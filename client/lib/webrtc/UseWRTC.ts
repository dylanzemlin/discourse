import useWebSocket, { ReadyState } from "react-use-websocket";
import { useLocalStorage } from "@mantine/hooks";
import { useEffect, useState } from "react";
import useDict from "../useDict";
import Peer from "simple-peer";
import { v4 } from "uuid";

const iceConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    }
  ]
}

const constraints = {
  audio: false,
  video: {
    aspectRatio: 1.777777778,
    frameRate: { max: 30 },
    facingMode: {
      ideal: "user",
    },
  },
};

enum PackageType {
  CONNECT,
  SEND_CHAT,

  SIGNAL,
  CLIENT_JOINED,
  CLIENT_JOINED_ACK,
  CLIENT_DISCONNECTED
}

export type WRTCOptions = {
  localVideoRefId: string;
}

export default function useWRTC(opts: WRTCOptions) {
  const { sendMessage, lastMessage, readyState } = useWebSocket(process.env.NODE_ENV === "development" ? "ws://10.205.204.144:3001/" : "wss://dcws.dylanzeml.in/", {});
  const [id] = useLocalStorage({
    key: "uuid",
    defaultValue: v4()
  })
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const peers = useDict<string, Peer.Instance>();
  const streams = useDict<string, MediaStream>();

  const handleJoin = (uid: string, initiator: boolean) => {
    console.log(`handleJoin - ${uid} | ${initiator}`);

    if (localStream == null) {
      console.error("localStream is null!");
      return;
    }

    const peer = new Peer({
      initiator: initiator,
      stream: localStream,
      config: iceConfig
    });

    peers.set(uid, peer);

    peer.on("signal", (signal) => {
      sendMessage(JSON.stringify({
        type: PackageType.SIGNAL,
        uid: uid,
        signal
      }));
    });

    peer.on("stream", (stream) => {
      streams.set(uid, stream);
    });
  }

  // Triggered on every message received
  useEffect(() => {
    (async () => {
      if (lastMessage == null) {
        return;
      }

      const packet = JSON.parse(lastMessage.data);
      switch (packet.type) {
        case PackageType.SIGNAL: {
          const peer = peers.get(packet.uid);
          if (peer == null) {
            return;
          }

          peer.signal(packet.signal);
        } break;

        case PackageType.CLIENT_DISCONNECTED: {
          peers.get(packet.uid)?.destroy();
          streams.get(packet.uid)?.getTracks().forEach((track) => track.stop());

          peers.remove(packet.uid);
          streams.remove(packet.uid);
        } break;

        case PackageType.CLIENT_JOINED: {
          handleJoin(packet.uid, false);
          sendMessage(JSON.stringify({
            type: PackageType.CLIENT_JOINED_ACK,
            uid: packet.uid
          }));
        } break;

        case PackageType.CLIENT_JOINED_ACK: {
          handleJoin(packet.uid, true);
        }

        case PackageType.SEND_CHAT: {
        } break;
      }
    })();
  }, [lastMessage]);

  useEffect(() => {
    if (readyState !== ReadyState.OPEN) {
      return;
    }

    setIsConnected(true);
  }, [readyState, sendMessage]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      const element = document.getElementById(opts.localVideoRefId) as HTMLVideoElement;
      if (element == null) {
        console.error(`Invalid local source object :(`);
        return;
      }

      element.srcObject = stream;

      sendMessage(JSON.stringify({
        type: PackageType.CONNECT,
        uid: id
      }));
    })();
  }, [opts.localVideoRefId, isConnected]);

  const setMuted = (muted: boolean) => {
    if (localStream == null) {
      return;
    }

    localStream.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });
  }

  const setVideoEnabled = (enabled: boolean) => {
    localStream?.getVideoTracks().forEach(track => {
      track.enabled = enabled;
    });
  }

  return {
    isConnected,
    setMuted,
    setVideoEnabled,
    remoteStreams: streams
  }
}