// wsOrder.js
import SockJS from "sockjs-client/dist/sockjs";
import { Stomp } from "@stomp/stompjs";

let stompClient = null;
const connectCallbacks = [];
const listeners = new Set();
const subscriptions = new Map(); // ✅ orderId -> subscription

export const connectWS = () => {
  if (stompClient && stompClient.connected) return;

  const socket = new SockJS("http://localhost:8888/ws-notify");
  stompClient = Stomp.over(socket);
  stompClient.debug = () => {};

  stompClient.connect({}, () => {
    console.log("🌐 WS CONNECTED");
    connectCallbacks.forEach((fn) => fn());
    connectCallbacks.length = 0;
  });
};

// lắng nghe WS chung
export const onOrderNotify = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

// subscribe theo orderId
export const subscribeOrder = (orderId, onSubscribed) => {
  if (!orderId) return;

  const doSubscribe = () => {
    if (subscriptions.has(orderId)) {
      console.log("⚠️ Already subscribed:", orderId);
      if (onSubscribed) onSubscribed();   // 🔥 Vẫn gọi callback nếu đã sub trước đó
      return;
    }

    const topic = `/topic/order/${orderId}`;
    console.log("📡 SUB:", topic);

    const sub = stompClient.subscribe(topic, (msg) => {
      try {
        const data = JSON.parse(msg.body);
        console.log("📥 WS MESSAGE:", data);
        listeners.forEach((fn) => fn(data));
      } catch (e) {
        console.error("❌ WS parse error", e);
      }
    });

    subscriptions.set(orderId, sub);

    // 🔥 Callback để báo FE biết SUBSCRIBE XONG
    if (onSubscribed) onSubscribed();
  };

  // Nếu WS chưa connected thì chờ
  if (!stompClient?.connected) {
    connectCallbacks.push(() => doSubscribe());
  } else {
    doSubscribe();
  }
};

// ✅ unsubscribe khi không cần nữa
export const unsubscribeOrder = (orderId) => {
  const sub = subscriptions.get(orderId);
  if (sub) {
    sub.unsubscribe();
    subscriptions.delete(orderId);
    console.log("🧹 UNSUB:", orderId);
  }
};
