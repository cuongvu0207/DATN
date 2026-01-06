// src/services/aiForecastService.js
import axios from "axios";

const AI_API_BASE_URL =
  import.meta.env.VITE_AI_BASE_URL || "http://localhost:5001";

export async function fetchAllOutOfStockForecast(days = 90) {
  const token = localStorage.getItem("accessToken");

  const res = await axios.get(
    `${AI_API_BASE_URL}/api/forecast/out_of_stock/all`,
    {
      params: { days },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  return res.data;
}
