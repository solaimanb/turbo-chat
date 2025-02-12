import Peer from "simple-peer";
import { Socket } from "socket.io-client";

interface CallSignalData {
  fromUserId: string;
  signal: Peer.SignalData;
}

class WebRTCService {
  private peer: Peer.Instance | null = null;
  private localStream: MediaStream | null = null;
  private socket: Socket;

  constructor(socket: Socket) {
    this.socket = socket;
  }

  async startCall(remoteUserId: string, isInitiator: boolean): Promise<void> {
    try {
      // Validate STUN/TURN configuration
      const iceServers: RTCIceServer[] = [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:relay1.expressturn.com:3478",
          username: "efQZWEG6AZABVUX9JK",
          credential: "9KyTq00gxMPtl3DV",
        },
      ];
      console.log("Using ICE servers:", iceServers);

      // Get user media (microphone)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Initialize WebRTC peer connection
      this.peer = new Peer({
        initiator: isInitiator,
        trickle: true,
        stream: this.localStream,
        config: { iceServers },
      });

      // Handle signaling data exchange via Socket.IO
      this.peer.on("signal", (data: Peer.SignalData) => {
        console.log("Sending WebRTC signal:", data);
        this.socket.emit("call-signal", {
          toUserId: remoteUserId,
          signal: data,
        });
      });

      // Handle remote stream
      this.peer.on("stream", (remoteStream: MediaStream) => {
        console.log("Remote stream received:", remoteStream);
        const audioElement = document.getElementById(
          "remote-audio"
        ) as HTMLAudioElement;
        if (audioElement) {
          audioElement.srcObject = remoteStream;
          audioElement.play().catch((err) => {
            console.error("Error playing remote audio:", err);
            alert("Audio playback failed. Please check your browser settings.");
          });
        } else {
          console.error("Remote audio element not found");
          alert("Audio playback failed. Please check your browser settings.");
        }
      });

      // Handle peer errors
      this.peer.on("error", (err) => {
        console.error("WebRTC peer error:", err);
        alert("An error occurred during the call. Please try again.");
      });

      // Listen for signaling data from the other peer
      this.socket.off("call-signal");
      this.socket.on(
        "call-signal",
        ({ fromUserId, signal }: CallSignalData) => {
          console.log(`Received WebRTC signal from ${fromUserId}`);
          if (this.peer && fromUserId === remoteUserId) {
            this.peer.signal(signal);
          }
        }
      );

      // Listen for incoming ICE candidates
      this.socket.on("ice-candidate", ({ candidate }) => {
        console.log("Received ICE candidate:", candidate);
        if (this.peer) {
          this.peer.signal(candidate);
        }
      });
    } catch (error) {
      console.error("Error starting call:", error);
      alert("Failed to access microphone. Please check your permissions.");
    }
  }

  endCall(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
    if (this.peer) {
      this.peer.destroy();
    }
    this.peer = null;
    this.localStream = null;
  }

  toggleMute(): void {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        console.log("Audio track enabled:", audioTracks[0].enabled);
      }
    }
  }
}

export default WebRTCService;
