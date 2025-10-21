import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import LanguageSwitcher from "../components/navigation/LanguageSwitcher";
import "bootstrap/dist/css/bootstrap.min.css";
import bgLogin from "../assets/img/bg-login.jpg";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loadingManager, setLoadingManager] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);
  const [errorKey, setErrorKey] = useState(""); //  chỉ lưu key

  const handleLogin = async (redirectPath, setLoading) => {
    setLoading(true);
    setErrorKey("");

    try {
      const res = await fetch("https://aerobiotically-supereffective-marcus.ngrok-free.dev/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();
      localStorage.setItem("accessToken", data.accessToken);

      navigate(redirectPath);
    } catch (err) {
      setErrorKey("login.error"); //  luôn lưu key, không lưu chuỗi
    } finally {
      setLoading(false);
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
        className="card shadow rounded-4 border-0 d-flex flex-column justify-content-between mx-auto"
        style={{ width: "100%", maxWidth: "400px", borderRadius: "16px" }}
      >
        <div className="card-body p-4">
          <h4 className="text-center mb-4 fw-bold">{t("login.title")}</h4>

          {/* Thông báo lỗi (dịch động theo i18n) */}
          {errorKey && <p className="text-danger text-center">{t(errorKey)}</p>}

          {/* Username */}
          <InputField
            type="text"
            placeholder={t("login.username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* Password với icon show/hide */}
          <div className="mb-3 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder={t("login.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: "40px" }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                top: "50%",
                right: "10px",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#6c757d",
              }}
            >
              <i className={`bi ${showPassword ? "bi-eye" : "bi-eye-slash"}`}></i>
            </span>
          </div>

          {/* Remember + Forgot */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="form-check">
              <input type="checkbox" className="form-check-input" id="remember" />
              <label htmlFor="remember" className="form-check-label">
                {t("login.remember")}
              </label>
            </div>
            <a href="#" className="small text-primary">
              {t("login.forgotPassword")}
            </a>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="card-footer d-flex p-0 border-0">
          <button
            className="btn btn-secondary w-50"
            disabled={loadingManager}
            style={{
              borderTopLeftRadius: "0",
              borderTopRightRadius: "0",
              borderBottomLeftRadius: "16px",
              borderBottomRightRadius: "0",
              paddingTop: "16px",
              paddingBottom: "16px",
            }}
            onClick={() => handleLogin("/", setLoadingManager)}
          >
            {loadingManager ? t("login.loading") : t("login.manager")}
          </button>

          <button
            className="btn btn-success w-50"
            disabled={loadingSales}
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
            onClick={() => handleLogin("/sales", setLoadingSales)}
          >
            {loadingSales ? t("login.loading") : t("login.sales")}
          </button>
        </div>
      </div>
    </div>
  );
}
