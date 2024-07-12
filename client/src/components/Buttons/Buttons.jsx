import PropTypes from 'prop-types';
import './Buttons.css';
import { FiSave } from "react-icons/fi";
import { RiCloseLargeLine } from "react-icons/ri";

export function ButtonSave({ ...props }) {
  return (
    <button className="btn btn-save" {...props}>
      <FiSave style={{ fontSize: '25px' }} />
      Guardar
    </button>
  );
}

export function ButtonClose({ ...props }) {
  return (
    <button className="btn btn-close" {...props}>
      <RiCloseLargeLine style={{ fontSize: '25px' }} />
      Cerrar
    </button>
  );
}

export function ButtonNormal({ children, color, ...props }) {
  return (
    <button className="btn" style={{ backgroundColor: color }} {...props}>
      {children}
    </button>
  );
}

export function ButtonIcon({ children, icon, color, ...props }) {
  return (
    <button className="btn" style={{ backgroundColor: color }} {...props}>
      {icon}
      {children}
    </button>
  );
}

ButtonSave.propTypes = {
  onClick: PropTypes.func,
};

ButtonClose.propTypes = {
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
