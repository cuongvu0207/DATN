import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import axios from "axios";

import { exportInvoicesToExcel } from "../utils/exportInvoicesUtils";
import InvoiceHeaderBar from "../components/invoice/InvoiceHeaderBar";
import InvoiceFilterPanel from "../components/invoice/InvoiceFilterPanel";
import InvoiceTable from "../components/invoice/InvoiceTable";
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

  /* =====================================
     1) LOAD CUSTOMER LIST
  ===================================== */
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

  const getCustomerInfo = (customerId) => {
    if (!customerId || customerId === "default_customer_id") {
      return { name: "Khách lẻ", phone: "" };
    }
    const found = customerList.find((c) => c.id === customerId);
    return found
      ? { name: found.name, phone: found.phone }
      : { name: "Khách hàng", phone: "" };
  };

  /* =====================================
     2) LOAD STAFF LIST
  ===================================== */
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

  /* =====================================
     3) MAP SELLER LIST CHO BỘ LỌC
  ===================================== */
  const sellerList = useMemo(() => {
    const usernames = [...new Set(invoices.map((i) => i.seller))];

    return usernames.map((username) => {
      const staff = staffList.find((s) => s.username === username);
      return {
        value: username,
        label: staff?.fullName || staff?.username || username,
      };
    });
  }, [invoices, staffList]);

  /* =====================================
     4) LOAD INVOICES — chỉ fetch sau khi có customers
  ===================================== */
  useEffect(() => {
    if (customerList.length === 0) return;

    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/order/static/all`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

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
              paymentMethod: item.paymentMethod,
              status: item.status,
              createdAt: dateObj.toLocaleString("vi-VN", { hour12: false }),
              createdAtRaw: dateObj.getTime(), // ⭐ DÙNG ĐỂ SORT
              seller: staff?.fullName || item.cashierId || "unknown",
            };
          })
          .sort((a, b) => b.createdAtRaw - a.createdAtRaw); // ⭐ MỚI NHẤT → CŨ NHẤT

        setInvoices(mapped);
      } catch (err) {
        console.error("Failed to fetch invoices", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [token, customerList]);

  /* =====================================
     5) FILTER
  ===================================== */
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const filtered = invoices.filter((inv) => {
    const q = query.toLowerCase();

    const matchQuery =
      inv.id.toLowerCase().includes(q) ||
      inv.customer.toLowerCase().includes(q) ||
      inv.phone.includes(q);

    const matchStatus = !filters.status || inv.status === filters.status;
    const matchPayment =
      !filters.paymentMethod || inv.paymentMethod === filters.paymentMethod;
    const matchSeller = !filters.seller || inv.seller === filters.seller;

    const matchDate =
      !filters.createdAt ||
      inv.createdAt.startsWith(
        new Date(filters.createdAt).toLocaleDateString("vi-VN")
      );

    return matchQuery && matchStatus && matchPayment && matchSeller && matchDate;
  });

  /* =====================================
     6) RENDER
  ===================================== */
  return (
    <MainLayout>
      <div className="container-fluid py-3">

        {/* HEADER BAR */}
        <InvoiceHeaderBar
          query={query}
          setQuery={setQuery}
          onExport={() => exportInvoicesToExcel(filtered, t)}
        />

        <div className="row g-3 mt-1">

          {/* FILTER PANEL */}
          <InvoiceFilterPanel
            filters={filters}
            onChange={handleFilterChange}
            sellerList={sellerList}
          />

          {/* DATA TABLE */}
          <InvoiceTable
            invoices={filtered}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            selectedInvoices={selectedInvoices}
            onSelectOne={(id) =>
              setSelectedInvoices((prev) =>
                prev.includes(id)
                  ? prev.filter((x) => x !== id)
                  : [...prev, id]
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
          />
        </div>
      </div>
    </MainLayout>
  );
}
