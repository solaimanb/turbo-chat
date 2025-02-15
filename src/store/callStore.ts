import { create } from "zustand";

interface CallState {
  incomingCall: string | null; // Caller ID
  activeCall: string | null; // Callee ID
  callStatus: "idle" | "ringing" | "connected" | "rejected";
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  // Actions to update state
  setIncomingCall: (callerId: string | null) => void;
  setActiveCall: (recipientId: string | null) => void;
  setCallStatus: (
    status: "idle" | "ringing" | "connected" | "rejected"
  ) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
}

export const useCallStore = create<CallState>((set) => ({
  incomingCall: null,
  activeCall: null,
  callStatus: "idle",
  localStream: null,
  remoteStream: null,

  setIncomingCall: (callerId) => set({ incomingCall: callerId }),
  setActiveCall: (recipientId) => set({ activeCall: recipientId }),
  setCallStatus: (status) => set({ callStatus: status }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
}));
