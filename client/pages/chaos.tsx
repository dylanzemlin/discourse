import { ActionIcon, Button, Flex, Group, LoadingOverlay, Menu, Title } from "@mantine/core";
import { Headphones, Microphone, Camera, Menu2 as MenuIcon } from "tabler-icons-react";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import UserSettingsModal from "@modals/UserSettingsModal";
import MediaDeviceQuery from "@queries/MediaDeviceQuery";
import { useAuthentication } from "@lib/context/auth";
import { useEffect, useRef, useState } from "react";
import useWRTC from "@lib/webrtc/useWRTC";
import Image from "next/image";
import Head from "next/head";
import ChatModal from "@modals/ChatModal";
import useArray from "@lib/useArray";
import { DiscouseUserFlags } from "@lib/api/DiscourseUserFlags";

type VideoProps = {
	stream: MediaStream | null;
	state: any;
	uid: string;
	isLocal: boolean;
	isMobile: boolean;
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
						<Image unoptimized src={`/api/avatar?uid=${props.uid}`} alt={`${props.uid}'s Avatar`} width={128} height={128} style={{
							borderRadius: "50%",
						}} />
						<Title order={2}>John Doe</Title>
					</Flex>
				)}
			</div>
			<video ref={ref} muted={props.isLocal || props.state?.muted} autoPlay />
		</div>
	)
}

type ActionMenuProps = {
	toggleMuted: () => void;
	toggleDeafened: () => void;
	toggleVideo: () => void;
	localState: any;
	isMobile: boolean;
}

function ActionMenu(props: ActionMenuProps) {
	if (props.isMobile) {
		return (
			<Menu shadow="md" width={200} closeOnItemClick={false} position="left">
				<Menu.Target>
					<ActionIcon>
						<MenuIcon size={60} />
					</ActionIcon>
				</Menu.Target>

				<Menu.Dropdown>
					<Group ml="lg">
						<Menu.Item onClick={props.toggleMuted} icon={<Microphone color={props.localState?.muted ? "red" : undefined} />}>
							{props.localState?.muted ? "Unmute" : "Mute"}
						</Menu.Item>
						<Menu.Item onClick={props.toggleDeafened} icon={<Headphones color={props.localState?.deafened ? "red" : undefined} />}>
							{props.localState?.deafened ? "Undeafen" : "Deafen"}
						</Menu.Item>
						<Menu.Item onClick={props.toggleVideo} icon={<Camera color={!props.localState?.video ? "red" : undefined} />}>
							{props.localState?.video ? "Disable Video" : "Enable Video"}
						</Menu.Item>
					</Group>
				</Menu.Dropdown>
			</Menu>
		)
	}

	return (
		<Group ml="lg">
			<Button onClick={props.toggleMuted}>
				<Microphone color={props.localState?.muted ? "red" : undefined} />
			</Button>
			<Button onClick={props.toggleDeafened}>
				<Headphones color={props.localState?.deafened ? "red" : undefined} />
			</Button>
			<Button onClick={props.toggleVideo}>
				<Camera color={!props.localState?.video ? "red" : undefined} />
			</Button>
		</Group>
	)
}

export default function Chaos() {
	// Handle all the WebRTC stuff
	const [showSettings, settingsHandler] = useDisclosure(false);
	const isMobile = useMediaQuery("(max-width: 768px)");
	const [avatar, setAvatar] = useState("/api/avatar");
	const auth = useAuthentication();
	const wrtc = useWRTC();

	if (!wrtc.isConnected || auth.user == null) {
		return (
			<LoadingOverlay visible={true} />
		)
	}

	return (
		<MediaDeviceQuery
			audio={true}
			video={true} // Always forced to use video :)
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
					height: "100%",
					justifyContent: isMobile ? "center" : undefined
				}}>
					<Video isMobile={isMobile} isLocal uid={auth.user.id} state={wrtc.localState} stream={wrtc.localStream} />
					{wrtc.streams.keys().map((uid) => {
						return (
							<Video isMobile={isMobile} isLocal={false} uid={uid} stream={wrtc.streams.get(uid)} state={wrtc.peerStates.get(uid)} key={uid} />
						)
					})}
				</div>
				<Flex p="0rem 0.3rem" pr="1.5rem" style={{
					marginTop: "auto",
					width: "100%",
					alignItems: "center",
				}}>
					<Group style={{
						borderRadius: "5px",
					}} mr="1rem" p="sm" pb={isMobile ? "md" : "lg"} sx={{
						"&:hover": {
							backgroundColor: "rgba(0, 0, 0, 0.3)",
							cursor: "pointer"
						}
					}} onClick={settingsHandler.open}>
						<Image unoptimized src={avatar} alt={`${auth.user?.settings.displayName}'s Avatar`} width={isMobile ? 48 : 64} height={isMobile ? 48 : 64} style={{
							borderRadius: "50%",
							border: auth.hasFlag(DiscouseUserFlags.Admin) ? "2px solid #B33A3A" : "2px solid var(--discourse-primary)"
						}} />
						<Title order={isMobile ? 4 : 2}>
							{auth.user?.settings.displayName}
						</Title>
					</Group>
					<div style={{
						flexGrow: 1,
						height: "3px",
						backgroundImage: "linear-gradient(to right, var(--discourse-primary), var(--discourse-secondary))",
						marginRight: "1rem",
					}} />
					<ChatModal messages={wrtc.messages.array} sendChat={wrtc.sendChat} />
					<div style={{
						height: "3px",
						width: "50px",
						backgroundColor: "var(--discourse-secondary)",
						marginRight: "1rem"
					}} />
					<ActionMenu isMobile={isMobile} toggleDeafened={wrtc.toggleDeafened} toggleMuted={wrtc.toggleMuted} toggleVideo={wrtc.toggleVideo} localState={wrtc.localState} />
				</Flex>
			</Flex>
			<UserSettingsModal onAvatarChanged={() => {
				setAvatar("/api/avatar?random=" + Date.now());
			}} opened={showSettings} onClose={settingsHandler.close} />
		</MediaDeviceQuery>
	)
}