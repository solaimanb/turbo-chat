"use client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import socket from "@/lib/socket";
import WebRTCService from "@/lib/webrtc/WebRTCService";
import {
  Cast,
  CircleUserRound,
  EllipsisVertical,
  MessageSquare,
  MessageSquareText,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const VoiceCall = () => {
  const [remoteUsername, setRemoteUsername] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [activeRightPanel, setActiveRightPanel] = useState<
    "participants" | "chat"
  >("participants");
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize WebRTC service
  const webRTCService = useRef(new WebRTCService(socket)).current;

  useEffect(() => {
    // Extract remote username from query params
    const username = searchParams.get("username");
    if (username) {
      setRemoteUsername(username);

      // Determine if the current peer is the initiator
      const isInitiator = window.location.hash === "#init";

      webRTCService.startCall(username, isInitiator);
    } else {
      console.error("No remote username found in query params");
      alert("Invalid call setup. Please try again.");
    }

    const handleCallEnd = ({roomId}: {roomId: string})=>{
      if(roomId === remoteUsername){
        alert(`${remoteUsername} has left the call.`);
        router.back();
      }
    }

    socket.on("call-end", handleCallEnd);

    // Cleanup on unmount
    return () => {
      webRTCService.endCall();
      socket.off("call-end", handleCallEnd);
    };
  }, [searchParams, webRTCService, remoteUsername, router]);

  // Toggle mute/unmute
  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    webRTCService.toggleMute();
  };

  // End the call
  const endCall = () => {
    webRTCService.endCall();
    socket.emit("call-end", { roomId: remoteUsername });
    router.back();
  };

  // Toggle right panel visibility
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
          {/* Circle Indicator */}
          <div className="w-20 h-20 rounded-full bg-muted-foreground flex items-center justify-center mb-4">
            <CircleUserRound size={24} />
          </div>
          {/* User Name */}
          <p className="text-xl font-semibold">
            {remoteUsername || "Unknown User"}
          </p>
        </div>

        {/* Right Side */}
        {showRightPanel && (
          <div className="w-72 flex flex-col bg-gray-950 rounded-lg p-4 transition-all duration-300 ease-in-out">
            {activeRightPanel === "participants" ? (
              // Connected Users List
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
                      <span>{remoteUsername || "Unknown User"}</span>
                    </div>
                    <EllipsisVertical size={16} />
                  </li>
                </ul>
              </div>
            ) : (
              // Chat Interface
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
                  {/* Chat Messages */}
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
                {/* Chat Input */}
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
          {/* Participants Button */}
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

          {/* Microphone Button */}
          <Button
            onClick={toggleMute}
            variant={isMuted ? "destructive" : "default"}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>

          {/* Chat Button */}
          <button
            onClick={() => toggleRightPanel("chat")}
            className={`p-2 rounded-lg ${
              showRightPanel && activeRightPanel === "chat"
                ? "bg-blue-600"
                : "bg-blue-500"
            } hover:scale-110 transition-transform`}
          >
            <MessageSquareText size={20} />
          </button>

          {/* End Call Button */}
          <Button onClick={endCall} variant="destructive">
            <PhoneOff size={20} />
          </Button>
        </div>
      </div>

      {/* Invisible Audio Element for Remote Stream */}
      <audio id="remote-audio" autoPlay style={{ display: "none" }} />
    </div>
  );
};

export default VoiceCall;
