// Components/Sidebar.jsx
import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const Sidebar = () => {
  return (
    <div className="w-64 min-h-screen bg-gray-200 dark:bg-gray-800 p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">
        Menu
      </h2>
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `mb-4 px-4 py-2 rounded ${
            isActive
              ? "bg-blue-500 text-white"
              : "text-gray-700 dark:text-gray-300 hover:bg-blue-300"
          }`
        }
      >
        Dashboard
      </NavLink>
      <NavLink
        to="/logs"
        className={({ isActive }) =>
          `mb-4 px-4 py-2 rounded ${
            isActive
              ? "bg-blue-500 text-white"
              : "text-gray-700 dark:text-gray-300 hover:bg-blue-300"
          }`
        }
      >
        Logs
      </NavLink>
      <div className="mt-auto">
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Sidebar;
