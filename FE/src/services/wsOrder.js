import SockJS from "sockjs-client/dist/sockjs";
import { Stomp } from "@stomp/stompjs";

let stompClient = null;
let connectCallbacks = [];
let notifyCallback = null;

export const connectWS = () => {
  if (stompClient && stompClient.connected) return;

  const socket = new SockJS("http://192.168.1.208:8888/ws-notify");
  stompClient = Stomp.over(socket);

  stompClient.debug = () => {};

  stompClient.connect({}, () => {
    console.log("🌐 WS CONNECTED");

    // chạy các subscribe đã chờ sẵn
    connectCallbacks.forEach((fn) => fn());
    connectCallbacks = [];
  });
};

// Đăng ký order sau khi WS connected
export const subscribeOrder = (orderId) => {
  if (!orderId) return;

  const doSub = () => {
    const topic = `/topic/order/${orderId}`;
    console.log("📡 Subscribed:", topic);

    stompClient.subscribe(topic, (msg) => {
      const data = JSON.parse(msg.body);
      console.log("📩 WS RECEIVED:", data);

      if (notifyCallback) notifyCallback(data);
    });
  };

  // nếu chưa connect → chờ connect xong
  if (!stompClient || !stompClient.connected) {
    connectCallbacks.push(doSub);
  } else {
    doSub();
  }
};

// nơi SalePage đăng ký nhận message
export const onOrderNotify = (callback) => {
  notifyCallback = callback;
};
