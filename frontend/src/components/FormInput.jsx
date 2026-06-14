import React from 'react';

const FormInput = ({ label, id, name, type = 'text', value, onChange, placeholder, required, disabled, ...props }) => {
  return (
    <div className="form-group">
      {label && <label htmlFor={id} className="form-label">{label}</label>}
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="form-input"
        {...props}
      />
    </div>
  );
};

export default FormInput;
