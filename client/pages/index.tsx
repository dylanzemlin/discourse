import LoginRegisterModal from "@modals/LoginRegisterModal";
import { useAuthentication } from "../lib/context/auth";
import { Button, Flex, Title } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useRouter } from "next/router";

export default function Home() {
	const isMobile = useMediaQuery("(max-width: 768px)");
	const auth = useAuthentication();
	const router = useRouter();

	return (
		<>
			<div style={{
				background: "url(/code.png)",
				backgroundPosition: isMobile ? undefined : "center",
				backgroundRepeat: "no-repeat",
				backgroundSize: "cover",
				filter: "blur(10px)",
				WebkitFilter: "blur(10px)",
				msFilter: "blur(10px)",
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

				<Flex mt="xl" gap="xl">
					{(!auth.user || auth.loading) ? (
						<LoginRegisterModal />
					) : (
						<>
							<Button w={`${isMobile ? 125 : 200}px`} h="50px" color="red" style={{
								fontSize: "1.5rem"
							}} onClick={() => router.push("/chaos")}>Enter Chaos</Button>
							<Button w={`${isMobile ? 125 : 200}px`} h="50px" color="red" style={{
								fontSize: "1.5rem"
							}} onClick={auth.logout}>Logout</Button>
						</>
					)}
				</Flex>
			</Flex>
		</>
	)
}