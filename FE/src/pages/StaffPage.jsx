import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";

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
    role: "STAFF_ROLE",
  });

  const token = localStorage.getItem("accessToken");

  // ===== Helper functions =====
  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return value;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const normalizeDate = (value) => {
    if (!value) return "";
    const [d, m, y] = value.split("/");
    if (!d || !m || !y) return "";
    return `${y}-${m}-${d}`;
  };

  const handleDateInput = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length >= 5) val = val.replace(/(\d{2})(\d{2})(\d{0,4})/, "$1/$2/$3");
    else if (val.length >= 3) val = val.replace(/(\d{2})(\d{0,2})/, "$1/$2");
    setForm({ ...form, dateOfBirth: val });
  };

  const getRoleLabel = (role) =>
    role === "ADMIN_ROLE"
      ? t("roles.admin") || "Quản trị viên"
      : t("roles.staff") || "Nhân viên";

  // ===== Fetch nhân viên =====
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/all`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Không thể tải danh sách nhân viên.");
      const data = await res.json();
      const formatted = data.map((s) => ({
        ...s,
        gender: String(s.gender),
        dateOfBirth: formatDate(s.dateOfBirth),
      }));
      setStaffList(formatted);
    } catch (err) {
      console.error(err);
      setError(t("staff.loadError") || "❌ Lỗi khi tải danh sách nhân viên!");
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
    setError("");
    setMessage("");

    const payload = {
      ...form,
      gender: form.gender === "Nam" ? 1 : 0,
      dateOfBirth: normalizeDate(form.dateOfBirth),
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
      setMessage(t("staff.addSuccess") || "✅ Thêm nhân viên thành công!");
      setShowModal(false);
      resetForm();
      await fetchStaff();
    } catch (err) {
      console.error(err);
      setError(t("staff.addFail") || "❌ Thêm nhân viên thất bại!");
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
      role: "STAFF_ROLE",
    });

  const handleDelete = async (id) => {
    if (!window.confirm(t("staff.confirmDelete") || "Xác nhận xóa tài khoản này?"))
      return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      await fetchStaff();
      setMessage(t("staff.deleteSuccess") || "🗑️ Đã xóa nhân viên thành công!");
    } catch {
      setError(t("staff.deleteFail") || "❌ Lỗi khi xóa nhân viên!");
    }
  };

  const filteredList = staffList.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  // ===== UI =====
  return (
    <MainLayout>
      <div className="container-fluid py-3 px-4">
        {/* ===== HEADER ===== */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <h4 className={`fw-bold text-${theme} mb-0`}>
              {t("staff.title") || "Quản lý nhân viên"}
            </h4>

            {/* Ô tìm kiếm có biểu tượng */}
            <div
              className="position-relative"
              style={{ width: 420, maxWidth: "100%" }}
            >
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
                placeholder={t("staff.searchPlaceholder") || "Tìm kiếm nhân viên..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Nút thêm nhân viên */}
          <button
            className={`btn btn-${theme}`}
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-person-plus me-1"></i>
            {t("staff.addButton") || "Thêm nhân viên"}
          </button>
        </div>

        {/* ===== ALERTS ===== */}
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* ===== TABLE ===== */}
        <div className="bg-white border rounded-3 shadow-sm p-3">
          {loading ? (
            <p className="text-center my-3">{t("common.loading") || "Đang tải..."}</p>
          ) : (
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>{t("staff.username") || "Tên đăng nhập"}</th>
                  <th>{t("staff.fullName") || "Họ và tên"}</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>{t("staff.gender") || "Giới tính"}</th>
                  <th>{t("staff.dateOfBirth") || "Ngày sinh"}</th>
                  <th>{t("staff.address") || "Địa chỉ"}</th>
                  <th>{t("staff.role") || "Vai trò"}</th>
                  <th>{t("staff.actions") || "Hành động"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length > 0 ? (
                  filteredList.map((s, i) => (
                    <tr key={s.id}>
                      <td>{i + 1}</td>
                      <td>{s.username}</td>
                      <td>{s.fullName}</td>
                      <td>{s.email}</td>
                      <td>{s.phoneNumber}</td>
                      <td>{s.gender === "1" ? "Nam" : "Nữ"}</td>
                      <td>{s.dateOfBirth}</td>
                      <td>{s.address}</td>
                      <td>{getRoleLabel(s.role)}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(s.id)}
                        >
                          {t("actions.delete") || "Xóa"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-3">
                      {t("staff.noData") || "Không có nhân viên nào"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== MODAL (XỔ GIỮA MÀN HÌNH) ===== */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ maxWidth: 800 }}
          >
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title">
                  {t("staff.addNew") || "Thêm nhân viên mới"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t("staff.username") || "Tên đăng nhập"}
                        value={form.username}
                        onChange={(e) =>
                          setForm({ ...form, username: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t("staff.fullName") || "Họ và tên"}
                        value={form.fullName}
                        onChange={(e) =>
                          setForm({ ...form, fullName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <input
                        type="password"
                        className="form-control"
                        placeholder={t("staff.password") || "Mật khẩu"}
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t("staff.phoneNumber") || "Số điện thoại"}
                        value={form.phoneNumber}
                        onChange={(e) =>
                          setForm({ ...form, phoneNumber: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="dd/mm/yyyy"
                        maxLength="10"
                        value={form.dateOfBirth}
                        onChange={handleDateInput}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t("staff.address") || "Địa chỉ"}
                        value={form.address}
                        onChange={(e) =>
                          setForm({ ...form, address: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-3">
                      <select
                        className="form-select"
                        value={form.gender}
                        onChange={(e) =>
                          setForm({ ...form, gender: e.target.value })
                        }
                      >
                        <option value="Nam">{t("account.male") || "Nam"}</option>
                        <option value="Nữ">{t("account.female") || "Nữ"}</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <select
                        className="form-select"
                        value={form.role}
                        onChange={(e) =>
                          setForm({ ...form, role: e.target.value })
                        }
                      >
                        <option value="STAFF_ROLE">
                          {t("roles.staff") || "Nhân viên"}
                        </option>
                        <option value="ADMIN_ROLE">
                          {t("roles.admin") || "Quản trị viên"}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    {t("actions.cancel") || "Hủy"}
                  </button>
                  <button type="submit" className={`btn btn-${theme}`}>
                    {t("actions.save") || "Lưu"}
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
