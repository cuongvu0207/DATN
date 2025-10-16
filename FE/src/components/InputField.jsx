import React from "react";

export default function InputField({ type, placeholder, value, onChange }) {
  return (
    <input
      type={type}
      className="form-control mb-3"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}
