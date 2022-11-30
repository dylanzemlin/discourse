import { Anchor, Button, Divider, Flex, Modal, PasswordInput, TextInput, Title } from "@mantine/core";
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

export default function RegisterModal() {
	// Router Usage
	const router = useRouter();

	// Disclosure for the modal open/close state
	const [opened, handler] = useDisclosure(false);

	// Login States
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [displayname, setDisplayname] = useState("");
	const [username, setUsername] = useState("");
	const [loading, setLoading] = useState(false);
	const [blurred, setBlurred] = useState(false);

	const validatePassword = () => {
		if (password.length === 0) {
			return undefined;
		}

		// Check for password length
		if (password.length < 6) {
			return "Password must be at least 6 characters long";
		}

		// Check for at least 1 symbol
		// if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
		// 	return "Password must contain at least 1 symbol";
		// }

		// Check for at least 1 number
		if (!/(?=.*\d)/.test(password)) {
			return "Password must contain at least 1 number";
		}

		// Check for at least 1 lowercase letter
		if (!/(?=.*[a-z])/.test(password)) {
			return "Password must contain at least 1 lowercase letter";
		}

		// Check for at least 1 uppercase letter
		if (!/(?=.*[A-Z])/.test(password)) {
			return "Password must contain at least 1 uppercase letter";
		}

		return false;
	}

	const validateEmail = () => {
		if (email.length === 0) {
			return undefined;
		}

		// TODO: Find a way to do email validation? probably isn't even worth it
		return false;
	}

	const handleRegister = async (e: any) => {
		e.preventDefault();
		setLoading(true);

		const result = await v1.REGISTER_USER(displayname, username, email, password);

		setLoading(false);

		if (result.status !== HttpStatusCode.CREATED || result.error) {
			showNotification({
				title: `[${result.status}] Registration Failed`,
				message: result.error,
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
				title={<Title order={2}>Register</Title>}
				centered
				closeOnClickOutside={false}
				closeOnEscape={!loading}
				withCloseButton={!loading}
			>
				<form>
					<Flex
						direction="column"
						gap="md"
					>
						<TextInput
							value={username}
							onChange={(e) => setUsername(e.currentTarget.value)}
							placeholder="johndoe"
							withAsterisk
							variant="filled"
							label="Username"
						/>
						<TextInput
							value={displayname}
							onChange={(e) => setDisplayname(e.currentTarget.value)}
							placeholder="John Doe"
							withAsterisk
							variant="filled"
							label="Display Name"
						/>
						<TextInput
							value={email}
							onChange={(e) => setEmail(e.currentTarget.value)}
							placeholder="Email"
							withAsterisk
							variant="filled"
							label="Email"
							error={validateEmail()}
						/>
						<PasswordInput
							value={password}
							onChange={(e) => setPassword(e.currentTarget.value)}
							placeholder="Password"
							withAsterisk
							variant="filled"
							label="Password"
							onBlur={() => setBlurred(true)}
							error={blurred ? validatePassword() : undefined}
						/>
					</Flex>
				</form>

				<Flex
					justify="center"
					w="100%"
					gap="md"
					mt="xl"
				>
					<Button
						variant="outline"
						color="green"
						onClick={(e: any) => handleRegister(e)}
						loading={loading}
					>
						Register
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

			<Button size="lg" color="cyan" onClick={handler.open}>Register</Button>
		</>
	)
}