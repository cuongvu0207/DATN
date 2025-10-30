import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  const location = useLocation();

  // Nếu không có token -> quay về login và ghi nhớ URL trước đó
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu có token -> cho phép truy cập
  return children;
}
