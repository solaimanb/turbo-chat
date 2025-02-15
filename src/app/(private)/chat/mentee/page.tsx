"use client";
import socket from "@/lib/socket";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useCallStore } from "@/store/callStore";
import { SocketEvents } from "@/lib/SocketEvents";

const MenteeChat = () => {
  const { incomingCall, callStatus, setIncomingCall } = useCallStore();
  const router = useRouter();
  const socketEvents = useMemo(() => new SocketEvents(socket), []);

  // Emit 'join-room' event when the component mounts
  useEffect(() => {
    console.log("Mentee joined the room");
    socket.emit("join-room", { userId: "mentee221", role: "mentee" });

    // Listen for incoming calls
    socketEvents.onIncomingCall((callerId) => {
      setIncomingCall(callerId);
      useCallStore.getState().setCallStatus("ringing");
    });

    // Cleanup function to remove listeners when the component unmounts
    return () => {
      socketEvents.onIncomingCall(() => {});
    };
  }, [setIncomingCall, socketEvents]);

  const acceptCall = () => {
    if (incomingCall) {
      console.log("Incoming call at MenteeChat(acceptCall):", incomingCall);
      console.log("SocketEvents at - acceptCall():", socketEvents);
  
      // Initialize WebRTCService here before navigating
      // const webRTCService = new WebRTCService(socketEvents);
      // console.log("WebRTCService at - acceptCall():", webRTCService);
      // webRTCService.startCall(incomingCall, false);
  
      socketEvents.answerCall("mentee221", incomingCall, true);
      useCallStore.getState().setCallStatus("connected");
      router.push(`/voice-call?username=${incomingCall}`);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      socketEvents.rejectCall(incomingCall);
      setIncomingCall(null);
      useCallStore.getState().setCallStatus("idle");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold">Mentee Chat</h1>
      {callStatus === "ringing" && incomingCall && (
        <div className="mt-4 p-4 bg-gray-100 border rounded">
          <p>Incoming call from {incomingCall}</p>
          <button
            onClick={acceptCall}
            className="bg-green-500 text-white px-2 py-1 rounded mt-2"
          >
            Accept Call
          </button>
          <button
            onClick={rejectCall}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            Reject Call
          </button>
        </div>
      )}
    </div>
  );
};

export default MenteeChat;
