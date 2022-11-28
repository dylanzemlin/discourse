import RegisterModal from "../components/modals/RegisterModal";
import { Button, Flex, LoadingOverlay, Title } from "@mantine/core";
import LoginModal from "../components/modals/LoginModal";
import { useAuthentication } from "../lib/context/auth";

export default function Home() {
	const auth = useAuthentication();

	const logout = () => {
		fetch("/api/auth", {
			method: "DELETE"
		}).then(() => {
			auth.verifyAuth();
		});
	}

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

			<Flex mt="xl" gap="xl" hidden={auth.loading}>
				{!auth.authed ? (
					<>
						<LoginModal />
						<RegisterModal />
					</>
				) : (
					<>
						<Button size="lg" color="green" onClick={logout}>Chaos</Button>
						<Button size="lg" color="red" onClick={logout}>Logout</Button>
					</>
				)}
			</Flex>
		</Flex >
	)
}