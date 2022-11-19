import { useAuthentication } from "../lib/context/auth";
import { Flex, Title } from "@mantine/core";
import { useRouter } from "next/router";
import Head from "next/head";
import MediaDeviceQuery from "../components/queries/MediaDeviceQuery";

export default function Home() {
	const router = useRouter();
	const state = useAuthentication();
	if (!state.authed) {
		return router.push("/");
	}

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
			</Flex >
			</MediaDeviceQuery>
	)
}