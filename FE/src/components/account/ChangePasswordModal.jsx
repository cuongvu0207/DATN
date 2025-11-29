import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../services/api";

export default function ChangePasswordModal({ show, onClose }) {
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("accessToken");

  // === CHECK MẬT KHẨU MẠNH ===
  const checkStrongPassword = (password) => {
    if (!password) return false;

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    return (
      password.length >= 8 &&
      hasUpper &&
      hasLower &&
      hasDigit &&
      hasSpecial
    );
  };

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccessMsg("");
  };

  // === SUBMIT ===
  const handleSubmit = async () => {
    setError("");
    setSuccessMsg("");

    if (!checkStrongPassword(newPassword)) {
      setError(t("changePassword.errors.weakPassword"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("changePassword.errors.mismatch"));
      return;
    }

    setLoading(true);

    try {
      await axios.put(
        `${API_BASE_URL}/auth/users/me/change-password`,
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMsg(t("changePassword.success"));
      resetForm();
      setLoading(false);

      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setLoading(false);

      if (!err.response) {
        setError(t("changePassword.serverError"));
        return;
      }

      const status = err.response.status;

      switch (status) {
        case 401:
          setError(t("changePassword.errors.unauthorized"));
          break;
        case 403:
          setError(t("changePassword.errors.wrongCurrentPassword"));
          break;
        case 400:
          setError(t("changePassword.errors.badRequest"));
          break;
        case 404:
          setError(t("changePassword.errors.userNotFound"));
          break;
        default:
          setError(t("changePassword.serverError"));
      }
    }
  };

  return (
    <Modal show={show} onHide={() => { resetForm(); onClose(); }} centered>

      {/* --- HEADER --- */}
      <Modal.Header closeButton>
        <Modal.Title>{t("changePassword.title")}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <p className="text-danger fw-semibold mb-2">{error}</p>}
        {successMsg && <p className="text-success fw-semibold mb-2">{successMsg}</p>}

        {/* === CURRENT PASSWORD === */}
        <Form.Group className="mb-3">
          <Form.Label>{t("changePassword.currentPassword")}</Form.Label>

          <div className="position-relative">
            <Form.Control
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              placeholder={t("changePassword.currentPasswordPlaceholder")}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ paddingRight: "40px" }}
            />

            <span
              onClick={() => setShowCurrent(!showCurrent)}
              style={{
                position: "absolute",
                top: "50%",
                right: "10px",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#6c757d",
              }}
            >
              <i className={`bi ${showCurrent ? "bi-eye" : "bi-eye-slash"}`} />
            </span>
          </div>
        </Form.Group>

        {/* === NEW PASSWORD === */}
        <Form.Group className="mb-3">
          <Form.Label>{t("changePassword.newPassword")}</Form.Label>

          <div className="position-relative">
            <Form.Control
              type={showNew ? "text" : "password"}
              value={newPassword}
              placeholder={t("changePassword.newPasswordPlaceholder")}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ paddingRight: "40px" }}
            />

            <span
              onClick={() => setShowNew(!showNew)}
              style={{
                position: "absolute",
                top: "50%",
                right: "10px",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#6c757d",
              }}
            >
              <i className={`bi ${showNew ? "bi-eye" : "bi-eye-slash"}`} />
            </span>
          </div>

          {/* === CHECKLIST i18n === */}
          <div className="mt-2 small">
            <p className="fw-semibold mb-1">{t("changePassword.requirements")}:</p>

            <ul className="ps-3 text-muted" style={{ fontSize: 13 }}>
              <li style={{ color: newPassword.length >= 8 ? "green" : "red" }}>
                {t("changePassword.require.minLength")}
              </li>
              <li style={{ color: /[A-Z]/.test(newPassword) ? "green" : "red" }}>
                {t("changePassword.require.upper")}
              </li>
              <li style={{ color: /[a-z]/.test(newPassword) ? "green" : "red" }}>
                {t("changePassword.require.lower")}
              </li>
              <li style={{ color: /\d/.test(newPassword) ? "green" : "red" }}>
                {t("changePassword.require.number")}
              </li>
              <li style={{ color: /[^a-zA-Z0-9]/.test(newPassword) ? "green" : "red" }}>
                {t("changePassword.require.special")}
              </li>
            </ul>
          </div>
        </Form.Group>

        {/* === CONFIRM PASSWORD === */}
        <Form.Group className="mb-2">
          <Form.Label>{t("changePassword.confirmPassword")}</Form.Label>

          <div className="position-relative">
            <Form.Control
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              placeholder={t("changePassword.confirmPasswordPlaceholder")}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ paddingRight: "40px" }}
            />

            <span
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: "absolute",
                top: "50%",
                right: "10px",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#6c757d",
              }}
            >
              <i className={`bi ${showConfirm ? "bi-eye" : "bi-eye-slash"}`} />
            </span>
          </div>

          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-danger small mt-1">
              {t("changePassword.errors.mismatch")}
            </p>
          )}
        </Form.Group>
      </Modal.Body>

      {/* --- FOOTER --- */}
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => {
            resetForm();
            onClose();
          }}
        >
          {t("common.cancel")}
        </Button>

        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? t("common.processing") + "..." : t("changePassword.save")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
