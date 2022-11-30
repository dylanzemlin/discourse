import RegisterModal from "../components/modals/RegisterModal";
import LoginModal from "../components/modals/LoginModal";
import { useAuthentication } from "../lib/context/auth";
import { Button, Flex, Title } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useRouter } from "next/router";

export default function Home() {
	const isMobile = useMediaQuery("(max-width: 768px)");
	const auth = useAuthentication();
	const router = useRouter();

	const logout = () => {
		fetch("/api/auth", {
			method: "DELETE"
		}).then(() => {
			auth.verifyAuth();
		});
	}

	const chaos = () => {
		router.push("/chaos");
	}

	return (
		<>
			<div style={{
				background: "url(/code.png)",
				backgroundPosition: isMobile ? undefined : "center",
				backgroundRepeat: "no-repeat",
				backgroundSize: "cover",
				filter: "blur(10px)",
				width: "100%",
				height: "100vh"
			}} />
			<Flex
				align="center"
				justify="center"
				w="100%"
				h="100vh"
				direction="column"
				p="lg"
				style={{
					position: "absolute",
					top: 0,
					zIndex: 2,
					background: "transparent"
				}}
			>
				<Title align="center" size={isMobile ? "4rem" : "7rem"} order={1}>Discourse</Title>
				<Title align="center" order={isMobile ? 5 : 3}>A video, voice, and chat platform to connect with people all across the world in one central room.</Title>

				<Flex mt="xl" gap="xl" hidden={auth.loading}>
					{!auth.authed ? (
						<>
							<LoginModal />
							<RegisterModal />
						</>
					) : (
						<>
							<Button size={isMobile ? "sm" : "lg"} color="green" onClick={chaos}>Enter Chaos</Button>
							<Button size={isMobile ? "sm" : "lg"} color="red" onClick={logout}>Logout</Button>
						</>
					)}
				</Flex>
			</Flex>
		</>
	)
}