import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { Stomp } from "@stomp/stompjs";

export default function PaymentNotification() {
  const [messages, setMessages] = useState([]);
  const logEndRef = useRef(null);

  useEffect(() => {
    console.log("⏳ Đang kết nối tới ws-notify...");

    const socket = new SockJS("http://localhost:8888/ws-notify");   // FIX!
    const stompClient = Stomp.over(socket);
    stompClient.debug = () => {};

    stompClient.connect({}, () => {
      console.log("🎉 WS CONNECTED");

      const topic = "/topic/order/**";   // hoặc /topic/order/<orderId>
      console.log("📌 Subscribe:", topic);

      stompClient.subscribe(topic, (msg) => {
        const data = JSON.parse(msg.body);
        console.log("📥 Received:", data);

        const entry = {
          time: new Date().toLocaleTimeString(),
          data,
        };

        setMessages((prev) => [...prev, entry]);
      });
    });

    return () => {
      stompClient.disconnect();
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Live WebSocket Messages</h1>

      <div
        style={{
          marginTop: 20,
          padding: 15,
          border: "1px solid #333",
          height: "70vh",
          overflowY: "auto",
          borderRadius: 8,
          background: "#000",
          color: "lime",
          fontFamily: "monospace",
        }}
      >
        {messages.length === 0 ? (
          <p>Đang chờ thông điệp WebSocket...</p>
        ) : (
          messages.map((log, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <div>[{log.time}]</div>
              <pre style={{ color: "#0f0" }}>
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
