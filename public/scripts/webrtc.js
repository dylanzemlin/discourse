// https://github.com/Dirvann/webrtc-video-conference-simple-peer
// Currently using the script from this repository. Lots of changes will be made in the future to adapt it
// to our project.

let local_socket_id = undefined;

const peers = {};
const constraints = {
  audio: false,
  video: {
    width: {
      min: 640,
      ideal: 1280,
      max: 1920,
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

let localStream;
let socket;

const configuration = {
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
  ],
};

function removePeer(socket_id) {
  let videoEl = document.getElementById(socket_id);
  if (videoEl) {
    const tracks = videoEl.srcObject.getTracks();

    tracks.forEach(function (track) {
      track.stop();
    });

    videoEl.srcObject = null;
    videoEl.parentNode.removeChild(videoEl);
  }
  if (peers[socket_id]) peers[socket_id].destroy();
  delete peers[socket_id];
}

function addPeer(socket_id, am_initiator) {
  peers[socket_id] = new SimplePeer({
    initiator: am_initiator,
    stream: localStream,
    config: configuration,
  });

  peers[socket_id].on("signal", (data) => {
    socket.emit("signal", {
      signal: data,
      socket_id: socket_id,
    });
  });

  peers[socket_id].on("stream", (stream) => {
    let newVid = document.createElement("video");
    newVid.srcObject = stream;
    newVid.id = socket_id;
    newVid.playsinline = false;
    newVid.autoplay = true;
    newVid.className = "vid";
    newVid.onclick = () => openPictureMode(newVid);
    newVid.ontouchstart = (e) => openPictureMode(newVid);
    videos.appendChild(newVid);
  });
}

function openPictureMode(el) {
  el.requestPictureInPicture();
}

navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
  localStream = stream;

  // TODO: Adjust based on environment variables
  const socket = new WebSocket(
    environment === "development"
      ? "ws://localhost:3000/socket"
      : "wss://discourse.dylanzeml.in/socket"
  );
  socket.addEventListener("open", () => {
    localVideo.srcObject = stream;
  });

  $("#chat_form").submit((e) => {
    e.preventDefault();
    socket.send(
      JSON.stringify({
        id: "chat_message",
        message: $("#chat_input").val(),
        name: user.name,
      })
    );
    $("#chat_input").val("");
  });

  socket.addEventListener("message", (event) => {
    const json = JSON.parse(event.data);
    switch (json.id) {
      case "signal":
        {
          peers[json.socket_id].signal(json.signal);
        }
        break;

      case "client_disconnected":
        {
          removePeer(json.socket_id);
        }
        break;

      case "client_connected":
        {
          if (local_socket_id == undefined) {
            local_socket_id = json.socket_id;
          }

          addPeer(json.socket_id, false);
          socket.send(
            JSON.stringify({
              id: "client_connected_ack",
              socket_id: local_socket_id,
            })
          );
        }
        break;

      case "client_connected_ack":
        {
          addPeer(json.socket_id, true);
        }
        break;

      case "chat_message":
        {
          const newMessage = $('<div class="d-flex"></div>');
          newMessage.className = "container d-flex";

          const newMessageText = $(
            `<p class="text-center mb-0" style="font-size: 1.3rem;"><small class="font-weight-bold text-center mb-0">${json.name}:&nbsp;</small>${json.message}</p>`
          );

          newMessage.append(newMessageText);
          $("#chat_container").append(newMessage);
        }
        break;
    }
  });

  socket.addEventListener("close", () => {
    for (const id in peers) {
      removePeer(id);
    }
  });
});
