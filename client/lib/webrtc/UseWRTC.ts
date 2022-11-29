import useWebSocket, { ReadyState } from "react-use-websocket";
import { useCallback, useEffect, useState } from "react";
import useDict from "../useDict";
import Peer from "simple-peer";

const iceConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: "stun:openrelay.metered.ca:80",
    },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302", "stun:stun3.l.google.com:19302", "stun:stun4.l.google.com:19302"],
    }
  ],
  iceCandidatePoolSize: 10
}

const constraints = {
  audio: true,
  video: {
    // width: 640,
    // height: 480,
    aspectRatio: 4 / 3, // 4:3
    frameRate: { max: 30 },
    facingMode: {
      ideal: "user",
    },
  },
};

export enum PackageType {
  // [Server] Used to request a ping from a client
  // [Client] Used to respond to a ping from the server
  PING,

  // [Server] Used to broadcast a new chat message to all clients
  // [Client] Used to send a new chat message to the server
  SEND_CHAT,

  
  INIT,
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
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [deafened, setDeafened] = useState(false);
  const [muted, setMuted] = useState(true);
  const peers = useDict<string, Peer.Instance>();
  const streams = useDict<string, MediaStream>();

  const send = useCallback((type: PackageType, data: any) => {
    const str = JSON.stringify({
      type,
      ...data
    });
    console.log("[send] sending: " + str);
    sendMessage(str);
  }, [sendMessage]);

  const reset = useCallback(() => {
    peers.values().forEach((peer) => {
      peer.destroy();
    });
    peers.clear();

    streams.values().forEach((stream) => {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    });
    streams.clear();
    setIsConnected(false);
    setLocalStream(null);
  }, [peers, streams]);

  const handleJoin = (uid: string, initiator: boolean) => {
    console.log("handleJoin 1");
    if (localStream == null) {
      console.error("[handleJoin] localStream is null!");
      return;
    }

    const peer = new Peer({
      initiator: initiator,
      stream: localStream,
      config: iceConfig
    });

    peers.set(uid, peer);

    peer.on("signal", (signal) => {
      console.log("[handleJoin] signal from peer: " + uid);
      send(PackageType.SIGNAL, {
        uid,
        signal
      });
    });

    peer.on("stream", (stream) => {
      streams.set(uid, stream);
      console.log("[handleJoin] stream from peer: " + uid);

      if (deafened) {
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
        case PackageType.PING: {
          send(PackageType.PING, {});
        } break;

        case PackageType.SIGNAL: {
          const peer = peers.get(packet.uid);
          if (peer == null) {
            return;
          }

          console.log("[messageHandler] stream from peer: " + packet.uid);
          peer.signal(packet.signal);
        } break;

        case PackageType.CLIENT_DISCONNECTED: {
          console.log("[messageHandler] client disconnected: " + packet.uid);
          peers.get(packet.uid)?.destroy();
          streams.get(packet.uid)?.getTracks().forEach((track) => track.stop());

          peers.remove(packet.uid);
          streams.remove(packet.uid);
        } break;

        case PackageType.CLIENT_JOINED: {
          console.log("[messageHandler] client joined: " + packet.uid);
          handleJoin(packet.uid, false);
          send(PackageType.CLIENT_JOINED_ACK, {
            uid: packet.uid
          });
        } break;

        case PackageType.CLIENT_JOINED_ACK: {
          console.log("[messageHandler] client joined ack: " + packet.uid);
          handleJoin(packet.uid, true);
        }

        case PackageType.SEND_CHAT: {
        } break;
      }
    })();
  }, [lastMessage]);

  // Triggered on every connection state change
  useEffect(() => {
    if (readyState === ReadyState.CLOSED) {
      reset();
      setIsConnected(false);
    }

    if (readyState !== ReadyState.OPEN) {
      return;
    }

    setIsConnected(true);
  }, [readyState, reset]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      // Start muted
      for (const track of stream.getAudioTracks()) {
        track.enabled = false;
      }

      const timer = setInterval(() => {
        // Wait for the element to be rendered
        const element = document.getElementById(opts.localVideoRefId) as HTMLVideoElement;
        if (element == null) {
          return;
        }

        element.srcObject = stream;
        send(PackageType.INIT, {});
        clearInterval(timer);
      }, 100);
    })();
  }, [isConnected, opts.localVideoRefId, send]);

  const toggleMuted = () => {
    if (localStream == null) {
      return;
    }

    for (const track of localStream.getAudioTracks()) {
      track.enabled = !track.enabled;
    }
    setMuted(!muted);
  }

  const toggleVideo = () => {
    if (localStream == null) {
      return;
    }

    for (const track of localStream.getVideoTracks()) {
      track.enabled = !videoEnabled;
    }
    setVideoEnabled(!videoEnabled);
  }

  const toggleDeafened = () => {
    if (localStream == null) {
      return;
    }

    // mute all remote tracks
    for (const stream of streams.values()) {
      for (const track of stream.getAudioTracks()) {
        track.enabled = deafened;
      }
    }
    setDeafened(!deafened);
  }

  return {
    isConnected,
    toggleMuted,
    muted,
    toggleDeafened,
    deafened,
    toggleVideo,
    videoEnabled,
    streams
  }
}