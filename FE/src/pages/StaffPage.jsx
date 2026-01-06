import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { formatters } from "../utils/formatters";
import { validators } from "../utils/validators";
import TablePagination from "../components/common/TablePagination";

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

  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

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

  const validatePhoneNumber = (phone) => {
    if (!phone || phone.trim() === "") return true;
    const cleaned = phone.replace(/\D/g, "");
    const vietnamPhoneRegex =
      /^(0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    return vietnamPhoneRegex.test(cleaned);
  };

  // 🔐 mật khẩu mạnh
  const checkStrongPassword = (password) => {
    if (!password) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    return password.length >= 8 && hasUpper && hasLower && hasDigit && hasSpecial;
  };

  const validateForm = () => {
    const errors = {};

    // Username
    if (!form.username.trim()) {
      errors.username = t("validation.required", "Trường này là bắt buộc");
    } else if (form.username.length < 3) {
      errors.username = t(
        "validation.usernameMinLength",
        "Tên đăng nhập phải có ít nhất 3 ký tự"
      );
    }

    // Full name
    if (!form.fullName.trim()) {
      errors.fullName = t("validation.required", "Trường này là bắt buộc");
    }

    // Email
    if (!form.email.trim()) {
      errors.email = t("validation.required", "Trường này là bắt buộc");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = t("validation.invalidEmail", "Email không hợp lệ");
    }

    // Password
    if (!form.password.trim()) {
      errors.password = t("validation.required", "Trường này là bắt buộc");
    } else if (!checkStrongPassword(form.password)) {
      errors.password = t(
        "changePassword.errors.weakPassword",
        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
      );
    }

    // Phone
    if (form.phoneNumber && form.phoneNumber.trim() !== "") {
      if (!validatePhoneNumber(form.phoneNumber.trim())) {
        errors.phoneNumber = t(
          "validation.invalidPhone",
          "Số điện thoại không hợp lệ"
        );
      }
    }

    // Date of birth
    if (form.dateOfBirth && form.dateOfBirth.trim() !== "") {
      if (!validators.date(form.dateOfBirth)) {
        errors.dateOfBirth = t(
          "validation.invalidDate",
          "Ngày không hợp lệ (dd/mm/yyyy)"
        );
      } else {
        const birthDate = new Date(formatters.date.toISO(form.dateOfBirth));
        const today = new Date();
        if (birthDate > today) {
          errors.dateOfBirth = t(
            "validation.dateFuture",
            "Ngày sinh không thể ở tương lai"
          );
        }
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          errors.dateOfBirth = t(
            "validation.ageRestriction",
            "Nhân viên phải từ 18 tuổi trở lên"
          );
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ===== Fetch staff =====
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
        gender:
          String(s.gender) === "1"
            ? t("staff.male", "Nam")
            : t("staff.female", "Nữ"),
        address: s.address || "",
        dateOfBirth: s.dateOfBirth
          ? formatters.date.toDisplay(s.dateOfBirth)
          : "",
        role: s.role || "ROLE_USER",
        rawData: s,
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

  // ===== Search + Pagination =====
  const filteredList = staffList.filter((s) => {
    const keyword = (search || "").toLowerCase();
    return (
      (s.fullName || "").toLowerCase().includes(keyword) ||
      (s.username || "").toLowerCase().includes(keyword) ||
      (s.email || "").toLowerCase().includes(keyword) ||
      (s.phoneNumber || "").toLowerCase().includes(keyword)
    );
  });

  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = filteredList.slice(startIndex, startIndex + rowsPerPage);
  const rowsSelectValue =
    rowsPerPage >= filteredList.length ? "all" : rowsPerPage;

  const handleRowsPerPageChange = (value) => {
    if (value === "all") {
      setRowsPerPage(filteredList.length || 1);
    } else {
      setRowsPerPage(Number(value));
    }
    setCurrentPage(1);
  };

  // ===== Form handlers =====
  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handlePhoneChange = (value) => {
    let cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 10) cleaned = cleaned.substring(0, 10);

    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = cleaned.substring(0, 4) + " " + cleaned.substring(4);
    }
    if (cleaned.length > 7) {
      formatted = formatted.substring(0, 8) + " " + formatted.substring(8);
    }
    handleInputChange("phoneNumber", formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!validateForm()) return;

    const payload = {
      username: form.username.trim(),
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      phoneNumber: form.phoneNumber.trim() || null,
      gender: form.gender === t("staff.male", "Nam") ? 1 : 0,
      address: form.address.trim() || null,
      dateOfBirth: form.dateOfBirth.trim()
        ? formatters.date.toISO(form.dateOfBirth)
        : null,
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
      setError(
        t("staff.addFail", "Thêm nhân viên thất bại: ") + err.message
      );
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

  const handleDelete = async (id, username) => {
    if (
      !window.confirm(
        t(
          "staff.confirmDelete",
          "Bạn có chắc chắn muốn xóa nhân viên {username}?",
          { username }
        )
      )
    )
      return;

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

  // ===== UI =====
  return (
    <MainLayout>
      <div className="container-fluid py-3 px-4">
        {/* HEADER */}
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
          {/* Title */}
          <h4 className="fw-bold mb-0 text-nowrap">
            {t("staff.title", "Danh sách nhân viên")}
          </h4>

          {/* Search: chiếm toàn bộ khoảng trống giữa title và nút thêm */}
          <div className="flex-grow-1 mx-2 order-3 order-md-2">
            <div className="position-relative" style={{ width: "100%" }}>
              <i
                className={`bi bi-search position-absolute top-50 start-0 translate-middle-y ps-3 text-${theme}`}
                style={{ fontSize: 15 }}
              />
              <input
                type="text"
                className="form-control ps-5"
                style={{ height: 40, paddingLeft: 45 }}
                placeholder={t("staff.searchPlaceholder", "Tìm kiếm nhân viên...")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Button thêm nhân viên */}
          <button
            className={`btn btn-${theme} text-white fw-semibold d-flex align-items-center rounded-3 px-3 order-2 order-md-3`}
            style={{ height: 40 }}
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-person-plus" />
            <span className="ms-2 d-none d-sm-inline">
              {t("staff.addButton", "Thêm nhân viên")}
            </span>
          </button>
        </div>

        {/* ALERTS */}
        {message && (
          <div className="alert alert-success alert-dismissible fade show mb-3">
            <i className="bi bi-check-circle me-2"></i>
            {message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setMessage("")}
            ></button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
            ></button>
          </div>
        )}

        {/* TABLE + PAGINATION */}
        <div className="row g-3 mt-1">
          <div className="col-12">
            <div className="table-responsive rounded-3 shadow-sm">
              <div
                style={{
                  maxHeight: "60vh",
                  overflowX: "auto",
                  overflowY: "auto",
                }}
              >
                <table className="table table-hover align-middle mb-0">
                  <thead
                    className={`table-${theme}`}
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      backgroundColor: "var(--bs-body-bg)",
                    }}
                  >
                    <tr>
                      <th style={{ width: "50px" }} className="fw-semibold">
                        #
                      </th>
                      <th className="fw-semibold">
                        {t("staff.username", "Tên đăng nhập")}
                      </th>
                      <th className="fw-semibold">
                        {t("staff.fullName", "Họ và tên")}
                      </th>
                      <th className="fw-semibold">
                        {t("staff.email", "Email")}
                      </th>
                      <th className="fw-semibold">
                        {t("staff.phoneNumber", "Số điện thoại")}
                      </th>
                      <th className="fw-semibold">
                        {t("staff.gender", "Giới tính")}
                      </th>
                      <th className="fw-semibold">
                        {t("staff.dateOfBirth", "Ngày sinh")}
                      </th>
                      <th className="fw-semibold">
                        {t("staff.role", "Vai trò")}
                      </th>
                      {/* <th className="fw-semibold text-center">
                        {t("staff.actions", "Thao tác")}
                      </th> */}
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="9" className="text-center py-5">
                          <div
                            className={`spinner-border text-${theme}`}
                            role="status"
                          ></div>
                          <p className="mt-2 text-muted">
                            {t("common.loading", "Đang tải...")}
                          </p>
                        </td>
                      </tr>
                    ) : currentRows.length > 0 ? (
                      currentRows.map((s, i) => (
                        <tr key={s.id}>
                          <td className="text-muted">
                            {startIndex + i + 1}
                          </td>
                          <td className="fw-medium">{s.username}</td>
                          <td>{s.fullName}</td>
                          <td>
                            {s.email ? (
                              <a
                                href={`mailto:${s.email}`}
                                className="text-decoration-none text-dark"
                              >
                                {s.email}
                              </a>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {s.phoneNumber ? (
                              <a
                                href={`tel:${s.phoneNumber}`}
                                className="text-decoration-none text-dark"
                              >
                                {s.phoneNumber}
                              </a>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <span className="text-dark">{s.gender}</span>
                          </td>
                          <td className="text-dark">
                            {s.dateOfBirth || (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${s.role === "ROLE_ADMIN"
                                ? "bg-warning text-dark"
                                : "bg-secondary text-white"
                                }`}
                            >
                              {getRoleLabel(s.role)}
                            </span>
                          </td>
                          {/* <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(s.id, s.username)}
                              title={t("staff.delete", "Xóa")}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td> */}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="9"
                          className="text-center text-muted py-4"
                        >
                          {t("staff.noData", "Không có nhân viên nào")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              currentPage={currentPage}
              totalItems={filteredList.length}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[15, 20, 30, 50, 100]}
              rowsPerPageValue={rowsSelectValue}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </div>
        </div>
      </div>

      {/* MODAL Add staff */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) =>
            e.target.className === "modal fade show d-block" &&
            setShowModal(false)
          }
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

              <form onSubmit={handleSubmit} autoComplete="off">
                {/* Fake fields để trình duyệt autofill vào đây */}
                <input
                  type="text"
                  name="fake-username"
                  autoComplete="username"
                  style={{ position: "absolute", left: "-9999px", top: "-9999px", height: 0, width: 0, opacity: 0 }}
                />
                <input
                  type="password"
                  name="fake-password"
                  autoComplete="current-password"
                  style={{ position: "absolute", left: "-9999px", top: "-9999px", height: 0, width: 0, opacity: 0 }}
                />
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Username */}
                    <div className="col-md-6">
                      <label className="form-label">
                        <span className="fw-medium">
                          {t("staff.username", "Tên đăng nhập")}
                        </span>
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${formErrors.username ? "is-invalid" : ""
                          }`}
                        placeholder={t(
                          "staff.usernamePlaceholder",
                          "Nhập tên đăng nhập"
                        )}
                        value={form.username}
                        onChange={(e) =>
                          handleInputChange("username", e.target.value)
                        }
                      />
                      {formErrors.username && (
                        <div className="invalid-feedback small">
                          {formErrors.username}
                        </div>
                      )}
                    </div>

                    {/* Full Name */}
                    <div className="col-md-6">
                      <label className="form-label">
                        <span className="fw-medium">
                          {t("staff.fullName", "Họ và tên")}
                        </span>
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${formErrors.fullName ? "is-invalid" : ""
                          }`}
                        placeholder={t(
                          "staff.fullNamePlaceholder",
                          "Nhập họ và tên"
                        )}
                        value={form.fullName}
                        onChange={(e) =>
                          handleInputChange("fullName", e.target.value)
                        }
                      />
                      {formErrors.fullName && (
                        <div className="invalid-feedback small">
                          {formErrors.fullName}
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="col-md-6">
                      <label className="form-label">
                        <span className="fw-medium">
                          {t("staff.email", "Email")}
                        </span>
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="email"
                        className={`form-control form-control-sm ${formErrors.email ? "is-invalid" : ""
                          }`}
                        placeholder={t(
                          "staff.emailPlaceholder",
                          "example@company.com"
                        )}
                        value={form.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                      />
                      {formErrors.email && (
                        <div className="invalid-feedback small">
                          {formErrors.email}
                        </div>
                      )}
                    </div>

                    {/* Password */}
                    <div className="col-md-6">
                      <label className="form-label">
                        <span className="fw-medium">
                          {t("staff.password", "Mật khẩu")}
                        </span>
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="password"
                        className={`form-control form-control-sm ${formErrors.password ? "is-invalid" : ""
                          }`}
                        placeholder={t(
                          "staff.passwordPlaceholder",
                          "Ít nhất 8 ký tự, có hoa, thường, số, ký tự đặc biệt"
                        )}
                        value={form.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                      />
                      {formErrors.password && (
                        <div className="invalid-feedback small">
                          {formErrors.password}
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
                        {t("staff.phoneNumber", "Số điện thoại")}
                      </label>
                      <input
                        type="tel"
                        className={`form-control form-control-sm ${formErrors.phoneNumber ? "is-invalid" : ""
                          }`}
                        placeholder={t(
                          "staff.phonePlaceholder",
                          ""
                        )}
                        value={form.phoneNumber}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                      />
                      {formErrors.phoneNumber && (
                        <div className="invalid-feedback small">
                          {formErrors.phoneNumber}
                        </div>
                      )}
                    </div>

                    {/* Date of birth */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
                        {t("staff.dateOfBirth", "Ngày sinh")}
                      </label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${formErrors.dateOfBirth ? "is-invalid" : ""
                          }`}
                        placeholder={t(
                          "staff.datePlaceholder",
                          "dd/mm/yyyy"
                        )}
                        value={form.dateOfBirth}
                        onChange={(e) =>
                          handleInputChange("dateOfBirth", e.target.value)
                        }
                      />
                      {formErrors.dateOfBirth && (
                        <div className="invalid-feedback small">
                          {formErrors.dateOfBirth}
                        </div>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="col-md-4">
                      <label className="form-label fw-medium">
                        {t("staff.gender", "Giới tính")}
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={form.gender}
                        onChange={(e) =>
                          handleInputChange("gender", e.target.value)
                        }
                      >
                        <option value="Nam">
                          {t("staff.male", "Nam")}
                        </option>
                        <option value="Nữ">
                          {t("staff.female", "Nữ")}
                        </option>
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
                        onChange={(e) =>
                          handleInputChange("role", e.target.value)
                        }
                      >
                        <option value="ROLE_USER">
                          {t("staff.roleUser", "Nhân viên")}
                        </option>
                        <option value="ROLE_ADMIN">
                          {t("staff.roleAdmin", "Quản trị viên")}
                        </option>
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
                        placeholder={t(
                          "staff.addressPlaceholder",
                          "Nhập địa chỉ (không bắt buộc)"
                        )}
                        value={form.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
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
                  <button
                    type="submit"
                    className={`btn btn-${theme} btn-sm px-4`}
                  >
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
