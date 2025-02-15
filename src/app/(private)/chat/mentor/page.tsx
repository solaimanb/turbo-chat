"use client";
import { useToast } from "@/hooks/use-toast";
import socket from "@/lib/socket";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useCallStore } from "@/store/callStore";
import { SocketEvents } from "@/lib/SocketEvents";

const MentorChat = () => {
  const [availableMentees, setAvailableMentees] = useState<string[]>([]);
  const { activeCall, setActiveCall } = useCallStore();
  const router = useRouter();
  const { toast } = useToast();

  // Memoize the `socketEvents` object to prevent recreation on every render
  const socketEvents = useMemo(() => new SocketEvents(socket), []);

  // Join the mentor's room when the component mounts
  useEffect(() => {
    const mentorUserId = "mentor112";
    const role = "mentor";

    console.log(`🚀 Joining mentor room: ${mentorUserId}`);
    socket.emit("join-room", { userId: mentorUserId, role });

    return () => {
      // console.log(`🚀 Leaving mentor room: ${mentorUserId}`);
      // socket.emit("leave-room", mentorUserId);
    };
  }, []);

  // Listen for available mentees
  useEffect(() => {
    const handleMenteeJoined = ({ userId }: { userId: string }) => {
      console.log(`🎉 Received mentee-joined event for user: ${userId}`);
      setAvailableMentees((prev) => [...prev, userId]);
    };

    socket.on("mentee-joined", handleMenteeJoined);

    return () => {
      socket.off("mentee-joined", handleMenteeJoined);
    };
  }, []);

  // Listen for call rejection
  useEffect(() => {
    const handleCallRejected = (message: string) => {
      console.log(`🚫 Call rejected. Message: ${message}`);
      toast({
        title: "Call Rejected",
        description: message,
      });
      setActiveCall(null);
    };

    socketEvents.onCallRejected(handleCallRejected);

    return () => {
      socketEvents.onCallRejected(() => {});
    };
  }, [setActiveCall, toast, socketEvents]);

  // Listen for call answer
  useEffect(() => {
    const handleCallAnswer = (data: { answer: RTCSessionDescription }) => {
      if (activeCall) {
        console.log(
          `📞 Call answered by ${activeCall} with answer:`,
          data.answer
        );
        toast({
          title: "Call Accepted",
          description: `Your call with ${activeCall} has been accepted.`,
        });
        useCallStore.getState().setCallStatus("connected");
        router.push(`/voice-call?username=${activeCall}`);
      }
    };

    socket.on("call-answered", handleCallAnswer);

    return () => {
      socket.off("call-answered", handleCallAnswer);
    };
  }, [activeCall, toast, router]);

  // Debugging: Listen for socket connection and disconnection
  useEffect(() => {
    const handleConnect = () => {
      console.log("📞 Socket connected:", socket.id);
    };

    const handleDisconnect = () => {
      console.log("📞 Socket disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  // Initiate a call
  const initiateCall = useCallback(
    (menteeId: string) => {
      console.log(`📞 Initiating call to menteeId: ${menteeId}`);
      setActiveCall(menteeId);
      socketEvents.initiateCall("mentor112", menteeId);
    },
    [setActiveCall, socketEvents]
  );

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