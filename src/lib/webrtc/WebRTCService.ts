import Peer from "simple-peer";
import { SocketEvents } from "../SocketEvents";
import { useCallStore } from "@/store/callStore";

class WebRTCService {
  private peer: Peer.Instance | null = null;
  private socketEvents: SocketEvents;

  constructor(socketEvents: SocketEvents) {
    this.socketEvents = socketEvents;
  }

  async startCall(remoteUserId: string, isInitiator: boolean): Promise<void> {
    try {
      const iceServers: RTCIceServer[] = [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: process.env.NEXT_PUBLIC_TURN_SERVER_URL!,
          username: process.env.NEXT_PUBLIC_TURN_SERVER_USERNAME!,
          credential: process.env.NEXT_PUBLIC_TURN_SERVER_CREDENTIAL!,
        },
      ];
      console.log("ICE servers:", iceServers);

      // Get user media (microphone)
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      useCallStore.getState().setLocalStream(localStream);
      console.log(
        "Local stream obtained at - Get user media (microphone):",
        localStream
      );

      // Initialize WebRTC peer connection
      this.peer = new Peer({
        initiator: isInitiator,
        trickle: true,
        stream: localStream,
        config: {
          iceServers,
          iceCandidatePoolSize: 10,
        },
      });

      // Listen for generated ICE candidates
      this.peer.on("icecandidate", (candidate) => {
        console.log("Sending ICE candidate:", candidate);
        this.socketEvents.sendIceCandidate(remoteUserId, candidate);
      });

      // Handle signaling data exchange via Socket.IO
      this.peer.on("signal", (data: Peer.SignalData) => {
        console.log("Sending WebRTC signal:", data);
        this.socketEvents.sendCallSignal(remoteUserId, data);
      });

      // Handle remote stream
      this.peer.on("stream", (remoteStream: MediaStream) => {
        console.log("Remote stream received:", remoteStream);
        console.log("Remote stream tracks:", remoteStream.getTracks());
        useCallStore.getState().setRemoteStream(remoteStream);
        useCallStore.getState().setCallStatus("connected");
      });

      // Handle peer errors
      this.peer.on("error", (err: Error) => {
        console.error("WebRTC peer error:", err.message);
        useCallStore.getState().setCallStatus("rejected");
      });

      // Listen for signaling data from the other peer
      this.socketEvents.onCallSignal(({ fromUserId, signal }) => {
        console.log("Received call signal:", signal.type, signal);
        if (this.peer && fromUserId === remoteUserId) {
          this.peer.signal(signal);
        }
      });

      // Listen for incoming ICE candidates
      this.socketEvents.onIceCandidate((candidate: RTCIceCandidateInit) => {
        console.log("Received ICE candidate:", candidate);

        if (this.peer) {
          const rtcIceCandidate = new RTCIceCandidate(candidate);
          const signalData: Peer.SignalData = {
            type: "candidate",
            candidate: rtcIceCandidate,
          };
          this.peer.signal(signalData);
        }
      });

      // Additional debugging logs
      this.peer.on("connect", () => {
        console.log("✅ Connection established");
        useCallStore.getState().setCallStatus("connected");
      });
      
      this.peer.on("close", () => {
        console.log("❌ Connection closed");
        useCallStore.getState().setCallStatus("idle");
      });

      this.peer.on("data", (data) => {
        console.log("Data channel message received:", data);
      });
    } catch (error) {
      console.error("Error starting call:", error);
      useCallStore.getState().setCallStatus("rejected");
      this.socketEvents.rejectCall(remoteUserId);
    }
  }

  endCall(): void {
    if (this.peer) {
      this.peer.removeAllListeners("icecandidate");
      this.peer.destroy();
    }
    useCallStore.getState().setLocalStream(null);
    useCallStore.getState().setRemoteStream(null);
    useCallStore.getState().setCallStatus("idle");
  }

  toggleMute(): void {
    const localStream = useCallStore.getState().localStream;
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        console.log("Audio track enabled:", audioTracks[0].enabled);
      }
    }
  }
}

export default WebRTCService;
