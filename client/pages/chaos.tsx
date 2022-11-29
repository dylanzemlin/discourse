import MediaDeviceQuery from "../components/queries/MediaDeviceQuery";
import VerticalDivider from "../components/global/VerticalDivider";
import { Button, Flex, Grid, Group, LoadingOverlay } from "@mantine/core";
import useWRTC from "../lib/webrtc/UseWRTC";
import { useEffect, useRef } from "react";
import Head from "next/head";
import { useAuthentication } from "../lib/context/auth";
import { Headphones, Microphone, Camera } from "tabler-icons-react";

type VideoProps = {
	stream: MediaStream;
	id: string;
}

function Video(props: VideoProps) {
	const ref = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (ref.current) {
			ref.current.srcObject = props.stream;
		}
	}, [props.stream, ref]);

	return (
		<video ref={ref} id={props.id} autoPlay />
	)
}

export default function Home() {
	// Handle all the WebRTC stuff
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const auth = useAuthentication();
	const wrtc = useWRTC({
		localVideoRefId: "localVideo"
	});

	useEffect(() => {
		if (videoRef.current == null || canvasRef.current == null) {
			return;
		}

		videoRef.current.addEventListener("loadedmetadata", () => {
			const context = canvasRef.current?.getContext("2d");
			if (context == null || canvasRef.current == null) {
				return;
			}

			const canvas = canvasRef.current as HTMLCanvasElement;
			// set canvas width/height to match video width/height
			canvas.width = videoRef.current?.videoWidth ?? 0;
			canvas.height = videoRef.current?.videoHeight ?? 0;
				
			context.translate(videoRef.current?.videoWidth ?? 0, 0);
			context.scale(-1, 1);
		});

		videoRef.current.addEventListener("play", () => {
			const context = canvasRef.current?.getContext("2d");
			if (context == null) {
				return;
			}

			const render = () => {
				context.drawImage(videoRef.current as HTMLVideoElement, 0, 0, videoRef.current?.videoWidth ?? 0, videoRef.current?.videoHeight ?? 0);
				requestAnimationFrame(render);
			}
			render();
		});
	}, [videoRef, canvasRef]);

	if (!wrtc.isConnected) {
		return (
			<LoadingOverlay visible={true} />
		)
	}

	return (
		<MediaDeviceQuery
			audio={true}
			video={true}
		>
			<Head>
				<title>Discourse - Chaos</title>
			</Head>
			<Flex>
				<Grid grow m={"lg"}>
					<Grid.Col span={3}>
						<video style={{
							zIndex: -50,
							position: "absolute"
						}} autoPlay muted id="localVideo" ref={videoRef}></video>
						<canvas ref={canvasRef}></canvas>
					</Grid.Col>
					{wrtc.remoteStreams.keys().map((id) => {
						return (
							<Grid.Col key={id} span={2}>
								<Video id={`video:${id}`} stream={wrtc.remoteStreams.get(id)} />
							</Grid.Col>
						)
					})}
				</Grid>
				<Flex style={{
					marginTop: "auto",
					width: "100%",
					height: "3rem"
				}}>
					<h2>
						{ auth.user?.name }
					</h2>
					<VerticalDivider />
					{/* Mute/Deafen/Video Buttons */}
					<Group>
						<Button onClick={wrtc.toggleMuted}>
							<Microphone color={wrtc.muted ? "red" : undefined} />
						</Button>
						<Button onClick={wrtc.toggleDeafened}>
							<Headphones color={wrtc.deafened ? "red" : undefined} />
						</Button>
						<Button onClick={wrtc.toggleVideo}>
							<Camera color={wrtc.videoEnabled ? "red" : undefined} />
						</Button>
					</Group>
				</Flex>
			</Flex>
		</MediaDeviceQuery>
	)
}