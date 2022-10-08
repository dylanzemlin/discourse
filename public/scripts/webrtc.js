// https://github.com/Dirvann/webrtc-video-conference-simple-peer
// Currently using the script from this repository. Lots of changes will be made in the future to adapt it
// to our project.

const peers = {};
const constraints = {
	audio: false,
	video: {
		width: {
			max: 300
		},
		height: {
			max: 300
		},
		facingMode: {
			ideal: "user"
		}
	}
}

let localStream;
let socket;
let uid;

const configuration = {
	"iceServers": [
		{
			urls: "stun:openrelay.metered.ca:80"
		},
		{
			urls: "turn:openrelay.metered.ca:80",
			username: "openrelayproject",
			credential: "openrelayproject"
		},
		{
			urls: "turn:openrelay.metered.ca:443",
			username: "openrelayproject",
			credential: "openrelayproject"
		},
		{
			urls: "turn:openrelay.metered.ca:443?transport=tcp",
			username: "openrelayproject",
			credential: "openrelayproject"
		}
	]
}

function removePeer(socket_id) {
	let videoEl = document.getElementById(socket_id)
	if (videoEl) {
		const tracks = videoEl.srcObject.getTracks();

		tracks.forEach(function (track) {
			track.stop()
		})

		videoEl.srcObject = null
		videoEl.parentNode.removeChild(videoEl)
	}
	if (peers[socket_id]) peers[socket_id].destroy()
	delete peers[socket_id]
}

function addPeer(socket_id, am_initiator) {
	peers[socket_id] = new SimplePeer({
		initiator: am_initiator,
		stream: localStream,
		config: configuration
	})

	peers[socket_id].on('signal', data => {
		if(data.renegotiate || data.transceiverRequest) {
			return;
		}

		socket.send(JSON.stringify({
			id: "signal",
			signal: data,
			socket_id: socket_id
		}));
	})

	peers[socket_id].on('stream', stream => {
		let newVid = document.createElement('video');
		newVid.srcObject = stream
		newVid.id = socket_id
		newVid.playsinline = false
		newVid.autoplay = true
		newVid.className = "vid"
		newVid.onclick = () => openPictureMode(newVid)
		newVid.ontouchstart = (e) => openPictureMode(newVid)
		videos.appendChild(newVid)
	})
}

function openPictureMode(el) {
	el.requestPictureInPicture();
}

navigator.mediaDevices.getUserMedia(constraints).then(stream => {
	localStream = stream;

	// TODO: Adjust based on environment variables
	socket = new WebSocket("wss://discourse.dylanzeml.in/socket");
	socket.addEventListener("open", () => {
		localVideo.srcObject = stream;
	});

	socket.addEventListener("message", (event) => {
		const data = JSON.parse(event.data);
		switch(data.id) {
			case "hello": {
				const id = data.socket_id;
				uid = id;
			} break;

			case "signal": {
				console.log(data.signal);
				peers[data.socket_id].signal(data.signal);
			} break;

			case "client_disconnected": {
				removePeer(data.socket_id);
			} break;

			case "client_connected": {
				addPeer(data.socket_id, false);
				socket.send(JSON.stringify({
					id: "client_connected_ack",
					socket_id: data.socket_id
				}));
			} break;
			
			case "client_connected_ack": {
				addPeer(data.socket_id, true);
			} break
		}
	});

	socket.addEventListener("close", () => {
		for(const id in peers) {
			removePeer(id);
		}
	});
});