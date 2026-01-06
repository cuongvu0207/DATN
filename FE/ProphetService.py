from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import pandas as pd
from prophet import Prophet

# ============================
# 🔧 CONFIG BACKEND
# ============================
BASE_URL = "http://192.168.1.208:8080/api"      # URL backend của bạn
ORDERS_ENDPOINT = "/order/static/all"           # API lấy danh sách hóa đơn
PRODUCTS_ENDPOINT = "/inventory/products"       # API lấy danh sách sản phẩm

DEFAULT_FORECAST_DAYS = 90                     # số ngày tối đa dự báo


# ============================
# 🔧 HÀM GỌI API (DÙNG TOKEN TỪ FE GỬI SANG)
# ============================
def fetch_orders(auth_header):
    """
    Gọi API hóa đơn, nếu có Authorization từ FE thì forward sang.
    """
    url = f"{BASE_URL}{ORDERS_ENDPOINT}"
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header
    res = requests.get(url, headers=headers, timeout=10)
    res.raise_for_status()
    return res.json()


def fetch_products(auth_header):
    """
    Gọi API sản phẩm, nếu có Authorization từ FE thì forward sang.
    """
    url = f"{BASE_URL}{PRODUCTS_ENDPOINT}"
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header
    res = requests.get(url, headers=headers, timeout=10)
    res.raise_for_status()
    return res.json()


# ============================
# 📦 HÀM DỰ BÁO CHO 1 SẢN PHẨM
# ============================
def forecast_out_of_stock_for_product(barcode: str, days: int, products, orders):
    # 1. Tìm sản phẩm theo barcode
    product = next((p for p in products if str(p.get("barcode")) == str(barcode)), None)
    if product is None:
        return {
            "success": False,
            "barcode": barcode,
            "message": f"Không tìm thấy sản phẩm với barcode {barcode}"
        }

    stock = int(product.get("quantityInStock", 0) or 0)
    minimum_stock = int(product.get("minimumStock", 0) or 0)

    # Nếu đã hết hàng sẵn
    if stock <= 0:
        return {
            "success": True,
            "barcode": barcode,
            "productName": product.get("productName"),
            "stock": stock,
            "minimumStock": minimum_stock,
            "forecastHorizonDays": days,
            "outOfStockDate": "ĐÃ HẾT HÀNG (tồn kho <= 0)",
            "daysToOutOfStock": 0
        }

    # 2. Lấy lịch sử bán theo ngày cho sản phẩm này
    rows = []
    for o in orders:
        date = o["createdAt"][:10]
        for item in o.get("orderItemDTOs", []):
            if str(item.get("barcode")) == str(barcode):
                qty = float(item.get("quantity", 0) or 0)
                rows.append({"ds": date, "y": qty})

    # Không có lịch sử bán
    if not rows:
        return {
            "success": False,
            "barcode": barcode,
            "productName": product.get("productName"),
            "stock": stock,
            "minimumStock": minimum_stock,
            "forecastHorizonDays": days,
            "outOfStockDate": None,
            "daysToOutOfStock": None,
            "message": f"Sản phẩm {barcode} chưa có lịch sử bán, không thể dự báo."
        }

    df = pd.DataFrame(rows)
    df = df.groupby("ds", as_index=False)["y"].sum().sort_values("ds")

    # ✅ FIX LỖI: Prophet cần ít nhất 2 điểm dữ liệu
    if len(df) < 2:
        return {
            "success": False,
            "barcode": barcode,
            "productName": product.get("productName"),
            "stock": stock,
            "minimumStock": minimum_stock,
            "forecastHorizonDays": days,
            "outOfStockDate": None,
            "daysToOutOfStock": None,
            "message": "Không đủ dữ liệu (cần ≥ 2 ngày bán) để dự báo."
        }

    # 3. Train Prophet trên chuỗi số lượng bán
    model = Prophet(daily_seasonality=True)
    model.fit(df)

    future = model.make_future_dataframe(periods=days)
    forecast = model.predict(future)

    # Chỉ lấy phần tương lai (sau ngày cuối có dữ liệu thật)
    last_real_date = df["ds"].max()
    fut = forecast[forecast["ds"] > last_real_date][["ds", "yhat"]].copy()

    # Không cho bán âm
    fut["yhat"] = fut["yhat"].apply(lambda v: max(v, 0))

    # 4. Cộng dồn số lượng bán dự báo để tìm ngày hết hàng
    cum = 0.0
    out_of_stock_date = None
    days_to_out = None

    for day_index, row in enumerate(fut.itertuples(index=False), start=1):
        qty = float(row.yhat)
        cum += qty
        remaining = stock - cum

        if remaining <= 0:
            out_of_stock_date = row.ds
            days_to_out = day_index  # số ngày tính từ sau ngày hiện tại
            break

    # 5. Chuẩn hoá dữ liệu trả về
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

    if out_of_stock_date:
        resp["outOfStockDate"] = out_of_stock_date.strftime("%Y-%m-%d")
        resp["daysToOutOfStock"] = days_to_out
    else:
        resp["message"] = "Trong chu kỳ dự báo vẫn chưa hết hàng."

    return resp


# ============================
# 🚀 FLASK APP
# ============================
app = Flask(__name__)
CORS(app)


# 👉 1) Dự báo theo 1 barcode
@app.route("/api/forecast/out_of_stock", methods=["GET"])
def api_out_of_stock_one():
    try:
        barcode = request.args.get("barcode")
        if not barcode:
            return jsonify({"success": False, "message": "Thiếu tham số 'barcode'"}), 400

        days = int(request.args.get("days", DEFAULT_FORECAST_DAYS))

        # 🔐 Lấy Authorization từ FE gửi sang
        auth_header = request.headers.get("Authorization", "")

        products = fetch_products(auth_header)
        orders = fetch_orders(auth_header)

        data = forecast_out_of_stock_for_product(barcode, days, products, orders)
        status = 200 if data.get("success", False) else 400
        return jsonify(data), status

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# 👉 2) Dự báo cho TẤT CẢ sản phẩm
@app.route("/api/forecast/out_of_stock/all", methods=["GET"])
def api_out_of_stock_all():
    try:
        days = int(request.args.get("days", DEFAULT_FORECAST_DAYS))

        # 🔐 Lấy Authorization từ FE gửi sang
        auth_header = request.headers.get("Authorization", "")

        products = fetch_products(auth_header)
        orders = fetch_orders(auth_header)

        results = []
        for p in products:
            barcode = p.get("barcode")
            if not barcode:
                continue

            try:
                item_result = forecast_out_of_stock_for_product(
                    str(barcode), days, products, orders
                )
            except Exception as e:
                # Nếu lỗi riêng 1 sản phẩm thì ghi message, không cho ngã cả list
                item_result = {
                    "success": False,
                    "barcode": str(barcode),
                    "productName": p.get("productName"),
                    "stock": int(p.get("quantityInStock", 0) or 0),
                    "minimumStock": int(p.get("minimumStock", 0) or 0),
                    "forecastHorizonDays": days,
                    "outOfStockDate": None,
                    "daysToOutOfStock": None,
                    "message": f"Lỗi khi dự báo: {str(e)}"
                }

            results.append(item_result)

        return jsonify({
            "success": True,
            "forecastHorizonDays": days,
            "totalProducts": len(results),
            "data": results
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    print("🚀 Out-of-Stock Forecast API is running:")
    print("   1 SP : http://localhost:5001/api/forecast/out_of_stock?barcode=8935001871453&days=90")
    print("   ALL  : http://localhost:5001/api/forecast/out_of_stock/all?days=90")
    app.run(port=5001, debug=True)
