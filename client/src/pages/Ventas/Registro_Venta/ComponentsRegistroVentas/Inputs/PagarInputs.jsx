import PropTypes from 'prop-types';

const InputField = ({ label, symbol, value, onChange, readOnly = false, pattern, onKeyDown, disabled = false, style, containerStyle, className,placeholder }) => (
    <div className="flex flex-col" style={containerStyle}>
        <label className="text-gray-800 font-semibold">{label}</label>
        <div className='flex items-center mt-2 '>
            {symbol && <span>{symbol}</span>}
            <input
                type="text"
                placeholder= {placeholder}
                className={className}
                style={style}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                pattern={pattern}
                onKeyDown={onKeyDown}
                disabled={disabled}
            />
        </div>
    </div>
);

InputField.propTypes = {
    label: PropTypes.string.isRequired,
    symbol: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onChange: PropTypes.func,
    readOnly: PropTypes.bool,
    pattern: PropTypes.string,
    onKeyDown: PropTypes.func,
    disabled: PropTypes.bool,
    style: PropTypes.object,
    containerStyle: PropTypes.object,
    className: PropTypes.string,
    placeholder: PropTypes.string
};

export default InputField;
