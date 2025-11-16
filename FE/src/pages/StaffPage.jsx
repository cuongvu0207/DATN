import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { formatters } from "../utils/formatters";
import { validators } from "../utils/validators";

export default function StaffPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    gender: "Nam",
    address: "",
    dateOfBirth: "",
    role: "ROLE_USER",
  });

  const token = localStorage.getItem("accessToken");

  // ===== Helper =====
  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return value;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const normalizeDate = (value) => value; // deprecated, use formatters.date.toISO when submit
  const getRoleLabel = (role) => {
    switch (role) {
      case "ROLE_ADMIN":
        return t("roles.admin");
      case "ROLE_USER":
        return t("roles.user");
      default:
        return t("roles.unknown");
    }
  };

// ===== Fetch nh?n vi?n =====
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/all`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Kh?ng th? t?i danh s?ch nh?n vi?n.");
      const data = await res.json();
      const formatted = (data || []).map((s, i) => ({
        id: s.userID || i,
        username: s.username || "",
        fullName: s.fullName || "",
        email: s.email || "",
        phoneNumber: s.phoneNumber || "",
        gender: String(s.gender) === "1" ? "Nam" : "N?",
        address: s.address || "",
        dateOfBirth: formatters.date.toDisplay(s.dateOfBirth),
        role: s.role || "ROLE_USER",
      }));
      setStaffList(formatted);
    } catch (err) {
      console.error(err);
      setError(t("staff.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // ===== Th?m nh?n vi?n =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (form.dateOfBirth && !validators.date(form.dateOfBirth)) {
      setError(t("account.invalidDate"));
      return;
    }

    const payload = {
      ...form,
      gender: form.gender === "Nam" ? 1 : 0,
      dateOfBirth: formatters.date.toISO(form.dateOfBirth),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      setMessage(t("staff.addSuccess"));
      setShowModal(false);
      resetForm();
      await fetchStaff();
    } catch (err) {
      console.error(err);
      setError(t("staff.addFail"));
    }
  };

  const resetForm = () =>
    setForm({
      username: "",
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
      gender: "Nam",
      address: "",
      dateOfBirth: "",
      role: "ROLE_USER",
    });

  // ===== X?a nh?n vi?n =====
  const handleDelete = async (id) => {
    if (!window.confirm(t("staff.confirmDelete"))) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      await fetchStaff();
      setMessage(t("staff.deleteSuccess"));
    } catch {
      setError(t("staff.deleteFail"));
    }
  };

  // ===== T?m ki?m =====
  const filteredList = staffList.filter((s) => {
    const keyword = (search || "").toLowerCase();
    return (
      (s.fullName || "").toLowerCase().includes(keyword) ||
      (s.username || "").toLowerCase().includes(keyword) ||
      (s.email || "").toLowerCase().includes(keyword)
    );
  });

  // ===== UI =====
  return (
    <MainLayout>
      <div className="container-fluid py-3 px-4">
        {/* HEADER */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <h4 className={`fw-bold text-${theme} mb-0`}>
              {t("staff.title")}
            </h4>

            <div className="position-relative" style={{ width: 420, maxWidth: "100%" }}>
              <i
                className="bi bi-search position-absolute"
                style={{
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: 0.6,
                  fontSize: 18,
                }}
              ></i>
              <input
                type="text"
                className="form-control ps-5"
                placeholder={t("staff.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <button className={`btn btn-${theme}`} onClick={() => setShowModal(true)}>
            <i className="bi bi-person-plus me-1"></i>
            {t("staff.addButton")}
          </button>
        </div>

        {/* ALERTS */}
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* TABLE (gi?ng ProductTable) */}
        <div className={`table-responsive rounded-3 shadow-sm`}>
          <table className="table table-hover align-middle mb-0">
            <thead className={`table-${theme}`} style={{ position: "sticky", top: 0, zIndex: 2 }}>
              <tr>
                <th>#</th>
                <th>{t("staff.username")}</th>
                <th>{t("staff.fullName")}</th>
                <th>{t("staff.email")}</th>
                <th>{t("staff.phoneNumber")}</th>
                <th>{t("staff.gender")}</th>
                <th>{t("staff.dateOfBirth")}</th>
                <th>{t("staff.address")}</th>
                <th>{t("staff.role")}</th>
                <th className="text-center">{t("staff.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2">{t("common.loading")}</p>
                  </td>
                </tr>
              ) : filteredList.length > 0 ? (
                filteredList.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td>{s.username}</td>
                    <td>{s.fullName}</td>
                    <td>{s.email}</td>
                    <td>{s.phoneNumber}</td>
                    <td>
                      <span
                        className={`badge ${
                          s.gender === "Nam"
                            ? "bg-success-subtle text-success border"
                            : "bg-danger-subtle text-danger border"
                        }`}
                      >
                        {s.gender}
                      </span>
                    </td>
                    <td>{s.dateOfBirth}</td>
                    <td>{s.address}</td>
                    <td>
                      <span
                        className={`badge ${
                          s.role === "ROLE_ADMIN"
                            ? "bg-warning text-dark border"
                            : "bg-light text-dark border"
                        }`}
                      >
                        {getRoleLabel(s.role)}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-danger px-3"
                        onClick={() => handleDelete(s.id)}
                      >
                        <i className="bi bi-trash me-1"></i>
                        {t("actions.delete")}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center text-muted py-4">
                    {t("staff.noData")}
                  </td>
                </tr>
              )}
            </tbody>
          </table></div></div>

      {/* MODAL */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered" style={{ maxWidth: 800 }}>
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title">{t("staff.addNew")}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    {[
                      { name: "username", placeholder: "T?n dang nh?p" },
                      { name: "fullName", placeholder: "H? v? t?n" },
                      { name: "email", placeholder: "Email", type: "email" },
                      { name: "password", placeholder: "M?t kh?u", type: "password" },
                      { name: "phoneNumber", placeholder: "S? di?n tho?i" },
                      { name: "address", placeholder: "??a ch?" },
                    ].map((f, i) => (
                      <div className="col-md-4" key={i}>
                        <input
                          type={f.type || "text"}
                          className="form-control"
                          placeholder={f.placeholder}
                          value={form[f.name]}
                          required={["username", "fullName", "email", "password"].includes(f.name)}
                          onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                        />
                      </div>
                    ))}

                    <div className="col-md-4">
                      <input
                        type="date"
                        className="form-control"
                        value={formatters.date.toISO(form.dateOfBirth || "")}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            dateOfBirth: formatters.date.toDisplay(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="col-md-4">
                      <select
                        className="form-select"
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      >
                        <option value="Nam">{t("account.male")}</option>
                        <option value="N?">{t("account.female")}</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <select
                        className="form-select"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                      >
                        <option value="ROLE_USER">{t("roles.user")}</option>
                        <option value="ROLE_ADMIN">{t("roles.admin")}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    {t("actions.cancel")}
                  </button>
                  <button type="submit" className={`btn btn-${theme}`}>
                    {t("actions.save")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}








