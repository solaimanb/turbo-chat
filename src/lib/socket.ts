import { io } from "socket.io-client";

// Initiate Socket.IO connection
const socket = io("http://localhost:8000", {
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("connect_error", (err) => {
  console.error("Connection error", err);
});

export default socket;
