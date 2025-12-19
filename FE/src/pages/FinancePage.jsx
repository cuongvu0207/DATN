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
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function FinancePage() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const token = localStorage.getItem("accessToken");

  // ===== TAB STATE =====
  const [activeTab, setActiveTab] = useState("overview");

  // ===== DATE FILTERS =====
  const todayISO = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayISO);
  const [endDate, setEndDate] = useState(todayISO);

  // ===== DASHBOARD DATA =====
  const [summary, setSummary] = useState({
    revenue: 0,
    cost: 0,
    profit: 0,
    invoicesCount: 0,
    averageOrderValue: 0,
    profitMargin: 0
  });

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // ===== CHART DATA =====
  const [chartData, setChartData] = useState({
    dailyRevenue: [],
    paymentMethods: [],
    categoryRevenue: []
  });

  // ===== TAX CALCULATOR STATE =====
  const [taxPeriod, setTaxPeriod] = useState("QUARTER"); // MONTH | QUARTER | YEAR
  const [taxRevenue, setTaxRevenue] = useState(0);
  const [inputVat, setInputVat] = useState(0); // Thuế VAT đầu vào
  const [vatMethod, setVatMethod] = useState("credit"); // Chỉ còn phương pháp khấu trừ

  // Cấu hình thuế - Chỉ giữ lại phương pháp khấu trừ
  const TAX_CONFIG = {
    industry: t("finance.industry.groceryStationery"),
    minRevenue: 500000000, // 500 triệu VNĐ - ngưỡng miễn thuế
    vatRate: 8,    // 8% GTGT phương pháp khấu trừ
    pitRate: 1.5,  // 1.5% TNCN
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

  // Hàm tính thuế - CHỈ CÒN PHƯƠNG PHÁP KHẤU TRỪ
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
    
    // Tính thuế VAT theo phương pháp khấu trừ
    const outputVat = taxableRevenue * (TAX_CONFIG.vatRate / 100);
    const vatToPay = Math.max(0, outputVat - inputVat); // Chỉ nộp nếu dương
    const vatAmount = vatToPay;
    
    // Thuế TNCN
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

  // ===== FETCH DASHBOARD DATA (giống trang Home) =====
  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      // Gọi API hóa đơn và sản phẩm giống trang Home
      const [invoicesRes, productsRes, customersRes] = await Promise.all([
        axiosInstance.get("/order/static/allCompleted"),
        axiosInstance.get("/inventory/products"),
        axiosInstance.get("/customer")
      ]);

      const allInvoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
      const products = Array.isArray(productsRes.data) ? productsRes.data : [];
      const customers = Array.isArray(customersRes.data) ? customersRes.data : [];

      // Lọc hóa đơn theo khoảng thời gian
      const fromDate = new Date(startDate);
      const toDate = new Date(endDate);
      toDate.setHours(23, 59, 59, 999);

      const filteredInvoices = allInvoices.filter((inv) => {
        const invoiceDate = new Date(inv.createdAt);
        return invoiceDate >= fromDate && invoiceDate <= toDate;
      });

      // Tính toán summary
      const totalRevenue = filteredInvoices.reduce(
        (sum, inv) => sum + Number(inv.totalPrice || 0), 
        0
      );

      // Tạo map giá vốn từ sản phẩm
      const costMap = {};
      products.forEach((p) => {
        if (p.barcode) {
          costMap[p.barcode] = Number(p.costOfCapital || p.costPrice || 0);
        }
      });

      let totalCost = 0;
      filteredInvoices.forEach((invoice) => {
        (invoice.orderItemDTOs || []).forEach((item) => {
          const barcode = item.barcode;
          const qty = Number(item.quantity || 0);
          const unitCost = costMap[barcode] ?? 0;
          totalCost += qty * unitCost;
        });
      });

      const totalProfit = totalRevenue - totalCost;
      const totalOrders = filteredInvoices.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      setSummary({
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalProfit,
        invoicesCount: totalOrders,
        averageOrderValue,
        profitMargin
      });

      // Chuẩn bị dữ liệu cho biểu đồ
      // 1. Doanh thu hàng ngày
      const dailyData = {};
      filteredInvoices.forEach((invoice) => {
        const date = new Date(invoice.createdAt);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            date: dateKey,
            displayDate: formatters.date.toDisplay(dateKey),
            revenue: 0,
            invoices: 0
          };
        }
        
        dailyData[dateKey].revenue += Number(invoice.totalPrice || 0);
        dailyData[dateKey].invoices += 1;
      });

      const dailyRevenue = Object.values(dailyData)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // 2. Phương thức thanh toán
      const paymentMethods = {};
      filteredInvoices.forEach((invoice) => {
        const method = invoice.paymentMethod || "UNKNOWN";
        const amount = Number(invoice.totalPrice || 0);
        
        if (!paymentMethods[method]) {
          paymentMethods[method] = {
            name: method,
            value: 0,
            count: 0
          };
        }
        
        paymentMethods[method].value += amount;
        paymentMethods[method].count += 1;
      });

      const paymentMethodsData = Object.values(paymentMethods).map(pm => ({
        ...pm,
        percentage: totalRevenue > 0 ? (pm.value / totalRevenue) * 100 : 0
      }));

      // 3. Doanh thu theo danh mục
      const categoryMap = {};
      products.forEach((p) => {
        if (p.barcode && p.categoryName) {
          categoryMap[p.barcode] = p.categoryName;
        }
      });

      const categoryRevenue = {};
      filteredInvoices.forEach((invoice) => {
        (invoice.orderItemDTOs || []).forEach((item) => {
          const category = categoryMap[item.barcode] || t("category.other", "Khác");
          const revenue = item.subTotal || 
            (Number(item.price || 0) * Number(item.quantity || 0));
          
          if (!categoryRevenue[category]) {
            categoryRevenue[category] = {
              category,
              revenue: 0,
              items: 0
            };
          }
          
          categoryRevenue[category].revenue += revenue;
          categoryRevenue[category].items += Number(item.quantity || 0);
        });
      });

      const categoryData = Object.values(categoryRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setChartData({
        dailyRevenue,
        paymentMethods: paymentMethodsData,
        categoryRevenue: categoryData
      });

      // Chuẩn bị dữ liệu giao dịch
      const transactionList = filteredInvoices.map((inv, index) => ({
        id: inv.orderId || index + 1,
        date: inv.createdAt,
        type: "SALE",
        code: inv.orderId || `INV-${index + 1}`,
        partner: inv.customerId === "default_customer_id" 
          ? t("customer.walkIn", "Khách lẻ")
          : customers.find(c => c.id === inv.customerId)?.name || `Khách #${inv.customerId?.substring(0, 6)}`,
        note: "",
        amount: Number(inv.totalPrice || 0)
      }));

      setTransactions(transactionList);

      // Cập nhật tax calculator với doanh thu hiện tại
      setTaxRevenue(totalRevenue);

    } catch (err) {
      console.error("Finance dashboard fetch failed:", err);
      setError(t("finance.fetchError", "Không tải được dữ liệu tài chính"));
    } finally {
      setLoading(false);
    }
  };

  // ===== REFRESH KHI DATE HOẶC TAB THAY ĐỔI =====
  useEffect(() => {
    if (activeTab === "overview" || activeTab === "transactions") {
      fetchDashboardData();
    }
  }, [startDate, endDate, activeTab]);

  // ===== FILTER SEARCH =====
  const filtered = transactions.filter((x) => {
    const q = query.toLowerCase();
    return (
      x.code.toLowerCase().includes(q) ||
      x.partner.toLowerCase().includes(q) ||
      x.type.toLowerCase().includes(q) ||
      formatters.date.toDisplay(x.date).includes(q)
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
    const rows = [
      ["Date", "Type", "Code", "Partner", "Amount", "Note"],
      ...filtered.map((x) => [
        formatters.date.toDisplay(x.date),
        x.type,
        x.code,
        x.partner,
        x.amount,
        x.note,
      ]),
    ];

    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== CHART COLORS =====
  const CHART_COLORS = {
    primary: "#3b82f6",
    secondary: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
    light: "#e5e7eb"
  };

  // ===== CUSTOM TOOLTIP =====
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="fw-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="mb-1" style={{ color: entry.color }}>
              {entry.name}: {entry.dataKey === 'revenue' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <MainLayout>
      <div className="container-fluid py-3">
        {/* ===== PAGE HEADER ===== */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0">
              {t("finance.title")}
            </h4>
            <div className="text-muted small">
              {t("finance.subtitle")}
            </div>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <div className="mb-3">
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn btn-outline-${theme} ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              {t("finance.tabs.overview")}
            </button>
            <button
              type="button"
              className={`btn btn-outline-${theme} ${activeTab === "tax-calculator" ? "active" : ""}`}
              onClick={() => setActiveTab("tax-calculator")}
            >
              {t("finance.tabs.taxCalculator")}
            </button>
            <button
              type="button"
              className={`btn btn-outline-${theme} ${activeTab === "transactions" ? "active" : ""}`}
              onClick={() => setActiveTab("transactions")}
            >
              {t("finance.tabs.transactions")}
            </button>
          </div>
        </div>

        {/* THÔNG BÁO LỖI (nếu có) */}
        {error && (
          <div className="alert alert-warning py-2 small mb-3">{error}</div>
        )}

        {/* =========================
            TAB 1: TỔNG QUAN
        ========================== */}
        {activeTab === "overview" && (
          <>
            {/* Date Filter */}
            <div className="card shadow-sm border-0 mb-3">
              <div className="card-body">
                <div className="row align-items-center g-3">
                  <div className="col-12">
                    <div className="row g-2">
                      <div className="col-md-3">
                        <label className="form-label small mb-1">
                          <i className="bi bi-calendar3 me-1"></i>
                          {t("finance.accounting.fromDate")}
                        </label>
                        <div className="input-group input-group-sm">
                          <input
                            type="date"
                            className="form-control"
                            value={startDate}
                            onChange={(e) => {
                              setStartDate(e.target.value);
                              setCurrentPage(1);
                            }}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small mb-1">
                          <i className="bi bi-calendar3 me-1"></i>
                          {t("finance.accounting.toDate")}
                        </label>
                        <div className="input-group input-group-sm">
                          <input
                            type="date"
                            className="form-control"
                            value={endDate}
                            onChange={(e) => {
                              setEndDate(e.target.value);
                              setCurrentPage(1);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="row g-3 mb-4">
              {[
                {
                  label: t("finance.accounting.revenue"),
                  value: formatCurrency(summary.revenue),
                  icon: "bi-currency-dollar",
                  color: "success",
                  description: t("finance.summary.revenueDesc"),
                  currencyUnit: t("common.currency")
                },
                {
                  label: t("finance.accounting.cost"),
                  value: formatCurrency(summary.cost),
                  icon: "bi-cash-stack",
                  color: "danger",
                  description: t("finance.summary.costDesc"),
                  currencyUnit: t("common.currency")
                },
                {
                  label: t("finance.accounting.profit"),
                  value: formatCurrency(summary.profit),
                  icon: "bi-graph-up-arrow",
                  color: "primary",
                  description: t("finance.summary.profitDesc"),
                  currencyUnit: t("common.currency")
                },
                {
                  label: t("finance.accounting.invoices"),
                  value: summary.invoicesCount,
                  icon: "bi-receipt",
                  color: "info",
                  description: t("finance.summary.invoicesDesc"),
                  unit: t("common.orders")
                },
                {
                  label: t("finance.summary.margin"),
                  value: `${summary.profitMargin.toFixed(1)}%`,
                  icon: "bi-percent",
                  color: "warning",
                  description: t("finance.summary.marginDesc"),
                  unit: "%"
                }
              ].map((card, index) => (
                <div key={index} className="col-12 col-sm-6 col-md-4 col-lg">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-start">
                        <div className="me-3">
                          <i className={`bi ${card.icon} fs-3 text-${card.color}`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="text-muted small mb-1">{card.label}</div>
                          <div className={`fw-bold fs-4 text-${card.color}`}>
                            {card.value}
                            {card.currencyUnit && (
                              <span className="fs-6 ms-1 text-muted">{card.currencyUnit}</span>
                            )}
                          </div>
                          <div className="small text-muted mt-1">{card.description}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="row g-3 mb-4">
              {/* Revenue Trend */}
              <div className="col-12 col-lg-8">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="fw-bold mb-0">
                        <i className="bi bi-graph-up me-2"></i>
                        {t("finance.charts.revenueTrend")}
                      </h5>
                      <div className="text-muted small">
                        <span className="text-success me-3">
                          {formatCurrency(summary.revenue)} {t("common.currency")}
                        </span>
                        <span className="text-primary">
                          {summary.invoicesCount} {t("finance.charts.orders")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary"></div>
                        <p className="text-muted mt-2">{t("common.loading")}</p>
                      </div>
                    ) : chartData.dailyRevenue.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData.dailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.light} />
                          <XAxis 
                            dataKey="displayDate" 
                            fontSize={12}
                          />
                          <YAxis 
                            tickFormatter={(value) => formatCurrency(value).replace('₫', '')}
                            fontSize={12}
                            unit={t("common.currency")}
                          />
                          <Tooltip 
                            content={<CustomTooltip />}
                            formatter={(value) => [formatCurrency(value), t("finance.charts.revenue")]}
                          />
                          <Bar 
                            name={`${t("finance.charts.revenue")} (${t("common.currency")})`}
                            dataKey="revenue" 
                            fill={CHART_COLORS.primary} 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-muted text-center py-5">
                        <i className="bi bi-bar-chart fs-1 mb-3"></i>
                        <p>{t("common.noData")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="col-12 col-lg-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="fw-bold mb-0">
                        <i className="bi bi-credit-card me-2"></i>
                        {t("finance.charts.paymentMethods")}
                      </h5>
                    </div>
                  </div>
                  <div className="card-body">
                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary"></div>
                        <p className="text-muted mt-2">{t("common.loading")}</p>
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
                                {formatCurrency(pm.value)} {t("common.currency")}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between small text-muted">
                              <span>{pm.count} {t("finance.charts.orders")}</span>
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
                        <p>{t("common.noData")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Revenue */}
            <div className="row g-3">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="fw-bold mb-0">
                        <i className="bi bi-tags me-2"></i>
                        {t("finance.charts.categoryRevenue")}
                      </h5>
                      <div className="text-muted small">
                        {t("finance.charts.topCategories")}
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary"></div>
                        <p className="text-muted mt-2">{t("common.loading")}</p>
                      </div>
                    ) : chartData.categoryRevenue.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                          data={chartData.categoryRevenue}
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
                            unit={t("common.currency")}
                          />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Bar 
                            name={`${t("finance.charts.revenue")} (${t("common.currency")})`}
                            dataKey="revenue" 
                            fill={CHART_COLORS.primary} 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-muted text-center py-5">
                        <i className="bi bi-tags fs-1 mb-3"></i>
                        <p>{t("common.noData")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =========================
            TAB 2: TÍNH THUẾ PHẢI NỘP (CHỈ CÒN PHƯƠNG PHÁP KHẤU TRỪ)
        ========================== */}
        {activeTab === "tax-calculator" && (
          <div className="row g-3">
            <div className="col-12 col-xl-8">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white border-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">
                      {t("finance.taxCalculator.title")}
                    </h5>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small">
                        {t("finance.taxCalculator.period")}:
                      </span>
                      <select
                        className={`form-select form-select-sm border-${theme}`}
                        value={taxPeriod}
                        onChange={(e) => setTaxPeriod(e.target.value)}
                        style={{ minWidth: 130 }}
                      >
                        <option value="MONTH">{t("finance.taxCalculator.monthly")}</option>
                        <option value="QUARTER">{t("finance.taxCalculator.quarterly")}</option>
                        <option value="YEAR">{t("finance.taxCalculator.yearly")}</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="card-body">
                  {/* Thông báo phương pháp khấu trừ */}
                  <div className="alert alert-info mb-4">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>{t("finance.taxCalculator.vatCreditOnly")}</strong><br/>
                    {t("finance.taxCalculator.vatCreditDesc")}
                  </div>

                  <div className="row g-3">
                    {/* Doanh thu */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        {t("finance.taxCalculator.revenue")}
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          value={taxRevenue}
                          min={0}
                          onChange={(e) => setTaxRevenue(Number(e.target.value))}
                          placeholder={t("finance.taxCalculator.revenuePlaceholder")}
                        />
                        <span className="input-group-text">
                          {t("common.currency")}
                        </span>
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setTaxRevenue(summary.revenue)}
                        >
                          {t("finance.taxCalculator.useCurrent")}
                        </button>
                      </div>
                    </div>

                    {/* Thuế VAT đầu vào */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        {t("finance.taxCalculator.inputVat")}
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          value={inputVat}
                          min={0}
                          onChange={(e) => setInputVat(Number(e.target.value))}
                          placeholder={t("finance.taxCalculator.inputVatPlaceholder")}
                        />
                        <span className="input-group-text">
                          {t("common.currency")}
                        </span>
                      </div>
                      <small className="text-muted d-block mt-1">
                        {t("finance.taxCalculator.inputVatDesc")}
                      </small>
                    </div>
                  </div>

                  {/* Thông tin ước tính */}
                  <div className="mt-4">
                    <div className="alert alert-light">
                      <div className="row">
                        <div className="col-6">
                          <div className="small text-muted">
                            {t("finance.taxCalculator.yearlyEstimateLabel")}
                          </div>
                          <div className="fw-bold">
                            {formatCurrency(yearlyRevenueEstimate)} {t("common.currency")}
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="small text-muted">
                            {t("finance.taxCalculator.taxFreeThreshold")}
                          </div>
                          <div className="fw-bold text-success">
                            {formatCurrency(TAX_CONFIG.minRevenue)} {t("common.currency")}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Thanh tiến trình */}
                    {taxRevenue > 0 && (
                      <div className="mt-3">
                        <div className="d-flex justify-content-between small mb-2">
                          <span>0 {t("common.currency")}</span>
                          <span className="fw-bold">
                            {t("finance.taxCalculator.threshold", { amount: formatCurrency(TAX_CONFIG.minRevenue) })}
                          </span>
                          <span>3 {t("common.billion")} {t("common.currency")}</span>
                        </div>
                        <div className="progress" style={{ height: "8px", borderRadius: "4px" }}>
                          <div
                            className={`progress-bar ${isAboveThreshold ? "bg-success" : "bg-warning"}`}
                            style={{ width: `${Math.min((yearlyRevenueEstimate / 3000000000) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="text-center small mt-2">
                          {!isAboveThreshold ? (
                            <span className="text-success">
                              <i className="bi bi-check-circle me-1"></i>
                              {t("finance.taxCalculator.belowThreshold")}
                            </span>
                          ) : (
                            <span className="text-warning">
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              {t("finance.taxCalculator.aboveThreshold")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chi tiết tính thuế VAT */}
                  {isAboveThreshold && taxResult.taxableRevenue > 0 && (
                    <div className="alert alert-info mt-3">
                      <div className="row">
                        <div className="col-6">
                          <div className="small">{t("finance.taxCalculator.outputVat")}:</div>
                          <div className="fw-bold">
                            {formatCurrency(taxResult.taxableRevenue)} × {TAX_CONFIG.vatRate}% = {formatCurrency(taxResult.outputVat)}
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="small">{t("finance.taxCalculator.inputVat")}:</div>
                          <div className="fw-bold">{formatCurrency(taxResult.inputVat)} {t("common.currency")}</div>
                        </div>
                        <div className="col-12 mt-2 pt-2 border-top">
                          <div className="small">{t("finance.taxCalculator.vatToPay")}:</div>
                          <div className="fw-bold text-danger">
                            {formatCurrency(taxResult.outputVat)} - {formatCurrency(taxResult.inputVat)} = {formatCurrency(taxResult.vatToPay)} {t("common.currency")}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <hr className="my-4" />

                  {/* Kết quả tính thuế */}
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="text-muted small">{t("finance.taxCalculator.vatAmount")}</div>
                            <span className="badge bg-primary text-white">
                              {TAX_CONFIG.vatRate}%
                            </span>
                          </div>
                          <div className={`fw-bold fs-4 ${isAboveThreshold ? "text-dark" : "text-muted"}`}>
                            {formatCurrency(taxResult.vatAmount)} {t("common.currency")}
                          </div>
                          {isAboveThreshold && (
                            <div className="small text-muted mt-2">
                              {formatCurrency(taxResult.outputVat)} - {formatCurrency(taxResult.inputVat)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="text-muted small">{t("finance.taxCalculator.pitAmount")}</div>
                            <span className="badge bg-info text-white">{TAX_CONFIG.pitRate}%</span>
                          </div>
                          <div className={`fw-bold fs-4 ${isAboveThreshold ? "text-dark" : "text-muted"}`}>
                            {formatCurrency(taxResult.pitAmount)} {t("common.currency")}
                          </div>
                          {isAboveThreshold && (
                            <div className="small text-muted mt-2">
                              {formatCurrency(taxResult.taxableRevenue)} × {TAX_CONFIG.pitRate}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <div className="text-muted small">{t("finance.taxCalculator.totalTax")}</div>
                          <div className="fw-bold fs-4 text-danger">
                            {formatCurrency(taxResult.totalTax)} {t("common.currency")}
                          </div>
                          <div className="text-muted small mt-2">
                            {t("finance.taxCalculator.effectiveRate")} <strong>{effectiveRate.toFixed(2)}%</strong>
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
                          <strong>{t("finance.taxCalculator.taxExemption")}:</strong>{" "}
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
                    {t("finance.taxCalculator.disclaimer")}
                  </div>
                </div>
              </div>
            </div>

            {/* Panel bên phải */}
            <div className="col-12 col-xl-4">
              {/* Hướng dẫn nhanh */}
              <div className="card shadow-sm border-0 mb-3">
                <div className="card-header bg-white border-0 fw-semibold">
                  {t("finance.taxCalculator.guideTitle")}
                </div>
                <div className="card-body">
                  <ol className="mb-0 ps-3">
                    <li className="mb-2">{t("finance.taxCalculator.guideStep1")}</li>
                    <li className="mb-2">{t("finance.taxCalculator.guideStep2")}</li>
                    <li className="mb-2">{t("finance.taxCalculator.guideStep3")}</li>
                    <li>{t("finance.taxCalculator.guideStep4")}</li>
                  </ol>
                </div>
              </div>
              
              {/* Lịch kê khai */}
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-0 fw-semibold">
                  {t("finance.taxCalendar.title")}
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    <div className="list-group-item px-0 border-0">
                      <div className="d-flex justify-content-between">
                        <strong>{t("finance.taxCalendar.q1")}</strong>
                        <span className="text-muted">{t("finance.taxCalendar.q1Deadline")}</span>
                      </div>
                    </div>
                    <div className="list-group-item px-0">
                      <div className="d-flex justify-content-between">
                        <strong>{t("finance.taxCalendar.q2")}</strong>
                        <span className="text-muted">{t("finance.taxCalendar.q2Deadline")}</span>
                      </div>
                    </div>
                    <div className="list-group-item px-0">
                      <div className="d-flex justify-content-between">
                        <strong>{t("finance.taxCalendar.q3")}</strong>
                        <span className="text-muted">{t("finance.taxCalendar.q3Deadline")}</span>
                      </div>
                    </div>
                    <div className="list-group-item px-0">
                      <div className="d-flex justify-content-between">
                        <strong>{t("finance.taxCalendar.q4")}</strong>
                        <span className="text-muted">{t("finance.taxCalendar.q4Deadline")}</span>
                      </div>
                    </div>
                    <div className="list-group-item px-0 border-top mt-2 pt-3">
                      <div className="d-flex justify-content-between">
                        <strong>{t("finance.taxCalendar.annualSettlement")}</strong>
                        <span className="text-danger fw-semibold">{t("finance.taxCalendar.annualDeadline")}</span>
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
            {/* Date Filter */}
            <div className="card shadow-sm border-0 mb-3">
              <div className="card-body">
                <div className="row align-items-center g-3">
                  <div className="col-12 col-md-5">
                    <div className="row g-2">
                      <div className="col">
                        <label className="form-label small mb-1">
                          <i className="bi bi-calendar3 me-1"></i>
                          {t("finance.accounting.fromDate")}
                        </label>
                        <div className="input-group input-group-sm">
                          <input
                            type="date"
                            className="form-control"
                            value={startDate}
                            onChange={(e) => {
                              setStartDate(e.target.value);
                              setCurrentPage(1);
                            }}
                          />
                        </div>
                      </div>
                      <div className="col">
                        <label className="form-label small mb-1">
                          <i className="bi bi-calendar3 me-1"></i>
                          {t("finance.accounting.toDate")}
                        </label>
                        <div className="input-group input-group-sm">
                          <input
                            type="date"
                            className="form-control"
                            value={endDate}
                            onChange={(e) => {
                              setEndDate(e.target.value);
                              setCurrentPage(1);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-7 d-flex justify-content-end">
                    <button
                      className={`btn btn-${theme} btn-sm text-white`}
                      onClick={exportCSV}
                    >
                      <i className="bi bi-download me-1" /> {t("finance.accounting.exportCSV")}
                    </button>
                  </div>
                </div>

                {/* Search input */}
                <div className="mt-3">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-search text-secondary" />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t("finance.accounting.searchPlaceholder")}
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ borderLeft: 'none' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions table */}
            <div className="row g-3">
              <div className="col-12">
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-white border-0 fw-semibold d-flex justify-content-between align-items-center">
                    <span>{t("finance.tabs.transactions")}</span>
                    {filtered.length > 0 && (
                      <span className="badge bg-light text-dark border">
                        {filtered.length} {t("finance.accounting.records")}
                      </span>
                    )}
                  </div>
                  
                  <div className="card-body">
                    <div
                      className="table-responsive rounded-3"
                      style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        paddingRight: 8,
                        paddingBottom: 8,
                        backgroundColor: "#fff",
                      }}
                    >
                      <div
                        style={{
                          maxHeight: "60vh",
                          overflowX: "auto",
                          overflowY: "auto",
                          borderRadius: 12,
                        }}
                      >
                        <table className="table table-hover align-middle mb-0">
                          <thead
                            className="table-light"
                            style={{ position: "sticky", top: 0, zIndex: 2 }}
                          >
                            <tr>
                              <th>#</th>
                              <th>{t("finance.accounting.date")}</th>
                              <th>{t("finance.accounting.type")}</th>
                              <th>{t("finance.accounting.code")}</th>
                              <th>{t("finance.accounting.partner")}</th>
                              <th className="text-end">
                                {t("finance.accounting.amount")} ({t("common.currency")})
                              </th>
                              <th>{t("finance.accounting.note")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loading ? (
                              <tr>
                                <td colSpan={7} className="text-center py-4">
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
                                          : x.type === "PURCHASE"
                                          ? "bg-warning text-dark"
                                          : "bg-secondary"
                                      }`}
                                    >
                                      {t(`finance.transactionTypes.${x.type.toLowerCase()}`, x.type)}
                                    </span>
                                  </td>
                                  <td>{x.code}</td>
                                  <td>{x.partner}</td>
                                  <td className="text-end fw-semibold">
                                    {formatCurrency(x.amount)} {t("common.currency")}
                                  </td>
                                  <td>{x.note}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="text-center text-muted py-4">
                                  {t("finance.accounting.noData")}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
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
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}