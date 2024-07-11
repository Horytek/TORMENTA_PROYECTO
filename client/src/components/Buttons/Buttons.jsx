import PropTypes from 'prop-types';
import './Buttons.css';
import { FiSave } from "react-icons/fi";
import { RiCloseLargeLine } from "react-icons/ri";

export function ButtonSave() {
  return (
    <button className="btn btn-save">
      <FiSave style={{ fontSize: '25px' }} />
      Guardar
    </button>
  );
}

export function ButtonClose() {
  return (
    <button className="btn btn-close">
      <RiCloseLargeLine style={{ fontSize: '25px' }} />
      Cerrar
    </button>
  );
}

export function ButtonNormal({ children, color }) {
  return (
    <button className="btn" style={{ backgroundColor: color }}>
      {children}
    </button>
  );
}

export function ButtonIcon({ children, icon, color }) {
  return (
    <button className="btn" style={{ backgroundColor: color }}>
      {icon}
      {children}
    </button>
  );
}

ButtonNormal.propTypes = {
  children: PropTypes.node.isRequired,
  color: PropTypes.node.isRequired
};

ButtonIcon.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.node.isRequired
};