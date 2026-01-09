import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import { formatCurrency, formatters } from "../utils/formatters";
import TablePagination from "../components/common/TablePagination";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";

export default function FinancePage() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const token = localStorage.getItem("accessToken");

  // ===== TAB STATE =====
  const [activeTab, setActiveTab] = useState("overview");

  // ===== DATE FILTERS FOR EACH TAB =====
  const todayISO = new Date().toISOString().slice(0, 10);
  
  // Tab Overview filters
  const [overviewStartDate, setOverviewStartDate] = useState(todayISO);
  const [overviewEndDate, setOverviewEndDate] = useState(todayISO);
  
  // Tab Tax Calculator filters
  const [taxStartDate, setTaxStartDate] = useState(todayISO);
  const [taxEndDate, setTaxEndDate] = useState(todayISO);
  
  // Tab Transactions filters
  const [transactionsStartDate, setTransactionsStartDate] = useState(todayISO);
  const [transactionsEndDate, setTransactionsEndDate] = useState(todayISO);

  // Get current filters based on active tab
  const getCurrentFilters = () => {
    switch (activeTab) {
      case "overview":
        return {
          startDate: overviewStartDate,
          endDate: overviewEndDate,
          setStartDate: setOverviewStartDate,
          setEndDate: setOverviewEndDate
        };
      case "tax-calculator":
        return {
          startDate: taxStartDate,
          endDate: taxEndDate,
          setStartDate: setTaxStartDate,
          setEndDate: setTaxEndDate
        };
      case "transactions":
        return {
          startDate: transactionsStartDate,
          endDate: transactionsEndDate,
          setStartDate: setTransactionsStartDate,
          setEndDate: setTransactionsEndDate
        };
      default:
        return {
          startDate: overviewStartDate,
          endDate: overviewEndDate,
          setStartDate: setOverviewStartDate,
          setEndDate: setOverviewEndDate
        };
    }
  };

  // ===== DASHBOARD DATA =====
  const [summary, setSummary] = useState({
    revenue: 0,
    cost: 0,
    profit: 0,
    invoicesCount: 0,
    importOrdersCount: 0,
    totalCashFlow: 0,
    averageOrderValue: 0,
    profitMargin: 0
  });

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // ===== CHART DATA =====
  const [chartData, setChartData] = useState({
    dailyCashFlow: [],
    paymentMethods: [],
    categoryCashFlow: [],
    cashFlowTrend: []
  });

  // ===== TAX CALCULATOR STATE =====
  const [taxPeriod, setTaxPeriod] = useState("QUARTER");
  const [taxRevenue, setTaxRevenue] = useState(0);
  const [inputVat, setInputVat] = useState(0);
  const [vatMethod, setVatMethod] = useState("credit");

  const TAX_CONFIG = {
    industry: t("finance.industry.groceryStationery", "Tạp hóa, văn phòng phẩm"),
    minRevenue: 500000000,
    vatRate: 8,
    pitRate: 1.5,
    applyFrom: "2026-01-01"
  };

  const [isAboveThreshold, setIsAboveThreshold] = useState(false);
  const [yearlyRevenueEstimate, setYearlyRevenueEstimate] = useState(0);

  // Tính toán thuế
  useEffect(() => {
    const multipliers = { MONTH: 12, QUARTER: 4, YEAR: 1 };
    const yearlyEstimate = taxRevenue * multipliers[taxPeriod];
    setYearlyRevenueEstimate(yearlyEstimate);
    setIsAboveThreshold(yearlyEstimate >= TAX_CONFIG.minRevenue);
  }, [taxRevenue, taxPeriod, TAX_CONFIG.minRevenue]);

  const calculateTax = () => {
    if (!isAboveThreshold) {
      return {
        taxableRevenue: 0,
        vatAmount: 0,
        pitAmount: 0,
        totalTax: 0,
        outputVat: 0,
        inputVat: inputVat,
        vatToPay: 0
      };
    }

    const taxableRevenue = Math.max(0, yearlyRevenueEstimate - TAX_CONFIG.minRevenue);
    const outputVat = taxableRevenue * (TAX_CONFIG.vatRate / 100);
    const vatToPay = Math.max(0, outputVat - inputVat);
    const vatAmount = vatToPay;
    const pitAmount = taxableRevenue * (TAX_CONFIG.pitRate / 100);

    return {
      taxableRevenue,
      vatAmount,
      pitAmount,
      totalTax: vatAmount + pitAmount,
      outputVat,
      inputVat: inputVat,
      vatToPay
    };
  };

  const taxResult = calculateTax();
  const effectiveRate = taxRevenue > 0 ? (taxResult.totalTax / yearlyRevenueEstimate) * 100 : 0;

  // ===== AXIOS INSTANCE =====
  const axiosInstance = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
    [token]
  );

  // ===== FETCH DASHBOARD DATA =====
  const fetchDashboardData = async (startDate, endDate) => {
    setLoading(true);
    setError("");

    try {
      const [invoicesRes, importOrdersRes, productsRes, customersRes] = await Promise.all([
        axiosInstance.get("/order/static/allCompleted"),
        axiosInstance.get("/inventory/import-product"),
        axiosInstance.get("/inventory/products"),
        axiosInstance.get("/customer")
      ]);

      const allInvoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
      const allImportOrders = Array.isArray(importOrdersRes.data) ? importOrdersRes.data : [];
      const products = Array.isArray(productsRes.data) ? productsRes.data : [];
      const customers = Array.isArray(customersRes.data) ? customersRes.data : [];

      // Lọc theo khoảng thời gian
      const fromDate = new Date(startDate);
      const toDate = new Date(endDate);
      toDate.setHours(23, 59, 59, 999);

      const filteredInvoices = allInvoices.filter((inv) => {
        const invoiceDate = new Date(inv.createdAt);
        return invoiceDate >= fromDate && invoiceDate <= toDate;
      });

      const filteredImportOrders = allImportOrders.filter((imp) => {
        const importDate = new Date(imp.createdAt);
        return importDate >= fromDate && importDate <= toDate;
      });

      // Tính toán
      const totalRevenue = filteredInvoices.reduce(
        (sum, inv) => sum + Number(inv.totalPrice || 0), 
        0
      );

      const totalImportCost = filteredImportOrders.reduce(
        (sum, imp) => sum + Number(imp.totalAmount || 0),
        0
      );

      const totalCashFlow = totalRevenue - totalImportCost;

      const totalOrders = filteredInvoices.length;
      const totalImports = filteredImportOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const profitMargin = totalRevenue > 0 ? (totalCashFlow / totalRevenue) * 100 : 0;

      setSummary({
        revenue: totalRevenue,
        cost: totalImportCost,
        profit: totalCashFlow,
        invoicesCount: totalOrders,
        importOrdersCount: totalImports,
        totalCashFlow: totalCashFlow,
        averageOrderValue,
        profitMargin
      });

      // Cập nhật tax calculator với doanh thu hiện tại
      if (activeTab === "tax-calculator") {
        setTaxRevenue(totalRevenue);
      }

      // Chuẩn bị dữ liệu chart
      const dailyData = {};
      
      // Thêm dữ liệu từ hóa đơn bán
      filteredInvoices.forEach((invoice) => {
        const date = new Date(invoice.createdAt);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            date: dateKey,
            displayDate: formatters.date.toDisplay(dateKey),
            revenue: 0,
            importCost: 0,
            cashFlow: 0,
            invoices: 0,
            imports: 0
          };
        }
        
        dailyData[dateKey].revenue += Number(invoice.totalPrice || 0);
        dailyData[dateKey].cashFlow += Number(invoice.totalPrice || 0);
        dailyData[dateKey].invoices += 1;
      });

      // Thêm dữ liệu từ đơn nhập
      filteredImportOrders.forEach((importOrder) => {
        const date = new Date(importOrder.createdAt);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            date: dateKey,
            displayDate: formatters.date.toDisplay(dateKey),
            revenue: 0,
            importCost: 0,
            cashFlow: 0,
            invoices: 0,
            imports: 0
          };
        }
        
        dailyData[dateKey].importCost += Number(importOrder.totalAmount || 0);
        dailyData[dateKey].cashFlow -= Number(importOrder.totalAmount || 0);
        dailyData[dateKey].imports += 1;
      });

      const dailyCashFlow = Object.values(dailyData)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Dữ liệu xu hướng tích lũy
      let cumulativeCashFlow = 0;
      const cashFlowTrend = dailyCashFlow.map(day => {
        cumulativeCashFlow += day.cashFlow;
        return {
          ...day,
          cumulativeCashFlow
        };
      });

      // Payment Methods
      const paymentMethods = {};
      filteredInvoices.forEach((invoice) => {
        const method = invoice.paymentMethod || "UNKNOWN";
        const displayName = {
          "CASH": t("finance.paymentMethods.cash", "Tiền mặt"),
          "BANK_TRANSFER": t("finance.paymentMethods.bankTransfer", "Chuyển khoản"),
          "CREDIT_CARD": t("finance.paymentMethods.creditCard", "Thẻ tín dụng"),
          "MOMO": t("finance.paymentMethods.momo", "Ví MoMo"),
          "ZALO_PAY": t("finance.paymentMethods.zaloPay", "Ví ZaloPay"),
          "UNKNOWN": t("finance.paymentMethods.unknown", "Khác")
        }[method] || method;
        
        const amount = Number(invoice.totalPrice || 0);
        
        if (!paymentMethods[displayName]) {
          paymentMethods[displayName] = {
            name: displayName,
            originalName: method,
            value: 0,
            count: 0
          };
        }
        
        paymentMethods[displayName].value += amount;
        paymentMethods[displayName].count += 1;
      });

      const paymentMethodsData = Object.values(paymentMethods).map(pm => ({
        ...pm,
        percentage: totalRevenue > 0 ? (pm.value / totalRevenue) * 100 : 0
      }));

      // Category Cash Flow
      const categoryMap = {};
      products.forEach((p) => {
        if (p.barcode && p.categoryName) {
          categoryMap[p.barcode] = p.categoryName;
        }
      });

      const categoryCashFlow = {};
      
      filteredInvoices.forEach((invoice) => {
        (invoice.orderItemDTOs || []).forEach((item) => {
          const category = categoryMap[item.barcode] || t("category.other", "Khác");
          const revenue = item.subTotal || 
            (Number(item.price || 0) * Number(item.quantity || 0));
          
          if (!categoryCashFlow[category]) {
            categoryCashFlow[category] = {
              category,
              revenue: 0,
              cost: 0,
              cashFlow: 0
            };
          }
          
          categoryCashFlow[category].revenue += revenue;
          categoryCashFlow[category].cashFlow += revenue;
        });
      });

      filteredImportOrders.forEach((importOrder) => {
        (importOrder.details || []).forEach((item) => {
          const category = categoryMap[item.productBarcode] || t("category.other", "Khác");
          const cost = item.subTotal || 
            (Number(item.importPrice || 0) * Number(item.quantity || 0));
          
          if (!categoryCashFlow[category]) {
            categoryCashFlow[category] = {
              category,
              revenue: 0,
              cost: 0,
              cashFlow: 0
            };
          }
          
          categoryCashFlow[category].cost += cost;
          categoryCashFlow[category].cashFlow -= cost;
        });
      });

      const categoryData = Object.values(categoryCashFlow)
        .sort((a, b) => Math.abs(b.cashFlow) - Math.abs(a.cashFlow))
        .slice(0, 10);

      setChartData({
        dailyCashFlow,
        paymentMethods: paymentMethodsData,
        categoryCashFlow: categoryData,
        cashFlowTrend
      });

      // Transaction List
      const transactionList = [];

      filteredInvoices.forEach((inv, index) => {
        transactionList.push({
          id: `SALE-${inv.orderId || index + 1}`,
          date: inv.createdAt,
          type: "SALE",
          typeDisplay: t("finance.transactionTypes.sale", "Bán hàng"),
          code: inv.orderId || `INV-${index + 1}`,
          partner: inv.customerId === "default_customer_id" 
            ? t("customer.walkIn", "Khách lẻ")
            : customers.find(c => c.id === inv.customerId)?.name || `Khách #${inv.customerId?.substring(0, 6)}`,
          note: "",
          amount: Number(inv.totalPrice || 0),
          isIncome: true
        });
      });

      filteredImportOrders.forEach((imp, index) => {
        transactionList.push({
          id: `IMPORT-${imp.importProductId || index + 1}`,
          date: imp.createdAt,
          type: "IMPORT",
          typeDisplay: t("finance.transactionTypes.import", "Nhập hàng"),
          code: imp.importCode || `IMP-${index + 1}`,
          partner: imp.supplierName || t("finance.supplier", "Nhà cung cấp"),
          note: imp.note || "",
          amount: Number(imp.totalAmount || 0),
          isIncome: false
        });
      });

      transactionList.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(transactionList);

    } catch (err) {
      console.error("Finance dashboard fetch failed:", err);
      setError(t("finance.fetchError", "Không tải được dữ liệu tài chính"));
    } finally {
      setLoading(false);
    }
  };

  // ===== AUTO-HIDE MESSAGES =====
  useEffect(() => {
    if (!message && !error) return undefined;
    const timer = setTimeout(() => {
      setMessage("");
      setError("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, error]);

  // ===== REFRESH DATA WHEN DATE FILTERS CHANGE =====
  useEffect(() => {
    const filters = getCurrentFilters();
    if (activeTab === "overview" || activeTab === "transactions") {
      fetchDashboardData(filters.startDate, filters.endDate);
    }
  }, [activeTab, overviewStartDate, overviewEndDate, transactionsStartDate, transactionsEndDate]);

  // ===== FILTER SEARCH =====
  const filtered = transactions.filter((x) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      x.code.toLowerCase().includes(q) ||
      x.partner.toLowerCase().includes(q) ||
      x.typeDisplay.toLowerCase().includes(q) ||
      formatters.date.toDisplay(x.date).toLowerCase().includes(q)
    );
  });

  const currentRows = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const rowsSelectValue = rowsPerPage > 100 ? "all" : rowsPerPage;

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(value === "all" ? Number.MAX_SAFE_INTEGER : Number(value));
    setCurrentPage(1);
  };

  // ===== EXPORT CSV =====
  const exportCSV = () => {
    const currentFilters = getCurrentFilters();
    const rows = [
      [
        t("finance.accounting.date", "Ngày"),
        t("finance.accounting.type", "Loại"),
        t("finance.accounting.code", "Mã"),
        t("finance.accounting.partner", "Đối tác"),
        t("finance.accounting.amount", "Số tiền"),
        t("finance.accounting.note", "Ghi chú"),
        t("finance.cashFlowDirection", "Dòng tiền")
      ],
      ...filtered.map((x) => [
        formatters.date.toDisplay(x.date),
        x.typeDisplay,
        x.code,
        x.partner,
        x.amount,
        x.note,
        x.isIncome ? t("finance.income", "Thu") : t("finance.expense", "Chi")
      ]),
    ];

    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cash_flow_${currentFilters.startDate}_${currentFilters.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    setMessage(t("finance.exportSuccess", "Xuất CSV thành công!"));
  };

  // ===== CHART COLORS =====
  const CHART_COLORS = {
    primary: "#3b82f6",
    secondary: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
    light: "#e5e7eb",
    income: "#10b981",
    expense: "#ef4444",
    net: "#3b82f6"
  };

  // ===== CUSTOM TOOLTIP =====
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="fw-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="mb-1" style={{ color: entry.color }}>
              {entry.name}: {entry.dataKey === 'revenue' || entry.dataKey === 'importCost' || entry.dataKey === 'cashFlow' 
                ? formatCurrency(entry.value) 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // ===== TAX PERIOD UTILITIES =====
  const getTaxPeriodRange = (period) => {
    const now = new Date();
    let startDate, endDate;
    
    switch(period) {
      case "MONTH":
        // Tháng hiện tại
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "QUARTER":
        // Quý hiện tại
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
        break;
      case "YEAR":
        // Năm hiện tại
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date();
        endDate = new Date();
    }
    
    return {
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10)
    };
  };

  // Xử lý khi thay đổi kỳ tính thuế
  const handleTaxPeriodChange = (e) => {
    const newPeriod = e.target.value;
    setTaxPeriod(newPeriod);
    
    // Cập nhật ngày tự động theo kỳ
    const range = getTaxPeriodRange(newPeriod);
    setTaxStartDate(range.startDate);
    setTaxEndDate(range.endDate);
  };

  // ===== RENDER =====
  return (
    <MainLayout>
      <div className="container-fluid py-3 px-4">
        {/* ===== HEADER ===== */}
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
          <h4 className={`fw-bold  mb-0 text-nowrap`}>
            {t("finance.title", "Tài chính & Kế toán")}
          </h4>

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
                placeholder={t("finance.searchPlaceholder", "Tìm kiếm giao dịch, mã đơn, đối tác...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ height: 40, paddingLeft: 40 }}
              />
            </div>
          </div>

          <button
            className={`btn btn-${theme} text-white fw-semibold d-flex align-items-center rounded-3 px-3 order-2 order-md-3`}
            style={{ height: 40 }}
            onClick={exportCSV}
          >
            <i className="bi bi-download me-1" />
            <span className="d-none d-sm-inline">
              {t("finance.exportCSV", "Xuất CSV")}
            </span>
          </button>
        </div>

        {/* ===== ALERTS ===== */}
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

        {/* ===== TABS ===== */}
        <div className="mb-4">
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn btn-outline-${theme} py-2 ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <i className="bi bi-bar-chart me-2"></i>
              {t("finance.tabs.overview", "Tổng quan")}
            </button>
            <button
              type="button"
              className={`btn btn-outline-${theme} py-2 ${activeTab === "tax-calculator" ? "active" : ""}`}
              onClick={() => setActiveTab("tax-calculator")}
            >
              <i className="bi bi-calculator me-2"></i>
              {t("finance.tabs.taxCalculator", "Tính thuế")}
            </button>
            <button
              type="button"
              className={`btn btn-outline-${theme} py-2 ${activeTab === "transactions" ? "active" : ""}`}
              onClick={() => setActiveTab("transactions")}
            >
              <i className="bi bi-receipt me-2"></i>
              {t("finance.tabs.transactions", "Giao dịch")}
            </button>
          </div>
        </div>

        {/* =========================
            TAB 1: TỔNG QUAN
        ========================== */}
        {activeTab === "overview" && (
          <>
            {/* Date Filter for Overview Tab */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-3">
                <div className="row g-2">
                  <div className="col-md-3">
                    <label className="form-label small mb-1">
                      <i className="bi bi-calendar3 me-1"></i>
                      {t("finance.accounting.fromDate", "Từ ngày")}
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={overviewStartDate}
                      onChange={(e) => {
                        setOverviewStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-1">
                      <i className="bi bi-calendar3 me-1"></i>
                      {t("finance.accounting.toDate", "Đến ngày")}
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={overviewEndDate}
                      onChange={(e) => {
                        setOverviewEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
              {[
                {
                  label: t("finance.accounting.revenue", "Doanh thu"),
                  value: formatCurrency(summary.revenue),
                  icon: "bi-cash-coin",
                  color: "success",
                  description: t("finance.summary.revenueDesc", "Tổng doanh thu bán hàng"),
                  badge: `${summary.invoicesCount} ${t("finance.orders", "đơn")}`
                },
                {
                  label: t("finance.importCost", "Chi phí nhập"),
                  value: formatCurrency(summary.cost),
                  icon: "bi-box-seam",
                  color: "danger",
                  description: t("finance.summary.importCostDesc", "Tổng chi phí nhập hàng"),
                  badge: `${summary.importOrdersCount} ${t("finance.imports", "đơn nhập")}`
                },
                {
                  label: t("finance.cashFlow", "Dòng tiền ròng"),
                  value: formatCurrency(summary.totalCashFlow),
                  icon: "bi-arrow-left-right",
                  color: summary.totalCashFlow >= 0 ? "primary" : "danger",
                  description: t("finance.summary.cashFlowDesc", "Doanh thu - Chi phí"),
                  badge: `${summary.profitMargin.toFixed(1)}%`
                },
                {
                  label: t("finance.transactionCount", "Tổng giao dịch"),
                  value: summary.invoicesCount + summary.importOrdersCount,
                  icon: "bi-receipt",
                  color: "info",
                  description: t("finance.summary.transactionDesc", "Số lượng giao dịch"),
                  badge: ""
                }
              ].map((card, index) => (
                <div key={index} className="col-12 col-sm-6 col-lg-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-start">
                        <div className="me-3">
                          <i className={`bi ${card.icon} fs-3 text-${card.color}`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="text-muted small mb-1">{card.label}</div>
                          <div className={`fw-bold fs-4 text-${card.color}`}>
                            {card.value}
                          </div>
                          <div className="small text-muted mt-1">{card.description}</div>
                          {card.badge && (
                            <span className={`badge bg-${card.color}-subtle text-${card.color} mt-2`}>
                              {card.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="row g-3 mb-4">
              {/* Daily Cash Flow */}
              <div className="col-12 col-lg-8">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-0 p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="fw-bold mb-0">
                        <i className="bi bi-arrow-left-right me-2"></i>
                        {t("finance.charts.dailyCashFlow", "Dòng tiền hàng ngày")}
                      </h5>
                      <div className="text-muted small">
                        <span className="text-success me-3">
                          {formatCurrency(summary.revenue)} {t("finance.charts.in", "Thu")}
                        </span>
                        <span className="text-danger me-3">
                          {formatCurrency(summary.cost)} {t("finance.charts.out", "Chi")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card-body p-3">
                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary"></div>
                        <p className="text-muted mt-2">{t("common.loading", "Đang tải...")}</p>
                      </div>
                    ) : chartData.dailyCashFlow.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData.dailyCashFlow}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.light} />
                          <XAxis 
                            dataKey="displayDate" 
                            fontSize={12}
                          />
                          <YAxis 
                            tickFormatter={(value) => formatCurrency(value).replace('₫', '')}
                            fontSize={12}
                          />
                          <Tooltip 
                            content={<CustomTooltip />}
                            formatter={(value) => [formatCurrency(value), t("finance.charts.value", "Giá trị")]}
                          />
                          <Legend />
                          <Area 
                            name={t("finance.charts.revenue", "Doanh thu")}
                            type="monotone" 
                            dataKey="revenue" 
                            stroke={CHART_COLORS.income} 
                            fill={CHART_COLORS.income}
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                          <Area 
                            name={t("finance.charts.importCost", "Chi phí nhập")}
                            type="monotone" 
                            dataKey="importCost" 
                            stroke={CHART_COLORS.expense} 
                            fill={CHART_COLORS.expense}
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-muted text-center py-5">
                        <i className="bi bi-bar-chart fs-1 mb-3"></i>
                        <p>{t("common.noData", "Không có dữ liệu")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="col-12 col-lg-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-0 p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="fw-bold mb-0">
                        <i className="bi bi-credit-card me-2"></i>
                        {t("finance.charts.paymentMethods", "Phương thức thanh toán")}
                      </h5>
                    </div>
                  </div>
                  <div className="card-body p-3">
                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary"></div>
                        <p className="text-muted mt-2">{t("common.loading", "Đang tải...")}</p>
                      </div>
                    ) : chartData.paymentMethods.length > 0 ? (
                      <div className="h-100 d-flex flex-column justify-content-center">
                        {chartData.paymentMethods.map((pm, index) => (
                          <div key={pm.name} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <div className="d-flex align-items-center">
                                <div className="rounded-circle me-2" 
                                  style={{
                                    width: 12,
                                    height: 12,
                                    backgroundColor: CHART_COLORS.primary
                                  }}
                                />
                                <span className="small fw-semibold">{pm.name}</span>
                              </div>
                              <span className="small">
                                {formatCurrency(pm.value)}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between small text-muted">
                              <span>{pm.count} {t("finance.charts.orders", "đơn")}</span>
                              <span>{pm.percentage.toFixed(1)}%</span>
                            </div>
                            <div className="progress" style={{ height: 6 }}>
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{ 
                                  width: `${pm.percentage}%`,
                                  backgroundColor: CHART_COLORS.primary
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted text-center py-5">
                        <i className="bi bi-pie-chart fs-1 mb-3"></i>
                        <p>{t("common.noData", "Không có dữ liệu")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Cash Flow */}
            <div className="row g-3">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="fw-bold mb-0">
                        <i className="bi bi-tags me-2"></i>
                        {t("finance.charts.categoryCashFlow", "Dòng tiền theo danh mục")}
                      </h5>
                    </div>
                  </div>
                  <div className="card-body p-3">
                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary"></div>
                        <p className="text-muted mt-2">{t("common.loading", "Đang tải...")}</p>
                      </div>
                    ) : chartData.categoryCashFlow.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                          data={chartData.categoryCashFlow}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.light} />
                          <XAxis 
                            dataKey="category"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            fontSize={12}
                          />
                          <YAxis 
                            tickFormatter={(value) => formatCurrency(value).replace('₫', '')}
                            fontSize={12}
                          />
                          <Tooltip 
                            formatter={(value, name) => {
                              const formattedValue = formatCurrency(value);
                              const label = name === 'cashFlow' ? t('finance.charts.cashFlow', 'Dòng tiền') : 
                                           name === 'revenue' ? t('finance.charts.revenue', 'Doanh thu') : 
                                           t('finance.charts.importCost', 'Chi phí nhập');
                              return [formattedValue, label];
                            }}
                          />
                          <Legend />
                          <Bar 
                            name={t("finance.charts.revenue", "Doanh thu")}
                            dataKey="revenue" 
                            fill={CHART_COLORS.income} 
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            name={t("finance.charts.importCost", "Chi phí nhập")}
                            dataKey="cost" 
                            fill={CHART_COLORS.expense} 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-muted text-center py-5">
                        <i className="bi bi-tags fs-1 mb-3"></i>
                        <p>{t("common.noData", "Không có dữ liệu")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =========================
            TAB 2: TÍNH THUẾ
        ========================== */}
        {activeTab === "tax-calculator" && (
          <div className="row g-3">
            <div className="col-12 col-xl-8">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white border-0 p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">
                      {t("finance.taxCalculator.title", "Tính thuế phải nộp")}
                    </h5>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small">
                        {t("finance.taxCalculator.period", "Kỳ tính thuế")}:
                      </span>
                      <select
                        className={`form-select form-select-sm border-${theme}`}
                        value={taxPeriod}
                        onChange={handleTaxPeriodChange}
                        style={{ minWidth: 130 }}
                      >
                        <option value="MONTH">{t("finance.taxCalculator.monthly", "Hàng tháng")}</option>
                        <option value="QUARTER">{t("finance.taxCalculator.quarterly", "Hàng quý")}</option>
                        <option value="YEAR">{t("finance.taxCalculator.yearly", "Hàng năm")}</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Date Filter for Tax Calculator Tab */}
                <div className="card-body p-3 border-bottom">
                  <div className="row g-2 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label small mb-1">
                        <i className="bi bi-calendar3 me-1"></i>
                        {t("finance.accounting.fromDate", "Từ ngày")}
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={taxStartDate}
                        onChange={(e) => setTaxStartDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small mb-1">
                        <i className="bi bi-calendar3 me-1"></i>
                        {t("finance.accounting.toDate", "Đến ngày")}
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={taxEndDate}
                        onChange={(e) => setTaxEndDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                      <button 
                        className="btn btn-sm btn-primary w-100"
                        onClick={() => fetchDashboardData(taxStartDate, taxEndDate)}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            {t("common.loading", "Đang tải...")}
                          </>
                        ) : (
                          <>
                            <i className="bi bi-calculator me-2"></i>
                            {t("finance.taxCalculator.calculateFromPeriod", "Tính thuế từ kỳ")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Hiển thị phạm vi ngày tương ứng với kỳ */}
                  <div className="mt-2">
                    <div className="alert alert-light py-2 mb-0">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-calendar-check text-primary me-2"></i>
                        <div>
                          <span className="small text-muted">Kỳ hiện tại: </span>
                          <strong className="text-dark">
                            {taxPeriod === "MONTH" 
                              ? t("finance.taxCalculator.monthly", "Hàng tháng")
                              : taxPeriod === "QUARTER"
                              ? t("finance.taxCalculator.quarterly", "Hàng quý")
                              : t("finance.taxCalculator.yearly", "Hàng năm")}
                          </strong>
                          <span className="text-muted mx-2">•</span>
                          <span className="small">
                            {formatters.date.toDisplay(taxStartDate)} → {formatters.date.toDisplay(taxEndDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-body p-3">
                  <div className="alert alert-info mb-4">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>{t("finance.taxCalculator.vatCreditOnly", "Phương pháp khấu trừ")}</strong><br/>
                    {t("finance.taxCalculator.vatCreditDesc", "Chỉ áp dụng phương pháp khấu trừ thuế GTGT")}
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        {t("finance.taxCalculator.revenue", "Doanh thu kỳ")}
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          value={taxRevenue}
                          min={0}
                          onChange={(e) => setTaxRevenue(Number(e.target.value))}
                          placeholder={t("finance.taxCalculator.revenuePlaceholder", "Nhập doanh thu")}
                        />
                        <span className="input-group-text">
                          {t("common.currency", "VNĐ")}
                        </span>
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setTaxRevenue(summary.revenue)}
                        >
                          {t("finance.taxCalculator.useCurrent", "Dùng hiện tại")}
                        </button>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        {t("finance.taxCalculator.inputVat", "Thuế VAT đầu vào")}
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          value={inputVat}
                          min={0}
                          onChange={(e) => setInputVat(Number(e.target.value))}
                          placeholder={t("finance.taxCalculator.inputVatPlaceholder", "Nhập VAT đầu vào")}
                        />
                        <span className="input-group-text">
                          {t("common.currency", "VNĐ")}
                        </span>
                      </div>
                      <small className="text-muted d-block mt-1">
                        {t("finance.taxCalculator.inputVatDesc", "Thuế VAT đã trả khi mua hàng")}
                      </small>
                    </div>
                  </div>

                  {/* Thông tin ước tính */}
                  <div className="mt-4">
                    <div className="alert alert-light">
                      <div className="row">
                        <div className="col-6">
                          <div className="small text-muted">
                            {t("finance.taxCalculator.yearlyEstimateLabel", "Doanh thu ước tính năm")}
                          </div>
                          <div className="fw-bold">
                            {formatCurrency(yearlyRevenueEstimate)} {t("common.currency", "VNĐ")}
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="small text-muted">
                            {t("finance.taxCalculator.taxFreeThreshold", "Ngưỡng miễn thuế")}
                          </div>
                          <div className="fw-bold text-success">
                            {formatCurrency(TAX_CONFIG.minRevenue)} {t("common.currency", "VNĐ")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kết quả tính thuế */}
                  <div className="row g-3 mt-4">
                    <div className="col-12 col-md-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="text-muted small">{t("finance.taxCalculator.vatAmount", "Thuế GTGT")}</div>
                            <span className="badge bg-primary text-white">
                              {TAX_CONFIG.vatRate}%
                            </span>
                          </div>
                          <div className={`fw-bold fs-4 ${isAboveThreshold ? "text-dark" : "text-muted"}`}>
                            {formatCurrency(taxResult.vatAmount)} {t("common.currency", "VNĐ")}
                          </div>
                          {isAboveThreshold && taxResult.vatAmount > 0 && (
                            <div className="small text-muted mt-2">
                              {formatCurrency(taxResult.outputVat)} - {formatCurrency(taxResult.inputVat)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="text-muted small">{t("finance.taxCalculator.pitAmount", "Thuế TNCN")}</div>
                            <span className="badge bg-info text-white">{TAX_CONFIG.pitRate}%</span>
                          </div>
                          <div className={`fw-bold fs-4 ${isAboveThreshold ? "text-dark" : "text-muted"}`}>
                            {formatCurrency(taxResult.pitAmount)} {t("common.currency", "VNĐ")}
                          </div>
                          {isAboveThreshold && taxResult.pitAmount > 0 && (
                            <div className="small text-muted mt-2">
                              {formatCurrency(taxResult.taxableRevenue)} × {TAX_CONFIG.pitRate}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="text-muted small">{t("finance.taxCalculator.totalTax", "Tổng thuế phải nộp")}</div>
                          <div className="fw-bold fs-4 text-danger">
                            {formatCurrency(taxResult.totalTax)} {t("common.currency", "VNĐ")}
                          </div>
                          <div className="text-muted small mt-2">
                            {t("finance.taxCalculator.effectiveRate", "Tỷ lệ thuế hiệu dụng")} <strong>{effectiveRate.toFixed(2)}%</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thông báo miễn thuế */}
                  {taxRevenue > 0 && !isAboveThreshold && (
                    <div className="alert alert-success mt-4">
                      <div className="d-flex">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        <div>
                          <strong>{t("finance.taxCalculator.taxExemption", "Được miễn thuế")}:</strong>{" "}
                          {t("finance.taxCalculator.exemptionDetails", { 
                            amount: formatCurrency(yearlyRevenueEstimate),
                            threshold: formatCurrency(TAX_CONFIG.minRevenue)
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="alert alert-warning mt-4 mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {t("finance.taxCalculator.disclaimer", "Lưu ý: Đây là ước tính dựa trên quy định hiện hành. Vui lòng tham khảo ý kiến chuyên gia thuế để có kết quả chính xác.")}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-4">
              {/* Hướng dẫn nhanh */}
              <div className="card shadow-sm border-0 mb-3">
                <div className="card-header bg-white border-0 p-3">
                  <h6 className="fw-semibold mb-0">
                    {t("finance.taxCalculator.guideTitle", "Hướng dẫn tính thuế")}
                  </h6>
                </div>
                <div className="card-body p-3">
                  <ol className="mb-0 ps-3">
                    <li className="mb-2">{t("finance.taxCalculator.guideStep1", "Chọn kỳ tính thuế: Tháng/Quý/Năm")}</li>
                    <li className="mb-2">{t("finance.taxCalculator.guideStep2", "Hệ thống tự động điền ngày bắt đầu và kết thúc")}</li>
                    <li className="mb-2">{t("finance.taxCalculator.guideStep3", "Nhấn 'Tính thuế từ kỳ' để lấy doanh thu")}</li>
                    <li>{t("finance.taxCalculator.guideStep4", "Nhập thuế VAT đầu vào (nếu có) để tính thuế phải nộp")}</li>
                  </ol>
                </div>
              </div>
              
              {/* Lịch kê khai */}
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-0 p-3">
                  <h6 className="fw-semibold mb-0">
                    {t("finance.taxCalendar.title", "Lịch kê khai thuế")}
                  </h6>
                </div>
                <div className="card-body p-3">
                  <div className="list-group list-group-flush">
                    <div className="list-group-item px-0 border-0">
                      <div className="d-flex justify-content-between">
                        <strong>{t("finance.taxCalendar.q1", "Quý I")}</strong>
                        <span className="text-muted">{t("finance.taxCalendar.q1Deadline", "30/04")}</span>
                      </div>
                    </div>
                    <div className="list-group-item px-0">
                      <div className="d-flex justify-content-between">
                        <strong>{t("finance.taxCalendar.q2", "Quý II")}</strong>
                        <span className="text-muted">{t("finance.taxCalendar.q2Deadline", "30/07")}</span>
                      </div>
                    </div>
                    <div className="list-group-item px-0">
                      <div className="d-flex justify-content-between">
                        <strong>{t("finance.taxCalendar.q3", "Quý III")}</strong>
                        <span className="text-muted">{t("finance.taxCalendar.q3Deadline", "30/10")}</span>
                      </div>
                    </div>
                    <div className="list-group-item px-0">
                      <div className="d-flex justify-content-between">
                        <strong>{t("finance.taxCalendar.q4", "Quý IV")}</strong>
                        <span className="text-muted">{t("finance.taxCalendar.q4Deadline", "30/01 năm sau")}</span>
                      </div>
                    </div>
                    <div className="list-group-item px-0 border-top mt-2 pt-3">
                      <div className="d-flex justify-content-between">
                        <strong>{t("finance.taxCalendar.annualSettlement", "Quyết toán năm")}</strong>
                        <span className="text-danger fw-semibold">{t("finance.taxCalendar.annualDeadline", "31/03 năm sau")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================
            TAB 3: GIAO DỊCH
        ========================== */}
        {activeTab === "transactions" && (
          <>
            {/* Filter Card */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-3">
                <div className="row align-items-center g-3">
                  <div className="col-12 col-md-6">
                    <div className="row g-2">
                      <div className="col">
                        <label className="form-label small mb-1">
                          <i className="bi bi-calendar3 me-1"></i>
                          {t("finance.accounting.fromDate", "Từ ngày")}
                        </label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={transactionsStartDate}
                          onChange={(e) => {
                            setTransactionsStartDate(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </div>
                      <div className="col">
                        <label className="form-label small mb-1">
                          <i className="bi bi-calendar3 me-1"></i>
                          {t("finance.accounting.toDate", "Đến ngày")}
                        </label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={transactionsEndDate}
                          onChange={(e) => {
                            setTransactionsEndDate(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6 d-flex justify-content-end">
                    <div className="d-flex gap-2">
                      <span className="badge bg-success align-self-center">
                        {filtered.filter(t => t.isIncome).length} {t("finance.income", "Thu")}
                      </span>
                      <span className="badge bg-danger align-self-center">
                        {filtered.filter(t => !t.isIncome).length} {t("finance.expense", "Chi")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-0 p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">
                    {t("finance.tabs.transactions", "Giao dịch")}
                  </h5>
                  <span className="badge bg-light text-dark border">
                    {filtered.length} {t("finance.accounting.records", "bản ghi")}
                  </span>
                </div>
              </div>
              
              <div className="card-body p-3">
                <div className="table-responsive rounded-3">
                  <table className="table table-hover align-middle mb-0">
                    <thead className={`table-${theme}`}>
                      <tr>
                        <th>#</th>
                        <th>{t("finance.accounting.date", "Ngày")}</th>
                        <th>{t("finance.accounting.type", "Loại")}</th>
                        <th>{t("finance.accounting.code", "Mã")}</th>
                        <th>{t("finance.accounting.partner", "Đối tác")}</th>
                        <th className="text-end">{t("finance.accounting.amount", "Số tiền")}</th>
                        <th>{t("finance.cashFlowDirection", "Dòng tiền")}</th>
                        <th>{t("finance.accounting.note", "Ghi chú")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="text-center py-4">
                            <div className="spinner-border text-primary" role="status" />
                          </td>
                        </tr>
                      ) : currentRows.length > 0 ? (
                        currentRows.map((x, idx) => (
                          <tr key={x.id}>
                            <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                            <td>{formatters.date.toDisplay(x.date)}</td>
                            <td>
                              <span
                                className={`badge ${
                                  x.type === "SALE"
                                    ? "bg-success"
                                    : x.type === "IMPORT"
                                    ? "bg-warning text-dark"
                                    : "bg-secondary"
                                }`}
                              >
                                {x.typeDisplay}
                              </span>
                            </td>
                            <td>{x.code}</td>
                            <td>{x.partner}</td>
                            <td className={`text-end fw-semibold ${x.isIncome ? 'text-success' : 'text-danger'}`}>
                              {x.isIncome ? '+' : '-'} {formatCurrency(x.amount)}
                            </td>
                            <td>
                              <span className={`badge ${x.isIncome ? 'bg-success' : 'bg-danger'}`}>
                                {x.isIncome ? t("finance.income", "Thu") : t("finance.expense", "Chi")}
                              </span>
                            </td>
                            <td>{x.note}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center text-muted py-4">
                            <i className="bi bi-receipt fs-1 mb-2"></i>
                            <p>{t("finance.accounting.noData", "Không có giao dịch")}</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {currentRows.length > 0 && (
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan={5} className="text-end fw-bold">
                            {t("finance.totalCashFlow", "Tổng dòng tiền ròng")}:
                          </td>
                          <td className={`text-end fw-bold ${summary.totalCashFlow >= 0 ? 'text-success' : 'text-danger'}`}>
                            {summary.totalCashFlow >= 0 ? '+' : ''} {formatCurrency(summary.totalCashFlow)}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-3">
                  <TablePagination
                    currentPage={currentPage}
                    totalItems={filtered.length}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[15, 30, 50, 100]}
                    rowsPerPageValue={rowsSelectValue}
                    onPageChange={setCurrentPage}
                    onRowsPerPageChange={handleRowsPerPageChange}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}