const nodemailer = require("nodemailer");

/**
 * Creates and returns a configured nodemailer transporter.
 * Falls back to console output if SMTP credentials are not configured in .env.
 */
const getTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  return null;
};

/**
 * Send Password Reset Email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient user name
 * @param {string} options.resetUrl - Full URL to password reset form
 */
const sendPasswordResetEmail = async ({ to, name = "Traveler", resetUrl }) => {
  const transporter = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || '"Thikana Security" <noreply@thikana.in>';

  const subject = "Reset Your Thikana Password";
  const textContent = `Hello ${name},\n\nYou recently requested to reset your password for your Thikana account.\nClick the link below to set a new password:\n\n${resetUrl}\n\nThis link is valid for 1 hour. If you did not request this, please ignore this email and your password will remain unchanged.\n\nBest regards,\nThe Thikana Team\nMera Thikana - Your own patch of the mountains, by the hour`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #0f172a; }
          .container { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background-color: #020617; padding: 32px; text-align: center; border-bottom: 2px solid #10b981; }
          .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { color: #10b981; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }
          .body { padding: 36px 32px; }
          .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
          .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .button-wrapper { text-align: center; margin: 32px 0; }
          .button { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
          .expiry-notice { font-size: 12px; color: #64748b; background-color: #f1f5f9; padding: 12px 16px; border-radius: 12px; margin-bottom: 24px; }
          .link-fallback { font-size: 12px; color: #94a3b8; word-break: break-all; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thikana</h1>
            <p>Mera Thikana • Mountain Plots by the Hour</p>
          </div>
          <div class="body">
            <div class="greeting">Hi ${name},</div>
            <div class="message">
              We received a request to reset the password for your Thikana account. Click the button below to choose a new, secure password.
            </div>
            <div class="button-wrapper">
              <a href="${resetUrl}" class="button" target="_blank">Reset My Password</a>
            </div>
            <div class="expiry-notice">
              ⏱ <strong>Note:</strong> This link will expire in <strong>1 hour</strong>. If you did not make this request, you can safely ignore this email.
            </div>
            <div class="link-fallback">
              Having trouble with the button? Copy and paste this URL into your browser:<br>
              <a href="${resetUrl}" style="color: #059669;">${resetUrl}</a>
            </div>
          </div>
          <div class="footer">
            &copy; 2026 Thikana. All rights reserved.<br>
            Mera Thikana - Your own patch of the mountains, by the hour.
          </div>
        </div>
      </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[EmailService] Password reset email sent to ${to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Failed to send email via SMTP to ${to}:`, err.message);
      // Fall through to dev console log
    }
  }

  // Development Fallback: output clearly to console
  console.log(`
╔═════════════════════════════════════════════════════════════════════════════╗
║                   📧 THIKANA PASSWORD RESET EMAIL (DEV)                     ║
╠═════════════════════════════════════════════════════════════════════════════╣
║ To: ${to.padEnd(72)}║
║ Subject: ${subject.padEnd(67)}║
║                                                                             ║
║ Click or copy the password reset link below:                                ║
║ ${resetUrl.padEnd(76)}║
║                                                                             ║
║ (Link expires in 1 hour)                                                    ║
╚═════════════════════════════════════════════════════════════════════════════╝
  `);
  return { success: true, devMode: true };
};

/**
 * Sends a booking approval email with direct payment link
 */
const sendBookingApprovedEmail = async ({
  to,
  name,
  spotTitle,
  bookingDate,
  startTime,
  endTime,
  totalPrice,
  paymentUrl,
}) => {
  const transporter = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || '"Thikana Concierge" <noreply@thikana.in>';
  const subject = `Reservation Approved: ${spotTitle} — Complete Your Payment`;

  const textContent = `Hello ${name},\n\nGreat news! Your booking request for "${spotTitle}" on ${bookingDate} (${startTime} - ${endTime}) has been approved by the host.\n\nTotal Payable: ₹${Number(totalPrice).toLocaleString("en-IN")}\n\nTo lock in and confirm your reservation, please complete your payment via the link below:\n${paymentUrl}\n\nBest regards,\nThe Thikana Team\nMera Thikana - Your own patch of the mountains, by the hour`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #0f172a; }
          .container { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background-color: #020617; padding: 32px; text-align: center; border-bottom: 2px solid #10b981; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; }
          .header p { color: #10b981; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }
          .body { padding: 32px; }
          .badge { display: inline-block; background-color: #ecfdf5; color: #059669; font-weight: 800; font-size: 12px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #a7f3d0; }
          .details-box { background-color: #f8fafc; border-radius: 16px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; }
          .details-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .button { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 700; font-size: 14px; text-align: center; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thikana</h1>
            <p>Reservation Approved</p>
          </div>
          <div class="body">
            <span class="badge">Host Approved</span>
            <h2 style="font-size: 18px; margin: 0 0 12px 0;">Pack your bags, ${name}!</h2>
            <p style="font-size: 14px; color: #475569; line-height: 1.5;">
              The host has approved your reservation request for <strong>${spotTitle}</strong>. Complete your payment now to lock in your dates before the turnover lock expires.
            </p>
            <div class="details-box">
              <div class="details-row"><span><strong>Date:</strong></span> <span>${bookingDate}</span></div>
              <div class="details-row"><span><strong>Time Slot:</strong></span> <span>${startTime} - ${endTime}</span></div>
              <div class="details-row" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 15px; color: #059669;">
                <span><strong>Total Payable:</strong></span> <span><strong>₹${Number(totalPrice).toLocaleString("en-IN")}</strong></span>
              </div>
            </div>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${paymentUrl}" class="button" target="_blank">Pay Now & Confirm Reservation</a>
            </div>
          </div>
          <div class="footer">&copy; 2026 Thikana. All rights reserved. • Mera Thikana</div>
        </div>
      </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({ from: fromAddress, to, subject, text: textContent, html: htmlContent });
      console.log(`[EmailService] Booking approved email sent to ${to}. ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Failed to send approval email to ${to}:`, err.message);
    }
  }

  console.log(`\n📧 [DEV EMAIL: BOOKING APPROVED] To: ${to} | Spot: ${spotTitle} | Pay URL: ${paymentUrl}\n`);
  return { success: true, devPreview: true };
};

/**
 * Send Booking Rejected Email
 */
const sendBookingRejectedEmail = async ({
  to,
  name = "Traveler",
  spotTitle = "Scenic Plot",
  bookingDate,
  reason = "The host was unable to accommodate this reservation request.",
}) => {
  const transporter = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || '"Thikana Concierge" <noreply@thikana.in>';
  const subject = `Update on your reservation request for ${spotTitle}`;

  const textContent = `Hello ${name},\n\nWe regret to inform you that your booking request for "${spotTitle}" on ${bookingDate} could not be accepted by the host.\n\nReason: ${reason}\n\nYour card was not charged. You can discover other scenic plots across the Himalayas at http://localhost:5173/listings.\n\nBest regards,\nThe Thikana Team\nMera Thikana - Your own patch of the mountains, by the hour`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #0f172a; }
          .container { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background-color: #020617; padding: 32px; text-align: center; border-bottom: 2px solid #ef4444; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; }
          .body { padding: 32px; }
          .badge { display: inline-block; background-color: #fef2f2; color: #dc2626; font-weight: 800; font-size: 12px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #fecaca; }
          .button { display: inline-block; background-color: #020617; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 700; font-size: 13px; text-align: center; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thikana</h1>
          </div>
          <div class="body">
            <span class="badge">Request Declined</span>
            <h2 style="font-size: 18px; margin: 0 0 12px 0;">Reservation Update</h2>
            <p style="font-size: 14px; color: #475569; line-height: 1.5;">
              Unfortunately, the host is unable to host your requested reservation for <strong>${spotTitle}</strong> on <strong>${bookingDate}</strong>.
            </p>
            <p style="font-size: 13px; color: #64748b; background-color: #f8fafc; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <strong>Note:</strong> ${reason}
            </p>
            <p style="font-size: 13px; color: #475569;">
              You have not been charged. Don't worry, there are dozens of other breathtaking verified plots waiting for you!
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="http://localhost:5173/listings" class="button" target="_blank">Explore Alternative Plots</a>
            </div>
          </div>
          <div class="footer">&copy; 2026 Thikana. All rights reserved. • Mera Thikana</div>
        </div>
      </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({ from: fromAddress, to, subject, text: textContent, html: htmlContent });
      console.log(`[EmailService] Booking rejected email sent to ${to}. ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Failed to send rejection email to ${to}:`, err.message);
    }
  }

  console.log(`\n📧 [DEV EMAIL: BOOKING DECLINED] To: ${to} | Spot: ${spotTitle}\n`);
  return { success: true, devPreview: true };
};

/**
 * Send Booking Confirmed Email (Payment verified, slot locked)
 */
const sendBookingConfirmedEmail = async ({
  to,
  name = "Traveler",
  spotTitle = "Scenic Plot",
  bookingDate,
  startTime,
  endTime,
  amountPaid,
  paymentId,
}) => {
  const transporter = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || '"Thikana Concierge" <noreply@thikana.in>';
  const subject = `Booking Confirmed! ${spotTitle} — See You There!`;

  const textContent = `Hello ${name},\n\nYour payment of ₹${Number(amountPaid).toLocaleString("en-IN")} was verified successfully! Your reservation for "${spotTitle}" on ${bookingDate} (${startTime} - ${endTime}) is now officially confirmed.\n\nPayment ID: ${paymentId}\nView your reservation details in your Thikana dashboard: http://localhost:5173/my-bookings\n\nHappy travels,\nThe Thikana Team\nMera Thikana - Your own patch of the mountains, by the hour`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #0f172a; }
          .container { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background-color: #020617; padding: 32px; text-align: center; border-bottom: 2px solid #10b981; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; }
          .header p { color: #10b981; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }
          .body { padding: 32px; }
          .badge { display: inline-block; background-color: #ecfdf5; color: #059669; font-weight: 800; font-size: 12px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #a7f3d0; }
          .details-box { background-color: #f8fafc; border-radius: 16px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; }
          .details-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .button { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 700; font-size: 14px; text-align: center; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thikana</h1>
            <p>Booking Confirmed</p>
          </div>
          <div class="body">
            <span class="badge">Payment Verified & Confirmed</span>
            <h2 style="font-size: 18px; margin: 0 0 12px 0;">You're All Set, ${name}!</h2>
            <p style="font-size: 14px; color: #475569; line-height: 1.5;">
              We have received your payment for <strong>${spotTitle}</strong>. Your reservation schedule has been locked in the calendar.
            </p>
            <div class="details-box">
              <div class="details-row"><span><strong>Date:</strong></span> <span>${bookingDate}</span></div>
              <div class="details-row"><span><strong>Time Slot:</strong></span> <span>${startTime} - ${endTime}</span></div>
              <div class="details-row"><span><strong>Payment ID:</strong></span> <span style="font-family: monospace; font-size: 11px;">${paymentId}</span></div>
              <div class="details-row" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 15px; color: #059669;">
                <span><strong>Amount Paid:</strong></span> <span><strong>₹${Number(amountPaid).toLocaleString("en-IN")}</strong></span>
              </div>
            </div>
            <div style="text-align: center; margin: 28px 0;">
              <a href="http://localhost:5173/my-bookings" class="button" target="_blank">View My Bookings</a>
            </div>
          </div>
          <div class="footer">&copy; 2026 Thikana. All rights reserved. • Mera Thikana</div>
        </div>
      </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({ from: fromAddress, to, subject, text: textContent, html: htmlContent });
      console.log(`[EmailService] Booking confirmed email sent to ${to}. ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Failed to send confirmation email to ${to}:`, err.message);
    }
  }

  console.log(`\n📧 [DEV EMAIL: BOOKING CONFIRMED] To: ${to} | Spot: ${spotTitle} | Payment: ${paymentId}\n`);
  return { success: true, devPreview: true };
};

module.exports = {
  sendPasswordResetEmail,
  sendBookingApprovedEmail,
  sendBookingRejectedEmail,
  sendBookingConfirmedEmail,
};
