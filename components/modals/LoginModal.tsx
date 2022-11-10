import { Anchor, Button, Checkbox, Divider, Flex, Modal, PasswordInput, TextInput, Title } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import HttpStatusCode from "../../lib/api/HttpStatusCode";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/router";
import v1 from "../../lib/api/v1";
import { useState } from "react";

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

		const result = await v1.LOGIN_USER(email, password, remember);

		setLoading(false);

		if (result.status != HttpStatusCode.CREATED || result.error) {
			showNotification({
				title: `[${result.status}] Login Failed`,
				message: result.friendlyError,
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
				closeOnClickOutside={!loading}
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

				<Divider m="lg" />

				<Flex
					justify="center"
					w="100%"
					gap="md"
					mt="xl"
				>
					<Anchor href="/google">Google</Anchor>
					<Anchor href="/google">Github</Anchor>
				</Flex>
			</Modal>

			<Button size="lg" color="cyan" onClick={handler.open}>Login</Button>
		</>
	)
}