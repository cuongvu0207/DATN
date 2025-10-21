import React, { useState } from "react";
import Header from "../components/layout/Header";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

// ======= COMPONENT THANH BAR TRÊN =======
function SalesHeaderBar({ tabs, activeTab, setActiveTab, handleAddTab, handleRemoveTab }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div
      className={`d-flex align-items-center justify-content-between px-3 py-2 bg-${theme}`}
      style={{
        borderBottom: "1px solid rgba(0,0,0,0.1)",
        minHeight: "52px",
      }}
    >
      {/* Ô tìm hàng hóa */}
      <div className="d-flex align-items-center gap-2 flex-grow-1">
        <div
          className="position-relative d-flex align-items-center bg-white rounded-3 px-2"
          style={{ width: "320px", height: "38px" }}
        >
          <i className="bi bi-search text-muted position-absolute" style={{ left: "10px", top: "10px" }}></i>
          <input
            type="text"
            placeholder={t("sales.searchProduct") || "Tìm hàng hoá (F3)"}
            className="form-control border-0 ps-4 pe-5 shadow-none"
            style={{ fontSize: "14px", background: "transparent" }}
          />
          <i
            className="bi bi-qr-code-scan text-muted position-absolute"
            style={{ right: "10px", top: "10px", cursor: "pointer" }}
            title="Quét mã sản phẩm"
          ></i>
        </div>

        {/* Tabs hóa đơn */}
        <div className="d-flex align-items-center bg-white rounded-3 ps-2" style={{ minHeight: "38px", fontSize: "14px" }}>
          <i className="bi bi-arrow-left-right text-success me-1" style={{ fontSize: "16px" }}></i>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-3 me-1 ${
                activeTab === tab.id ? "bg-light text-dark fw-semibold" : "text-secondary"
              }`}
              style={{ cursor: "pointer", userSelect: "none" }}
            >
              {tab.name}
              {tabs.length > 1 && (
                <i
                  className="bi bi-x ms-2 text-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTab(tab.id);
                  }}
                  style={{ cursor: "pointer", fontSize: "13px" }}
                ></i>
              )}
            </div>
          ))}
        </div>

        {/* Nút thêm tab */}
        <div className="d-flex align-items-center bg-white rounded-end-3 ps-1 pe-2">
          <button
            className={`btn btn-sm text-${theme} d-flex align-items-center`}
            onClick={handleAddTab}
            title="Thêm hoá đơn mới"
          >
            <i className="bi bi-plus-lg"></i>
          </button>

          <div className="dropdown">
            <button
              className="btn btn-sm text-muted dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            ></button>
            <ul className="dropdown-menu">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button className="dropdown-item" onClick={() => setActiveTab(tab.id)}>
                    {tab.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======= TRANG CHÍNH BÁN HÀNG =======
export default function SalesPage() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [tabs, setTabs] = useState([{ id: 1, name: "Hóa đơn 1", items: [] }]);
  const [activeTab, setActiveTab] = useState(1);

  const handleAddTab = () => {
    const newId = tabs.length + 1;
    setTabs([...tabs, { id: newId, name: `Hóa đơn ${newId}`, items: [] }]);
    setActiveTab(newId);
  };

  const handleRemoveTab = (id) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    setActiveTab(newTabs[0].id);
  };

  const currentTab = tabs.find((t) => t.id === activeTab);
  const cartItems = currentTab?.items || [];

  return (
    <div className="container-fluid p-0" style={{ background: "#f4f5f6" }}>
      {/* Header (logo, user, logout,...) */}
      <Header />

      {/* Thanh bar */}
      <SalesHeaderBar
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleAddTab={handleAddTab}
        handleRemoveTab={handleRemoveTab}
      />

      {/* Nội dung chính */}
      <div className="row g-0">
        {/* Cột trái - Giỏ hàng */}
        <div className="col-lg-8 col-md-7 p-3">
          <div className="bg-white border rounded-3 p-2 h-100">
            <div
              className="d-flex align-items-center justify-content-center text-muted"
              style={{ height: "65vh" }}
            >
              {t("sales.noProduct") || "Chưa có sản phẩm trong giỏ hàng"}
            </div>

            {/* ✅ Chỉ còn ô ghi chú đơn hàng */}
            <div className="border-top pt-2">
              <div className="d-flex align-items-center">
                <i className="bi bi-pencil text-muted me-2"></i>
                <input
                  type="text"
                  className="form-control border-0 shadow-none"
                  placeholder={t("sales.orderNote") || "Ghi chú đơn hàng"}
                  style={{
                    fontSize: "14px",
                    color: "#333",
                    backgroundColor: "transparent",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải - Thanh toán */}
        <div className="col-lg-4 col-md-5 p-3">
          <div className="bg-white border rounded-3 p-3 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-semibold">Nguyễn Văn A</span>
                <small className="text-muted">
                  {new Date().toLocaleString("vi-VN")}
                </small>
              </div>

              <div className="input-group input-group-sm mb-3">
                <span className="input-group-text bg-light">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t("sales.searchCustomer") || "Tìm khách hàng (F4)"}
                />
                <button className={`btn btn-outline-${theme}`}>+</button>
              </div>

              <div className="border-top mt-3 pt-2 small text-center text-muted">
                Bạn chưa có tài khoản ngân hàng <br />
                <a
                  href="#"
                  className={`text-${theme} text-decoration-none fw-semibold`}
                >
                  + Thêm tài khoản
                </a>
              </div>
            </div>

            <button
              className={`btn btn-${theme} w-100 fw-bold mt-3`}
              style={{ fontSize: "1rem" }}
            >
              {t("sales.pay") || "THANH TOÁN"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
