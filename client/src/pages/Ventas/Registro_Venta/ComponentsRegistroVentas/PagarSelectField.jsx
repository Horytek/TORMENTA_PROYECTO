import PropTypes from 'prop-types';

const SelectField = ({ label, options, value, onChange, style, containerStyle }) => (
    <div className="flex flex-col" style={containerStyle}>
        <label className="text-gray-800 font-semibold">{label}</label>
        <div className="w-60 flex items-center mt-2 ">
            <select
                className="input w-full h-10 border border-gray-300"
                value={value}
                onChange={onChange}
                style={style}
            >
                {options.map((option, index) => (
                    <option key={index} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    </div>
);

SelectField.propTypes = {
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.string).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    style: PropTypes.object,
    containerStyle: PropTypes.object,
};

export default SelectField;
