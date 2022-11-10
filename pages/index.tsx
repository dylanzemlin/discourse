import { Anchor, Flex, Title } from "@mantine/core";
import LoginModal from "../components/modals/LoginModal";
import RegisterModal from "../components/modals/RegisterModal";

export default function Home() {
	return (
		<Flex
			align="center"
			justify="center"
			w="100%"
			h="100vh"
			direction="column"
		>
			<Title size="7rem" order={1}>Discourse</Title>
			<Title order={3}>A video, voice, and chat platform to connect with people all across the world in one central room.</Title>

			<Flex mt="xl" gap="xl">
				<LoginModal />
				<RegisterModal />
			</Flex>
		</Flex >
	)
}