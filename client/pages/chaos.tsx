import { Button, Flex, Group, LoadingOverlay, Title } from "@mantine/core";
import MediaDeviceQuery from "../components/queries/MediaDeviceQuery";
import { Headphones, Microphone, Camera } from "tabler-icons-react";
import { useAuthentication } from "../lib/context/auth";
import useWRTC from "../lib/webrtc/useWRTC";
import { useEffect, useRef } from "react";
import Head from "next/head";

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
		<video style={{
			maxHeight: "100%",
			maxWidth: "100%",
		}} ref={ref} id={props.id} autoPlay />
	)
}

export default function Home() {
	// Handle all the WebRTC stuff
	const videoRef = useRef<HTMLVideoElement>(null);
	const auth = useAuthentication();
	const wrtc = useWRTC({
		localVideoRefId: "localVideo"
	});

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
			<Flex w="100%" h="100vh" direction="column">
				<div style={{
					flexGrow: 1,
					padding: "1em",
					display: "flex",
					overflowY: "auto",
					gap: "1rem",
					width: "100%",
					height: "100%"
				}}>
					<video style={{
						maxHeight: "100%",
						maxWidth: "100%",
					}} autoPlay muted id="localVideo" ref={videoRef}>
					</video>
					{wrtc.streams.keys().map((id) => {
						return (
							<div key={id}>
								<Video id={`video:${id}`} stream={wrtc.streams.get(id)} />
							</div>
						)
					})}
				</div>
				<Flex p="1rem" style={{
					marginTop: "auto",
					width: "100%",
					alignItems: "center",
				}}>
					<img src="/api/avatar" alt={`${auth.user?.name}'s Avatar`} width={64} height={64} style={{
						borderRadius: "50%",
						marginRight: "1rem"
					}} />
					<Title mr="1rem" order={2}>
						{auth.user?.name}
					</Title>
					<div style={{
						width: "3rem",
						height: "3px",
						backgroundColor: "#fff"
					}} />
					<Group ml="lg">
						<Button onClick={wrtc.toggleMuted}>
							<Microphone color={wrtc.muted ? "red" : undefined} />
						</Button>
						<Button onClick={wrtc.toggleDeafened}>
							<Headphones color={wrtc.deafened ? "red" : undefined} />
						</Button>
						<Button onClick={wrtc.toggleVideo}>
							<Camera color={!wrtc.videoEnabled ? "red" : undefined} />
						</Button>
					</Group>
				</Flex>
			</Flex>
		</MediaDeviceQuery>
	)
}