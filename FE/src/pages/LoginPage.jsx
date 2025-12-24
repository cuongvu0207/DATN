import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import LanguageSwitcher from "../components/navigation/LanguageSwitcher";
import { API_BASE_URL } from "../services/api";
import "bootstrap/dist/css/bootstrap.min.css";
import bgLogin from "../assets/img/bg-login.jpg";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  const [loadingRole, setLoadingRole] = useState(null);

  const [errorKey, setErrorKey] = useState("");

  const isLoading = loadingRole !== null; // đang xử lý login

  const handleLogin = async (redirectPath, role) => {
    if (isLoading) return; 

    setLoadingRole(role);
    setErrorKey("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      navigate(redirectPath);
    } catch (err) {
      console.error("❌ Lỗi đăng nhập:", err);
      setErrorKey("login.error");
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center min-vh-100"
      style={{
        backgroundImage: `url(${bgLogin})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Góc trên bên phải chứa LanguageSwitcher */}
      <div className="position-absolute top-0 end-0 m-3">
        <LanguageSwitcher />
      </div>

      {/* Card đăng nhập */}
      <div
        className="card shadow rounded-4 border-0 mx-auto"
        style={{ width: "100%", maxWidth: "400px", borderRadius: "16px" }}
      >
        <div className="card-body p-4">
          <h4 className="text-center mb-4 fw-bold">{t("login.title")}</h4>

          {/* Thông báo lỗi */}
          {errorKey && <p className="text-danger text-center">{t(errorKey)}</p>}


          <InputField
            type="text"
            placeholder={t("login.username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />

          <div className="mb-3 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder={t("login.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: "40px" }}
              disabled={isLoading}
            />
            <span
              onClick={() => !isLoading && setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                top: "50%",
                right: "10px",
                transform: "translateY(-50%)",
                cursor: isLoading ? "not-allowed" : "pointer",
                color: "#6c757d",
                opacity: isLoading ? 0.6 : 1,
              }}
              title={isLoading ? t("login.loading") : ""}
            >
              <i className={`bi ${showPassword ? "bi-eye" : "bi-eye-slash"}`}></i>
            </span>
          </div>

          {/* Remember + Forgot */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="remember"
                disabled={isLoading}
              />
              <label htmlFor="remember" className="form-check-label">
                {t("login.remember")}
              </label>
            </div>


            <a
              href="/forgot-password"
              className={`small text-primary ${isLoading ? "pe-none opacity-75" : ""}`}
              style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
              aria-disabled={isLoading}
            >
              {t("login.forgotPassword")}
            </a>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="card-footer d-flex p-0 border-0">
          <button
            className="btn btn-secondary w-50"

            disabled={isLoading}
            style={{
              borderTopLeftRadius: "0",
              borderTopRightRadius: "0",
              borderBottomLeftRadius: "16px",
              borderBottomRightRadius: "0",
              paddingTop: "16px",
              paddingBottom: "16px",
            }}
            onClick={() => handleLogin("/", "manager")}
          >
            {loadingRole === "manager" ? t("login.loading") : t("login.manager")}
          </button>

          <button
            className="btn btn-success w-50"

            disabled={isLoading}
            style={{
              borderTopLeftRadius: "0",
              borderTopRightRadius: "0",
              borderBottomLeftRadius: "0",
              borderBottomRightRadius: "16px",
              paddingTop: "16px",
              paddingBottom: "16px",
              backgroundColor: "#20c997",
              borderColor: "#20c997",
            }}
            onClick={() => handleLogin("/sales", "sales")}
          >
            {loadingRole === "sales" ? t("login.loading") : t("login.sales")}
          </button>
        </div>
      </div>
    </div>
  );
}
