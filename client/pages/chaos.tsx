import MediaDeviceQuery from "../components/queries/MediaDeviceQuery";
import { Flex, LoadingOverlay, Title } from "@mantine/core";
import useWRTC from "../lib/webrtc/UseWRTC";
import { useEffect, useRef } from "react";
import Head from "next/head";
import VerticalDivider from "../components/global/VerticalDivider";
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
		<video ref={ref} id={props.id} autoPlay style={{
			width: "100%",
			height: "100%"
		}} />
	)
}

export default function Home() {
	// Handle all the WebRTC stuff
	const videoRef = useRef<HTMLVideoElement>(null);
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
			<>
				{/* Header */}
				<Flex style={{
					width: "100%",
					height: "5rem",
					background: "#1a1a1a",
				}} align="center">
					<Title>Chaos</Title>
					<VerticalDivider />
				</Flex>
				<video autoPlay muted id="localVideo" style={{
					width: "25%",
					height: "25%"
				}} ref={videoRef}></video>
				<Flex>
					{wrtc.remoteStreams.keys().map((id) => {
						return (
							<Video key={id} id={`video:${id}`} stream={wrtc.remoteStreams.get(id)} />
						)
					})}
				</Flex>
			</>
		</MediaDeviceQuery>
	)
}