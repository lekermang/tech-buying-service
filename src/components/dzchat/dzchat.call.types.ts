/* eslint-disable @typescript-eslint/no-explicit-any */

export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

export type CallMode = "normal" | "ptt";
export type CallStatus = "calling" | "ringing" | "connected" | "ended";

export interface Participant {
  id: number;
  name: string;
  avatar_url?: string;
  speaking?: boolean;
}

export interface CallProps {
  me: any;
  token: string;
  chat?: any;
  incomingCall?: any;
  onClose: () => void;
}
