const SlotLock = require("../models/SlotLock");
const Booking = require("../models/Booking");
const Spot = require("../models/Spot");

/**
 * Helper to convert "HH:MM" to integer minutes from 00:00
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10) || 0);
  return h * 60 + m;
};

/**
 * Helper to convert integer minutes to "HH:MM"
 */
const minutesToTime = (mins) => {
  const clamped = Math.max(0, Math.min(1439, Math.round(mins)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/**
 * Helper to format a Date object or string into "YYYY-MM-DD"
 */
const dateToDateStr = (dateInput) => {
  if (!dateInput) return "";
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Generates discrete interval keys (default: 30 minutes) between startMins and endMins
 */
const generateSlotKeys = (dateStr, startMins, endMins, step = 30) => {
  const keys = [];
  for (let m = startMins; m < endMins; m += step) {
    keys.push(`${dateStr}_${minutesToTime(m)}`);
  }
  return keys;
};

/**
 * Checks whether a candidate slot is available for booking
 * Validates:
 * 1. Spot active status
 * 2. Operating days & seasonal ranges
 * 3. Operating hours window (e.g. 10:00 to 20:00)
 * 4. Min and Max duration
 * 5. Lead time / past time restrictions
 * 6. Blocked dates & maintenance periods
 * 7. Overlap with existing bookings and buffer periods
 */
const checkSlotAvailability = async ({
  spotId,
  date,
  startTime,
  endTime,
  durationHours,
  excludeBookingId = null,
}) => {
  const spot = await Spot.findById(spotId);
  if (!spot) {
    return { available: false, code: "SPOT_NOT_FOUND", message: "Plot not found" };
  }

  if (spot.isActive === false) {
    return {
      available: false,
      code: "SPOT_INACTIVE",
      message: "This plot is currently inactive and not accepting reservations.",
    };
  }

  const dateStr = dateToDateStr(date);
  if (!dateStr) {
    return { available: false, code: "INVALID_DATE", message: "Invalid booking date provided." };
  }

  const bookingDate = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = bookingDate.getDay(); // 0 = Sunday, 6 = Saturday
  const monthNumber = bookingDate.getMonth() + 1; // 1 = January

  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);

  if (endMins <= startMins) {
    return {
      available: false,
      code: "INVALID_TIME_RANGE",
      message: "End time must be strictly later than start time.",
    };
  }

  const computedDuration = (endMins - startMins) / 60;
  const requestedDuration = durationHours ? Number(durationHours) : computedDuration;

  // Extract Spot availability configs with defaults
  const avail = spot.availability || {};
  const openTime = avail.openTime || "06:00";
  const closeTime = avail.closeTime || "22:00";
  const openMins = timeToMinutes(openTime);
  const closeMins = timeToMinutes(closeTime);
  const bufferMinutes = typeof avail.bufferMinutes === "number" ? avail.bufferMinutes : 30;
  const minDurationHours = avail.minDurationHours || 1;
  const maxDurationHours = avail.maxDurationHours || 12;
  const leadTimeHours = typeof avail.leadTimeHours === "number" ? avail.leadTimeHours : 1;
  const openDays = Array.isArray(avail.openDays) && avail.openDays.length > 0
    ? avail.openDays
    : [0, 1, 2, 3, 4, 5, 6];

  // 1. Operating Days Check (e.g. weekend vs weekday availability)
  if (!openDays.includes(dayOfWeek)) {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return {
      available: false,
      code: "DAY_CLOSED",
      message: `This space is not open on ${dayNames[dayOfWeek]}s. Available days: ${openDays.map((d) => dayNames[d]).join(", ")}.`,
    };
  }

  // 2. Seasonal Range Check
  if (avail.seasonalRange && avail.seasonalRange.isSeasonal) {
    const { startMonth = 1, endMonth = 12 } = avail.seasonalRange;
    const inSeason =
      startMonth <= endMonth
        ? monthNumber >= startMonth && monthNumber <= endMonth
        : monthNumber >= startMonth || monthNumber <= endMonth;

    if (!inSeason) {
      return {
        available: false,
        code: "SEASONAL_CLOSED",
        message: `This space is seasonal and currently closed for the season.`,
      };
    }
  }

  // 3. Operating Hours Window Check (e.g. 10 AM to 8 PM)
  if (startMins < openMins || endMins > closeMins) {
    return {
      available: false,
      code: "OUTSIDE_OPERATING_HOURS",
      message: `Selected hours are outside landowner operating schedule (${openTime} to ${closeTime}).`,
    };
  }

  // 4. Minimum Duration Check
  if (requestedDuration < minDurationHours) {
    return {
      available: false,
      code: "BELOW_MIN_DURATION",
      message: `Minimum reservation length for this plot is ${minDurationHours} ${minDurationHours === 1 ? "hour" : "hours"}.`,
    };
  }

  // 5. Maximum Duration Check
  if (requestedDuration > maxDurationHours) {
    return {
      available: false,
      code: "EXCEEDS_MAX_DURATION",
      message: `Maximum reservation length for this plot is ${maxDurationHours} hours per session.`,
    };
  }

  // 6. Lead Time / Past Time Restriction
  const now = new Date();
  const todayStr = dateToDateStr(now);
  if (dateStr < todayStr) {
    return {
      available: false,
      code: "PAST_DATE",
      message: "Cannot book a date in the past.",
    };
  }

  if (dateStr === todayStr) {
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const minAllowedStartMins = currentMins + leadTimeHours * 60;
    if (startMins < minAllowedStartMins) {
      return {
        available: false,
        code: "LEAD_TIME_RESTRICTION",
        message: `Last-minute booking notice: This plot requires at least ${leadTimeHours} ${leadTimeHours === 1 ? "hour" : "hours"} advance notice. Earliest available start time today is ${minutesToTime(minAllowedStartMins)}.`,
      };
    }
  }

  // 7. Blocked Dates Check
  if (Array.isArray(avail.blockedDates) && avail.blockedDates.length > 0) {
    const isBlocked = avail.blockedDates.some((b) => {
      const bStr = dateToDateStr(b.date);
      return bStr === dateStr;
    });

    if (isBlocked) {
      const blockItem = avail.blockedDates.find((b) => dateToDateStr(b.date) === dateStr);
      return {
        available: false,
        code: "BLOCKED_DATE",
        message: `This date is blocked by the landowner (${blockItem?.reason || "Unavailable"}).`,
      };
    }
  }

  // 8. Maintenance Periods Check
  if (Array.isArray(avail.maintenancePeriods) && avail.maintenancePeriods.length > 0) {
    for (const period of avail.maintenancePeriods) {
      const pStartStr = dateToDateStr(period.startDate);
      const pEndStr = dateToDateStr(period.endDate);

      if (dateStr >= pStartStr && dateStr <= pEndStr) {
        const pStartMins = timeToMinutes(period.startTime || "00:00");
        const pEndMins = timeToMinutes(period.endTime || "23:59");

        // Check time overlap
        if (startMins < pEndMins && endMins > pStartMins) {
          return {
            available: false,
            code: "MAINTENANCE_PERIOD",
            message: `Plot is unavailable due to scheduled maintenance: "${period.reason || "Maintenance"}" (${period.startTime || "00:00"} - ${period.endTime || "23:59"}).`,
          };
        }
      }
    }
  }

  // 9. Check Conflicting Bookings & Buffer Overlaps
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  const bookingQuery = {
    spot: spotId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ["pending", "confirmed", "approved"] },
  };

  if (excludeBookingId) {
    bookingQuery._id = { $ne: excludeBookingId };
  }

  const existingBookings = await Booking.find(bookingQuery).lean();

  for (const b of existingBookings) {
    const bStartMins = timeToMinutes(b.startTime || "00:00");
    const bEndMins = timeToMinutes(b.endTime || "23:59");
    const bEffectiveEndMins = bEndMins + bufferMinutes; // buffer follows previous booking

    // Overlap condition considering buffer turnaround:
    // Candidate starts before existing booking + buffer ends AND candidate ends after existing booking starts
    if (startMins < bEffectiveEndMins && endMins > bStartMins) {
      const nextStart = minutesToTime(Math.min(closeMins, bEffectiveEndMins));
      return {
        available: false,
        code: "BOOKING_CONFLICT",
        message: `Conflict with an existing reservation (${b.startTime} - ${b.endTime} + ${bufferMinutes}m buffer). Next available start time is ${nextStart}.`,
        conflictBooking: {
          startTime: b.startTime,
          endTime: b.endTime,
          bufferEndTime: minutesToTime(bEffectiveEndMins),
        },
      };
    }
  }

  return {
    available: true,
    spot,
    dateStr,
    startMins,
    endMins,
    durationHours: requestedDuration,
    bufferMinutes,
  };
};

/**
 * Atomically acquires slot locks in the database for the given booking
 * Slices the duration and buffer into discrete 30-minute interval keys.
 * Guaranteed by MongoDB compound unique index { spot: 1, slotKey: 1 }.
 */
const acquireSlotLocks = async ({
  spotId,
  bookingId,
  dateStr,
  startTime,
  endTime,
  bufferMinutes = 30,
}) => {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);

  // Discrete 30-min keys for the active reservation
  const bookingKeys = generateSlotKeys(dateStr, startMins, endMins, 30);

  // Discrete 30-min keys for the host-turnaround buffer period
  const bufferKeys = generateSlotKeys(dateStr, endMins, endMins + bufferMinutes, 30);

  const lockDocs = [
    ...bookingKeys.map((key) => ({
      spot: spotId,
      dateStr,
      slotKey: key,
      booking: bookingId,
      isBuffer: false,
    })),
    ...bufferKeys.map((key) => ({
      spot: spotId,
      dateStr,
      slotKey: key,
      booking: bookingId,
      isBuffer: true,
    })),
  ];

  try {
    // Attempt atomic insertion of all slot locks
    await SlotLock.insertMany(lockDocs, { ordered: true });
    return { success: true, count: lockDocs.length };
  } catch (err) {
    // If a duplicate key error occurs (E11000), clean up any locks that were partially inserted
    await SlotLock.deleteMany({ booking: bookingId });

    if (err.code === 11000 || err.message?.includes("E11000")) {
      return {
        success: false,
        code: "CONCURRENCY_CONFLICT",
        message:
          "High demand: Another traveler secured this time slot right before you. Please select an alternate slot.",
      };
    }

    throw err;
  }
};

/**
 * Releases all slot locks associated with a booking (e.g. on cancellation or rejection)
 */
const releaseSlotLocks = async (bookingId) => {
  if (!bookingId) return;
  await SlotLock.deleteMany({ booking: bookingId });
};

/**
 * Computes a detailed daily availability schedule and timeline for frontend visualization
 */
const getSpotDailySchedule = async ({ spotId, dateStr }) => {
  const spot = await Spot.findById(spotId).lean();
  if (!spot) return null;

  const avail = spot.availability || {};
  const openTime = avail.openTime || "06:00";
  const closeTime = avail.closeTime || "22:00";
  const openMins = timeToMinutes(openTime);
  const closeMins = timeToMinutes(closeTime);
  const bufferMinutes = typeof avail.bufferMinutes === "number" ? avail.bufferMinutes : 30;
  const minDurationHours = avail.minDurationHours || 1;
  const maxDurationHours = avail.maxDurationHours || 12;
  const leadTimeHours = typeof avail.leadTimeHours === "number" ? avail.leadTimeHours : 1;

  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  // Active bookings on this day
  const bookings = await Booking.find({
    spot: spotId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ["pending", "confirmed", "approved"] },
  })
    .select("startTime endTime status durationHours user")
    .lean();

  // Determine blocked status
  let isDateBlocked = false;
  let blockReason = "";
  if (Array.isArray(avail.blockedDates)) {
    const foundBlock = avail.blockedDates.find((b) => dateToDateStr(b.date) === dateStr);
    if (foundBlock) {
      isDateBlocked = true;
      blockReason = foundBlock.reason || "Blocked by landowner";
    }
  }

  // Maintenance intervals
  const maintenanceRanges = [];
  if (Array.isArray(avail.maintenancePeriods)) {
    avail.maintenancePeriods.forEach((p) => {
      const pStart = dateToDateStr(p.startDate);
      const pEnd = dateToDateStr(p.endDate);
      if (dateStr >= pStart && dateStr <= pEnd) {
        maintenanceRanges.push({
          startMins: timeToMinutes(p.startTime || "00:00"),
          endMins: timeToMinutes(p.endTime || "23:59"),
          reason: p.reason || "Maintenance",
        });
      }
    });
  }

  // Current time restrictions for today
  const now = new Date();
  const todayStr = dateToDateStr(now);
  const isToday = dateStr === todayStr;
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const minStartMinsToday = currentMins + leadTimeHours * 60;

  // Build 30-minute interval timeline blocks from openTime to closeTime
  const timeline = [];
  for (let m = openMins; m < closeMins; m += 30) {
    const slotStart = m;
    const slotEnd = m + 30;
    const timeLabel = minutesToTime(slotStart);

    let status = "available";
    let detail = "Available for booking";

    if (isDateBlocked) {
      status = "blocked";
      detail = blockReason;
    } else if (isToday && slotStart < minStartMinsToday) {
      status = "past";
      detail = slotStart < currentMins ? "Past time" : `Advance notice required (${leadTimeHours}h lead time)`;
    } else {
      // Check maintenance
      const inMaintenance = maintenanceRanges.some(
        (mR) => slotStart < mR.endMins && slotEnd > mR.startMins
      );
      if (inMaintenance) {
        status = "maintenance";
        detail = "Scheduled maintenance";
      } else {
        // Check bookings & buffer
        for (const b of bookings) {
          const bStart = timeToMinutes(b.startTime);
          const bEnd = timeToMinutes(b.endTime);
          const bBufferEnd = bEnd + bufferMinutes;

          if (slotStart >= bStart && slotStart < bEnd) {
            status = "booked";
            detail = `Booked (${b.startTime} - ${b.endTime})`;
            break;
          } else if (slotStart >= bEnd && slotStart < bBufferEnd) {
            status = "buffer";
            detail = `Host prep & cleaning buffer (${bufferMinutes} mins)`;
            break;
          }
        }
      }
    }

    timeline.push({
      time: timeLabel,
      minutes: slotStart,
      status,
      detail,
    });
  }

  // Compute continuous available windows (e.g. 10:00 - 14:00, 17:30 - 20:00)
  const availableWindows = [];
  let winStart = null;

  timeline.forEach((slot, idx) => {
    if (slot.status === "available") {
      if (winStart === null) winStart = slot.time;
    } else {
      if (winStart !== null) {
        const winEnd = slot.time;
        const winHours = (timeToMinutes(winEnd) - timeToMinutes(winStart)) / 60;
        if (winHours >= minDurationHours) {
          availableWindows.push({
            startTime: winStart,
            endTime: winEnd,
            durationHours: winHours,
          });
        }
        winStart = null;
      }
    }
  });

  if (winStart !== null) {
    const winEnd = minutesToTime(closeMins);
    const winHours = (closeMins - timeToMinutes(winStart)) / 60;
    if (winHours >= minDurationHours) {
      availableWindows.push({
        startTime: winStart,
        endTime: winEnd,
        durationHours: winHours,
      });
    }
  }

  return {
    spotId,
    dateStr,
    operatingHours: {
      open: openTime,
      close: closeTime,
    },
    bufferMinutes,
    minDurationHours,
    maxDurationHours,
    leadTimeHours,
    isDateBlocked,
    blockReason,
    bookedIntervals: bookings.map((b) => ({
      id: b._id,
      startTime: b.startTime,
      endTime: b.endTime,
      bufferEndTime: minutesToTime(timeToMinutes(b.endTime) + bufferMinutes),
      status: b.status,
    })),
    availableWindows,
    timeline,
  };
};

/**
 * Startup synchronization: populates SlotLock documents for existing active bookings
 * Ensures backward compatibility and zero double-bookings on existing database records.
 */
const syncExistingBookingsToLocks = async () => {
  try {
    const activeBookings = await Booking.find({
      status: { $in: ["pending", "confirmed", "approved"] },
    }).lean();

    let createdCount = 0;
    for (const b of activeBookings) {
      const dateStr = dateToDateStr(b.date);
      if (!dateStr || !b.startTime || !b.endTime) continue;

      const startMins = timeToMinutes(b.startTime);
      const endMins = timeToMinutes(b.endTime);
      const bufferMinutes = 30;

      const bookingKeys = generateSlotKeys(dateStr, startMins, endMins, 30);
      const bufferKeys = generateSlotKeys(dateStr, endMins, endMins + bufferMinutes, 30);

      const docs = [
        ...bookingKeys.map((k) => ({
          spot: b.spot,
          dateStr,
          slotKey: k,
          booking: b._id,
          isBuffer: false,
        })),
        ...bufferKeys.map((k) => ({
          spot: b.spot,
          dateStr,
          slotKey: k,
          booking: b._id,
          isBuffer: true,
        })),
      ];

      for (const d of docs) {
        try {
          await SlotLock.updateOne(
            { spot: d.spot, slotKey: d.slotKey },
            { $setOnInsert: d },
            { upsert: true }
          );
          createdCount++;
        } catch (e) {
          // Ignore duplicate keys during sync
        }
      }
    }

    console.log(`[AvailabilityEngine] Synchronized active bookings to SlotLocks (processed ${activeBookings.length} bookings)`);
  } catch (err) {
    console.warn("[AvailabilityEngine] Startup sync warning:", err.message);
  }
};

module.exports = {
  timeToMinutes,
  minutesToTime,
  dateToDateStr,
  generateSlotKeys,
  checkSlotAvailability,
  acquireSlotLocks,
  releaseSlotLocks,
  getSpotDailySchedule,
  syncExistingBookingsToLocks,
};
