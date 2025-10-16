import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import InputField from "../components/InputField";
import AuthLayout from "../layouts/AuthLayout";
import LanguageSwitcher from "../components/navigation/LanguageSwitcher"; //  thêm vào
import "bootstrap/dist/css/bootstrap.min.css";

export default function LoginPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (role) => {
    console.log("Login with:", { username, password, role });
  };

  return (
    <AuthLayout>
      {/* Góc trên bên phải chứa LanguageSwitcher */}
      <div className="position-absolute top-0 end-0 m-3">
        <LanguageSwitcher />
      </div>

      {/* Card đăng nhập */}
      <div
        className="card shadow border rounded-4 d-flex flex-column justify-content-between mx-auto"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "16px",
        }}
      >
        <div className="card-body p-4">
          <h4 className="text-center mb-4 fw-bold">{t("login.title")}</h4>

          {/* Username */}
          <InputField
            type="text"
            placeholder={t("login.username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* Password */}
          <InputField
            type="password"
            placeholder={t("login.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Remember + Forgot */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="remember"
              />
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
            style={{
              borderTopLeftRadius: "0",          // không bo trên
              borderTopRightRadius: "0",         // không bo trên
              borderBottomLeftRadius: "16px",    // chỉ bo ngoài trái
              borderBottomRightRadius: "0",      // không bo trong
              paddingTop: "16px",
              paddingBottom: "16px",
            }}
            onClick={() => handleLogin("manager")}
          >
            {t("login.manager")}
          </button>
          <button
            className="btn btn-success w-50"
            style={{
              borderTopLeftRadius: "0",           // không bo trên
              borderTopRightRadius: "0",          // không bo trên
              borderBottomLeftRadius: "0",        // không bo trong
              borderBottomRightRadius: "16px",    // chỉ bo ngoài phải
              paddingTop: "16px",
              paddingBottom: "16px",
              backgroundColor: "#20c997",
              borderColor: "#20c997",
            }}
            onClick={() => handleLogin("sales")}
          >
            {t("login.sales")}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
