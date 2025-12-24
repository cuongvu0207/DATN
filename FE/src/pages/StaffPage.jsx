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
  const [formErrors, setFormErrors] = useState({});

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

  // ===== Helper Functions =====
  const getRoleLabel = (role) => {
    switch (role) {
      case "ROLE_ADMIN":
        return t("staff.roleAdmin", "Quản trị viên");
      case "ROLE_USER":
        return t("staff.roleUser", "Nhân viên");
      default:
        return t("staff.roleUnknown", "Không xác định");
    }
  };

  // Validate phone number (Vietnam standard)
  const validatePhoneNumber = (phone) => {
    if (!phone || phone.trim() === "") return true; // Allow empty
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Vietnam phone number regex: starts with 0, followed by 9 or 10 digits total
    // Common patterns: 0xxx xxx xxx, 0xx xxx xxxx
    const vietnamPhoneRegex = /^(0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    
    if (!vietnamPhoneRegex.test(cleaned)) {
      return false;
    }
    
    return true;
  };

  const validateForm = () => {
    const errors = {};
    
    // Username validation
    if (!form.username.trim()) {
      errors.username = t("validation.required", "Trường này là bắt buộc");
    } else if (form.username.length < 3) {
      errors.username = t("validation.usernameMinLength", "Tên đăng nhập phải có ít nhất 3 ký tự");
    }

    // Full name validation
    if (!form.fullName.trim()) {
      errors.fullName = t("validation.required", "Trường này là bắt buộc");
    }

    // Email validation
    if (!form.email.trim()) {
      errors.email = t("validation.required", "Trường này là bắt buộc");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = t("validation.invalidEmail", "Email không hợp lệ");
    }

    // Password validation
    if (!form.password.trim()) {
      errors.password = t("validation.required", "Trường này là bắt buộc");
    } else if (form.password.length < 6) {
      errors.password = t("validation.passwordMinLength", "Mật khẩu phải có ít nhất 6 ký tự");
    }

    // Phone validation (optional but must be valid if provided)
    if (form.phoneNumber && form.phoneNumber.trim() !== "") {
      if (!validatePhoneNumber(form.phoneNumber.trim())) {
        errors.phoneNumber = t("validation.invalidPhone", "Số điện thoại không hợp lệ. Ví dụ: 0912345678");
      }
    }

    // Date validation (optional)
    if (form.dateOfBirth && form.dateOfBirth.trim() !== "") {
      if (!validators.date(form.dateOfBirth)) {
        errors.dateOfBirth = t("validation.invalidDate", "Ngày không hợp lệ (dd/mm/yyyy)");
      } else {
        const birthDate = new Date(formatters.date.toISO(form.dateOfBirth));
        const today = new Date();
        if (birthDate > today) {
          errors.dateOfBirth = t("validation.dateFuture", "Ngày sinh không thể ở tương lai");
        }
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          errors.dateOfBirth = t("validation.ageRestriction", "Nhân viên phải từ 18 tuổi trở lên");
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ===== Fetch nhân viên =====
  const fetchStaff = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/all`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Không thể tải danh sách nhân viên");
      const data = await res.json();
      const formatted = (data || []).map((s, i) => ({
        id: s.userID || i,
        username: s.username || "",
        fullName: s.fullName || "",
        email: s.email || "",
        phoneNumber: s.phoneNumber || "",
        gender: String(s.gender) === "1" ? t("staff.male", "Nam") : t("staff.female", "Nữ"),
        address: s.address || "",
        dateOfBirth: s.dateOfBirth ? formatters.date.toDisplay(s.dateOfBirth) : "",
        role: s.role || "ROLE_USER",
        rawData: s
      }));
      setStaffList(formatted);
    } catch (err) {
      console.error(err);
      setError(t("staff.loadError", "Không tải được danh sách nhân viên"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // ===== Thêm nhân viên =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!validateForm()) {
      return;
    }

    const payload = {
      username: form.username.trim(),
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      phoneNumber: form.phoneNumber.trim() || null,
      gender: form.gender === t("staff.male", "Nam") ? 1 : 0,
      address: form.address.trim() || null,
      dateOfBirth: form.dateOfBirth.trim() ? formatters.date.toISO(form.dateOfBirth) : null,
      role: form.role,
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

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create user");
      }

      setMessage(t("staff.addSuccess", "Thêm nhân viên thành công!"));
      setShowModal(false);
      resetForm();
      await fetchStaff();
    } catch (err) {
      console.error(err);
      setError(t("staff.addFail", "Thêm nhân viên thất bại: ") + err.message);
    }
  };

  const resetForm = () => {
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
    setFormErrors({});
  };

  // ===== Xóa nhân viên =====
  const handleDelete = async (id, username) => {
    if (!window.confirm(t("staff.confirmDelete", "Bạn có chắc chắn muốn xóa nhân viên {username}?", { username }))) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      await fetchStaff();
      setMessage(t("staff.deleteSuccess", "Xóa nhân viên thành công!"));
    } catch {
      setError(t("staff.deleteFail", "Xóa nhân viên thất bại!"));
    }
  };

  // ===== Tìm kiếm =====
  const filteredList = staffList.filter((s) => {
    const keyword = (search || "").toLowerCase();
    return (
      (s.fullName || "").toLowerCase().includes(keyword) ||
      (s.username || "").toLowerCase().includes(keyword) ||
      (s.email || "").toLowerCase().includes(keyword) ||
      (s.phoneNumber || "").toLowerCase().includes(keyword)
    );
  });

  // ===== Handle input changes with validation =====
  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Format phone number input
  const handlePhoneChange = (value) => {
    // Remove all non-digit characters
    let cleaned = value.replace(/\D/g, '');
    
    // Limit to 10 digits (Vietnam phone number length)
    if (cleaned.length > 10) {
      cleaned = cleaned.substring(0, 10);
    }
    
    // Format with spaces: 0xx xxx xxxx
    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = cleaned.substring(0, 4) + ' ' + cleaned.substring(4);
    }
    if (cleaned.length > 7) {
      formatted = formatted.substring(0, 8) + ' ' + formatted.substring(8);
    }
    
    handleInputChange("phoneNumber", formatted);
  };

  // ===== UI =====
  return (
    <MainLayout>
      <div className="container-fluid py-3 px-4">
        {/* HEADER */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-3">
            <h4 className={`fw-bold mb-0`}>
              {t("staff.title", "Quản lý nhân viên")}
            </h4>

            <div className="position-relative" style={{ width: 320 }}>
              <i
                className="bi bi-search position-absolute"
                style={{
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 14,
                  color: "#6c757d"
                }}
              ></i>
              <input
                type="text"
                className="form-control form-control-sm ps-4 py-2"
                placeholder={t("staff.searchPlaceholder", "Tìm kiếm nhân viên...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <button 
            className={`btn btn-${theme} btn-sm px-3 py-2`} 
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-person-plus me-1"></i>
            {t("staff.addButton", "Thêm nhân viên")}
          </button>
        </div>

        {/* ALERTS */}
        {message && (
          <div className="alert alert-success alert-dismissible fade show mb-3">
            <i className="bi bi-check-circle me-2"></i>
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError("")}></button>
          </div>
        )}

        {/* TABLE */}
        <div className="table-responsive border rounded">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="fw-semibold" style={{ width: "50px" }}>#</th>
                <th className="fw-semibold">{t("staff.username", "Tên đăng nhập")}</th>
                <th className="fw-semibold">{t("staff.fullName", "Họ và tên")}</th>
                <th className="fw-semibold">{t("staff.email", "Email")}</th>
                <th className="fw-semibold">{t("staff.phoneNumber", "Số điện thoại")}</th>
                <th className="fw-semibold">{t("staff.gender", "Giới tính")}</th>
                <th className="fw-semibold">{t("staff.dateOfBirth", "Ngày sinh")}</th>
                <th className="fw-semibold">{t("staff.role", "Vai trò")}</th>
                <th className="fw-semibold text-center">{t("staff.actions", "Thao tác")}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-5">
                    <div className={`spinner-border text-${theme}`} role="status"></div>
                    <p className="mt-2 text-muted">{t("common.loading", "Đang tải...")}</p>
                  </td>
                </tr>
              ) : filteredList.length > 0 ? (
                filteredList.map((s, i) => (
                  <tr key={s.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td className="fw-medium">{s.username}</td>
                    <td>{s.fullName}</td>
                    <td>
                      {s.email ? (
                        <a href={`mailto:${s.email}`} className="text-decoration-none text-dark">
                          {s.email}
                        </a>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {s.phoneNumber ? (
                        <a href={`tel:${s.phoneNumber}`} className="text-decoration-none text-dark">
                          {s.phoneNumber}
                        </a>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <span className="text-dark">
                        {s.gender}
                      </span>
                    </td>
                    <td className="text-dark">{s.dateOfBirth || <span className="text-muted">-</span>}</td>
                    <td>
                      <span
                        className={`badge ${
                          s.role === "ROLE_ADMIN"
                            ? "bg-warning text-dark"
                            : "bg-secondary text-white"
                        }`}
                      >
                        {getRoleLabel(s.role)}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(s.id, s.username)}
                        title={t("staff.delete", "Xóa")}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-5">
                    <i className="bi bi-people display-5 d-block mb-2 opacity-50"></i>
                    {t("staff.noData", "Không có nhân viên nào")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination info */}
        {filteredList.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <small className="text-muted">
              {t("common.showing", "Hiển thị")} <strong>{filteredList.length}</strong> {t("common.of", "trong tổng")} <strong>{staffList.length}</strong> {t("common.records", "bản ghi")}
            </small>
          </div>
        )}
      </div>

      {/* MODAL Thêm nhân viên */}
      {showModal && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target.className === "modal fade show d-block" && setShowModal(false)}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-plus me-2"></i>
                  {t("staff.addNew", "Thêm nhân viên mới")}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                ></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Username */}
                    <div className="col-md-6">
                      <label className="form-label">
                        <span className="fw-medium">{t("staff.username", "Tên đăng nhập")}</span>
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${formErrors.username ? "is-invalid" : ""}`}
                        placeholder={t("staff.usernamePlaceholder", "Nhập tên đăng nhập")}
                        value={form.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                      />
                      {formErrors.username && (
                        <div className="invalid-feedback small">{formErrors.username}</div>
                      )}
                    </div>

                    {/* Full Name */}
                    <div className="col-md-6">
                      <label className="form-label">
                        <span className="fw-medium">{t("staff.fullName", "Họ và tên")}</span>
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${formErrors.fullName ? "is-invalid" : ""}`}
                        placeholder={t("staff.fullNamePlaceholder", "Nhập họ và tên")}
                        value={form.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                      />
                      {formErrors.fullName && (
                        <div className="invalid-feedback small">{formErrors.fullName}</div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="col-md-6">
                      <label className="form-label">
                        <span className="fw-medium">{t("staff.email", "Email")}</span>
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="email"
                        className={`form-control form-control-sm ${formErrors.email ? "is-invalid" : ""}`}
                        placeholder={t("staff.emailPlaceholder", "example@company.com")}
                        value={form.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                      {formErrors.email && (
                        <div className="invalid-feedback small">{formErrors.email}</div>
                      )}
                    </div>

                    {/* Password */}
                    <div className="col-md-6">
                      <label className="form-label">
                        <span className="fw-medium">{t("staff.password", "Mật khẩu")}</span>
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="password"
                        className={`form-control form-control-sm ${formErrors.password ? "is-invalid" : ""}`}
                        placeholder={t("staff.passwordPlaceholder", "Ít nhất 6 ký tự")}
                        value={form.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                      />
                      {formErrors.password && (
                        <div className="invalid-feedback small">{formErrors.password}</div>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
                        {t("staff.phoneNumber", "Số điện thoại")}
                      </label>
                      <input
                        type="tel"
                        className={`form-control form-control-sm ${formErrors.phoneNumber ? "is-invalid" : ""}`}
                        placeholder={t("staff.phonePlaceholder", "0912 345 678")}
                        value={form.phoneNumber}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                      />
                      {formErrors.phoneNumber && (
                        <div className="invalid-feedback small">{formErrors.phoneNumber}</div>
                      )}
                      <small className="text-muted">
                        {t("staff.phoneFormatHint", "Định dạng: 09xx xxx xxx hoặc 03x xxx xxxx")}
                      </small>
                    </div>

                    {/* Date of Birth */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
                        {t("staff.dateOfBirth", "Ngày sinh")}
                      </label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${formErrors.dateOfBirth ? "is-invalid" : ""}`}
                        placeholder={t("staff.datePlaceholder", "dd/mm/yyyy")}
                        value={form.dateOfBirth}
                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      />
                      {formErrors.dateOfBirth && (
                        <div className="invalid-feedback small">{formErrors.dateOfBirth}</div>
                      )}
                      <small className="text-muted">
                        {t("staff.dateFormatHint", "Định dạng: dd/mm/yyyy")}
                      </small>
                    </div>

                    {/* Gender */}
                    <div className="col-md-4">
                      <label className="form-label fw-medium">
                        {t("staff.gender", "Giới tính")}
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={form.gender}
                        onChange={(e) => handleInputChange("gender", e.target.value)}
                      >
                        <option value="Nam">{t("staff.male", "Nam")}</option>
                        <option value="Nữ">{t("staff.female", "Nữ")}</option>
                      </select>
                    </div>

                    {/* Role */}
                    <div className="col-md-4">
                      <label className="form-label fw-medium">
                        {t("staff.role", "Vai trò")}
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={form.role}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                      >
                        <option value="ROLE_USER">{t("staff.roleUser", "Nhân viên")}</option>
                        <option value="ROLE_ADMIN">{t("staff.roleAdmin", "Quản trị viên")}</option>
                      </select>
                    </div>

                    {/* Address */}
                    <div className="col-md-12 mt-2">
                      <label className="form-label fw-medium">
                        {t("staff.address", "Địa chỉ")}
                      </label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        placeholder={t("staff.addressPlaceholder", "Nhập địa chỉ (không bắt buộc)")}
                        value={form.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top pt-3">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-sm px-4" 
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    {t("actions.cancel", "Hủy")}
                  </button>
                  <button type="submit" className={`btn btn-${theme} btn-sm px-4`}>
                    <i className="bi bi-check-circle me-1"></i>
                    {t("actions.save", "Lưu")}
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