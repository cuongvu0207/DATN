import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  PieChart,
  Pie,
  Cell
} from "recharts";
import axios from "axios";

// Custom hooks và components
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";
import { formatCurrency } from "../utils/formatters";

// Theme color mapping
const THEME_COLORS = {
  primary: {
    light: "#3b82f6",
    dark: "#1d4ed8"
  },
  secondary: {
    light: "#6b7280",
    dark: "#374151"
  },
  success: {
    light: "#10b981",
    dark: "#047857"
  },
  danger: {
    light: "#ef4444",
    dark: "#b91c1c"
  },
  warning: {
    light: "#f59e0b",
    dark: "#d97706"
  },
  info: {
    light: "#06b6d4",
    dark: "#0e7490"
  },
  dark: {
    light: "#374151",
    dark: "#1f2937"
  }
};

// Common colors (không thay đổi theo theme)
const COMMON_COLORS = {
  light: "#e5e7eb",
  white: "#ffffff",
  border: "#d1d5db"
};

// Helper function to get theme colors
const getThemeColors = (themeName, isDarkMode = false) => {
  const themeKey = isDarkMode ? 'dark' : 'light';
  return THEME_COLORS[themeName] ? THEME_COLORS[themeName][themeKey] : THEME_COLORS.primary[themeKey];
};

const PERIOD_OPTIONS = [
  { value: "day", labelKey: "dashboard.today" },
  { value: "week", labelKey: "dashboard.last7Days" },
  { value: "month", labelKey: "dashboard.last30Days" },
  { value: "year", labelKey: "dashboard.thisYear" }
];

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

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
};

// Pie Chart Label Component
const PieChartLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  // Chữ trắng cho phần màu xanh, chữ xanh cho phần màu trắng
  const textColor = index % 2 === 0 ? '#ffffff' : '#3b82f6';

  return (
    <text 
      x={x} 
      y={y} 
      fill={textColor} 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
      style={{
        textShadow: '0px 0px 2px rgba(0, 0, 0, 0.3)'
      }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Summary Card Component
const SummaryCard = ({ label, value, description, icon, color, currency = false, unit }) => (
  <div className="card border-0 shadow-sm h-100">
    <div className="card-body">
      <div className="d-flex align-items-start">
        <div className="me-3">
          <i className={`bi ${icon} fs-3 text-${color}`}></i>
        </div>
        <div>
          <div className="text-muted small mb-1">{label}</div>
          <div className={`fw-bold fs-4 text-${color}`}>
            {value}
            {currency && (
              <span className="fs-6 ms-1 text-muted">₫</span>
            )}
            {unit && (
              <span className="fs-6 ms-1 text-muted">{unit}</span>
            )}
          </div>
          <div className="small text-muted mt-1">{description}</div>
        </div>
      </div>
    </div>
  </div>
);

// Helper function to translate payment method
const translatePaymentMethod = (method, t) => {
  if (!method) return t("paymentMethod.unknown", "Không xác định");
  
  const methodLower = method.toLowerCase();
  
  if (methodLower.includes('cash') || methodLower === 'cash') {
    return t("paymentMethod.cash", "Tiền mặt");
  } else if (methodLower.includes('bank') || methodLower === 'bank' || methodLower.includes('transfer')) {
    return t("paymentMethod.bank", "Chuyển khoản");
  } else if (methodLower.includes('card') || methodLower.includes('credit')) {
    return t("paymentMethod.card", "Thẻ thanh toán");
  } else if (methodLower.includes('momo') || methodLower.includes('zalopay') || methodLower.includes('vnpay')) {
    return t("paymentMethod.eWallet", "Ví điện tử");
  }
  
  return method;
};

// Main Component
const HomePage = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const token = localStorage.getItem("accessToken");
  const lowStockSectionRef = useRef(null); // Ref để scroll tới phần cảnh báo hàng hết

  // Lấy màu sắc theo theme
  const themeColor = getThemeColors(theme);
  
  // Màu cho biểu đồ dựa trên theme
  const CHART_COLORS = useMemo(() => ({
    primary: themeColor,
    secondary: COMMON_COLORS.white,
    secondaryBorder: COMMON_COLORS.border,
    success: THEME_COLORS.success.light,
    danger: THEME_COLORS.danger.light,
    warning: THEME_COLORS.warning.light,
    info: THEME_COLORS.info.light,
    light: COMMON_COLORS.light,
    dark: THEME_COLORS.dark.light
  }), [themeColor]);

  // Mảng màu cho biểu đồ pie
  const PIE_CHART_COLORS = useMemo(() => [themeColor, COMMON_COLORS.white], [themeColor]);

  const [period, setPeriod] = useState("day");
  const [summary, setSummary] = useState({ 
    revenue: 0, 
    cost: 0, 
    profit: 0,
    totalOrders: 0,
    averageOrderValue: 0 
  });
  
  const [invoiceStats, setInvoiceStats] = useState({
    dailyInvoices: [],
    paymentMethods: [],
    categoryDistribution: []
  });
  
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chartType, setChartType] = useState("bar");

  // Axios instance
  const axiosInstance = useMemo(
    () => axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  // Hàm scroll tới phần cảnh báo hàng hết
  const scrollToLowStockSection = () => {
    if (lowStockSectionRef.current) {
      lowStockSectionRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Helper functions
  const getFromDateByPeriod = useCallback(() => {
    const now = new Date();
    const from = new Date(now);

    switch (period) {
      case "day":
        from.setHours(0, 0, 0, 0);
        break;
      case "week":
        from.setDate(from.getDate() - 6);
        break;
      case "month":
        from.setDate(from.getDate() - 29);
        break;
      case "year":
        from.setMonth(0, 1);
        break;
      default:
        from.setHours(0, 0, 0, 0);
    }

    from.setHours(0, 0, 0, 0);
    return from;
  }, [period]);

  const processInvoiceData = useCallback((invoices, products) => {
    const now = new Date();
    const fromDate = getFromDateByPeriod();
    
    const filteredInvoices = invoices.filter((inv) => {
      const invoiceDate = new Date(inv.createdAt);
      return !isNaN(invoiceDate.getTime()) && invoiceDate >= fromDate && invoiceDate <= now;
    });

    // Process daily data
    const dailyMap = new Map();
    
    filteredInvoices.forEach((invoice) => {
      const date = new Date(invoice.createdAt);
      const dateKey = date.toISOString().split('T')[0];
      const displayDate = `${date.getDate()}/${date.getMonth() + 1}`;
      
      const existing = dailyMap.get(dateKey) || {
        date: dateKey,
        displayDate,
        revenue: 0,
        invoiceCount: 0
      };
      
      existing.revenue += Number(invoice.totalPrice || 0);
      existing.invoiceCount += 1;
      dailyMap.set(dateKey, existing);
    });

    const dailyInvoices = Array.from(dailyMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Process payment methods - SỬA: Thêm translation
    const paymentMap = new Map();
    
    filteredInvoices.forEach((invoice) => {
      const method = invoice.paymentMethod || "UNKNOWN";
      const translatedMethod = translatePaymentMethod(method, t);
      const amount = Number(invoice.totalPrice || 0);
      
      const existing = paymentMap.get(translatedMethod) || {
        originalName: method, // Lưu tên gốc
        name: translatedMethod, // Tên đã dịch
        value: 0,
        count: 0,
        percentage: 0
      };
      
      existing.value += amount;
      existing.count += 1;
      paymentMap.set(translatedMethod, existing);
    });

    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + Number(inv.totalPrice || 0), 0);
    
    const paymentMethods = Array.from(paymentMap.values()).map(pm => ({
      ...pm,
      percentage: totalRevenue > 0 ? (pm.value / totalRevenue) * 100 : 0
    }));

    // Process category distribution
    const categoryMap = new Map();
    const costMap = new Map();
    
    products.forEach((product) => {
      if (product.barcode) {
        if (product.categoryName) {
          categoryMap.set(product.barcode, product.categoryName);
        }
        costMap.set(product.barcode, Number(product.costOfCapital || product.costPrice || 0));
      }
    });

    const categoryDistribution = new Map();
    
    filteredInvoices.forEach((invoice) => {
      (invoice.orderItemDTOs || []).forEach((item) => {
        const category = categoryMap.get(item.barcode) || t("category.other", "Khác");
        const revenue = item.subTotal || (Number(item.price || 0) * Number(item.quantity || 0));
        const cost = (costMap.get(item.barcode) || 0) * Number(item.quantity || 0);
        const profit = revenue - cost;
        
        const existing = categoryDistribution.get(category) || {
          category,
          revenue: 0,
          profit: 0
        };
        
        existing.revenue += revenue;
        existing.profit += profit;
        categoryDistribution.set(category, existing);
      });
    });

    const categoryData = Array.from(categoryDistribution.values())
      .sort((a, b) => b.revenue - b.revenue)
      .slice(0, 8);

    return {
      dailyInvoices,
      paymentMethods,
      categoryDistribution: categoryData,
      filteredInvoices
    };
  }, [getFromDateByPeriod, t]);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [invoicesRes, productsRes, customersRes, lowStockRes] = await Promise.all([
        axiosInstance.get("/order/static/allCompleted"),
        axiosInstance.get("/inventory/products"),
        axiosInstance.get("/customer"),
        axiosInstance.get("/inventory/static/low-stock"),
      ]);

      const allInvoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
      const products = Array.isArray(productsRes.data) ? productsRes.data : [];
      const customers = Array.isArray(customersRes.data) ? customersRes.data : [];
      const lowStockRaw = Array.isArray(lowStockRes.data) ? lowStockRes.data : [];

      // Process low stock products
      const lowStock = lowStockRaw
        .map((p) => ({
          id: p.productId,
          name: p.productName,
          barcode: p.barcode,
          stock: p.quantityInStock,
          minStock: p.minimumStock,
          categoryName: p.categoryName,
          brandName: p.brandName,
          unit: p.unit,
          sellingPrice: p.sellingPrice,
          costOfCapital: p.costOfCapital,
          lastUpdated: p.lastUpdated,
          image: p.image,
        }))
        .filter((p) => typeof p.stock === "number" && typeof p.minStock === "number" && p.minStock > 0)
        .sort((a, b) => a.stock - b.stock);

      setLowStockProducts(lowStock);

      // Process invoice data
      const invoiceData = processInvoiceData(allInvoices, products);
      setInvoiceStats(invoiceData);

      const { filteredInvoices } = invoiceData;
      const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + Number(inv.totalPrice || 0), 0);

      // Calculate total cost
      const costMap = new Map();
      products.forEach((p) => {
        if (p.barcode) {
          costMap.set(p.barcode, Number(p.costOfCapital || p.costPrice || 0));
        }
      });

      let totalCost = 0;
      filteredInvoices.forEach((invoice) => {
        (invoice.orderItemDTOs || []).forEach((item) => {
          const qty = Number(item.quantity || 0);
          const unitCost = costMap.get(item.barcode) ?? 0;
          totalCost += qty * unitCost;
        });
      });

      const totalProfit = totalRevenue - totalCost;
      const totalOrders = filteredInvoices.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setSummary({ 
        revenue: totalRevenue, 
        cost: totalCost, 
        profit: totalProfit,
        totalOrders,
        averageOrderValue 
      });

      // Process top products
      const productAgg = new Map();
      
      filteredInvoices.forEach((invoice) => {
        (invoice.orderItemDTOs || []).forEach((item) => {
          const barcode = item.barcode || item.productName;
          if (!barcode) return;
          
          const existing = productAgg.get(barcode) || {
            name: item.productName || t("product.defaultName", "Sản phẩm"),
            barcode: item.barcode || "",
            revenue: 0,
            quantity: 0
          };
          
          const revenue = item.subTotal || (Number(item.price || 0) * Number(item.quantity || 0));
          existing.revenue += revenue;
          existing.quantity += Number(item.quantity || 0);
          productAgg.set(barcode, existing);
        });
      });

      const topProductsArray = Array.from(productAgg.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopProducts(topProductsArray);

      // Process top customers
      const customerAgg = new Map();
      
      filteredInvoices.forEach((invoice) => {
        const customerId = invoice.customerId || "default_customer_id";
        
        const existing = customerAgg.get(customerId) || {
          id: customerId,
          name: customerId === "default_customer_id" 
            ? t("customer.walkIn", "Khách lẻ") 
            : t("customer.anonymous", `Khách #${customerId.substring(0, 6)}`),
          revenue: 0,
          orders: 0
        };
        
        existing.revenue += Number(invoice.totalPrice || 0);
        existing.orders += 1;
        customerAgg.set(customerId, existing);
      });

      customers.forEach((customer) => {
        if (customer.id && customerAgg.has(customer.id)) {
          const existing = customerAgg.get(customer.id);
          existing.name = customer.name || customer.fullName || t("customer.defaultName", "Khách hàng");
          existing.phone = customer.phone || customer.phoneNumber || "";
          customerAgg.set(customer.id, existing);
        }
      });

      const topCustomersArray = Array.from(customerAgg.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopCustomers(topCustomersArray);

    } catch (err) {
      console.error("Dashboard fetch failed:", err);
      setError(t("dashboard.fetchError", "Không tải được dữ liệu dashboard"));
      setSummary({ revenue: 0, cost: 0, profit: 0, totalOrders: 0, averageOrderValue: 0 });
      setInvoiceStats({
        dailyInvoices: [],
        paymentMethods: [],
        categoryDistribution: []
      });
      setLowStockProducts([]);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, processInvoiceData, t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Hàm định dạng giá trị trung bình - Làm tròn đến đơn vị
  const formatAverageValue = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    // Làm tròn đến đơn vị (bỏ phần thập phân)
    const roundedValue = Math.round(Number(value));
    // Định dạng số với dấu phân cách hàng nghìn
    return roundedValue.toLocaleString('vi-VN');
  };

  // Summary cards data với màu theo theme
  const summaryCards = [
    {
      label: t("dashboard.summary.revenue"),
      value: formatCurrency(summary.revenue),
      description: t("dashboard.summary.revenueDesc"),
      icon: "bi-currency-dollar",
      color: "success",
      currency: true
    },
    {
      label: t("dashboard.summary.cost"),
      value: formatCurrency(summary.cost),
      description: t("dashboard.summary.costDesc"),
      icon: "bi-cash-stack",
      color: "danger", // Giữ nguyên màu danger cho chi phí
      currency: true
    },
    {
      label: t("dashboard.summary.profit"),
      value: formatCurrency(summary.profit),
      description: t("dashboard.summary.profitDesc"),
      icon: "bi-graph-up-arrow",
      color: theme, // Sử dụng màu theme cho lợi nhuận
      currency: true
    },
    {
      label: t("dashboard.summary.totalOrders"),
      value: summary.totalOrders,
      description: t("dashboard.summary.totalOrdersDesc"),
      icon: "bi-receipt",
      color: "info",
      unit: t("common.orders")
    },
    {
      label: t("dashboard.summary.averageOrderValue"),
      value: formatAverageValue(summary.averageOrderValue), // Sử dụng hàm mới
      description: t("dashboard.summary.averageOrderValueDesc"),
      icon: "bi-calculator",
      color: "warning",
      currency: true // Vẫn giữ để hiển thị "₫"
    }
  ];

  // Màu cho button chart type
  const getButtonClass = (type) => {
    return chartType === type ? `btn-${theme}` : `btn-outline-${theme}`;
  };

  return (
    <MainLayout>
      <div className="container-fluid py-3">
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0">
              {t("dashboard.title")}
            </h4>
            <div className="text-muted small">
              {t("dashboard.subtitle")}
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            {/* Biểu tượng cảnh báo hàng sắp hết */}
            {lowStockProducts.length > 0 && (
              <button 
                className="btn btn-sm btn-danger d-flex align-items-center gap-2 position-relative"
                onClick={scrollToLowStockSection}
                title={t("dashboard.scrollToLowStock", "Xem cảnh báo hàng sắp hết")}
              >
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{lowStockProducts.length}</span>
                <span className="visually-hidden">
                  {t("dashboard.needToImport", { count: lowStockProducts.length })}
                </span>
              </button>
            )}
            
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">
                {t("dashboard.timePeriod")}:
              </span>
              <select
                className="form-select form-select-sm"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                style={{ minWidth: 120 }}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-warning py-2 small mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="row g-3 mb-4">
          {summaryCards.map((card, index) => (
            <div key={index} className="col-12 col-sm-6 col-md-4 col-lg">
              <SummaryCard {...card} />
            </div>
          ))}
        </div>

        {/* REVENUE TREND CHART */}
        <div className="row g-3 mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-graph-up me-2"></i>
                    {t("dashboard.charts.revenueTrend")}
                  </h5>
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center gap-1">
                      <span className="text-muted small me-2">
                        {t("dashboard.charts.chartType")}:
                      </span>
                      <div className="btn-group btn-group-sm">
                        <button
                          className={`btn ${getButtonClass('bar')}`}
                          onClick={() => setChartType('bar')}
                          title={t("dashboard.charts.barChart")}
                        >
                          <i className="bi bi-bar-chart"></i>
                        </button>
                        <button
                          className={`btn ${getButtonClass('line')}`}
                          onClick={() => setChartType('line')}
                          title={t("dashboard.charts.lineChart")}
                        >
                          <i className="bi bi-graph-up"></i>
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-muted small">
                      <span className="text-success me-3">
                        <i className="bi bi-currency-dollar me-1"></i>
                        {formatCurrency(summary.revenue)} ₫
                      </span>
                      <span className={`text-${theme}`}>
                        <i className="bi bi-receipt me-1"></i>
                        {summary.totalOrders} {t("common.orders")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-5">
                    <div className={`spinner-border text-${theme}`}></div>
                    <p className="text-muted mt-2">{t("common.loading")}</p>
                  </div>
                ) : invoiceStats.dailyInvoices.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    {chartType === 'bar' ? (
                      <BarChart data={invoiceStats.dailyInvoices}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.light} />
                        <XAxis dataKey="displayDate" fontSize={12} />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value).replace('₫', '')}
                          fontSize={12}
                          unit="₫"
                        />
                        <Tooltip 
                          content={<CustomTooltip />}
                          formatter={(value) => [formatCurrency(value), t("dashboard.charts.revenue")]}
                        />
                        <Bar 
                          name={`${t("dashboard.charts.revenue")} (₫)`}
                          dataKey="revenue" 
                          fill={CHART_COLORS.primary} 
                          radius={[4, 4, 0, 0]}
                          stroke={CHART_COLORS.secondary}
                          strokeWidth={1}
                        />
                      </BarChart>
                    ) : (
                      <LineChart data={invoiceStats.dailyInvoices}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.light} />
                        <XAxis dataKey="displayDate" fontSize={12} />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value).replace('₫', '')}
                          fontSize={12}
                          unit="₫"
                        />
                        <Tooltip 
                          content={<CustomTooltip />}
                          formatter={(value) => [formatCurrency(value), t("dashboard.charts.revenue")]}
                        />
                        <Line 
                          name={`${t("dashboard.charts.revenue")} (₫)`}
                          type="monotone" 
                          dataKey="revenue" 
                          stroke={CHART_COLORS.primary} 
                          strokeWidth={3}
                          dot={{ r: 4, fill: CHART_COLORS.primary, stroke: CHART_COLORS.secondary, strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: CHART_COLORS.primary, stroke: CHART_COLORS.secondary, strokeWidth: 2 }}
                        />
                      </LineChart>
                    )}
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
        </div>

        {/* DISTRIBUTION CHARTS */}
        <div className="row g-3 mb-4">
          {/* Payment Methods */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-credit-card me-2"></i>
                    {t("dashboard.charts.paymentMethods")}
                  </h5>
                  <div className="text-muted small">
                    <i className="bi bi-currency-dollar me-1"></i>
                    {t("dashboard.charts.total")}: {formatCurrency(summary.revenue)} ₫
                  </div>
                </div>
              </div>
              <div className="card-body">
                {invoiceStats.paymentMethods.length > 0 ? (
                  <div className="row">
                    <div className="col-md-6">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={invoiceStats.paymentMethods}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(props) => <PieChartLabel {...props} />}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {invoiceStats.paymentMethods.map((_, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                                stroke={CHART_COLORS.secondaryBorder}
                                strokeWidth={1}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              formatCurrency(value), 
                              `${props.payload.name}: ${props.payload.percentage.toFixed(1)}%`
                            ]}
                            labelFormatter={(name) => name}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="col-md-6">
                      <div className="h-100 d-flex flex-column justify-content-center">
                        {invoiceStats.paymentMethods.map((pm, index) => (
                          <div key={pm.originalName} className="mb-2">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <div className="d-flex align-items-center">
                                <div className="rounded-circle me-2" 
                                  style={{
                                    width: 12,
                                    height: 12,
                                    backgroundColor: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
                                    border: `1px solid ${CHART_COLORS.secondaryBorder}`
                                  }}
                                />
                                <span className="small fw-semibold">{pm.name}</span>
                              </div>
                              <span className="small">
                                {formatCurrency(pm.value)} ₫
                              </span>
                            </div>
                            <div className="d-flex justify-content-between small text-muted">
                              <span>{pm.count} {t("common.orders")}</span>
                              <span>{pm.percentage.toFixed(1)}%</span>
                            </div>
                            <div className="progress" style={{ height: 4 }}>
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{ 
                                  width: `${pm.percentage}%`,
                                  backgroundColor: CHART_COLORS.primary,
                                  border: `1px solid ${CHART_COLORS.secondary}`
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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

          {/* Category Revenue */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-tags me-2"></i>
                    {t("dashboard.charts.categoryRevenue")}
                  </h5>
                  <div className="text-muted small">
                    <i className="bi bi-tags me-1"></i>
                    {t("dashboard.charts.topCategories", { count: invoiceStats.categoryDistribution.length })}
                  </div>
                </div>
              </div>
              <div className="card-body">
                {invoiceStats.categoryDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={invoiceStats.categoryDistribution}
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
                        unit="₫"
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), t("dashboard.charts.revenue")]} 
                      />
                      <Bar 
                        name={`${t("dashboard.charts.revenue")} (₫)`}
                        dataKey="revenue" 
                        fill={CHART_COLORS.primary} 
                        radius={[4, 4, 0, 0]}
                        stroke={CHART_COLORS.secondary}
                        strokeWidth={1}
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

        {/* TOP PRODUCTS AND CUSTOMERS */}
        <div className="row g-3 mb-4">
          {/* Top Products */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-box-seam me-2"></i>
                    {t("dashboard.topProducts")}
                  </h5>
                  <span className={`badge bg-${theme}`}>
                    {t("dashboard.charts.total")}: {formatCurrency(
                      topProducts.reduce((sum, p) => sum + p.revenue, 0)
                    )} ₫
                  </span>
                </div>
              </div>
              <div className="card-body p-0">
                {topProducts.length === 0 ? (
                  <div className="text-muted text-center py-5">
                    <i className="bi bi-box-seam fs-1 mb-3"></i>
                    <p>{t("common.noData")}</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>{t("dashboard.table.productName")}</th>
                          <th className="text-end">{t("dashboard.table.quantity")}</th>
                          <th className="text-end">{t("dashboard.table.revenue")} (₫)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((product, index) => (
                          <tr key={index}>
                            <td className="fw-semibold">
                              <span className={`badge bg-${index < 3 ? theme : 'secondary'}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td>
                              <div className="fw-semibold">{product.name}</div>
                              {product.barcode && (
                                <div className="small text-muted">{product.barcode}</div>
                              )}
                            </td>
                            <td className="text-end fw-semibold">
                              {product.quantity}
                            </td>
                            <td className="text-end">
                              <span className="fw-semibold" style={{ color: CHART_COLORS.primary }}>
                                {formatCurrency(product.revenue)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Customers */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-person me-2"></i>
                    {t("dashboard.topCustomers")}
                  </h5>
                  <span className={`badge bg-${theme}`}>
                    {t("dashboard.charts.total")}: {formatCurrency(
                      topCustomers.reduce((sum, c) => sum + c.revenue, 0)
                    )} ₫
                  </span>
                </div>
              </div>
              <div className="card-body p-0">
                {topCustomers.length === 0 ? (
                  <div className="text-muted text-center py-5">
                    <i className="bi bi-person fs-1 mb-3"></i>
                    <p>{t("common.noData")}</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>{t("dashboard.table.customerName")}</th>
                          <th className="text-end">{t("dashboard.table.orders")}</th>
                          <th className="text-end">{t("dashboard.table.totalSpent")} (₫)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCustomers.map((customer, index) => (
                          <tr key={customer.id}>
                            <td className="fw-semibold">
                              <span className={`badge bg-${index < 3 ? theme : 'secondary'}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td>
                              <div className="fw-semibold">{customer.name}</div>
                              {customer.phone && (
                                <div className="small text-muted">
                                  <i className="bi bi-telephone me-1"></i>
                                  {customer.phone}
                                </div>
                              )}
                            </td>
                            <td className="text-end">
                              <span className="badge bg-light text-dark">
                                {customer.orders}
                              </span>
                            </td>
                            <td className="text-end">
                              <span className="fw-semibold" style={{ color: CHART_COLORS.primary }}>
                                {formatCurrency(customer.revenue)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* LOW STOCK ALERTS - THÊM REF TẠI ĐÂY */}
        <div className="row g-3" ref={lowStockSectionRef}>
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                    {t("dashboard.lowStockAlert")}
                  </h5>
                  {lowStockProducts.length > 0 && (
                    <span className="badge rounded-pill bg-danger">
                      {t("dashboard.needToImport", { count: lowStockProducts.length })}
                    </span>
                  )}
                </div>
              </div>
              <div className="card-body">
                {lowStockProducts.length === 0 ? (
                  <div className="text-muted text-center py-5">
                    <i className="bi bi-check-circle text-success fs-1 mb-3"></i>
                    <p>{t("dashboard.allProductsInStock")}</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>{t("dashboard.table.productName")}</th>
                          <th>{t("dashboard.table.category")}</th>
                          <th>{t("dashboard.table.barcode")}</th>
                          <th className="text-end">{t("dashboard.table.currentStock")}</th>
                          <th className="text-end">{t("dashboard.table.minStock")}</th>
                          <th className="text-end">{t("dashboard.table.difference")}</th>
                          <th>{t("dashboard.table.status")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockProducts.map((product, index) => {
                          const isOutOfStock = product.stock <= 0;
                          const difference = product.minStock - product.stock;
                          
                          return (
                            <tr key={product.id || product.barcode || index}>
                              <td>{index + 1}</td>
                              <td>
                                <div className="fw-semibold">{product.name}</div>
                                {product.brandName && (
                                  <div className="small text-muted">{product.brandName}</div>
                                )}
                              </td>
                              <td>{product.categoryName || t("category.other", "Khác")}</td>
                              <td>
                                <code>{product.barcode}</code>
                              </td>
                              <td className="text-end fw-semibold">
                                <span className={isOutOfStock ? "text-danger" : "text-warning"}>
                                  {product.stock} {product.unit || ""}
                                </span>
                              </td>
                              <td className="text-end">
                                {product.minStock} {product.unit || ""}
                              </td>
                              <td className="text-end fw-bold">
                                <span className="text-danger">
                                  -{difference} {product.unit || ""}
                                </span>
                              </td>
                              <td>
                                {isOutOfStock ? (
                                  <span className="badge bg-danger">
                                    <i className="bi bi-x-circle me-1"></i>
                                    {t("dashboard.status.outOfStock")}
                                  </span>
                                ) : (
                                  <span className="badge bg-warning text-dark">
                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                    {t("dashboard.status.lowStock")}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HomePage;