import useWebSocket, { ReadyState } from "react-use-websocket";
import { useCallback, useEffect, useState } from "react";
import useDict from "../useDict";
import Peer from "simple-peer";

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
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [muted, setMuted] = useState(false);
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

  useEffect(() => {
    if (readyState !== ReadyState.OPEN) {
      return;
    }


    setIsConnected(true);
  }, [readyState]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      const timer = setInterval(() => {
        // Wait for the element to be rendered
        const element = document.getElementById(opts.localVideoRefId) as HTMLVideoElement;
        if (element == null) {
          return;
        }

        element.srcObject = stream;
        setMuted(true);
        send(PackageType.INIT, {});
        clearInterval(timer);
      }, 100);
    })();
  }, [isConnected, opts.localVideoRefId, send]);

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
    // if (localStream == null) {
    //   return;
    // }
    
    // // mute all remote tracks
    // streams.values().forEach((stream) => {
    //   stream.getAudioTracks().forEach(track => {
    //     track.enabled = !deafened;
    //   });
    // });
    // setDeafened(!deafened);
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