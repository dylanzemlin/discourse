import useWebSocket, { ReadyState } from "react-use-websocket";
import { useEffect, useState } from "react";
import useDict from "../useDict";

const iceServers: RTCIceServer[] = [
  {
    urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
  }
]

const constraints = {
  audio: false,
  video: {
    width: {
      min: 640,
      ideal: 1280,
      max: 1280,
    },
    height: {
      min: 480,
      ideal: 720,
      max: 1080,
    },
    aspectRatio: 1.777777778,
    frameRate: { max: 30 },
    facingMode: {
      ideal: "user",
    },
  },
};

export type WRTCOptions = {
  remoteUri?: string;
  localVideoRefId: string;
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
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      stream?.getTracks().forEach(track => {
        connection.addTrack(track, stream);
      });

      const element = document.getElementById(opts.localVideoRefId) as HTMLVideoElement;
      if(element == null) {
        console.error(`Invalid local source object :(`);
        return;
      }
      
      element.srcObject = stream;
    })();
  }, [connection, localStream, opts.localVideoRefId]);

  const setMuted = (muted: boolean) => {

  }

  const setVideoEnabled = (enabled: boolean) => {
    
  }

  return {
    isConnected,
    setMuted,
    setVideoEnabled,
    remoteStreams
  }
}