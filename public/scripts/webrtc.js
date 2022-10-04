// https://github.com/Dirvann/webrtc-video-conference-simple-peer
// Currently using the script from this repository. Lots of changes will be made in the future to adapt it
// to our project.

const peers = {};
const constraints = {
	audio: true,
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

let stream;
let socket;

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
		socket.emit('signal', {
			signal: data,
			socket_id: socket_id
		})
	})

	peers[socket_id].on('stream', stream => {
		let newVid = document.createElement('video')
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
	console.log('opening pip')
	el.requestPictureInPicture()
}

function switchMedia() {
	if (constraints.video.facingMode.ideal === 'user') {
		constraints.video.facingMode.ideal = 'environment'
	} else {
		constraints.video.facingMode.ideal = 'user'
	}

	const tracks = localStream.getTracks();

	tracks.forEach(function (track) {
		track.stop()
	})

	localVideo.srcObject = null
	navigator.mediaDevices.getUserMedia(constraints).then(stream => {

		for (let socket_id in peers) {
			for (let index in peers[socket_id].streams[0].getTracks()) {
				for (let index2 in stream.getTracks()) {
					if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
						peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
						break;
					}
				}
			}
		}

		localStream = stream
		localVideo.srcObject = stream

		updateButtons()
	})
}

function setScreen() {
	navigator.mediaDevices.getDisplayMedia().then(stream => {
		for (let socket_id in peers) {
			for (let index in peers[socket_id].streams[0].getTracks()) {
				for (let index2 in stream.getTracks()) {
					if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
						peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
						break;
					}
				}
			}

		}
		localStream = stream

		localVideo.srcObject = localStream
		socket.emit('removeUpdatePeer', '')
	})
	updateButtons()
}

function removeLocalStream() {
	if (localStream) {
		const tracks = localStream.getTracks();

		tracks.forEach(function (track) {
			track.stop()
		})

		localVideo.srcObject = null
	}

	for (let socket_id in peers) {
		removePeer(socket_id)
	}
}

function toggleMute() {
	for (let index in localStream.getAudioTracks()) {
		localStream.getAudioTracks()[index].enabled = !localStream.getAudioTracks()[index].enabled
		muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
	}
}

function toggleVid() {
	for (let index in localStream.getVideoTracks()) {
		localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled
		vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
	}
}

function updateButtons() {
	for (let index in localStream.getVideoTracks()) {
		vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
	}
	for (let index in localStream.getAudioTracks()) {
		muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
	}
}

navigator.mediaDevices.getUserMedia(constraints).then(s => {
	stream = s;
	localVideo.srcObject = s;

	socket = io();
	socket.on('initReceive', socket_id => {
		console.log('INIT RECEIVE ' + socket_id);
		addPeer(socket_id, false);

		socket.emit('initSend', socket_id);
	});

	socket.on('initSend', socket_id => {
		console.log('INIT SEND ' + socket_id);
		addPeer(socket_id, true);
	})

	socket.on('removePeer', socket_id => {
		console.log('removing peer ' + socket_id);
		removePeer(socket_id);
	})

	socket.on('disconnect', () => {
		console.log('GOT DISCONNECTED')
		for (let socket_id in peers) {
			removePeer(socket_id);
		}
	})

	socket.on('signal', data => {
		peers[data.socket_id].signal(data.signal);
	})
});