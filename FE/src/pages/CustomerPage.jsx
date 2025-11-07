import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";

import CustomerTable from "../components/customers/CustomerTable";

export default function CustomerPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    gender: "Nam",
    
  });

  const token = localStorage.getItem("accessToken");

    const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formatted = (res.data || []).map((c) => ({
        id: c.id,
        fullName: c.fullName || c.name || "",
        email: c.email || "",
        phoneNumber: c.phoneNumber || c.phone || "",
        gender: String(c.gender) === "1" ? "Nam" : "Nữ",
        address: c.address || "",
        
      }));
      setCustomers(formatted);
    } catch {
      setError(t("customer.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.fullName?.trim(),
        phone: form.phoneNumber?.trim(),
        email: form.email?.trim(),
        address: form.address?.trim(),
      };

      await axios.post(`${API_BASE_URL}/customers`, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      setShowModal(false);
      setForm({ fullName: "", email: "", phoneNumber: "", address: "", gender: "Nam" });
      fetchCustomers();
      setMessage(t("customer.addSuccess") || "Đã thêm khách hàng thành công!");
    } catch (err) {
      console.error("Create customer error", err);
      setError(t("customer.addError") || "Không thể thêm khách hàng.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("customer.deleteConfirm") || "Xác nhận xóa khách hàng này?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCustomers();
      setMessage(t("customer.deleteSuccess") || "Đã xóa khách hàng thành công!");
    } catch {
      setError(t("customer.deleteError") || "Lỗi khi xóa khách hàng!");
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const keyword = search.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(keyword) ||
      c.email.toLowerCase().includes(keyword) ||
      c.phoneNumber.toLowerCase().includes(keyword)
    );
  });

  return (
    <MainLayout>
      <div className="container-fluid py-3 px-4">
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <h4 className={`fw-bold text-${theme} mb-0`}>
              {t("customer.title")}
            </h4>
            <div className="position-relative" style={{ width: 420 }}>
              <i className="bi bi-search position-absolute" style={{ left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.6 }}></i>
              <input
                type="text"
                className="form-control ps-5"
                placeholder={t("customer.searchPlaceholder") || "Tìm kiếm khách hàng..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <button className={`btn btn-${theme}`} onClick={() => setShowModal(true)}>
            <i className="bi bi-person-plus me-1"></i> {t("customer.add") || "Thêm khách hàng"}
          </button>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <CustomerTable
          customers={filteredCustomers}
          loading={loading}
          theme={theme}
          onDelete={handleDelete}
        />
        {showModal && (
          <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,.4)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("customer.add") || "Thêm khách hàng"}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleCreate}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">{t("customer.fullName") || "Họ và tên"}</label>
                      <input
                        type="text"
                        name="fullName"
                        className="form-control"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t("customer.phoneNumber") || "Số điện thoại"}</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        className="form-control"
                        value={form.phoneNumber}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t("customer.email") || "Email"}</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t("customer.address") || "Địa chỉ"}</label>
                      <input
                        type="text"
                        name="address"
                        className="form-control"
                        value={form.address}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      {t("common.cancel") || "Hủy"}
                    </button>
                    <button type="submit" className={`btn btn-${theme} text-white`}> {t("common.save") || "Lưu"}
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













