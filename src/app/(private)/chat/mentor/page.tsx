"use client";

import socket from "@/lib/socket";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const MentorChat = () => {
  const [availableMentees, setAvailableMentees] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Listen for available mentees
    socket.on("mentee-joined", ({ userId }) => {
        console.log(`🎉 Received mentee-joined event for user: ${userId}`);
        setAvailableMentees((prev) => [...prev, userId]);
      });
      
    return () => {
      socket.off("mentee-joined");
    };
  }, []);

  const initiateCall = (menteeId: string) => {
    socket.emit("initiate-call", {
      callerId: "mentor112",
      calleeId: menteeId,
    });
    router.push(`/voice-call?username=${menteeId}`);
  };

  return (
    <div>
       <h1 className="text-xl font-bold">Available Mentees</h1>
      <ul>
        {availableMentees.map((menteeId) => (
          <li key={menteeId} className="flex items-center gap-2 mt-2">
            <span>{menteeId}</span>
            <button
              onClick={() => initiateCall(menteeId)}
              className="bg-blue-500 text-white px-2 py-1 rounded"
            >
              Call
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MentorChat;
