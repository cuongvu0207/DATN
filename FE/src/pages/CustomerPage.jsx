import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import CustomerTable from "../components/customers/CustomerTable";

const initialFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  address: "",
  gender: "male",
};

const normalizeGender = (value) => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (["1", "nam", "male", "m", "true"].includes(raw)) return "male";
  if (["0", "nữ", "nu", "female", "f", "false"].includes(raw)) return "female";
  return "unknown";
};

// Hàm validate số điện thoại Việt Nam
const validateVietnamesePhone = (phone) => {
  const phoneStr = String(phone || "").trim();

  // Bỏ dấu +84 nếu có
  const normalizedPhone = phoneStr.replace(/^\+84/, "0");

  // Các mẫu số điện thoại Việt Nam hợp lệ
  const phonePatterns = [
    /^(0[3|5|7|8|9])[0-9]{8}$/, // 10 số: 03x, 05x, 07x, 08x, 09x
    /^(84[3|5|7|8|9])[0-9]{8}$/, // 11 số với 84
    /^(\+84[3|5|7|8|9])[0-9]{8}$/, // 12 số với +84
  ];

  if (!phoneStr) {
    return "Số điện thoại là bắt buộc";
  }

  if (!phonePatterns.some((pattern) => pattern.test(normalizedPhone))) {
    return "Số điện thoại không hợp lệ. Ví dụ: 0912345678 hoặc 0381234567";
  }

  return "";
};

export default function CustomerPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(initialFormState);
  const [phoneError, setPhoneError] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const token = localStorage.getItem("accessToken");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/customer`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formatted = (res.data || []).map((c) => ({
        id: c.id,
        fullName: c.fullName || c.name || "",
        email: c.email || "",
        phoneNumber: c.phoneNumber || c.phone || "",
        gender: normalizeGender(c.gender),
        address: c.address || "",
      }));
      setCustomers(formatted);
    } catch {
      setError(
        t("customer.loadError") || "Không thể tải danh sách khách hàng"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!message && !error) return undefined;
    const timer = setTimeout(() => {
      setMessage("");
      setError("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, error]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      // Tự động thêm tiền tố 0 nếu bắt đầu bằng các đầu số Việt Nam
      let processedValue = value;
      if (value.length === 1 && ["3", "5", "7", "8", "9"].includes(value)) {
        processedValue = `0${value}`;
      }

      setForm((prev) => ({ ...prev, [name]: processedValue }));

      // Validate real-time
      if (processedValue.length >= 3) {
        const error = validateVietnamesePhone(processedValue);
        setPhoneError(error);
      } else {
        setPhoneError("");
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    // Xóa lỗi của trường đang được sửa
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setForm(initialFormState);
    setPhoneError("");
    setFormErrors({});
  };

  const handleEditClick = (customer) => {
    setEditingCustomer(customer);
    setForm({
      fullName: customer.fullName || "",
      phoneNumber: customer.phoneNumber || "",
      email: customer.email || "",
      address: customer.address || "",
      gender: customer.gender === "female" ? "female" : "male",
    });
    setPhoneError("");
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!form.fullName?.trim()) {
      errors.fullName =
        t("customer.fullNameRequired") || "Họ và tên là bắt buộc";
    }

    const phoneValidation = validateVietnamesePhone(form.phoneNumber);
    if (phoneValidation) {
      errors.phoneNumber = phoneValidation;
      setPhoneError(phoneValidation);
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        name: (form.fullName || "").trim(),
        phone: (form.phoneNumber || "").trim(),
        email: (form.email || "").trim(),
        address: (form.address || "").trim(),
        gender: form.gender === "female" ? 0 : 1,
      };

      if (editingCustomer?.id) {
        await axios.put(
          `${API_BASE_URL}/customer/${editingCustomer.id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setMessage(
          t("customer.updateSuccess") ||
            "Đã cập nhật khách hàng thành công!"
        );
      } else {
        await axios.post(`${API_BASE_URL}/customer`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setMessage(
          t("customer.addSuccess") || "Đã thêm khách hàng thành công!"
        );
      }
      handleCloseModal();
      fetchCustomers();
      setError("");
    } catch (err) {
      console.error("Create customer error", err);
      let errorMessage = "";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 409) {
        errorMessage =
          t("customer.phoneExists") ||
          "Số điện thoại đã tồn tại trong hệ thống";
      } else {
        errorMessage = editingCustomer
          ? t("customer.updateError") || "Không thể cập nhật khách hàng."
          : t("customer.addError") || "Không thể thêm khách hàng.";
      }

      setError(errorMessage);
      setMessage("");
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        t("customer.deleteConfirm") || "Xác nhận xóa khách hàng này?"
      )
    )
      return;
    try {
      await axios.delete(`${API_BASE_URL}/customer/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCustomers();
      setMessage(
        t("customer.deleteSuccess") || "Đã xóa khách hàng thành công!"
      );
      setError("");
    } catch {
      setError(t("customer.deleteError") || "Lỗi khi xóa khách hàng!");
      setMessage("");
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return (
      (c.fullName || "").toLowerCase().includes(keyword) ||
      (c.email || "").toLowerCase().includes(keyword) ||
      (c.phoneNumber || "").toLowerCase().includes(keyword) ||
      (c.address || "").toLowerCase().includes(keyword)
    );
  });

  return (
    <MainLayout>
      <div className="container-fluid py-3 px-4">
        {/* HEADER giống style trang nhân viên */}
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
          {/* Tiêu đề */}
          <h4 className={`fw-bold text-${theme} mb-0 text-nowrap`}>
            {t("customer.title") || "Quản lý khách hàng"}
          </h4>

          {/* Ô tìm kiếm: fill khoảng trống giữa title và nút thêm */}
          <div className="flex-grow-1 mx-2 order-3 order-md-2">
            <div className="position-relative" style={{ width: "100%" }}>
              <i
                className="bi bi-search position-absolute"
                style={{
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: 0.6,
                }}
              />
              <input
                type="text"
                className="form-control ps-5"
                placeholder={
                  t("customer.searchPlaceholder") ||
                  "Tìm kiếm khách hàng..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ height: 40, paddingLeft: 40 }}
              />
            </div>
          </div>

          {/* Nút thêm khách hàng */}
          <button
            className={`btn btn-${theme} text-white fw-semibold d-flex align-items-center rounded-3 px-3 order-2 order-md-3`}
            style={{ height: 40 }}
            onClick={() => {
              setEditingCustomer(null);
              setForm(initialFormState);
              setPhoneError("");
              setFormErrors({});
              setShowModal(true);
            }}
          >
            <i className="bi bi-person-plus me-1" />
            <span className="d-none d-sm-inline">
              {t("customer.add") || "Thêm khách hàng"}
            </span>
          </button>
        </div>

        {/* ALERTS */}
        {message && (
          <div className="alert alert-success alert-dismissible fade show">
            {message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setMessage("")}
            ></button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
            ></button>
          </div>
        )}

        {/* Bảng khách hàng */}
        <CustomerTable
          customers={filteredCustomers}
          loading={loading}
          theme={theme}
          onDelete={handleDelete}
          onEdit={handleEditClick}
        />

        {/* MODAL */}
        {showModal && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              background: "rgba(0,0,0,.4)",
              zIndex: 1050,
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingCustomer
                      ? t("customer.edit") || "Chỉnh sửa khách hàng"
                      : t("customer.add") || "Thêm khách hàng"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseModal}
                  />
                </div>
                <form onSubmit={handleSubmit} autoComplete="off">
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">
                        {t("customer.fullName") || "Họ và tên"}
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        className={`form-control ${
                          formErrors.fullName ? "is-invalid" : ""
                        }`}
                        placeholder={
                          t("customer.fullNamePlaceholder") || "Nhập họ và tên"
                        }
                        value={form.fullName}
                        onChange={handleChange}
                      />
                      {formErrors.fullName && (
                        <div className="invalid-feedback d-block">
                          {formErrors.fullName}
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        {t("customer.phoneNumber") || "Số điện thoại"}
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        className={`form-control ${
                          phoneError || formErrors.phoneNumber
                            ? "is-invalid"
                            : ""
                        }`}
                        placeholder={
                          t("customer.phoneExample") || "Ví dụ: 0912345678"
                        }
                        value={form.phoneNumber}
                        onChange={handleChange}
                        maxLength="15"
                      />
                      {(phoneError || formErrors.phoneNumber) && (
                        <div className="invalid-feedback d-block">
                          {phoneError || formErrors.phoneNumber}
                        </div>
                      )}
                      {/* Bỏ dòng mô tả định dạng bên dưới để gọn giống trang nhân viên */}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        {t("customer.email") || "Email"}
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder={t("customer.email") || "Nhập email"}
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        {t("customer.address") || "Địa chỉ"}
                      </label>
                      <input
                        type="text"
                        name="address"
                        className="form-control"
                        placeholder={t("customer.address") || "Nhập địa chỉ"}
                        value={form.address}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="mb-0">
                      <label className="form-label">
                        {t("customer.gender") || "Giới tính"}
                      </label>
                      <select
                        name="gender"
                        className="form-select"
                        value={form.gender}
                        onChange={handleChange}
                      >
                        <option value="male">
                          {t("customer.genderMale") || "Nam"}
                        </option>
                        <option value="female">
                          {t("customer.genderFemale") || "Nữ"}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCloseModal}
                    >
                      {t("common.cancel") || "Huỷ"}
                    </button>
                    <button
                      type="submit"
                      className={`btn btn-${theme} text-white`}
                      disabled={!!phoneError}
                    >
                      {t("common.save") || "Lưu"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
