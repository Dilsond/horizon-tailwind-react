import { useEffect, useRef } from "react";
import Links from "./components/Links";
import routes from "routes.js";
import logo from "./logo.png";

const Sidebar = ({ open, onClose }) => {
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth <= 1199 &&
        open &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  return (
    <div
      ref={sidebarRef}
      className={`sm:none duration-175 linear fixed !z-30 flex min-h-full flex-col bg-white pb-10 shadow-2xl shadow-white/5 transition-all dark:!bg-navy-800 dark:text-white md:!z-50 lg:!z-50 xl:!z-0 ${open ? "translate-x-0" : "-translate-x-84"}`}
    >
      <div className={`mx-[48px] mt-[40px] flex items-center`}>
        <img src={logo} alt="Cresce.AO Logo" className="w-auto h-10 object-contain" />
        <div className="font-poppins text-[32px] font-bold uppercase text-navy-700 dark:text-white leading-none">
          Cresce.<span className="font-medium">AO</span>
        </div>
      </div>
      <div className="mt-[58px] mb-7 h-px bg-gray-300 dark:bg-white/30" />

      <ul className="mb-auto pt-1">
        <Links routes={routes} onLinkClick={onClose} />
      </ul>
    </div>
  );
};

export default Sidebar;