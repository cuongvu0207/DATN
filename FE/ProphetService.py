from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import pandas as pd
from prophet import Prophet
from datetime import datetime

# ============================
# 🔧 CONFIG BACKEND
# ============================
BASE_URL = "http://localhost:8080/api"
ORDERS_ENDPOINT = "/order/static/all"
PRODUCTS_ENDPOINT = "/inventory/products"

DEFAULT_FORECAST_DAYS = 90


# ============================
# 🔧 API FETCH FUNCTIONS
# ============================
def fetch_orders(auth_header):
    url = f"{BASE_URL}{ORDERS_ENDPOINT}"
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header
    res = requests.get(url, headers=headers, timeout=10)
    res.raise_for_status()
    return res.json()


def fetch_products(auth_header):
    url = f"{BASE_URL}{PRODUCTS_ENDPOINT}"
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header
    res = requests.get(url, headers=headers, timeout=10)
    res.raise_for_status()
    return res.json()


# ============================
# 🔮 FORECAST 1 PRODUCT
# ============================
def forecast_out_of_stock_for_product(barcode: str, days: int, products, orders):
    product = next((p for p in products if str(p.get("barcode")) == str(barcode)), None)
    if not product:
        return {
            "success": False,
            "barcode": barcode,
            "message": "Không tìm thấy sản phẩm"
        }

    stock = int(product.get("quantityInStock", 0) or 0)
    minimum_stock = int(product.get("minimumStock", 0) or 0)

    if stock <= 0:
        return {
            "success": True,
            "barcode": barcode,
            "productName": product.get("productName"),
            "stock": stock,
            "minimumStock": minimum_stock,
            "outOfStockDate": "ĐÃ HẾT HÀNG",
            "daysToOutOfStock": 0
        }

    # ----------------------------
    # Build sales history
    # ----------------------------
    rows = []
    for o in orders:
        date = o["createdAt"][:10]
        for item in o.get("orderItemDTOs", []):
            if str(item.get("barcode")) == str(barcode):
                rows.append({
                    "ds": date,
                    "y": float(item.get("quantity", 0) or 0)
                })

    if not rows:
        return {
            "success": False,
            "barcode": barcode,
            "productName": product.get("productName"),
            "message": "Chưa có lịch sử bán"
        }

    df = pd.DataFrame(rows)
    df["ds"] = pd.to_datetime(df["ds"])
    df = df.groupby("ds", as_index=False)["y"].sum().sort_values("ds")

    if len(df) < 2:
        return {
            "success": False,
            "barcode": barcode,
            "productName": product.get("productName"),
            "message": "Không đủ dữ liệu (≥ 2 ngày bán)"
        }

    # ----------------------------
    # Train Prophet
    # ----------------------------
    model = Prophet(daily_seasonality=True)
    model.fit(df)

    future = model.make_future_dataframe(periods=days)
    forecast = model.predict(future)
    forecast["ds"] = pd.to_datetime(forecast["ds"])

    # 🔥 CHỈ LẤY TỪ NGÀY HÔM NAY
    today = pd.to_datetime(datetime.now().date())
    fut = forecast[forecast["ds"] >= today][["ds", "yhat"]].copy()

    # Không cho bán âm
    fut["yhat"] = fut["yhat"].apply(lambda v: max(v, 0))

    # ----------------------------
    # Find out-of-stock date
    # ----------------------------
    cum = 0.0
    out_date = None
    days_left = None

    for row in fut.itertuples(index=False):
        cum += float(row.yhat)
        if stock - cum <= 0:
            out_date = row.ds
            days_left = (row.ds - today).days
            break

    # ----------------------------
    # Response
    # ----------------------------
    resp = {
        "success": True,
        "barcode": barcode,
        "productName": product.get("productName"),
        "stock": stock,
        "minimumStock": minimum_stock,
        "forecastHorizonDays": days,
        "outOfStockDate": None,
        "daysToOutOfStock": None
    }

    if out_date:
        resp["outOfStockDate"] = out_date.strftime("%Y-%m-%d")
        resp["daysToOutOfStock"] = max(days_left, 0)
    else:
        resp["message"] = "Trong chu kỳ dự báo vẫn chưa hết hàng"

    return resp


# ============================
# 🌐 FLASK APP
# ============================
app = Flask(__name__)
CORS(app)


@app.route("/api/forecast/out_of_stock", methods=["GET"])
def api_out_of_stock_one():
    try:
        barcode = request.args.get("barcode")
        if not barcode:
            return jsonify({"success": False, "message": "Thiếu barcode"}), 400

        days = int(request.args.get("days", DEFAULT_FORECAST_DAYS))
        auth_header = request.headers.get("Authorization", "")

        products = fetch_products(auth_header)
        orders = fetch_orders(auth_header)

        result = forecast_out_of_stock_for_product(barcode, days, products, orders)
        return jsonify(result), 200 if result.get("success") else 400

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/forecast/out_of_stock/all", methods=["GET"])
def api_out_of_stock_all():
    try:
        days = int(request.args.get("days", DEFAULT_FORECAST_DAYS))
        auth_header = request.headers.get("Authorization", "")

        products = fetch_products(auth_header)
        orders = fetch_orders(auth_header)

        results = []
        for p in products:
            barcode = p.get("barcode")
            if barcode:
                results.append(
                    forecast_out_of_stock_for_product(
                        str(barcode), days, products, orders
                    )
                )

        return jsonify({
            "success": True,
            "forecastHorizonDays": days,
            "totalProducts": len(results),
            "data": results
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    print("🚀 Out-of-Stock Forecast API running")
    print("1 SP  : http://localhost:5001/api/forecast/out_of_stock?barcode=XXX&days=90")
    print("ALL   : http://localhost:5001/api/forecast/out_of_stock/all?days=90")
    app.run(port=5001, debug=True)
