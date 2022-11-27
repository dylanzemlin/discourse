import useWebSocket, { ReadyState } from "react-use-websocket";
import { useEffect, useState } from "react";
import useDict from "../useDict";

const iceServers: RTCIceServer[] = [
  {
    urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
  }
]

export type WRTCOptions = {
  remoteUri?: string;
  localVideoRefId: string;
  // onUserConnect: (userId: string, stream: MediaStream) => void;
  // onUserDisconnect: (userId: string) => void;
}

export default function useWRTC(opts: WRTCOptions) {
  const { sendMessage, lastMessage, readyState } = useWebSocket(opts.remoteUri ?? "ws://localhost:3000/");

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connection, setConnection] = useState<RTCPeerConnection | null>(null);
  const remoteStreams = useDict<string, MediaStream>();

  useEffect(() => {
    if(lastMessage == null) {
      return;
    }
    
    const packet = JSON.parse(lastMessage.data);
  }, [lastMessage]);

  useEffect(() => {
    if(readyState !== ReadyState.OPEN) {
      return;
    }

    setVideoEnabled(true);
  }, [readyState]);

  useEffect(() => {
    if(connection == null) {
      setConnection(new RTCPeerConnection({ iceServers }));
      return;
    }

    if(connection != null && localStream != null) {
      return;
    }

    (async () => {
      setLocalStream(await navigator.mediaDevices.getUserMedia({ video: true, audio: true }));

      localStream?.getTracks().forEach(track => {
        connection.addTrack(track, localStream);
      });

      const element = document.getElementById(opts.localVideoRefId) as HTMLVideoElement;
      if(element == null) {
        console.error(`Invalid local source object :(`);
        return;
      }

      console.log("setting source object :)")
      element.srcObject = localStream;
    })();
  }, [connection, localStream, opts.localVideoRefId]);

  const setMuted = (muted: boolean) => {

  }

  const setVideoEnabled = (enabled: boolean) => {
    
  }

  return {
    isConnected,
    setMuted,
    setVideoEnabled
  }
}