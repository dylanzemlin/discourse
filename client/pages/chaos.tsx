import { useAuthentication } from "../lib/context/auth";
import { Flex, Title } from "@mantine/core";
import { useRouter } from "next/router";
import Head from "next/head";
import MediaDeviceQuery from "../components/queries/MediaDeviceQuery";
import { useEffect, useRef } from "react";
import useWRTC from "../lib/webrtc/UseWRTC";

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
			width: "25%",
			height: "25%"
		}} />
	)
}

export default function Home() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const wrtc = useWRTC({
		localVideoRefId: "localVideo"
	});

	return (
		<MediaDeviceQuery
			audio={true}
			video={true}
		>
			<Head>
				<title>Discourse - Chaos</title>
			</Head>
			<Flex
				align="center"
				justify="center"
				w="100%"
				h="100vh"
				direction="column"
			>
				<Title size="7rem" order={1}>CHAOS</Title>
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
			</Flex >
		</MediaDeviceQuery>
	)
}