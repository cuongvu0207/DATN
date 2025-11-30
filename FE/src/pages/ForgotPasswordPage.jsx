import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/navigation/LanguageSwitcher";
import bgLogin from "../assets/img/bg-login.jpg";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [resetPasswordToken, setResetPasswordToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loadingSendOtp, setLoadingSendOtp] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const checkStrongPassword = (password) => {
    if (!password) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    return password.length >= 8 && hasUpper && hasLower && hasDigit && hasSpecial;
  };

  const handleSendOTP = async () => {
    setLoadingSendOtp(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Failed");

      setMessage(t("forgot.success"));
      setCountdown(60);
    } catch (err) {
      setError(t("forgot.fail"));
    } finally {
      setLoadingSendOtp(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoadingReset(true);
    setMessage("");
    setError("");

    if (!checkStrongPassword(newPassword)) {
      setError(t("changePassword.errors.weakPassword"));
      setLoadingReset(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("changePassword.errors.mismatch"));
      setLoadingReset(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetPasswordToken,
          newPassword,
          confirmPassword,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      setMessage(t("forgot.resetSuccess"));
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(t("forgot.resetFail"));
    } finally {
      setLoadingReset(false);
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
      <div className="position-absolute top-0 end-0 m-3">
        <LanguageSwitcher />
      </div>

      <div
        className="card shadow rounded-4 border-0 mx-auto"
        style={{ width: "100%", maxWidth: "450px" }}
      >
        <div className="card-body p-4">
          <h4 className="fw-bold text-center mb-3">{t("forgot.resetTitle")}</h4>

          {error && <p className="text-danger text-center fw-semibold">{error}</p>}
          {message && <p className="text-success text-center fw-semibold">{message}</p>}

          <form autoComplete="off" onSubmit={handleResetPassword}>
            {/* EMAIL */}
            <input
              type="email"
              className="form-control mb-3"
              placeholder={t("forgot.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* OTP */}
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder={t("forgot.otpPlaceholder")}
                value={resetPasswordToken}
                onChange={(e) => setResetPasswordToken(e.target.value)}
                required
              />

              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleSendOTP}
                disabled={loadingSendOtp || !email || countdown > 0}
              >
                {loadingSendOtp
                  ? t("forgot.loading")
                  : countdown > 0
                  ? `${t("forgot.resendIn")} ${countdown}s`
                  : t("forgot.sendOtp")}
              </button>
            </div>

            {/* NEW PASSWORD */}
            <div className="position-relative mb-3">
              <input
                type={showNew ? "text" : "password"}
                className="form-control"
                placeholder={t("forgot.newPassword")}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ paddingRight: 45 }}
              />

              <span
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "12px",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#6c757d",
                  fontSize: "18px",
                }}
              >
                <i className={`bi ${showNew ? "bi-eye" : "bi-eye-slash"}`}></i>
              </span>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="position-relative mb-3">
              <input
                type={showConfirm ? "text" : "password"}
                className="form-control"
                placeholder={t("forgot.confirmPassword")}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingRight: 45 }}
              />

              <span
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "12px",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#6c757d",
                  fontSize: "18px",
                }}
              >
                <i className={`bi ${showConfirm ? "bi-eye" : "bi-eye-slash"}`}></i>
              </span>
            </div>

            {/* SUBMIT */}
            <button className="btn btn-success w-100" disabled={loadingReset}>
              {loadingReset ? t("forgot.loading") : t("forgot.reset")}
            </button>

            {/* BACK */}
            <button
              type="button"
              className="btn btn-outline-secondary w-100 mt-3"
              onClick={() => navigate("/login")}
            >
              {t("forgot.backToLogin")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
