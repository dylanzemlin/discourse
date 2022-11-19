import { Flex, LoadingOverlay, Title } from "@mantine/core";
import { useEffect, useState } from "react";

enum QueryState {
	WAITING,
	BLOCKED,
	OKAY
}

type MediaDeviceQueryProps = {
	video: boolean;
	audio: boolean;
	children: React.ReactNode;
}

const PermToState = (perm: PermissionState) => {
	switch (perm) {
		case "granted":
			return QueryState.OKAY;
		case "denied":
			return QueryState.BLOCKED;
		case "prompt":
			return QueryState.WAITING;
	}
}

export default function MediaDeviceQuery(props: MediaDeviceQueryProps) {
	const [state, setState] = useState(QueryState.WAITING);

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({
			video: props.video,
			audio: props.audio
		}).then(() => {
			setState(QueryState.OKAY);
		}).catch(() => {
			setState(QueryState.BLOCKED);
		});
	}, [props.video, props.audio]);

	switch(state) {
		case QueryState.WAITING:
			return <LoadingOverlay visible={true} />

		case QueryState.BLOCKED:
			return <Flex w="100" h="100vh" align="center" justify="center" direction="column">
				<Title>Media Device Error</Title>
				<p>It looks like you have blocked access to your camera and/or microphone. Please allow access to your camera and microphone in your browser settings.</p>
			</Flex>
		
		case QueryState.OKAY:
			return <>{props.children}</>
	}
}