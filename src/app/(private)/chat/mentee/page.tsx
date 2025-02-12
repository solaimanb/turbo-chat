"use client";

import socket from "@/lib/socket";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const MenteeChat = () => {
  const [incomingCall, setIncomingCall] = useState<string | null>(null);
  const router =  useRouter();

  useEffect(() => {
    // Join the mentee's room
    socket.emit("join-room", { userId: "mentee221", role: "mentee" });

    // Listen for incoming calls
    socket.on("incoming-call", ({ callerId }) => {
      setIncomingCall(callerId);
    });

    return () => {
      socket.off("incoming-call");
    };
  }, []);

  const acceptCall = () => {
    setIncomingCall(null);
    router.push(`/voice-call?username=mentor112`);
  };

  return (
    <div>
      <h1 className="text-xl font-bold">Mentee Chat</h1>
      {incomingCall && (
        <div className="mt-4 p-4 bg-gray-100 border rounded">
          <p>Incoming call from {incomingCall}</p>
          <button
            onClick={acceptCall}
            className="bg-green-500 text-white px-2 py-1 rounded mt-2"
          >
            Accept Call
          </button>
        </div>
      )}
    </div>
  );
};

export default MenteeChat;