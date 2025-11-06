import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { formatters } from "../utils/formatters";
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
    dateOfBirth: "",
  });

  const token = localStorage.getItem("accessToken");

  const formatDate = (value) => formatters.date.toDisplay(value);

  const normalizeDate = (value) => formatters.date.toISO(value);

  const handleDateInput = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length >= 5) val = val.replace(/(\d{2})(\d{2})(\d{0,4})/, "$1/$2/$3");
    else if (val.length >= 3) val = val.replace(/(\d{2})(\d{0,2})/, "$1/$2");
    setForm({ ...form, dateOfBirth: val });
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formatted = (res.data || []).map((c) => ({
        id: c.id,
        fullName: c.fullName || "",
        email: c.email || "",
        phoneNumber: c.phoneNumber || "",
        gender: String(c.gender) === "1" ? "Nam" : "Nữ",
        address: c.address || "",
        dateOfBirth: formatDate(c.dateOfBirth),
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

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa khách hàng này?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCustomers();
      setMessage("🗑️ Xóa khách hàng thành công!");
    } catch {
      setError("❌ Lỗi khi xóa khách hàng!");
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
                placeholder="Tìm kiếm khách hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <button className={`btn btn-${theme}`} onClick={() => setShowModal(true)}>
            <i className="bi bi-person-plus me-1"></i> Thêm khách hàng
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
      </div>
    </MainLayout>
  );
}

