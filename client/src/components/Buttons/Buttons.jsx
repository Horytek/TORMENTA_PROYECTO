import PropTypes from "prop-types";
import { FiSave } from "react-icons/fi";
import { FiDownload } from "react-icons/fi";
import { CiSearch, CiFilter } from "react-icons/ci";
import { RiCloseLargeLine } from "react-icons/ri";
import { IoIosArrowDropdownCircle } from "react-icons/io";
import { Button, ButtonGroup } from "@heroui/button";

export function ButtonSave({ ...props }) {
  return (
    <Button
      className="flex items-center gap-2 font-medium text-white bg-blue-500 hover:bg-blue-600 m-0"
      {...props}
      variant="shadow"
    >
      <FiSave style={{ fontSize: "25px" }} />
      Guardar
    </Button>
  );
}

export function ButtonClose({ ...props }) {
  return (
    <Button
      className="flex items-center gap-2 font-medium text-white bg-gray-500 hover:bg-gray-600 m-0"
      {...props}
      variant="shadow"
    >
      <RiCloseLargeLine style={{ fontSize: "25px" }} />
      Cerrar
    </Button>
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
