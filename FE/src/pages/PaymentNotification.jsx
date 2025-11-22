import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { Stomp } from "@stomp/stompjs";

export default function PaymentNotification() {

  const [message, setMessage] = useState(null);

  useEffect(() => {
    console.log("⏳ Đang kết nối WebSocket...");

    const socket = new SockJS("http://192.168.1.208:8888/ws-notify");
    const stompClient = Stomp.over(socket);

    stompClient.debug = () => {};

    stompClient.connect({}, () => {
      console.log("🎉 WebSocket CONNECTED!");

      const topic = "/topic/order/1234";
      console.log("📌 Subscribe vào:", topic);

      stompClient.subscribe(topic, (msg) => {
        const data = JSON.parse(msg.body);
        console.log("📦 Message JSON:", data);
        setMessage(data);
      });
    });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Listening WebSocket...</h1>

      {message ? (
        <div style={{ marginTop: 20, padding: 15, border: "1px solid #ccc" }}>
          <h3>📩 Thông điệp nhận được:</h3>

          <p><b>Order ID:</b> {message.orderId}</p>
          <p><b>Status:</b> {message.status}</p>

          {/* ⭐ Nếu message là URL → hiển thị ảnh */}
          {/^https?:\/\//i.test(message.message) ? (
            <div>
              <p><b>Ảnh QR từ server:</b></p>
              <img
                src={message.message}
                alt="QR Payment"
                style={{ maxWidth: "300px", height: "auto", borderRadius: 8 }}
              />
            </div>
          ) : (
            <p><b>Message:</b> {message.message}</p>
          )}
        </div>
      ) : (
        <p>⏳ Chưa nhận được thông điệp...</p>
      )}
    </div>
  );
}
