"use client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import socket from "@/lib/socket";
import { SocketEvents } from "@/lib/SocketEvents";
import WebRTCService from "@/lib/webrtc/WebRTCService";
import { useCallStore } from "@/store/callStore";
import {
  Cast,
  CircleUserRound,
  EllipsisVertical,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const VoiceCall = () => {
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [activeRightPanel, setActiveRightPanel] = useState<
    "participants" | "chat"
  >("participants");
  const searchParams = useSearchParams();
  const router = useRouter();

  const { activeCall, incomingCall, localStream, remoteStream, setCallStatus } =
    useCallStore();

  console.log("Remote Stream:", remoteStream);

  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const webRTCService = useRef(
    new WebRTCService(new SocketEvents(socket))
  ).current;

  // Attach remote stream to audio element
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch((error) => {
        console.error("Error playing remote audio:", error);
      });
    }
  }, [remoteStream]);

  // Initialize call
  useEffect(() => {
    const username = searchParams.get("username");
    if (username) {
      const isInitiator = window.location.hash === "#init";
      webRTCService.startCall(username, isInitiator);
    } else {
      console.error("No remote username found in query params");
      alert("Invalid call setup. Please try again.");
    }

    return () => webRTCService.endCall();
  }, [searchParams, webRTCService]);

  const toggleMute = () => {
    webRTCService.toggleMute();
  };

  const endCall = () => {
    webRTCService.endCall();
    setCallStatus("idle");
    router.back();
  };

  const toggleRightPanel = (panel: "participants" | "chat") => {
    if (activeRightPanel === panel && showRightPanel) {
      setShowRightPanel(false);
    } else {
      setShowRightPanel(true);
      setActiveRightPanel(panel);
    }
  };

  return (
    <div className="flex flex-col h-screen p-3 gap-3 bg-gray-900">
      {/* Top Layout */}
      <div className="flex flex-1 rounded-lg overflow-hidden gap-3">
        {/* Left Side */}
        <div className="flex-1 flex flex-col items-center justify-center rounded-lg bg-gray-800 min-w-40">
          <div className="w-20 h-20 rounded-full bg-muted-foreground flex items-center justify-center mb-4">
            <CircleUserRound size={24} />
          </div>
          <p className="text-xl font-semibold">
            {incomingCall}
            {activeCall}
          </p>
        </div>

        {/* Right Side */}
        {showRightPanel && (
          <div className="w-72 flex flex-col bg-gray-950 rounded-lg p-4 transition-all duration-300 ease-in-out">
            {activeRightPanel === "participants" ? (
              <div>
                <div className="flex items-center gap-2">
                  <Cast size={26} className="bg-gray-800 p-1 rounded" />
                  <h2 className="text-lg font-bold">Participants</h2>
                </div>
                <Separator className="my-3" />
                <ul className="space-y-2 bg-gray-900 p-3 rounded-lg">
                  <li className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CircleUserRound size={20} />
                      <span>
                        {searchParams.get("username") || "Unknown User"}
                      </span>
                    </div>
                    <EllipsisVertical size={16} />
                  </li>
                </ul>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2">
                  <MessageSquare
                    size={26}
                    className="bg-gray-800 p-1 rounded"
                  />
                  <h2 className="text-lg font-bold">Chat</h2>
                </div>
                <Separator className="my-3" />
                <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-y-auto">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <span className="font-bold">User:</span>
                      <span>Hello!</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold">You:</span>
                      <span>Hi there!</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 p-2 rounded-lg placeholder:text-sm"
                  />
                  <Button variant="default" size="icon">
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Layout */}
      <div className="flex justify-around items-center p-3 bg-gray-950 rounded-lg">
        <div className="flex items-center gap-6 lg:gap-8 rounded-lg justify-center">
          <button
            onClick={() => toggleRightPanel("participants")}
            className={`p-2 rounded-lg ${
              showRightPanel && activeRightPanel === "participants"
                ? "bg-blue-600"
                : "bg-blue-400"
            } hover:scale-110 transition-transform`}
          >
            <Users size={20} />
          </button>
          <Button
            onClick={toggleMute}
            variant={
              localStream?.getAudioTracks()[0]?.enabled
                ? "default"
                : "destructive"
            }
          >
            {localStream?.getAudioTracks()[0]?.enabled ? (
              <Mic size={20} />
            ) : (
              <MicOff size={20} />
            )}
          </Button>
          <button
            onClick={() => toggleRightPanel("chat")}
            className={`p-2 rounded-lg ${
              showRightPanel && activeRightPanel === "chat"
                ? "bg-blue-600"
                : "bg-blue-500"
            } hover:scale-110 transition-transform`}
          >
            <MessageSquare size={20} />
          </button>
          <Button onClick={endCall} variant="destructive">
            <PhoneOff size={20} />
          </Button>
        </div>
      </div>

      {/* Audio Element for Remote Stream */}
      <audio
        id="remote-audio"
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />
    </div>
  );
};

export default VoiceCall;
