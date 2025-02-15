import React, { useEffect } from "react";

const ConnectionCheck = () => {
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/stream/"); // Adjust URL as per your backend setup

    socket.onopen = () => {
      console.log("✅ WebSocket connection opened");
      socket.send(JSON.stringify({ score: 43 })); // Sending a test variable
    };

    socket.onmessage = (event) => {
      console.log("📩 Message from server:", event.data);
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("❌ WebSocket connection closed");
    };

    return () => {
      socket.close(); // Cleanup on component unmount
    };
  }, []);

  return <div>Checking Connection...</div>;
};

export default ConnectionCheck;