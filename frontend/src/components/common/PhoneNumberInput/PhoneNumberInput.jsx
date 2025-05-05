import React, { useState, useEffect } from "react";
import styles from "./PhoneNumberInput.module.css";

const PhoneNumberInput = ({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  className = "",
  inputClassName = "",
  labelClassName = "",
  errorClassName = "",
  placeholder = "(XXX) XXX-XXXX",
  disabled = false,
  readOnly = false,
  searchMode = false,
  displayMode = false,
}) => {
  const [formattedValue, setFormattedValue] = useState("");

  useEffect(() => {
    if (value) {
      formatPhoneNumber(value);
    } else {
      setFormattedValue("");
    }
  }, [value]);

  const formatPhoneNumber = (input) => {
    // Remove all non-numeric characters
    const numbers = input.replace(/\D/g, "");

    // Format the number as (XXX) XXX-XXXX
    let formatted = "";
    if (numbers.length > 0) {
      formatted = "(" + numbers.substring(0, 3);
      if (numbers.length > 3) {
        formatted += ") " + numbers.substring(3, 6);
        if (numbers.length > 6) {
          formatted += "-" + numbers.substring(6, 10);
        }
      }
    }
    setFormattedValue(formatted);
  };

  const handleChange = (e) => {
    const input = e.target.value;
    // Remove all non-numeric characters
    const numbers = input.replace(/\D/g, "");

    // Handle backspace/delete
    if (input.length < formattedValue.length) {
      const newValue = numbers.slice(0, -1);
      onChange({ target: { name, value: newValue } });
      return;
    }

    // Limit to 10 digits
    if (numbers.length <= 10) {
      onChange({ target: { name, value: numbers } });
    }
  };

  if (displayMode) {
    return <span className={className}>{formattedValue}</span>;
  }

  const inputProps = {
    type: "tel",
    name,
    value: formattedValue,
    onChange: handleChange,
    placeholder,
    disabled,
    readOnly,
    maxLength: 14,
    className: `${styles.input} ${inputClassName}`,
  };

  if (searchMode) {
    return (
      <input {...inputProps} className={`${styles.input} ${inputClassName}`} />
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {label && (
        <label htmlFor={name} className={`${styles.label} ${labelClassName}`}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <input {...inputProps} />
      {error && (
        <div className={`${styles.error} ${errorClassName}`}>{error}</div>
      )}
    </div>
  );
};

export default PhoneNumberInput;
