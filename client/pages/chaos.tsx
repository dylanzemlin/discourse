import { ActionIcon, Box, Button, Flex, Group, LoadingOverlay, Menu, ScrollArea, Title } from "@mantine/core";
import { Headphones, Microphone, Camera, Menu2 as MenuIcon } from "tabler-icons-react";
import { DiscouseUserFlags } from "@lib/api/DiscourseUserFlags";
import { useDisclosure, useHover, useMediaQuery } from "@mantine/hooks";
import UserSettingsModal from "@modals/UserSettingsModal";
import MediaDeviceQuery from "@queries/MediaDeviceQuery";
import { useAuthentication } from "@lib/context/auth";
import { useEffect, useRef, useState } from "react";
import Styles from "../styles/chaos.module.css";
import useWRTC from "@lib/webrtc/useWRTC";
import ChatModal from "@modals/ChatModal";
import Image from "next/image";
import Head from "next/head";

type VideoProps = {
	stream: MediaStream | null;
	state: any;
	globalState: any;
	uid: string;
	isLocal: boolean;
	isMobile: boolean;
}

function Video(props: VideoProps) {
	const ref = useRef<HTMLVideoElement>(null);
	const [name, setName] = useState<string>("John Doe");
	const { hovered, ref: outerDivRef } = useHover();

	useEffect(() => {
		if (ref.current && props.stream) {
			ref.current.srcObject = props.stream;
		}
	}, [props.stream, ref]);

	useEffect(() => {
		fetch(`/api/v1/user/name?uid=${props.uid}`).then(async res => {
			setName(await res.text());
		}).catch(err => {
			console.error(err);
		})
	}, [props.uid]);

	return (
		<div ref={outerDivRef} style={{
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
				width: "100%"
			}}>
				{props.state?.video ? (
					<Box className={Styles.peerInfo} sx={{
						display: "flex",
						background: "rgba(0, 0, 0, 0.80)",
						height: "fit-content",
						padding: "0.25rem",
						borderRadius: "0.25rem",
						zIndex: 50,
						transform: hovered ? "scale(1.1)" : "scale(1)",
					}}>
						{<Title order={5} mr={props.state?.muted || props.state?.deafened || props.globalState?.muted ? "xs" : undefined}>{name}</Title>}
						{(props.state?.muted || props.globalState?.muted) && <Microphone color={"#E33A3A"} />}
						{props.state?.deafened && <Headphones color={"#E33A3A"} />}
					</Box>
				) : (
					<Flex w="100%" h="100%" align="center" justify="center" gap="2rem">
						<Image unoptimized src={`/api/avatar?uid=${props.uid}`} alt={`${props.uid}'s Avatar`} width={128} height={128} style={{
							borderRadius: "50%",
						}} />
						<Title order={2}>{name}</Title>
					</Flex>
				)}
			</div>
			<video style={{
				borderRadius: "0.25rem"
			}} ref={ref} muted={props.isLocal || props.state?.muted} autoPlay />
		</div>
	)
}

type ActionMenuProps = {
	toggleMuted: () => void;
	toggleDeafened: () => void;
	toggleVideo: () => void;
	localState: any;
	isMobile: boolean;
	globalState: any;
	auth: any;
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
						<Menu.Item disabled={(props.globalState?.muted && !props.auth.hasFlag(DiscouseUserFlags.Admin))} onClick={props.toggleMuted} icon={<Microphone color={(props.localState?.muted || props.globalState?.muted) ? "red" : undefined} />}>
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

	if (!wrtc.isConnected || auth.user == null || auth.loading) {
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
				<Box component={ScrollArea} style={{
					flexGrow: 1,
					padding: "1em",
					display: "flex",
					overflowY: "auto",
					gap: "1rem",
					width: "100%",
					height: "100%",
					justifyContent: "center",
					flexWrap: "wrap",
					maxWidth: "100%",
				}}>
					<Video globalState={wrtc.globalState} isMobile={isMobile} isLocal uid={auth.user.id} state={wrtc.localState} stream={wrtc.localStream} />

					{wrtc.streams.keys().map((uid) => {
						return (
							<Video globalState={wrtc.globalState} isMobile={isMobile} isLocal={false} uid={uid} stream={wrtc.streams.get(uid)} state={wrtc.peerStates.get(uid)} key={uid} />
						)
					})}
				</Box>
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
					<ChatModal messages={wrtc.messages.array} sendChat={wrtc.sendChat} deleteChat={wrtc.deleteChat} clearChat={wrtc.clearChat} globalState={wrtc.globalState} />
					<div style={{
						height: "3px",
						width: "50px",
						backgroundColor: "var(--discourse-secondary)",
						marginRight: "1rem"
					}} />
					<ActionMenu auth={auth} isMobile={isMobile} toggleDeafened={wrtc.toggleDeafened} toggleMuted={wrtc.toggleMuted} toggleVideo={wrtc.toggleVideo} localState={wrtc.localState} globalState={wrtc.globalState} />
				</Flex>
			</Flex>
			<UserSettingsModal onAvatarChanged={() => {
				setAvatar("/api/avatar?random=" + Date.now());
			}} opened={showSettings} onClose={settingsHandler.close} />
		</MediaDeviceQuery>
	)
}