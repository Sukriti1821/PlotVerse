import { Link, useLocation } from "react-router-dom";
import {
  FaTree,
  FaLayerGroup,
  FaCalendarCheck,
  FaChartLine,
  FaShieldAlt,
  FaBullhorn,
} from "react-icons/fa";

const HostNavHeader = ({ title, subtitle, badge = "Host Portal", actions }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      label: "My Listings",
      path: "/owner/spots",
      icon: FaTree,
      active: currentPath.startsWith("/owner/spots") || currentPath.startsWith("/owner/listings") || currentPath.startsWith("/my-listings"),
    },
    {
      label: "Experience Packages",
      path: "/owner/experiences",
      icon: FaLayerGroup,
      active: currentPath.startsWith("/owner/experiences"),
    },
    {
      label: "Reservations",
      path: "/owner/bookings",
      icon: FaCalendarCheck,
      active: currentPath.startsWith("/owner/bookings") || currentPath.startsWith("/owner-bookings"),
    },
    {
      label: "Analytics & Insights",
      path: "/owner/analytics",
      icon: FaChartLine,
      active: currentPath.startsWith("/owner/analytics"),
    },
    {
      label: "Growth & Promos",
      path: "/owner/promotions",
      icon: FaBullhorn,
      active: currentPath.startsWith("/owner/promotions") || currentPath.startsWith("/owner/growth"),
    },
  ];

  return (
    <div className="border-b border-slate-200 bg-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        {/* Title & Actions Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-800 mb-2">
              <FaShieldAlt className="text-emerald-600" />
              <span>{badge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>

          {actions && <div className="flex items-center flex-wrap gap-2 sm:gap-3">{actions}</div>}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  item.active
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`text-sm ${item.active ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HostNavHeader;
