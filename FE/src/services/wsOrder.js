// wsOrder.js
import SockJS from "sockjs-client/dist/sockjs";
import { Stomp } from "@stomp/stompjs";
import { API_BASE_URL_SOCKET } from "../services/api";

let stompClient = null;
const connectCallbacks = [];
const listeners = new Set();
const subscriptions = new Map(); // orderId -> subscription instance

export const connectWS = () => {
  if (stompClient && stompClient.connected) return;

  const socket = new SockJS(API_BASE_URL_SOCKET);
  stompClient = Stomp.over(socket);
  stompClient.debug = () => {};

  stompClient.connect({}, () => {
    console.log("🌐 WS CONNECTED");

    connectCallbacks.forEach((fn) => fn());
    connectCallbacks.length = 0;
  });
};

// Listener chung cho tất cả order
export const onOrderNotify = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

// === SUBSCRIBE KHÔNG CALLBACK ===
export const subscribeOrder = (orderId) => {
  if (!orderId) return;

  const doSubscribe = () => {
    // ĐÃ SUB RỒI → BỎ QUA
    if (subscriptions.has(orderId)) {
      console.log("⚠️ Already subscribed:", orderId);
      return;
    }

    const topic = `/topic/order/${orderId}`;
    console.log("📡 SUB:", topic);

    const sub = stompClient.subscribe(topic, (msg) => {
      try {
        const data = JSON.parse(msg.body);
        console.log("📥 WS MESSAGE:", data);
        listeners.forEach((fn) => fn(data));
      } catch (err) {
        console.error("❌ WS parse error", err);
      }
    });

    subscriptions.set(orderId, sub);
  };

  if (!stompClient?.connected) {
    connectCallbacks.push(() => doSubscribe());
  } else {
    doSubscribe();
  }
};

// Hủy sub
export const unsubscribeOrder = (orderId) => {
  const sub = subscriptions.get(orderId);
  if (sub) {
    sub.unsubscribe();
    subscriptions.delete(orderId);
    console.log("🧹 UNSUB:", orderId);
  }
};
