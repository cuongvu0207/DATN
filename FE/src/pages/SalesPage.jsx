import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import SalesHeaderBar from "../components/sale/SalesHeaderBar";
import CartItem from "../components/sale/CartItem";
import CustomerPanel from "../components/sale/CustomerPanel";
import CustomerModal from "../components/sale/CustomerModal";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API_BASE_URL } from "../services/api";
import { formatCurrency } from "../utils/formatters";

export default function SalesPage() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const token = localStorage.getItem("accessToken");

  /* ====== SẢN PHẨM TỪ DATABASE ====== */
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE_URL}/inventory/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        // ✅ Chuẩn hóa đúng với dữ liệu thực tế của bạn
        const formatted = (res.data || []).map((p) => ({
          id: p.productId,
          code: p.barcode || `SP${String(p.productId).padStart(6, "0")}`,
          name: p.productName,
          category: p.categoryName || "",
          unit: p.unit || "",
          brand: p.brandName || "",
          price: Number(p.sellingPrice || 0),
          cost: Number(p.costOfCapital || 0),
          discount: Number(p.discount || 0),
          stock: Number(p.quantityInStock || 0),
          image: p.image || "",
          updatedAt: p.lastUpdated || null,
          active: p.isActive ?? true,
        }));
  
        setProductList(formatted);
      } catch (err) {
        console.error(err);
        setError("❌ Không thể tải danh sách sản phẩm!");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [token]);

  /* ====== STATE HOÁ ĐƠN ====== */
  const [tabs, setTabs] = useState([{ id: 1, name: "Hóa đơn 1", items: [], orderNote: "" }]);
  const [activeTab, setActiveTab] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);

  /* ====== KHÁCH HÀNG ====== */
  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem("customers");
    return saved ? JSON.parse(saved) : [];
  });
  const [customer, setCustomer] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });

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
      alert(t("sales.alertEmptyCustomer") || "⚠️ Vui lòng nhập tên khách hàng!");
      return;
    }
    const newCus = {
      id: Date.now(),
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim(),
    };
    setCustomers([...customers, newCus]);
    setSelectedCustomer(newCus);
    setCustomer(newCus.name);
    setShowCustomerModal(false);
    setNewCustomer({ name: "", phone: "" });
  };

  /* ====== GIỎ HÀNG ====== */
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
                      ? {
                          ...it,
                          quantity: it.quantity + 1,
                          total: (it.quantity + 1) * it.price - (it.discountValue ?? 0),
                        }
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
                    discount: 0,
                    discountValue: 0,
                    discountMode: "%",
                  },
                ];
              })(),
            }
      )
    );
    setSearchQuery("");
  };

  /* ====== QUÉT BARCODE ====== */
  const handleScanProduct = (code) => {
    const found = productList.find(
      (p) => p.code?.toLowerCase() === code.trim().toLowerCase()
    );
    if (found) {
      handleAddProduct(found);
    } else {
      alert(t("sales.productNotFound") || "⚠️ Không tìm thấy sản phẩm!");
    }
  };

  /* ====== GIẢM GIÁ, SỐ LƯỢNG, XÓA, GHI CHÚ ====== */
  const setDiscount = (code, { discount, discountValue, discountMode }) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? {
              ...tab,
              items: tab.items.map((x) =>
                x.code === code
                  ? {
                      ...x,
                      discount,
                      discountValue,
                      discountMode,
                      total:
                        x.price * x.quantity -
                        (discountMode === "%"
                          ? (x.price * x.quantity * discount) / 100
                          : discountValue),
                    }
                  : x
              ),
            }
          : tab
      )
    );
  };

  const changeQty = (code, delta) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? {
              ...tab,
              items: tab.items.map((it) => {
                if (it.code === code) {
                  const newQty = Math.max(0, it.quantity + delta);
                  const newTotal =
                    newQty * it.price -
                    (it.discountMode === "%"
                      ? (newQty * it.price * it.discount) / 100
                      : it.discountValue);
                  return { ...it, quantity: newQty, total: newTotal };
                }
                return it;
              }),
            }
          : tab
      )
    );
  };

  const removeItem = (code) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? { ...tab, items: tab.items.filter((i) => i.code !== code) }
          : tab
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
          ? {
              ...tab,
              items: tab.items.map((it) =>
                it.code === code ? { ...it, note: value } : it
              ),
            }
          : tab
      )
    );
  };

  const setOrderNote = (value) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab ? { ...tab, orderNote: value } : tab
      )
    );
  };

  /* ====== THANH TOÁN ====== */
  const totalAmount = cartItems.reduce((s, it) => s + (it.total ?? 0), 0);
  const finalTotal = Math.max(totalAmount - invoiceDiscount, 0);

  const handlePayment = () => {
    if (cartItems.length === 0) {
      alert("🛒 Chưa có sản phẩm nào trong giỏ hàng!");
      return;
    }

    alert(
      `✅ Thanh toán thành công!\nKhách hàng: ${
        selectedCustomer?.name || customer || "Khách lẻ"
      }\nTổng tiền: ${formatCurrency(finalTotal)}`
    );

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab ? { ...tab, items: [], orderNote: "" } : tab
      )
    );
    setCustomer("");
    setSelectedCustomer(null);
    setInvoiceDiscount(0);
  };

  /* ====== GIAO DIỆN ====== */
  const filteredProducts =
    searchQuery.trim() === "" || barcodeMode
      ? []
      : productList.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.code.toLowerCase().includes(searchQuery.toLowerCase())
        );

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
        onScanProduct={handleScanProduct}
      />

      <div className="row gx-1 gy-1 m-0" style={{ height: "calc(100vh - 110px)" }}>
        {/* === TRÁI: GIỎ HÀNG === */}
        <div className="col-lg-8 col-md-7 p-2 d-flex flex-column">
          <div className="flex-grow-1 overflow-auto position-relative">
            {loading ? (
              <div className="text-center text-muted mt-5">
                <div className="spinner-border text-primary" />
                <p>Đang tải sản phẩm...</p>
              </div>
            ) : error ? (
              <div className="text-danger text-center mt-5">{error}</div>
            ) : filteredProducts.length > 0 ? (
              <div className="position-absolute bg-white shadow rounded-3 p-2" style={{ zIndex: 10, width: 300 }}>
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    className="btn btn-light text-start w-100 mb-1"
                    onClick={() => handleAddProduct(p)}
                  >
                    {p.name}{" "}
                    <span className="text-success fw-semibold">{formatCurrency(p.price)}</span>
                  </button>
                ))}
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center text-muted mt-5">
                {t("sales.noItems") || "Chưa có sản phẩm trong giỏ hàng"}
              </div>
            ) : (
              cartItems.map((it, idx) => (
                <CartItem
                  key={it.code}
                  item={it}
                  index={idx}
                  changeQty={changeQty}
                  removeItem={removeItem}
                  toggleNote={toggleNote}
                  setNote={setNote}
                  setDiscount={setDiscount}
                />
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
                placeholder={t("sales.orderNote") || "Ghi chú đơn hàng..."}
                value={currentTab?.orderNote || ""}
                onChange={(e) => setOrderNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* === PHẢI: KHÁCH HÀNG === */}
        <div className="col-lg-4 col-md-5 p-2 d-flex flex-column">
          <CustomerPanel
            customer={customer}
            setCustomer={setCustomer}
            filteredCustomers={filteredCustomers}
            handleSelectCustomer={handleSelectCustomer}
            totalAmount={totalAmount}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            onAddCustomerClick={() => setShowCustomerModal(true)}
            selectedCustomer={selectedCustomer}
            invoiceDiscount={invoiceDiscount}
            setInvoiceDiscount={setInvoiceDiscount}
            onPrint={() => console.log("🖨️ In hóa đơn")}
            cartItems={cartItems}
            onPay={handlePayment}
          />
        </div>
      </div>

      {/* Modal khách hàng */}
      <CustomerModal
        show={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        newCustomer={newCustomer}
        setNewCustomer={setNewCustomer}
        handleAddCustomer={handleAddCustomer}
      />
    </div>
  );
}

