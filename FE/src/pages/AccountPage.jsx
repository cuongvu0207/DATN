import React, { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import { formatters } from "../utils/formatters";
import { validators } from "../utils/validators";
import ChangePasswordModal from "../components/account/ChangePasswordModal"; // ⭐ IMPORT modal

export default function AccountPage() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [account, setAccount] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showChangePass, setShowChangePass] = useState(false); // ⭐ STATE MODAL

  const token = localStorage.getItem("accessToken");

  // ===== Fetch account =====
  const fetchAccount = async () => {
    setLoading(true);
    try {
      if (!token) {
        setError(t("account.noToken"));
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/auth/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = {
        ...res.data,
        dateOfBirth: formatters.date.toDisplay(res.data.dateOfBirth),
      };
      setAccount(formatted);
    } catch (err) {
      console.error(err);
      setError(t("account.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  // ===== Handle form edit =====
  const handleChange = (e) => {
    setAccount({
      ...account,
      [e.target.name]: e.target.value,
    });
  };

  // ===== Update account =====
  const handleUpdate = async () => {
    try {
      if (!token) {
        setError(t("account.noToken"));
        return;
      }

      if (account.dateOfBirth && !validators.date(account.dateOfBirth)) {
        setError(t("account.invalidDate"));
        return;
      }

      const payload = {
        ...account,
        gender:
          account.gender === "Nam" || account.gender === 1
            ? 1
            : account.gender === "Nữ" || account.gender === 0
            ? 0
            : account.gender,
        dateOfBirth: formatters.date.toISO(account.dateOfBirth),
      };

      await axios.put(`${API_BASE_URL}/auth/users/me`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      await fetchAccount();
      setMessage(t("account.updateSuccess"));
      setEditing(false);
    } catch (err) {
      console.error(err);
      setMessage(t("account.updateFail"));
    }
  };

  // ===== Loading UI =====
  if (loading)
    return (
      <MainLayout>
        <div className="text-center py-4">
          <div className="spinner-border text-primary"></div>
          <p className="mt-2">{t("common.loading")}</p>
        </div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="container-fluid py-3 px-4">

        {/* TITLE */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="fw-bold text-black">{t("account.title")}</h4>
        </div>

        <div className="bg-white border rounded-3 shadow-sm p-4">
          {error && <p className="text-danger">{error}</p>}
          {message && <p className="text-success">{message}</p>}

          {account && (
            <div className="row g-3">
              {[
                { label: t("account.username"), name: "username" },
                { label: t("account.fullName"), name: "fullName" },
                { label: t("account.email"), name: "email" },
                { label: t("account.phoneNumber"), name: "phoneNumber" },
                { label: t("account.role"), name: "role" },
                { label: t("account.gender"), name: "gender" },
                { label: t("account.address"), name: "address" },
                { label: t("account.dateOfBirth"), name: "dateOfBirth" },
              ].map((field) => (
                <div key={field.name} className="col-md-6">
                  <label className="form-label fw-semibold">{field.label}</label>

                  {/* EDIT MODE */}
                  {editing ? (
                    field.name === "gender" ? (
                      <select
                        name="gender"
                        className="form-select"
                        value={
                          account.gender === 1 ||
                          account.gender === "1" ||
                          account.gender === "Nam"
                            ? "Nam"
                            : "Nữ"
                        }
                        onChange={(e) =>
                          setAccount({ ...account, gender: e.target.value })
                        }
                      >
                        <option value="Nam">{t("account.male")}</option>
                        <option value="Nữ">{t("account.female")}</option>
                      </select>
                    ) : field.name === "dateOfBirth" ? (
                      <input
                        type="date"
                        className="form-control"
                        value={formatters.date.toISO(account.dateOfBirth)}
                        onChange={(e) =>
                          setAccount({
                            ...account,
                            dateOfBirth: formatters.date.toDisplay(e.target.value),
                          })
                        }
                      />
                    ) : field.name === "role" ? (
                      <p className="form-control bg-light">{account.role}</p>
                    ) : (
                      <input
                        type="text"
                        name={field.name}
                        className="form-control"
                        value={account[field.name] || ""}
                        onChange={handleChange}
                      />
                    )
                  ) : (
                    /* VIEW MODE */
                    <p className="form-control bg-light">
                      {field.name === "gender"
                        ? account.gender === 1 ||
                          account.gender === "1" ||
                          account.gender === "Nam"
                          ? t("account.male")
                          : t("account.female")
                        : field.name === "role"
                        ? (() => {
                            switch (account.role) {
                              case "ROLE_ADMIN":
                                return t("roles.admin");
                              case "ROLE_USER":
                                return t("roles.user");
                              default:
                                return t("roles.unknown");
                            }
                          })()
                        : field.name === "dateOfBirth"
                        ? account.dateOfBirth
                        : account[field.name]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="mt-4 d-flex justify-content-end gap-2">

            {!editing ? (
              <>
                {/* Edit */}
                <button className={`btn btn-${theme}`} onClick={() => setEditing(true)}>
                  {t("account.edit")}
                </button>

                {/* Change password (modal) */}
                <button
                  className="btn btn-warning"
                  onClick={() => setShowChangePass(true)} // ⭐ MỞ MODAL
                >
                  {t("account.changePassword")}
                </button>
              </>
            ) : (
              <>
                <button className={`btn btn-${theme}`} onClick={handleUpdate}>
                  {t("account.save")}
                </button>

                <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                  {t("account.cancel")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ⭐ MODAL ĐỔI MẬT KHẨU */}
      <ChangePasswordModal
        show={showChangePass}
        onClose={() => setShowChangePass(false)}
      />

    </MainLayout>
  );
}
