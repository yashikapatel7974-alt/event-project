import React, { useState, useEffect } from 'react';
import FormInput from './FormInput';
import FormSelect from './FormSelect';

const DynamicForm = ({ fields = [], onSubmit, submitLabel = 'Submit', initialValues = {} }) => {
  const [formData, setFormData] = useState({});

  // Sync initial values
  useEffect(() => {
    const defaultVals = {};
    fields.forEach((field) => {
      defaultVals[field.name] = initialValues[field.name] !== undefined ? initialValues[field.name] : (field.defaultValue || '');
    });
    setFormData(defaultVals);
  }, [fields, initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((field) => {
        if (field.type === 'select') {
          return (
            <FormSelect
              key={field.name}
              label={field.label}
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              options={field.options}
              required={field.required}
              placeholder={field.placeholder}
              disabled={field.disabled}
            />
          );
        }

        if (field.type === 'textarea') {
          return (
            <div key={field.name} className="form-group">
              <label htmlFor={field.name} className="form-label">{field.label}</label>
              <textarea
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                required={field.required}
                disabled={field.disabled}
                placeholder={field.placeholder}
                className="form-input"
                style={{ minHeight: '100px', resize: 'vertical' }}
              />
            </div>
          );
        }

        return (
          <FormInput
            key={field.name}
            label={field.label}
            id={field.name}
            name={field.name}
            type={field.type}
            value={formData[field.name] || ''}
            onChange={handleChange}
            required={field.required}
            placeholder={field.placeholder}
            disabled={field.disabled}
          />
        );
      })}

      <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
        {submitLabel}
      </button>
    </form>
  );
};

export default DynamicForm;
