import Peer from "simple-peer";

// Interface for ICE candidate data
export interface IceCandidateData {
  candidate: RTCIceCandidateInit;
}

// Interface for WebRTC signaling data
export interface CallSignalData {
  fromUserId: string;
  signal: Peer.SignalData;
}

// Interface for call-related events
export interface CallEventData {
  callerId: string;
  calleeId?: string;
  roomId: string;
  message: string;
}

// Interface for call-answer event payload
export interface CallAnswerData {
  calleeId: string;
  callerId: string;
  answer: boolean;
}

// Interface for call-answered event payload
export interface CallAnsweredData {
  answer: boolean;
}