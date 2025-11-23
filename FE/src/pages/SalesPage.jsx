import React, { useState, useEffect, useCallback, useRef } from "react";
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
import PaymentConfirmModal from "../components/notifications/PaymentConfirmModal";
import { connectWS, subscribeOrder, onOrderNotify, unsubscribeOrder } from "../services/wsOrder";


const createSalesTab = (id, labelPrefix, overrides = {}) => ({
  id,
  name: `${labelPrefix} ${id}`,
  items: [],
  orderNote: "",
  orderId: null,
  customerInput: "",
  selectedCustomer: null,
  customerId: null,
  paymentMethod: "cash",
  invoiceDiscount: 0,
  ...overrides,
});

const EMPTY_CUSTOMER_FORM = {
  fullName: "",
  phoneNumber: "",
  email: "",
  address: "",
  gender: "male",
};

const getEmptyCustomerForm = () => ({ ...EMPTY_CUSTOMER_FORM });

const normalizeGender = (value) => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (["1", "nam", "male", "m", "true"].includes(raw)) return "male";
  if (["0", "nu", "female", "f", "false"].includes(raw)) return "female";
  return "unknown";
};

const mapDraftItemToCart = (item, idx = 0) => {
  const quantity = Number(item.quantity || 0);
  const price = Number(item.price || 0);
  const discountMode = item.discountMode || "%";
  const discountValue = Number(item.discountValue || 0);
  const discountPct =
    discountMode === "%"
      ? Number(item.discount || 0)
      : price > 0
        ? Math.min(100, Math.max(0, (discountValue / price) * 100))
        : 0;

  const stockValue = Number(item.stock);
  return {
    code: item.barcode || `SKU-${String(idx + 1).padStart(4, "0")}`,
    name: item.productName || `Item ${idx + 1}`,
    price,
    quantity,
    total: Number(item.total || quantity * price),
    discount: discountPct,
    discountMode,
    discountValue,
    note: item.note || "",
    showNote: Boolean(item.note),
    stock: Number.isFinite(stockValue) ? stockValue : 999999,
  };
};

const mapCartItemToDraftDTO = (item) => ({
  productName: item.name,
  barcode: item.code,
  quantity: Number(item.quantity || 0),
  price: Number(item.price || 0),
});

const serializeDraftState = ({
  orderId,
  customerId,
  paymentMethod,
  orderNote,
  items,
  invoiceDiscount,
}) =>
  JSON.stringify({
    orderId: orderId || null,
    customerId: customerId || null,
    paymentMethod,
    orderNote,
    invoiceDiscount: Number(invoiceDiscount || 0),
    items: items.map((item) => ({
      barcode: item.barcode || item.code,
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
    })),
  });

const normalizePaymentMethod = (value) => {
  const val = String(value || "").toLowerCase();
  if (val === "bank" || val === "wallet") return val;
  return "cash";
};

const mapDraftCustomer = (draft) => {
  const info =
    draft.customer ||
    draft.customerInfo ||
    draft.customerData ||
    {};
  const id = draft.customerId || info.id || info.customerId || null;
  const fullName = info.fullName || info.name || info.customerName || draft.customerName || "";
  const phoneNumber = info.phoneNumber || info.phone || "";
  const email = info.email || "";
  const address = info.address || "";
  const gender = normalizeGender(info.gender);

  if (!id && !fullName) return null;
  return {
    id,
    fullName,
    phoneNumber,
    email,
    address,
    gender,
  };
};

export default function SalesPage() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const printRef = useRef(null);

  const [payLoading, setPayLoading] = useState(false);

  const tabPrefix = t("sales.tabPrefix", { defaultValue: "Order" });
  const token = localStorage.getItem("accessToken");

  /* ====== SẢN PHẨM TỪ DATABASE ====== */
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== POPUP THANH TOÁN REALTIME =====
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  /* ====== STATE HOÁ ĐƠN ====== */
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeMode, setBarcodeMode] = useState(false);

  /* ====== KHÁCH HÀNG ====== */
  const [customers, setCustomers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState(() => getEmptyCustomerForm());
  const [savingCustomer, setSavingCustomer] = useState(false);

  const draftSyncRef = useRef(null);
  const draftSnapshotRef = useRef({});
  const lastDraftFetchRef = useRef(0);

  // refs để tránh closure WS bị stale
  const currentOrderIdRef = useRef(null);
  const tabsRef = useRef(tabs);

  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  /* ================== LOAD PRODUCTS ================== */
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE_URL}/inventory/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });

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
        setError(t("sales.productsLoadError", { defaultValue: "Unable to load product list." }));
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [token, t]);

  /* ================== DRAFT TAB ================== */
  const createDraftTab = useCallback(async ({ replace = false } = {}) => {
    let newOrderId = null;
    try {
      const res = await axios.post(
        `${API_BASE_URL}/order/draft`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      newOrderId = res?.data?.orderId || null;
    } catch (err) {
      console.error("Failed to fetch draft orders", err);
      setTabs([]);       // ❗ không tự tạo tab nữa
      await createDraftTab({ replace: true }); // ❗ chỉ tạo draft từ BE
      setActiveTab(1);
    }
    setTabs((prev) => {
      const base = replace ? [] : prev;
      const nextIndex = base.length + 1;
      const newTab = createSalesTab(nextIndex, tabPrefix, {
        orderId: newOrderId,
        customerId: null,
        paymentMethod: "cash",
        invoiceDiscount: 0,
      });

      if (newOrderId) {
        draftSnapshotRef.current[newOrderId] = serializeDraftState({
          orderId: newOrderId,
          customerId: null,
          paymentMethod: "CASH",
          orderNote: "",
          items: [],
          invoiceDiscount: 0,
        });
      }

      return [...base, newTab];
    });

    setActiveTab((prev) => (replace ? 1 : prev + 1));
  }, [tabPrefix, token]);

  const loadDraftTabs = useCallback(async () => {
    lastDraftFetchRef.current = Date.now();
    try {
      const res = await axios.get(`${API_BASE_URL}/order/drafts/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = res?.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.content)
          ? payload.content
          : [];

      if (list.length === 0) {
        await createDraftTab({ replace: true });
        return;
      }

      const mapped = list.map((draft, idx) => {
        const selectedCustomer = mapDraftCustomer(draft);
        const customerId = selectedCustomer?.id || draft.customerId || null;
        const normalizedMethod = normalizePaymentMethod(draft.paymentMethod);

        return createSalesTab(idx + 1, tabPrefix, {
          orderId: draft.orderId || null,
          orderNote: draft.orderNote || "",
          items: (draft.orderItemDTOs || []).map((it, itemIdx) =>
            mapDraftItemToCart(it, itemIdx)
          ),
          customerInput: selectedCustomer?.fullName || "",
          selectedCustomer,
          customerId,
          paymentMethod: normalizedMethod,
          invoiceDiscount: Number(draft.invoiceDiscount || 0),
        });
      });

      setTabs(mapped);
      setActiveTab(1);

      draftSnapshotRef.current = list.reduce((acc, draft) => {
        if (!draft.orderId) return acc;
        const selectedCustomer = mapDraftCustomer(draft);
        acc[draft.orderId] = serializeDraftState({
          orderId: draft.orderId,
          customerId: selectedCustomer?.id || draft.customerId || null,
          paymentMethod: (draft.paymentMethod || "CASH").toUpperCase(),
          orderNote: draft.orderNote || "",
          items: draft.orderItemDTOs || [],
          invoiceDiscount: Number(draft.invoiceDiscount || 0),
        });
        return acc;
      }, {});
    } catch (err) {
      console.error("Failed to fetch draft orders", err);
      setTabs((prev) => (prev.length > 0 ? prev : [createSalesTab(1, tabPrefix)]));
      setActiveTab(1);
    }
  }, [tabPrefix, token, createDraftTab]);

  /* ================== CUSTOMERS ================== */
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/customer`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formatted = (res.data || []).map((c) => ({
        id: c.id,
        fullName: c.fullName || c.name || "",
        phoneNumber: c.phoneNumber || c.phone || "",
        email: c.email || "",
        address: c.address || "",
        gender: normalizeGender(c.gender),
      }));
      setCustomers(formatted);
      return formatted;
    } catch (err) {
      console.error("Failed to fetch customers", err);
      return [];
    }
  }, [token]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    loadDraftTabs();
  }, [loadDraftTabs]);

  useEffect(() => {
    if (!customers || customers.length === 0) return;
    setTabs((prev) => {
      let changed = false;
      const updated = prev.map((tab) => {
        if (!tab.customerId) return tab;

        if (
          tab.selectedCustomer &&
          tab.selectedCustomer.id === tab.customerId &&
          (tab.selectedCustomer.fullName || tab.selectedCustomer.phoneNumber)
        ) {
          return tab;
        }

        const found = customers.find((c) => c.id === tab.customerId);
        if (!found) return tab;

        changed = true;
        return {
          ...tab,
          selectedCustomer: found,
          customerInput: found.fullName || tab.customerInput,
        };
      });
      return changed ? updated : prev;
    });
  }, [customers]);

  useEffect(() => {
    const shouldReload = () => Date.now() - lastDraftFetchRef.current > 1000;
    const handleFocus = () => { if (shouldReload()) loadDraftTabs(); };
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && shouldReload()) loadDraftTabs();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadDraftTabs]);

  /* ================== CURRENT TAB ================== */
  const currentTab = tabs.find((t) => t.id === activeTab);
  const cartItems = currentTab?.items || [];
  const customer = currentTab?.customerInput || "";
  const selectedCustomer = currentTab?.selectedCustomer || null;
  const currentOrderId = currentTab?.orderId || null;
  const currentOrderNote = currentTab?.orderNote || "";
  const currentCustomerId = selectedCustomer?.id ?? currentTab?.customerId ?? null;
  const paymentMethod = currentTab?.paymentMethod || "cash";
  const invoiceDiscount = Number(currentTab?.invoiceDiscount || 0);


  // update ref cho WS filter
  useEffect(() => {
    currentOrderIdRef.current = currentOrderId;
  }, [currentOrderId]);

  // log orderId khi chọn tab
  useEffect(() => {
    if (currentTab?.orderId) {
      console.log("🟢 Active OrderId:", currentTab.orderId);
    } else {
      console.log("🟡 Tab chưa có orderId");
    }
  }, [activeTab, currentTab?.orderId]);

  /* ================== WS LISTENER (RUN ONCE) ================== */
  useEffect(() => {
    connectWS();

    const unsubscribe = onOrderNotify((data) => {
      const activeOrderId = currentOrderIdRef.current;

      // 1️⃣ Phải có orderId hợp lệ
      if (!data.orderId) return;

      // 2️⃣ Đơn phải còn tồn tại trong tabs hiện tại
      const existsInTabs = tabsRef.current.some((t) => t.orderId === data.orderId);
      if (!existsInTabs) return;

      // 3️⃣ Đúng orderId đang active mới xử lý
      if (data.orderId !== activeOrderId) return;

      console.log("🔥 PAYMENT WS EVENT:", data);

      setPayLoading(false);
      setPaymentData(data);

      if (data.paymentStatus === "PENDING") {
        setShowPaymentPopup(true);
        return;
      }

      if (data.paymentStatus === "COMPLETED") {
        console.log("🎉 PAYMENT COMPLETE:", data.orderId);
        alert("Thanh toán hoàn tất!");
        // 🖨 AUTO PRINT
        // if (printRef.current) {
        //   printRef.current();
        // }
        setShowPaymentPopup(false);

        // ❗ Bạn có thể gọi nút in hóa đơn tại đây nếu muốn
        // if (printRef.current) printRef.current();

        unsubscribeOrder(data.orderId);
        handleAfterPaymentComplete(data.orderId);
      }
    });

    return () => unsubscribe();
  }, []);


  /* ================== DRAFT AUTO SYNC ================== */
  useEffect(() => {
    if (!currentOrderId) return undefined;

    if (draftSyncRef.current) clearTimeout(draftSyncRef.current);
    draftSyncRef.current = setTimeout(() => {
      const draftPayload = {
        orderId: currentOrderId,
        customerId: currentCustomerId,
        paymentMethod: paymentMethod.toUpperCase(),
        orderNote: currentOrderNote,
        orderItemDTOs: cartItems.map((item) => mapCartItemToDraftDTO(item)),
        invoiceDiscount,
      };

      const serialized = serializeDraftState({
        orderId: draftPayload.orderId,
        customerId: draftPayload.customerId,
        paymentMethod: draftPayload.paymentMethod,
        orderNote: draftPayload.orderNote,
        items: draftPayload.orderItemDTOs,
        invoiceDiscount: draftPayload.invoiceDiscount,
      });

      if (draftSnapshotRef.current[currentOrderId] === serialized) return;

      axios.put(`${API_BASE_URL}/order/draft`, draftPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then(() => {
          draftSnapshotRef.current[currentOrderId] = serialized;
        })
        .catch((err) => {
          console.error("Failed to sync draft order", err);
        });
    }, 600);

    return () => {
      if (draftSyncRef.current) clearTimeout(draftSyncRef.current);
    };
  }, [
    cartItems,
    currentOrderId,
    currentOrderNote,
    currentCustomerId,
    paymentMethod,
    invoiceDiscount,
    token,
  ]);

  /* ================== TAB REMOVE ================== */
  const handleRemoveTab = async (id) => {
    if (tabsRef.current.length <= 1) {
      alert(t("sales.needOneTab"));
      return;
    }

    const tabToRemove = tabsRef.current.find((tab) => tab.id === id);

    if (tabToRemove?.orderId) {
      try {
        await axios.delete(`${API_BASE_URL}/order/draft/${tabToRemove.orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Failed to delete draft order", err);
      }
      delete draftSnapshotRef.current[tabToRemove.orderId];
    }

    setTabs((prev) => {
      const normalized = prev
        .filter((tab) => tab.id !== id)
        .map((tab, idx) => ({
          ...tab,
          id: idx + 1,
          name: `${tabPrefix} ${idx + 1}`,
        }));

      return normalized.length > 0 ? normalized : [createSalesTab(1, tabPrefix)];
    });

    setActiveTab((prevActive) => {
      if (prevActive === id) return Math.max(1, id - 1);
      if (prevActive > id) return prevActive - 1;
      return prevActive;
    });
  };

  // Xóa tab theo orderId (SỬA thành sync, KHÔNG tạo draft bên trong setTabs nữa)
  const removeTabByOrderIdSync = (orderId) => {
    const prevTabs = tabsRef.current;
    const filtered = prevTabs.filter((t) => t.orderId !== orderId);

    delete draftSnapshotRef.current[orderId];

    const reordered = filtered.map((tab, idx) => ({
      ...tab,
      id: idx + 1,
      name: `${tabPrefix} ${idx + 1}`,
    }));

    setTabs(reordered);
    setActiveTab(1);

    return reordered.length === 0; // true nếu là tab cuối
  };

  // xử lý sau khi payment completed
  const handleAfterPaymentComplete = async (completedOrderId) => {
    // 1️⃣ Xoá tab tương ứng trong FE
    removeTabByOrderIdSync(completedOrderId);

    try {
      // 2️⃣ Gọi BE xem còn draft nào không
      const res = await axios.get(`${API_BASE_URL}/order/drafts/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.content)
          ? res.data.content
          : [];

      if (list.length === 0) {
        // 3️⃣ Không còn draft nào → tạo đơn mới
        await createDraftTab({ replace: true });
        console.log("🟢 No draft left → created a new draft");
      } else {
        // 4️⃣ Còn draft → load lại toàn bộ FE từ BE
        await loadDraftTabs();
        console.log("🟡 Still has drafts → reload tabs");
      }

    } catch (err) {
      console.error("❌ Error checking remaining drafts:", err);
    }
  };


  /* ================== CUSTOMER UI LOGIC ================== */
  const filteredCustomers =
    customer.trim() === ""
      ? []
      : customers.filter((c) => {
        const keyword = customer.trim().toLowerCase();
        const name = (c.fullName || "").toLowerCase();
        const phone = c.phoneNumber || "";
        return name.includes(keyword) || phone.includes(customer.trim());
      });

  const setCustomerInput = (value) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab ? { ...tab, customerInput: value } : tab
      )
    );
  };

  const handleSelectCustomer = (c) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? {
            ...tab,
            selectedCustomer: c,
            customerInput: c.fullName || "",
            customerId: c.id || null,
          }
          : tab
      )
    );
  };

  const handleClearCustomer = () => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? { ...tab, selectedCustomer: null, customerInput: "", customerId: null }
          : tab
      )
    );
  };

  const handlePaymentMethodChange = (method) => {
    const normalized = normalizePaymentMethod(method);
    setTabs((prev) =>
      prev.map((tab) => (tab.id === activeTab ? { ...tab, paymentMethod: normalized } : tab))
    );
  };

  const handleInvoiceDiscountChange = (value) => {
    const safeValue = Math.max(0, Number(value) || 0);
    setTabs((prev) =>
      prev.map((tab) => (tab.id === activeTab ? { ...tab, invoiceDiscount: safeValue } : tab))
    );
  };

  const handleCloseCustomerModal = () => {
    setShowCustomerModal(false);
    setNewCustomer(getEmptyCustomerForm());
  };

  const handleOpenCustomerModal = () => {
    setNewCustomer(getEmptyCustomerForm());
    setShowCustomerModal(true);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.fullName.trim()) {
      alert(t("sales.alertEmptyCustomer"));
      return;
    }
    if (!newCustomer.phoneNumber.trim()) {
      alert(t("customer.phoneRequired"));
      return;
    }
    setSavingCustomer(true);
    try {
      const payload = {
        name: newCustomer.fullName.trim(),
        phone: newCustomer.phoneNumber.trim(),
        email: newCustomer.email.trim(),
        address: newCustomer.address.trim(),
        gender: newCustomer.gender === "female" ? 0 : 1,
      };
      await axios.post(`${API_BASE_URL}/customer`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const updated = await fetchCustomers();
      const fallbackCustomer = {
        id: Date.now(),
        fullName: newCustomer.fullName.trim(),
        phoneNumber: newCustomer.phoneNumber.trim(),
        email: newCustomer.email.trim(),
        address: newCustomer.address.trim(),
        gender: newCustomer.gender,
      };
      const created = updated.find((c) => c.phoneNumber === payload.phone);
      if (!created) {
        setCustomers((prev) => [...prev, fallbackCustomer]);
      }
      const resolved = created || fallbackCustomer;
      handleSelectCustomer(resolved);
      handleCloseCustomerModal();
    } catch (err) {
      console.error("Failed to add customer", err);
      alert(t("customer.addError"));
    } finally {
      setSavingCustomer(false);
    }
  };

  /* ================== CART LOGIC ================== */
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

  const handleScanProduct = (code) => {
    const found = productList.find(
      (p) => p.code?.toLowerCase() === code.trim().toLowerCase()
    );
    if (found) {
      handleAddProduct(found);
    } else {
      alert(t("sales.productNotFound"));
    }
  };

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

  const handleAddTab = async () => {
    await createDraftTab();
  };

  /* ================== PAY ================== */
  const totalAmount = cartItems.reduce((s, it) => s + (it.total ?? 0), 0);
  const finalTotal = Math.max(totalAmount - invoiceDiscount, 0);

  const savePendingOrder = async () => {
    if (!currentOrderId) return;


    setPayLoading(true);

    try {
      // 1️⃣ SYNC DRAFT NGAY LẬP TỨC
      const draftPayload = {
        orderId: currentOrderId,
        customerId: currentCustomerId,
        paymentMethod: paymentMethod.toUpperCase(),
        orderNote: currentOrderNote,
        orderItemDTOs: cartItems.map((item) => mapCartItemToDraftDTO(item)),
        invoiceDiscount,
      };

      console.log("🔄 Sync draft before payment...", draftPayload);

      await axios.put(`${API_BASE_URL}/order/draft`, draftPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // 🔥 CẬP NHẬT SNAPSHOT NGAY (để auto-sync không sync lại)
      draftSnapshotRef.current[currentOrderId] = serializeDraftState({
        orderId: currentOrderId,
        customerId: currentCustomerId,
        paymentMethod: paymentMethod.toUpperCase(),
        orderNote: currentOrderNote,
        items: draftPayload.orderItemDTOs,
        invoiceDiscount,
      });

      // 2️⃣ SUBSCRIBE ĐƠN NÀY ĐỂ LẮNG NGHE WS
      subscribeOrder(currentOrderId, async () => {
        console.log("📡 WS READY → NOW SEND PAY");

        const res = await axios.post(
          `${API_BASE_URL}/order/sale/${currentOrderId}/pay`,
          { paymentMethod: paymentMethod.toUpperCase() },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("💰 PAY SENT:", res.data);
      });
      // 3️⃣ GỌI THANH TOÁN
      const res = await axios.post(
        `${API_BASE_URL}/order/sale/${currentOrderId}/pay`,
        { paymentMethod: paymentMethod.toUpperCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("💰 PAY REQUEST SENT:", res.data);

    } catch (e) {
      console.error("PAY ERROR:", e);
      alert("Có lỗi khi thanh toán, thử lại!");
    } finally {
      setPayLoading(false);
    }
  };




  /* ================== FILTER PRODUCTS ================== */
  const filteredProducts =
    searchQuery.trim() === "" || barcodeMode
      ? []
      : productList.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.code.toLowerCase().includes(searchQuery.toLowerCase())
      );



  /* ================== RENDER ================== */
  return (
    <div className="container-fluid bg-light p-0" style={{ height: "100vh", overflow: "hidden" }}>
      <Header />
      <SalesHeaderBar
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleAddTab={handleAddTab}
        handleRemoveTab={handleRemoveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        barcodeMode={barcodeMode}
        setBarcodeMode={setBarcodeMode}
        onScanProduct={handleScanProduct}
      />

      <div className="row gx-1 gy-1 m-0" style={{ height: "calc(100vh - 110px)" }}>
        {/* === GIỎ HÀNG === */}
        <div className="col-lg-8 col-md-7 p-2 d-flex flex-column">
          <div className="flex-grow-1 overflow-auto position-relative">
            {loading ? (
              <div className="text-center text-muted mt-5">
                <div className="spinner-border text-primary" />
                <p>{t("sales.loadingProducts", { defaultValue: "Loading products..." })}</p>
              </div>
            ) : error ? (
              <div className="text-danger text-center mt-5">{error}</div>
            ) : (
              <>
                {filteredProducts.length > 0 && (
                  <div
                    className="position-absolute bg-white shadow rounded-3 p-2"
                    style={{ zIndex: 10, width: 300 }}
                  >
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
                )}

                {cartItems.length === 0 ? (
                  <div className="text-center text-muted mt-5">
                    {t("sales.noItems", { defaultValue: "No items in the cart" })}
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
              </>
            )}
          </div>

          {/* Ghi chú hóa đơn */}
          <div className={`rounded-4 border border-${theme} border-opacity-25 bg-white p-3 mt-2`}>
            <div className="d-flex align-items-center">
              <i className="bi bi-pencil text-muted me-2" />
              <input
                type="text"
                className="form-control border-0 shadow-none"
                placeholder={t("sales.orderNote", { defaultValue: "Order note..." })}
                value={currentTab?.orderNote || ""}
                onChange={(e) => setOrderNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* === KHÁCH HÀNG === */}
        <div className="col-lg-4 col-md-5 p-2 d-flex flex-column">
          <CustomerPanel
            customer={customer}
            setCustomer={setCustomerInput}
            filteredCustomers={filteredCustomers}
            handleSelectCustomer={handleSelectCustomer}
            totalAmount={totalAmount}
            paymentMethod={paymentMethod}
            setPaymentMethod={handlePaymentMethodChange}
            onAddCustomerClick={handleOpenCustomerModal}
            selectedCustomer={selectedCustomer}
            onClearCustomer={handleClearCustomer}
            invoiceDiscount={invoiceDiscount}
            setInvoiceDiscount={handleInvoiceDiscountChange}
            onPrint={() => console.log(t("sales.printAction", { defaultValue: "Print invoice" }))}
            cartItems={cartItems}
            orderNote={currentTab?.orderNote || ""}
            onPay={savePendingOrder}
            onPrintReady={(fn) => (printRef.current = fn)}
          />
        </div>
      </div>

      {/* Modal khách hàng */}
      <CustomerModal
        show={showCustomerModal}
        onClose={handleCloseCustomerModal}
        newCustomer={newCustomer}
        setNewCustomer={setNewCustomer}
        handleAddCustomer={handleAddCustomer}
        saving={savingCustomer}
      />

      <PaymentConfirmModal
        show={showPaymentPopup}
        data={paymentData}

        onCancel={async () => {
          try {
            const res = await axios.post(
              `${API_BASE_URL}/order/sale/${paymentData.orderId}/cancel`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Đã hủy thanh toán:", res.data);
          } catch (err) {
            console.error("Failed to cancel:", err);
          }
          setShowPaymentPopup(false);
        }}

        onConfirm={async () => {
          console.log("CLIENT SEND CONFIRM:", paymentData.orderId);



          try {
            await axios.post(
              `${API_BASE_URL}/order/sale/${paymentData.orderId}/confirm`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );

          } catch (e) {
            console.error("CONFIRM ERROR:", e);
          }
        }}
      />

      {payLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.25)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <div className="spinner-border text-primary" style={{ width: "4rem", height: "4rem" }} />
        </div>
      )}
    </div>
  );
}
