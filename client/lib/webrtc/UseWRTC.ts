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
    width: 640,
    height: 480,
    aspectRatio: 1.777777778,
    frameRate: { max: 30 },
    facingMode: {
      ideal: "user",
    },
  },
};

enum PackageType {
  INIT,
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
  const { sendMessage, lastMessage, readyState } = useWebSocket(process.env.NEXT_PUBLIC_SOCKET_URI as string, {});
  const [id] = useLocalStorage({ key: "uuid", defaultValue: v4() });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [muted, setMuted] = useState(true);
  const peers = useDict<string, Peer.Instance>();
  const streams = useDict<string, MediaStream>();

  const send = (type: PackageType, data: any) => {
    sendMessage(JSON.stringify({
      type,
      ...data
    }));
  }

  const handleJoin = (uid: string, initiator: boolean) => {
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
      send(PackageType.SIGNAL, {
        uid,
        signal
      });
    });

    peer.on("stream", (stream) => {
      streams.set(uid, stream);

      if(deafened) {
        stream.getAudioTracks().forEach(track => track.enabled = false);
      }
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
        case PackageType.INIT: {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          setLocalStream(stream);

          const element = document.getElementById(opts.localVideoRefId) as HTMLVideoElement;
          if (element == null) {
            console.error(`Invalid local source object :(`);
            return;
          }

          element.srcObject = stream;

          send(PackageType.INIT, {});
        } break;

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
          send(PackageType.CLIENT_JOINED_ACK, {
            uid: packet.uid
          });
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

  const toggleMuted = () => {
    if (localStream == null) {
      return;
    }

    localStream.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });
    setMuted(!muted);
  }

  const toggleVideo = () => {
    if (localStream == null) {
      return;
    }

    localStream.getVideoTracks().forEach(track => {
      track.enabled = videoEnabled;
    });
    setVideoEnabled(!videoEnabled);
  }

  const toggleDeafened = () => {
    setDeafened(!deafened);

    if (localStream == null) {
      return;
    }

    // mute all remote tracks
    streams.values().forEach((stream) => {
      stream.getAudioTracks().forEach(track => {
        track.enabled = deafened;
      });
    });
  }

  return {
    isConnected,
    toggleMuted,
    muted,
    toggleDeafened,
    deafened,
    toggleVideo,
    videoEnabled,
    remoteStreams: streams
  }
}