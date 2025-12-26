import PropTypes from "prop-types";
import { FiSave } from "react-icons/fi";
import { FiDownload } from "react-icons/fi";
import { CiSearch, CiFilter } from "react-icons/ci";
import { RiCloseLargeLine } from "react-icons/ri";
import { IoIosArrowDropdownCircle } from "react-icons/io";
import { RefreshCw } from "lucide-react";
import { Button, ButtonGroup } from "@heroui/button";

export function ButtonSave({ ...props }) {
  return (
    <ActionButton
      color="blue"
      icon={<FiSave size={20} />}
      {...props}
    >
      Guardar
    </ActionButton>
  );
}

export function ButtonClose({ ...props }) {
  return (
    <ActionButton
      color="red"
      icon={<RiCloseLargeLine size={20} />}
      {...props}
    >
      Cerrar
    </ActionButton>
  );
}

export function ButtonNormal({ children, color, ...props }) {
  return (
    <Button
      className={`flex items-center gap-2 font-medium text-white m-0`}
      style={{ backgroundColor: color }}
      {...props}
      variant="shadow"
    >
      {children}
    </Button>
  );
}

export function ButtonIcon({ children, icon, color, ...props }) {
  return (
    <Button
      className={`flex items-center gap-2 font-medium text-white m-0`}
      style={{ backgroundColor: color }}
      {...props}
      variant="shadow"
    >
      {icon}
      {children}
    </Button>
  );
}

export function ButtonSearch({ ...props }) {
  return (
    <Button
      className="flex items-center gap-2 font-medium text-white bg-blue-400 hover:bg-blue-500 m-0"
      {...props}
      variant="shadow"
    >
      <CiSearch className="h-5 w-5" />
    </Button>
  );
}

export function ButtonFilter({ ...props }) {
  return (
    <Button
      className="flex items-center gap-2 font-medium text-white bg-blue-400 hover:bg-blue-500 m-0"
      {...props}
      variant="shadow"
    >
      <CiFilter className="h-5 w-5" />
    </Button>
  );
}

export function ButtonDownload({ ...props }) {
  return (
    <Button
      className="flex items-center gap-2 font-medium text-white bg-blue-400 hover:bg-blue-500 m-0"
      {...props}
      variant="shadow"
    >
      <FiDownload className="h-5 w-5" />
    </Button>
  );
}

export function ButtonDesplegable({ ...props }) {
  return (
    <Button
      className="flex items-center gap-2 font-medium text-white bg-teal-500 hover:bg-teal-600 m-0"
      {...props}
      variant="shadow"
    >
      <IoIosArrowDropdownCircle className="h-5 w-5" />
    </Button>
  );
}

export function ActionButton({ color = "blue", icon, children, size = "md", className, ...props }) {
  const colorStyles = {
    blue: "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:border-blue-800 dark:text-blue-200",
    indigo: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:border-indigo-800 dark:text-indigo-200",
    purple: "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:border-purple-800 dark:text-purple-200",
    cyan: "bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-700 dark:bg-cyan-900/30 dark:hover:bg-cyan-900/50 dark:border-cyan-800 dark:text-cyan-200",
    green: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:border-emerald-800 dark:text-emerald-400",
    red: "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:border-rose-800 dark:text-rose-400",
    yellow: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:border-yellow-800 dark:text-yellow-200",
    default: "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-200"
  };
  return (
    <Button
      variant="flat"
      size={size}
      className={`gap-2 font-bold px-4 h-10 rounded-xl border transition-colors shadow-sm ${colorStyles[color] || colorStyles.default} ${className || ""}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </Button>
  );
}

ButtonSave.propTypes = {
  onClick: PropTypes.func,
};

ButtonDesplegable.propTypes = {
  onClick: PropTypes.func,
};

ButtonClose.propTypes = {
  onClick: PropTypes.func,
};

ButtonSearch.propTypes = {
  onClick: PropTypes.func,
};

ButtonDownload.propTypes = {
  onClick: PropTypes.func,
};

ButtonNormal.propTypes = {
  children: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ButtonIcon.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ActionButton.propTypes = {
  color: PropTypes.string,
  icon: PropTypes.node,
  children: PropTypes.node,
  size: PropTypes.string,
};