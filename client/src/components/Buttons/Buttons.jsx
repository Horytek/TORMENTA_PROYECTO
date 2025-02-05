import PropTypes from "prop-types";
import "./Buttons.css";
import { FiSave } from "react-icons/fi";
import { FiDownload } from "react-icons/fi";
import { CiSearch, CiFilter} from "react-icons/ci";
import { RiCloseLargeLine } from "react-icons/ri";
import { IoIosArrowDropdownCircle } from "react-icons/io";
import {Button, ButtonGroup} from "@nextui-org/button";

export function ButtonSave({ ...props }) {
  return (
    <Button className="btn btn-save m-0" {...props}>
      <FiSave style={{ fontSize: "25px" }} />
      Guardar
    </Button>
  );
}

export function ButtonClose({ ...props }) {
  return (
    <Button className="btn btn-close m-0" {...props}>
      <RiCloseLargeLine style={{ fontSize: "25px" }} />
      Cerrar
    </Button>
  );
}

export function ButtonNormal({ children, color, ...props }) {
  return (
    <button className="btn m-0" style={{ backgroundColor: color }} {...props}>
      {children}
    </button>
  );
}

export function ButtonIcon({ children, icon, color, ...props }) {
  return (
    <Button className="btn m-0 " style={{ backgroundColor: color }} {...props}>
      {icon}
      {children}
    </Button>
  );
}

export function ButtonSearch({ ...props }) {
  return (
    <button className="btn btn-rvsecondary flex items-center" {...props}>
      <CiSearch className="h-5 w-5" style={{ color: "#f8f9fa" }} />
    </button>
  );
}

export function ButtonFilter({ ...props }) {
  return (
    <button className="btn btn-rvsecondary flex items-center" {...props}>
      <CiFilter className="h-5 w-5" style={{ color: "#f8f9fa" }} />
    </button>
  );
}

export function ButtonDownload({ ...props }) {
  return (
    <button className="btn btn-rvsecondary flex items-center" {...props}>
      <FiDownload className="h-5 w-5" style={{ color: "#f8f9fa" }} />
    </button>
  );
}

export function ButtonDesplegable({ ...props }) {
  return (
    <button className="btn btn-masecondary flex items-center" {...props}>
      <IoIosArrowDropdownCircle className="h-5 w-5" style={{ color: "#f8f9fa" }} />
    </button>
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
