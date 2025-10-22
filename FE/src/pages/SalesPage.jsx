import React, { useMemo, useState, useEffect } from "react";
import Header from "../components/layout/Header";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

/* ===== THANH BAR ===== */
function SalesHeaderBar({
  tabs,
  activeTab,
  setActiveTab,
  handleAddTab,
  handleRemoveTab,
  searchQuery,
  setSearchQuery,
  barcodeMode,
  setBarcodeMode,
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div
      className={`d-flex align-items-center justify-content-between px-3 py-2 bg-${theme}`}
      style={{ borderBottom: "1px solid rgba(255,255,255,.15)", minHeight: 52 }}
    >
      <div className="d-flex align-items-center gap-2 flex-grow-1">
        {/* Ô tìm kiếm */}
        <div className="position-relative">
          <div
            className="d-flex align-items-center bg-white rounded-3 px-2"
            style={{ width: 320, height: 38 }}
          >
            <i className="bi bi-search text-muted me-2" />
            <input
              type="text"
              placeholder={
                barcodeMode
                  ? t("sales.scanBarcode") || "Quét mã sản phẩm..."
                  : t("sales.searchProduct") || "Tìm hàng hoá (F3)"
              }
              className="form-control border-0 shadow-none bg-transparent"
              style={{ fontSize: 14 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Nút bật chế độ barcode */}
        <button
          type="button"
          className={`btn ${
            barcodeMode ? `btn-${theme}` : "btn-outline-light"
          } d-flex align-items-center justify-content-center rounded-3`}
          style={{ height: 38, width: 45 }}
          title="Chế độ quét barcode"
          onClick={() => setBarcodeMode(!barcodeMode)}
        >
          <i className="bi bi-qr-code-scan fs-6" />
        </button>

        {/* Tabs hoá đơn */}
        <div
          className="d-flex align-items-center bg-white rounded-3 ps-2"
          style={{ minHeight: 38, fontSize: 14 }}
        >
          <i
            className="bi bi-arrow-left-right text-success me-1"
            style={{ fontSize: 16 }}
          />
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-3 me-1 ${
                activeTab === tab.id
                  ? "bg-light text-dark fw-semibold"
                  : "text-secondary"
              }`}
              style={{ cursor: "pointer" }}
            >
              {tab.name}
              {tabs.length > 1 && (
                <i
                  className="bi bi-x ms-2 text-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTab(tab.id);
                  }}
                  style={{ cursor: "pointer", fontSize: 13 }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Nút thêm hoá đơn tạm */}
        <button
          type="button"
          className="btn btn-outline-light d-flex align-items-center justify-content-center rounded-3"
          style={{ height: 38, width: 38 }}
          onClick={handleAddTab}
          title="Thêm hoá đơn mới"
        >
          <i className="bi bi-plus-lg fs-5" />
        </button>
      </div>
    </div>
  );
}

/* ===== TRANG BÁN HÀNG ===== */
export default function SalesPage() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const productList = useMemo(
    () => [
      { id: 1, code: "SP000001", name: "Bút bi Thiên Long", price: 5000, stock: 10 },
      { id: 2, code: "SP000002", name: "Vở Campus 200 trang", price: 15000, stock: 5 },
      { id: 3, code: "SP000005", name: "Ví nhỏ đựng card Synapse", price: 180000, stock: 2 },
    ],
    []
  );

  const [tabs, setTabs] = useState([{ id: 1, name: "Hóa đơn 1", items: [], orderNote: "" }]);
  const [activeTab, setActiveTab] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  /* ====== Khách hàng ====== */
  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem("customers");
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, name: "Nguyễn Văn A", phone: "0905123456" },
          { id: 2, name: "Trần Thị B", phone: "0987654321" },
        ];
  });

  const [customer, setCustomer] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });

  // Lưu danh sách khách hàng vào localStorage
  useEffect(() => {
    localStorage.setItem("customers", JSON.stringify(customers));
  }, [customers]);

  const filteredCustomers =
    customer.trim() === ""
      ? []
      : customers.filter(
          (c) =>
            c.name.toLowerCase().includes(customer.toLowerCase()) ||
            c.phone.includes(customer)
        );

  const handleSelectCustomer = (c) => {
    setSelectedCustomer(c);
    setCustomer(c.name);
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name.trim()) {
      alert("⚠️ Vui lòng nhập tên khách hàng!");
      return;
    }
    const newId = customers.length + 1;
    const newCus = {
      id: newId,
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim(),
    };
    setCustomers([...customers, newCus]);
    setSelectedCustomer(newCus);
    setCustomer(newCus.name);
    setShowCustomerModal(false);
    setNewCustomer({ name: "", phone: "" });
  };

  /* ====== Sản phẩm ====== */
  const currentTab = tabs.find((t) => t.id === activeTab);
  const cartItems = currentTab?.items || [];

  const handleAddProduct = (p) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id !== activeTab
          ? tab
          : {
              ...tab,
              items: (() => {
                const existed = tab.items.find((it) => it.code === p.code);
                if (existed) {
                  return tab.items.map((it) =>
                    it.code === p.code
                      ? { ...it, quantity: it.quantity + 1, total: (it.quantity + 1) * it.price }
                      : it
                  );
                }
                return [
                  ...tab.items,
                  {
                    code: p.code,
                    name: p.name,
                    price: p.price,
                    stock: p.stock,
                    quantity: 1,
                    total: p.price,
                    note: "",
                    showNote: false,
                  },
                ];
              })(),
            }
      )
    );
    setSearchQuery("");
  };

  // Quét barcode
  useEffect(() => {
    if (!barcodeMode || !searchQuery.trim()) return;
    const found = productList.find(
      (p) => p.code.toLowerCase() === searchQuery.trim().toLowerCase()
    );
    if (found) {
      handleAddProduct(found);
      setSearchQuery("");
    }
  }, [searchQuery, barcodeMode]);

  /* ====== Xử lý khác ====== */
  const changeQty = (code, delta) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? {
              ...tab,
              items: tab.items.map((it) =>
                it.code === code
                  ? {
                      ...it,
                      quantity: Math.max(0, it.quantity + delta),
                      total: Math.max(0, it.quantity + delta) * it.price,
                    }
                  : it
              ),
            }
          : tab
      )
    );
  };

  const removeItem = (code) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab ? { ...tab, items: tab.items.filter((i) => i.code !== code) } : tab
      )
    );
  };

  const toggleNote = (code) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? {
              ...tab,
              items: tab.items.map((it) =>
                it.code === code ? { ...it, showNote: !it.showNote } : it
              ),
            }
          : tab
      )
    );
  };

  const setNote = (code, value) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? { ...tab, items: tab.items.map((it) => (it.code === code ? { ...it, note: value } : it)) }
          : tab
      )
    );
  };

  const setOrderNote = (value) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === activeTab ? { ...tab, orderNote: value } : tab))
    );
  };

  const totalAmount = cartItems.reduce((s, it) => s + it.total, 0);

  const filteredProducts =
    searchQuery.trim() === "" || barcodeMode
      ? []
      : productList.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.code.toLowerCase().includes(searchQuery.toLowerCase())
        );

  /* ====== Giao diện ====== */
  return (
    <div className="container-fluid bg-light p-0" style={{ height: "100vh", overflow: "hidden" }}>
      <Header />
      <SalesHeaderBar
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleAddTab={() =>
          setTabs([
            ...tabs,
            { id: tabs.length + 1, name: `Hóa đơn ${tabs.length + 1}`, items: [], orderNote: "" },
          ])
        }
        handleRemoveTab={(id) => setTabs(tabs.filter((t) => t.id !== id && tabs.length > 1))}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        barcodeMode={barcodeMode}
        setBarcodeMode={setBarcodeMode}
      />

      <div className="row gx-1 gy-1 m-0" style={{ height: "calc(100vh - 110px)" }}>
        {/* TRÁI */}
        <div className="col-lg-8 col-md-7 p-2 d-flex flex-column">
          <div className="flex-grow-1 overflow-auto position-relative">
            {/* Danh sách gợi ý sản phẩm */}
            {filteredProducts.length > 0 && (
              <div className="position-absolute bg-white shadow rounded-3 p-2" style={{ zIndex: 10, width: 300 }}>
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    className="btn btn-light text-start w-100 mb-1"
                    onClick={() => handleAddProduct(p)}
                  >
                    {p.name}{" "}
                    <span className="text-success fw-semibold">{p.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Giỏ hàng */}
            {cartItems.length === 0 ? (
              <div className="text-center text-muted mt-5">
                {t("sales.noItems") || "Chưa có sản phẩm trong giỏ hàng"}
              </div>
            ) : (
              cartItems.map((it, idx) => (
                <div key={it.code} className={`bg-white rounded-4 border border-${theme} border-opacity-25 mb-2 p-2`}>
                  <div className="d-flex align-items-center justify-content-between" style={{ minHeight: 50 }}>
                    <div className="d-flex align-items-center flex-grow-1" style={{ gap: 10 }}>
                      <span className="text-secondary small">{idx + 1}</span>
                      <button className="btn btn-sm p-0 text-danger border-0" onClick={() => removeItem(it.code)}>
                        <i className="bi bi-trash" />
                      </button>
                      <strong>{it.code}</strong>
                      <span>{it.name}</span>
                    </div>

                    <div className="d-flex align-items-center justify-content-end" style={{ gap: 25 }}>
                      <div className="d-flex align-items-center" style={{ gap: 8 }}>
                        <button className="btn btn-sm btn-light rounded-circle" onClick={() => changeQty(it.code, -1)}>
                          −
                        </button>
                        <input
                          type="text"
                          value={it.tempQty ?? it.quantity.toString()}
                          className={`form-control form-control-sm text-center fw-semibold border-0 ${
                            it.quantity > it.stock ? "text-danger" : "text-dark"
                          }`}
                          style={{ width: 50, background: "transparent", boxShadow: "none" }}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTabs((prev) =>
                              prev.map((tab) =>
                                tab.id === activeTab
                                  ? {
                                      ...tab,
                                      items: tab.items.map((x) =>
                                        x.code === it.code ? { ...x, tempQty: val } : x
                                      ),
                                    }
                                  : tab
                              )
                            );
                          }}
                          onBlur={() => {
                            setTabs((prev) =>
                              prev.map((tab) =>
                                tab.id === activeTab
                                  ? {
                                      ...tab,
                                      items: tab.items.map((x) => {
                                        if (x.code === it.code) {
                                          const parsed = parseInt(x.tempQty);
                                          const validQty = !isNaN(parsed) && parsed >= 0 ? parsed : x.quantity;
                                          return {
                                            ...x,
                                            quantity: validQty,
                                            total: validQty * x.price,
                                            tempQty: undefined,
                                          };
                                        }
                                        return x;
                                      }),
                                    }
                                  : tab
                              )
                            );
                          }}
                        />
                        <button className="btn btn-sm btn-light rounded-circle" onClick={() => changeQty(it.code, 1)}>
                          +
                        </button>
                      </div>

                      <span style={{ width: 80, textAlign: "right" }}>{it.price.toLocaleString()}</span>
                      <strong
                        style={{ width: 90, textAlign: "right" }}
                        className={it.quantity > it.stock ? "text-danger" : ""}
                      >
                        {it.total.toLocaleString()}
                      </strong>

                      <button className={`btn btn-sm border-0 text-${theme}`} onClick={() => toggleNote(it.code)}>
                        <i className="bi bi-three-dots-vertical" />
                      </button>
                    </div>
                  </div>

                  {it.showNote && (
                    <div className="mt-2">
                      <input
                        type="text"
                        className={`form-control form-control-sm border-${theme}`}
                        placeholder="Ghi chú sản phẩm..."
                        value={it.note}
                        onChange={(e) => setNote(it.code, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Ghi chú hóa đơn */}
          <div className={`rounded-4 border border-${theme} border-opacity-25 bg-white p-3 mt-2`}>
            <div className="d-flex align-items-center">
              <i className="bi bi-pencil text-muted me-2" />
              <input
                type="text"
                className="form-control border-0 shadow-none"
                placeholder="Ghi chú đơn hàng..."
                value={currentTab?.orderNote || ""}
                onChange={(e) => setOrderNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* PHẢI */}
        <div className="col-lg-4 col-md-5 p-2 d-flex flex-column">
          <div
            className={`rounded-4 border border-${theme} border-opacity-25 bg-white p-2 flex-grow-1 shadow-sm d-flex flex-column justify-content-between`}
          >
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold">Khách hàng</span>
                <small className="text-muted">{new Date().toLocaleString("vi-VN")}</small>
              </div>

              {/* Ô tìm khách hàng */}
              <div className="position-relative mb-3">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light">
                    <i className="bi bi-person" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập tên hoặc SĐT khách hàng"
                    value={customer}
                    onChange={(e) => {
                      setCustomer(e.target.value);
                      setSelectedCustomer(null);
                    }}
                  />
                  <button
                    type="button"
                    className={`btn btn-outline-${theme}`}
                    onClick={() => setShowCustomerModal(true)}
                  >
                    <i className="bi bi-plus-lg" />
                  </button>
                </div>

                {/* Danh sách gợi ý khách hàng */}
                {filteredCustomers.length > 0 && (
                  <div
                    className="position-absolute bg-white border rounded shadow-sm mt-1 w-100"
                    style={{ zIndex: 20 }}
                  >
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        className="p-2 hover-bg-light"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSelectCustomer(c)}
                      >
                        <strong>{c.name}</strong> <small className="text-muted">({c.phone})</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tổng tiền */}
              <div className="mt-2 small">
                <div className="d-flex justify-content-between mb-1">
                  <span>Tổng tiền hàng</span>
                  <span>{totalAmount.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Giảm giá</span>
                  <span>0</span>
                </div>
                <div className="d-flex justify-content-between fw-semibold text-dark mb-1">
                  <span>Khách cần trả</span>
                  <span>{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Thanh toán */}
              <div className="mt-2">
                <label className="form-label fw-semibold">Phương thức thanh toán</label>
                <select
                  className="form-select form-select-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="bank">Chuyển khoản</option>
                  <option value="qr">Quét mã QR</option>
                </select>
              </div>
            </div>

            <div className="mt-2 d-flex align-items-stretch gap-2">
              <button
                type="button"
                className={`btn btn-outline-${theme} fw-semibold d-flex align-items-center justify-content-center btn-lg`}
              >
                <i className="bi bi-printer me-1" />
                In
              </button>

              <button
                type="button"
                className={`btn btn-${theme} fw-bold flex-fill btn-lg`}
                onClick={() => {
                  const overItems = cartItems.filter((it) => it.quantity > it.stock);
                  if (overItems.length > 0) {
                    alert(
                      `⚠️ Một số sản phẩm vượt quá tồn kho:\n` +
                        overItems
                          .map((i) => `- ${i.name}: tồn ${i.stock}, trong giỏ ${i.quantity}`)
                          .join("\n")
                    );
                    return;
                  }
                  if (cartItems.length === 0) {
                    alert("🛒 Chưa có sản phẩm nào trong giỏ hàng!");
                    return;
                  }

                  const finalCustomer = selectedCustomer
                    ? selectedCustomer.name
                    : customer.trim()
                    ? customer
                    : "Khách lẻ";

                  alert(`✅ Thanh toán thành công!\nKhách hàng: ${finalCustomer}`);

                  setTabs((prev) =>
                    prev.map((tab) =>
                      tab.id === activeTab ? { ...tab, items: [], orderNote: "" } : tab
                    )
                  );
                  setCustomer("");
                  setSelectedCustomer(null);
                }}
              >
                THANH TOÁN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal thêm khách hàng mới */}
      {showCustomerModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.4)", zIndex: 9999 }}
        >
          <div className="bg-white rounded-4 shadow p-4" style={{ width: 400 }}>
            <h6 className="fw-semibold mb-3">
              <i className="bi bi-person-plus me-2"></i>Thêm khách hàng mới
            </h6>
            <div className="mb-2">
              <label className="form-label small">Tên khách hàng</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small">Số điện thoại</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCustomerModal(false)}
              >
                Hủy
              </button>
              <button className={`btn btn-${theme} btn-sm`} onClick={handleAddCustomer}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
