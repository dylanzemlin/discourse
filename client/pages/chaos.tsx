import { Button, Flex, Group, LoadingOverlay, Title } from "@mantine/core";
import MediaDeviceQuery from "../components/queries/MediaDeviceQuery";
import { Headphones, Microphone, Camera } from "tabler-icons-react";
import { useAuthentication } from "../lib/context/auth";
import useWRTC from "../lib/webrtc/useWRTC";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Head from "next/head";
import { useDisclosure } from "@mantine/hooks";
import UserSettingsModal from "../components/modals/UserSettingsModal";

type VideoProps = {
	stream: MediaStream | null;
	state: any;
	uid: string;
}

function Video(props: VideoProps) {
	const ref = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (ref.current && props.stream) {
			ref.current.srcObject = props.stream;
		}
	}, [props.stream, ref]);

	return (
		<div style={{
			position: "relative",
			height: "min-content",
			width: "min-content",
		}}>
			<div style={{
				position: "absolute",
				float: "left",
				padding: "1rem",
				display: "flex",
				height: "100%",
				width: "100%",
			}}>
				{props.state?.video ? (
					<>
						{props.state?.muted && <Microphone color={"red"} />}
						{props.state?.deafened && <Headphones color={"red"} />}
					</>
				) : (
					<Flex w="100%" h="100%" align="center" justify="center" gap="2rem">
						<Image unoptimized src={`/api/avatar?id=${props.uid}`} alt={`${props.uid}'s Avatar`} width={128} height={128} style={{
							borderRadius: "50%",
						}} />
						<Title order={2}>John Doe</Title>
					</Flex>
				)}
			</div>
			<video style={{
				width: "640px",
				height: "480px",
				// width: "320px",
				// height: "240px",
			}} ref={ref} autoPlay />
		</div>
	)
}

export default function Chaos() {
	// Handle all the WebRTC stuff
	const auth = useAuthentication();
	const wrtc = useWRTC();
	const [showSettings, settingsHandler] = useDisclosure(false);

	if (!wrtc.isConnected || auth.user == null) {
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
					<Video uid={auth.user.id} state={wrtc.localState} stream={wrtc.localStream} />
					{wrtc.streams.keys().map((uid) => {
						return (
							<Video uid={uid} stream={wrtc.streams.get(uid)} state={wrtc.peerStates.get(uid)} key={uid} />
						)
					})}
				</div>
				<Flex p="0.5rem" style={{
					marginTop: "auto",
					width: "100%",
					alignItems: "center",
				}}>
					<Group style={{
						borderRadius: "5px",
						padding: "0.5rem"
					}} mr="1rem" sx={{
						"&:hover": {
							backgroundColor: "rgba(0, 0, 0, 0.3)",
							cursor: "pointer"
						}
					}} onClick={settingsHandler.open}>
						<Image unoptimized src="/api/avatar" alt={`${auth.user?.name}'s Avatar`} width={64} height={64} style={{
							borderRadius: "50%"
						}} />
						<Title order={2}>
							{auth.user?.name}
						</Title>
					</Group>
					<div style={{
						width: "3rem",
						height: "3px",
						backgroundColor: "#fff"
					}} />
					<Group ml="lg">
						<Button onClick={wrtc.toggleMuted}>
							<Microphone color={wrtc.localState?.muted ? "red" : undefined} />
						</Button>
						<Button onClick={wrtc.toggleDeafened}>
							<Headphones color={wrtc.localState?.deafened ? "red" : undefined} />
						</Button>
						<Button onClick={wrtc.toggleVideo}>
							<Camera color={!wrtc.localState?.video ? "red" : undefined} />
						</Button>
					</Group>
				</Flex>
			</Flex>
			<UserSettingsModal opened={showSettings} onClose={settingsHandler.close} />
		</MediaDeviceQuery>
	)
}