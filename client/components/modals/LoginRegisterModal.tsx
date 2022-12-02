import { Anchor, Button, Checkbox, Divider, Flex, Modal, PasswordInput, Tabs, TextInput, Title, Text } from "@mantine/core";
import { BrandGithub, BrandGoogle } from "tabler-icons-react";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { useRouter } from "next/router";
import { useState } from "react";
import v1 from "@lib/api/v1";

const github_params = new URLSearchParams({
  client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID as string,
  redirect_uri: process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI as string,
  scope: "user:email read:user"
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

type TabProps = {
  isLoading: (value: boolean) => void;
}

const githubOAuthEnabled = (process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED == "true" && process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID != null && process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI != null);
const googleOAuthEnabled = (process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED == "true" && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID != null && process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI != null);
const showAlternativeLogins = githubOAuthEnabled || googleOAuthEnabled;

function LoginTab(props: TabProps) {
  // Router Usage
  const router = useRouter();

  // Login States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <Flex
        direction="column"
        gap="md"
        mt="lg"
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
        {/* <Checkbox
          onChange={(e) => setRemember(e.currentTarget.checked)}
          checked={remember}
          label="Remember Me"
          size="sm"
        /> */}
      </Flex>

      <Button
        variant="outline"
        color="green"
        onClick={() => handleLogin()}
        loading={loading}
        fullWidth
        mt="xl"
        disabled={email.length === 0 || password.length === 0}
      >
        Login
      </Button>

      <Divider mt="xl" mb="md" hidden={!showAlternativeLogins} />

      <Text w="100%" px="sm" align="center" hidden={!showAlternativeLogins}>or login with</Text>
      <Flex
        justify="center"
        w="100%"
        gap="md"
        mt="sm"
        hidden={!showAlternativeLogins}
      >
        <Anchor href={google_uri} hidden={!googleOAuthEnabled}>
          <BrandGoogle />
        </Anchor>
        <Anchor href={github_uri} hidden={!githubOAuthEnabled}>
          <BrandGithub />
        </Anchor>
      </Flex>
    </>
  )
}

function RegisterTab(props: TabProps) {
  // User Input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayname, setDisplayname] = useState("");
  const [username, setUsername] = useState("");

  // UI States
  const [blurred, setBlurred] = useState(false);
  const [loading, setLoading] = useState(false);

  // Router Usage
  const router = useRouter();

  const validateNames = () => {
    if (username.length === 0) {
      return undefined;
    }

    if (displayname.length === 0) {
      return undefined;
    }

    return false;
  }
  
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
    props.isLoading(true);

    const result = await v1.REGISTER_USER(displayname, username, email, password);

    if (result.status !== HttpStatusCode.OK || result.error) {
      setLoading(false);
      props.isLoading(false);

      showNotification({
        title: `[${result.status}] Registration Failed`,
        message: result.error,
        color: "red"
      });
      console.error(result.error);
      return;
    }

    setTimeout(() => {
      setLoading(false);
      props.isLoading(false);

      router.push("/chaos");
    }, 1000);
  }

  return (
    <>
      <form>
        <Flex
          direction="column"
          gap="md"
          mt="lg"
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

      <Button
        variant="outline"
        color="green"
        onClick={(e: any) => handleRegister(e)}
        loading={loading}
        fullWidth
        mt="xl"
        disabled={typeof validatePassword() !== "boolean" || typeof validateEmail() !== "boolean" || typeof validateNames() !== "boolean"}
      >
        Register
      </Button>

      <Divider mt="xl" mb="md" hidden={!showAlternativeLogins} />

      <Text w="100%" px="sm" align="center" hidden={!showAlternativeLogins}>or create an account with</Text>
      <Flex
        justify="center"
        w="100%"
        gap="md"
        mt="sm"
        hidden={!showAlternativeLogins}
      >
        <Anchor href={google_uri} hidden={!googleOAuthEnabled}>
          <BrandGoogle />
        </Anchor>
        <Anchor href={github_uri} hidden={!githubOAuthEnabled}>
          <BrandGithub />
        </Anchor>
      </Flex>
    </>
  )
}

export default function LoginRegisterModal() {
  // UI State
  const [tab, setTab] = useState<"login" | "register">("login");
  const [opened, handler] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <>
      <Modal
        opened={opened}
        onClose={handler.close}
        title={<Title order={2}>{tab === "login" ? "Login" : "Register"}</Title>}
        centered
        closeOnClickOutside={false}
        closeOnEscape={!loading}
        withCloseButton={!loading}
      >
        <Tabs onTabChange={(tab) => setTab(tab as any)} defaultValue="login">
          <Tabs.List style={{
            display: "flex",
            flexDirection: "row"
          }}>
            <Tabs.Tab color="violet" style={{ flexGrow: 1 }} value="login">Login</Tabs.Tab>
            <Tabs.Tab color="violet" style={{ flexGrow: 1 }} value="register">Register</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="login">
            <LoginTab isLoading={setLoading} />
          </Tabs.Panel>

          <Tabs.Panel value="register">
            <RegisterTab isLoading={setLoading} />
          </Tabs.Panel>
        </Tabs>
      </Modal>
      <Button onClick={handler.open} w={`${isMobile ? 125 : 200}px`} h="50px" color="violet" style={{
        fontSize: "1.5rem"
      }}>Login</Button>
    </>
  )
}