import { Anchor, Button, Checkbox, Divider, Flex, Modal, PasswordInput, TextInput, Title } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/router";
import { useState } from "react";
import v1 from "@lib/api/v1";

const github_params = new URLSearchParams({
	client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID as string,
	redirect_uri: process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI as string,
	scope: "user:email"
});
const github_uri = `https://github.com/login/oauth/authorize?${github_params.toString()}`;

const google_params = new URLSearchParams({
	client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
	redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI as string,
	scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
	response_type: "code",
	prompt: "consent"
});
const google_uri = `https://accounts.google.com/o/oauth2/v2/auth?${google_params.toString()}`;

export default function LoginModal() {
	// Router Usage
	const router = useRouter();

	// Disclosure for the modal open/close state
	const [opened, handler] = useDisclosure(false);

	// Login States
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleLogin = async () => {
		setLoading(true);

		const result = await v1.LOGIN_USER(email, password);

		setLoading(false);

		if (result.status != HttpStatusCode.OK || result.error) {
			showNotification({
				title: `[${result.status}] Login Failed`,
				message: result.data?.error_text || "Unknown Error",
				color: "red"
			});
			console.error(result.error);
			return;
		}

		router.push("/chaos");
	}

	return (
		<>
			<Modal
				opened={opened}
				onClose={handler.close}
				title={<Title order={2}>Login</Title>}
				centered
				closeOnClickOutside={false}
				closeOnEscape={!loading}
				withCloseButton={!loading}
			>
				<Flex
					direction="column"
					gap="md"
				>
					<TextInput
						value={email}
						onChange={(e) => setEmail(e.currentTarget.value)}
						placeholder="Email"
						withAsterisk
						variant="filled"
						label="Email"
					/>
					<PasswordInput
						value={password}
						onChange={(e) => setPassword(e.currentTarget.value)}
						placeholder="Password"
						withAsterisk
						variant="filled"
						label="Password"
					/>
					<Checkbox
						onChange={(e) => setRemember(e.currentTarget.checked)}
						checked={remember}
						label="Remember Me"
						size="sm"
					/>
				</Flex>

				<Flex
					justify="center"
					w="100%"
					gap="md"
					mt="xl"
				>
					<Button
						onClick={handler.close}
						variant="outline"
						color="red"
						disabled={loading}
					>
						Cancel
					</Button>
					<Button
						variant="outline"
						color="green"
						onClick={() => handleLogin()}
						loading={loading}
					>
						Login
					</Button>
				</Flex>

				<Divider mt="xl" mb="xl" />

				<Flex
					justify="center"
					w="100%"
					gap="md"
					mt="xl"
				>
					<Anchor href={google_uri}>Google</Anchor>
					<Anchor href={github_uri}>Github</Anchor>
				</Flex>
			</Modal>

			<Button size="lg" color="cyan" onClick={handler.open}>Login</Button>
		</>
	)
}