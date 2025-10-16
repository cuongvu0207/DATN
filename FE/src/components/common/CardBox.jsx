import React from "react";

export default function CardBox({ title, children }) {
  return (
    <div className="card shadow p-3 mb-3">
      <h6 className="fw-bold">{title}</h6>
      {children}
    </div>
  );
}
