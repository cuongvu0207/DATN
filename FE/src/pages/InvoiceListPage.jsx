// InvoiceListPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import axios from "axios";

import { exportInvoicesToExcel } from "../utils/exportInvoicesUtils";
import InvoiceHeaderBar from "../components/invoice/InvoiceHeaderBar";
import InvoiceFilterPanel from "../components/invoice/InvoiceFilterPanel";
import InvoiceTable from "../components/invoice/InvoiceTable";
import InvoiceDetailCard from "../components/invoice/InvoiceDetailCard";
import { API_BASE_URL } from "../services/api";

export default function InvoiceListPage() {
  const { t } = useTranslation();
  const token = localStorage.getItem("accessToken");

  const [invoices, setInvoices] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  const [filters, setFilters] = useState({
    status: "",
    paymentMethod: "",
    seller: "",
    createdAt: "",
  });

  const [expandedId, setExpandedId] = useState(null);
  const [detailMap, setDetailMap] = useState({});
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  const translatePaymentMethod = useCallback(
    (method) => {
      if (!method) return t("paymentMethod.unknown", "Không xác định");

      const methodLower = String(method).toLowerCase();

      if (methodLower.includes("cash") || methodLower === "cash")
        return t("paymentMethod.cash", "Tiền mặt");
      if (
        methodLower.includes("bank") ||
        methodLower === "bank" ||
        methodLower.includes("transfer")
      )
        return t("paymentMethod.bank", "Chuyển khoản");
      if (methodLower.includes("card") || methodLower.includes("credit"))
        return t("paymentMethod.card", "Thẻ thanh toán");
      if (
        methodLower.includes("momo") ||
        methodLower.includes("zalopay") ||
        methodLower.includes("vnpay")
      )
        return t("paymentMethod.eWallet", "Ví điện tử");

      return method;
    },
    [t]
  );

  const translateStatus = useCallback(
    (status) => {
      if (status === "COMPLETED") return t("status.completed", "Hoàn thành");
      if (status === "PENDING") return t("status.pending", "Đang xử lý");
      if (status === "CANCELLED") return t("status.cancelled", "Đã hủy");
      return status;
    },
    [t]
  );

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/customer`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomerList(res.data || []);
      } catch (err) {
        console.error("Failed to fetch customers", err);
      }
    };
    fetchCustomers();
  }, [token]);

  const getCustomerInfo = useCallback(
    (customerId) => {
      if (!customerId || customerId === "default_customer_id") {
        return { name: t("customer.walkIn", "Khách lẻ"), phone: "" };
      }
      const found = customerList.find((c) => c.id === customerId);
      return found
        ? {
            name:
              found.name ||
              found.fullName ||
              t("customer.defaultName", "Khách hàng"),
            phone: found.phone || found.phoneNumber || "",
          }
        : { name: t("customer.defaultName", "Khách hàng"), phone: "" };
    },
    [customerList, t]
  );

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/users/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStaffList(res.data || []);
      } catch (err) {
        console.error("Failed to fetch staff", err);
      }
    };
    fetchStaff();
  }, [token]);

  useEffect(() => {
    if (customerList.length === 0) return;

    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/order/static/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw = Array.isArray(res.data) ? res.data : [];

        const mapped = raw
          .map((item) => {
            const customer = getCustomerInfo(item.customerId);
            const dateObj = new Date(item.createdAt);
            const staff = staffList.find((s) => s.username === item.cashierId);

            return {
              id: item.orderId,
              customer: customer.name,
              phone: customer.phone,
              total: Number(item.totalPrice || 0),

              paymentMethod: translatePaymentMethod(item.paymentMethod),
              status: translateStatus(item.status),

              createdAt: dateObj.toLocaleString("vi-VN", { hour12: false }),
              createdAtRaw: dateObj.getTime(),

              seller: staff?.fullName || item.cashierId || "unknown",
              originalStatus: item.status,
              originalPaymentMethod: item.paymentMethod,
            };
          })
          .sort((a, b) => b.createdAtRaw - a.createdAtRaw);

        setInvoices(mapped);
      } catch (err) {
        console.error("Failed to fetch invoices", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [
    token,
    customerList,
    staffList,
    getCustomerInfo,
    translatePaymentMethod,
    translateStatus,
  ]);

  const sellerList = useMemo(() => {
    const usernames = [...new Set(invoices.map((i) => i.seller))];
    return usernames.map((username) => ({
      value: username,
      label: username,
    }));
  }, [invoices]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
    setExpandedId(null);
  };

  const filtered = invoices.filter((inv) => {
    const q = query.toLowerCase();

    const matchQuery =
      inv.id.toLowerCase().includes(q) ||
      inv.customer.toLowerCase().includes(q) ||
      inv.phone.includes(q);

    const matchStatus = !filters.status || inv.originalStatus === filters.status;
    const matchPayment =
      !filters.paymentMethod ||
      inv.originalPaymentMethod === filters.paymentMethod;
    const matchSeller = !filters.seller || inv.seller === filters.seller;

    const matchDate =
      !filters.createdAt ||
      inv.createdAt.startsWith(
        new Date(filters.createdAt).toLocaleDateString("vi-VN")
      );

    return matchQuery && matchStatus && matchPayment && matchSeller && matchDate;
  });

  const fetchInvoiceDetail = useCallback(
    async (invoiceId) => {
      const res = await axios.get(`${API_BASE_URL}/order/static/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const invoiceData = res.data;
      const customer = getCustomerInfo(invoiceData.customerId);
      const staff = staffList.find((s) => s.username === invoiceData.cashierId);

      return {
        orderId: invoiceData.orderId,
        cashierId: invoiceData.cashierId,
        customerId: invoiceData.customerId,
        totalPrice: Number(invoiceData.totalPrice || 0),
        paymentMethod: invoiceData.paymentMethod,
        status: invoiceData.status,
        createdAt: invoiceData.createdAt,
        orderItemDTOs: invoiceData.orderItemDTOs || [],
        customer: customer.name,
        phone: customer.phone,
        seller: staff?.fullName || invoiceData.cashierId || "unknown",
      };
    },
    [token, getCustomerInfo, staffList]
  );

  const handleToggleRow = async (invoice) => {
    if (expandedId === invoice.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(invoice.id);

    if (detailMap[invoice.id]) return;

    try {
      setLoadingDetailId(invoice.id);
      const detail = await fetchInvoiceDetail(invoice.id);
      setDetailMap((prev) => ({ ...prev, [invoice.id]: detail }));
    } catch (e) {
      console.error("Failed to load invoice detail", e);
    } finally {
      setLoadingDetailId(null);
    }
  };

  const formatCurrency = useCallback(
    (value) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(Number(value || 0)),
    []
  );

  const fmtDate = useCallback(
    (d) =>
      d ? new Date(d).toLocaleString("vi-VN", { hour12: false }) : "-",
    []
  );

  return (
    <MainLayout>
      <div className="container-fluid py-3">
        <InvoiceHeaderBar
          query={query}
          setQuery={setQuery}
          onExport={() => exportInvoicesToExcel(filtered, t)}
        />

        <div className="row g-3 mt-1">
          <InvoiceFilterPanel
            filters={filters}
            onChange={handleFilterChange}
            sellerList={sellerList}
            translatePaymentMethod={translatePaymentMethod}
            translateStatus={translateStatus}
          />

          <InvoiceTable
            invoices={filtered}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            selectedInvoices={selectedInvoices}
            onSelectOne={(id) =>
              setSelectedInvoices((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
              )
            }
            onSelectAll={(checked, items) => {
              const ids = items.map((i) => i.id);
              setSelectedInvoices((prev) =>
                checked
                  ? [...new Set([...prev, ...ids])]
                  : prev.filter((id) => !ids.includes(id))
              );
            }}
            loading={loading}
            expandedId={expandedId}
            onToggleRow={handleToggleRow}
            onRowClick={undefined}
            renderExpandedRow={(inv) => {
              const detail = detailMap[inv.id];

              if (loadingDetailId === inv.id) {
                return (
                  <div className="p-3 text-center">
                    <div className="spinner-border text-primary" />
                    <div className="small text-muted mt-2">
                      {t("common.loading", "Đang tải...")}
                    </div>
                  </div>
                );
              }

              if (!detail) {
                return (
                  <div className="p-3 text-muted">
                    {t("invoice.detail.noItems", "Không có dữ liệu")}
                  </div>
                );
              }

              return (
                <div className="p-2">
                  <InvoiceDetailCard
                    invoice={detail}
                    onClose={() => setExpandedId(null)}
                    formatCurrency={formatCurrency}
                    fmtDate={fmtDate}
                  />
                </div>
              );
            }}
          />
        </div>
      </div>
    </MainLayout>
  );
}
