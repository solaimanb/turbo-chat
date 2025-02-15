import { Socket } from "socket.io-client";
import {
  CallEventData,
  CallSignalData,
  IceCandidateData,
} from "@/types/webrtc.types";
import Peer from "simple-peer";

type CallAnswerListener = (answer: boolean) => void;
type IncomingCallListener = (callerId: string) => void;
type CallSignalListener = (data: CallSignalData) => void;
type IceCandidateListener = (candidate: RTCIceCandidateInit) => void;
type CallRejectedListener = (message: string) => void;
type CallEndListener = (roomId: string) => void;

export class SocketEvents {
  private socket: Socket;
  private listeners: {
    [event: string]:
      | CallAnswerListener
      | IncomingCallListener
      | CallSignalListener
      | IceCandidateListener
      | CallRejectedListener
      | CallEndListener;
  } = {};

  constructor(socket: Socket) {
    this.socket = socket;
  }

    sendCallSignal(toUserId: string, signal: Peer.SignalData): void {
    console.log(`📡 Sending WebRTC signal to ${toUserId}`);
    this.socket.emit("call-signal", { toUserId, signal });
  }

  onCallSignal(callback: CallSignalListener): void {
    this.socket.on("call-signal", ({ fromUserId, signal }: CallSignalData) => {
      console.log(`📡 Received WebRTC signal from ${fromUserId}`);
      callback({ fromUserId, signal });
    });
  }

  sendIceCandidate(toUserId: string, candidate: RTCIceCandidateInit): void {
    console.log(`🧊 Sending ICE candidate to ${toUserId}`, candidate);
    this.socket.emit("ice-candidate", { toUserId, candidate });
  }


  initiateCall(callerId: string, calleeId: string): void {
    console.log(`📞 Initiating call from ${callerId} to ${calleeId}`);
    this.socket.emit("initiate-call", { callerId, calleeId });
  }

  onIncomingCall(callback: IncomingCallListener): void {
    this.socket.on("incoming-call", ({ callerId }: CallEventData) => {
      console.log(`onIncomingCall - 📞 Incoming call from ${callerId}`);
      callback(callerId);
    });
  }

  onIceCandidate(callback: IceCandidateListener): void {
    this.socket.on("ice-candidate", ({ candidate }: IceCandidateData) => {
      console.log(`🧊 Received ICE candidate`, candidate);
      callback(candidate);
    });
  }

  rejectCall(callerId: string): void {
    console.log(`🚫 Rejecting call from ${callerId}`);
    this.socket.emit("call-rejected", { callerId });
  }

  onCallRejected(callback: CallRejectedListener): void {
    this.socket.on("call-rejected", ({ message }: CallEventData) => {
      console.log(`🚫 Call rejected. Message: ${message}`);
      callback(message);
    });
  }

  answerCall(calleeId: string, callerId: string, answer: boolean): void {
    console.log(
      `answerCall - 📞 Answering call from ${callerId} by ${calleeId} & ${answer}`
    );
    this.socket.emit("call-answer", { calleeId, callerId, answer });
  }

  onCallAnswer(callback: CallAnswerListener): void {
    const eventName = "call-answered";
    if (this.listeners[eventName]) {
      this.socket.off(eventName, this.listeners[eventName]);
    }
    this.listeners[eventName] = (answer: boolean) => {
      console.log(`onCallAnswer - 📞 Call answered at: ${answer}`);
      callback(answer);
    };
    this.socket.on(eventName, this.listeners[eventName] as CallAnswerListener);
  }

  removeAllListeners(): void {
    Object.keys(this.listeners).forEach((eventName) => {
      this.socket.off(eventName, this.listeners[eventName]);
    });
    this.listeners = {};
  }

  endCall(roomId: string): void {
    console.log(`⏹ Ending call in room: ${roomId}`);
    this.socket.emit("call-end", { roomId });
  }

  onCallEnd(callback: CallEndListener): void {
    this.socket.on("call-end", ({ roomId }: CallEventData) => {
      console.log(`⏹ Call ended in room: ${roomId}`);
      callback(roomId);
    });
  }
}
