import { Button, FileInput, Flex, LoadingOverlay, Modal, Select, TextInput, Title } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useLocalStorage } from "@mantine/hooks";
import { FileUpload } from "tabler-icons-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useApi from "../../lib/useApi";

type UserSettingsModalProps = {
  opened: boolean;
  onClose: () => void;
}

export default function UserSettingsModal(props: UserSettingsModalProps) {
  const { data, loading, error, refetch } = useApi<any>({
    url: "/api/v1/user/settings",
    method: "GET",
    runImmediate: false
  });

  const [theme, setBrowserTheme] = useLocalStorage<"light" | "dark">({ key: "discourse-theme", defaultValue: "dark" });
  const [displayname, setDisplayname] = useState<string>("John Doe");
  const [email, setEmail] = useState<string>("john.doe@gmail.com");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!props.opened) {
      return;
    }

    setAvatarFile(null);
    refetch();
  }, [props.opened, refetch]);

  useEffect(() => {
    if (data == undefined) {
      return;
    }

    setDisplayname(data.settings.name);
    setEmail(data.email);
  }, [data]);

  const uploadAvatar = async (avatar: File | null) => {
    if (avatar == null) {
      return;
    }

    const formData = new FormData();
    formData.append("file", avatar);

    const result = await fetch("/api/avatar", {
      method: "PATCH",
      body: formData
    });

    if (result.ok) {
      return showNotification({
        title: "Avatar Updated",
        message: `Successfully updated your avatar to ${avatar.name}`
      });
    }

    return showNotification({
      title: "Avatar Update Failed",
      message: `Failed to update your avatar to ${avatar.name}`
    });
  }

  const save = async () => {
    // Save displayname and theme
    const result = await fetch("/api/v1/user/settings", {
      method: "PATCH",
      body: JSON.stringify({
        name: displayname,
        theme: theme
      })
    });

    if (result.ok) {
      return showNotification({
        title: "Settings Updated",
        message: "Successfully updated your settings"
      });
    }

    return showNotification({
      title: "Settings Update Failed",
      message: "Failed to update your settings"
    });
  }

  const deleteAccount = async () => {
    // TODO: Show confirmation modal
    const result = await fetch("/api/v1/user", {
      method: "DELETE"
    });

    if (result.ok) {
      return router.push("/");
    }

    showNotification({
      title: "Failed to delete account",
      message: "An unknown error occured trying to delete your account. Please try again later"
    });
  }

  return (
    <Modal closeOnClickOutside={false} size="lg" opened={props.opened} onClose={props.onClose} centered withCloseButton={false}>
      <LoadingOverlay visible={loading} />

      <Flex w="100%" align="center" justify="center" gap="lg">
        <div style={{
          height: "3px",
          flexGrow: 1,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
        }} />

        <Title order={4}>General Settings</Title>

        <div style={{
          height: "3px",
          flexGrow: 1,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
        }} />
      </Flex>

      <Flex mt="lg" direction="column" gap="lg">
        <TextInput
          placeholder="john_doe"
          label="Username"
          value={data?.username}
          disabled
        />

        <TextInput
          placeholder="John Doe"
          label="Display Name"
          value={displayname}
          onChange={(e) => setDisplayname(e.currentTarget.value)}
        />

        <TextInput
          placeholder="john.doe@gmail.com"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />

        <FileInput
          placeholder="Choose File"
          label="Avatar"
          value={avatarFile}
          onChange={(e) => {
            setAvatarFile(e);
            uploadAvatar(e);
          }}
          accept="image/png,image/jpeg,image/jpg,image/gif"
          icon={<FileUpload size={24} />}
          w="100%"
        />

        <Select
          label="Theme"
          placeholder="Dark"
          data={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" }
          ]}
          value={theme}
          onChange={(e) => {
            setBrowserTheme((e as any) ?? "dark");
          }}
        />

        <Flex gap="lg" w="100%" justify="center">
          <Button w="25%" mt="lg" disabled={!(email != data?.email || displayname != data?.settings?.name || theme != data?.settings?.theme)} onClick={save}>
            Save
          </Button>
          <Button w="25%" mt="lg" onClick={props.onClose} color="gray">
            Close
          </Button>
        </Flex>

        <Flex w="100%" align="center" justify="center" gap="lg" my="lg">
          <div style={{
            height: "3px",
            flexGrow: 1,
            backgroundColor: "rgba(255, 50, 50, 0.8)",
          }} />

          <Title order={4}>Danger Zone</Title>

          <div style={{
            height: "3px",
            flexGrow: 1,
            backgroundColor: "rgba(255, 50, 50, 0.8)",
          }} />
        </Flex>

        <Button w="25%" color="red" onClick={deleteAccount}>
          Delete Account
        </Button>
      </Flex>

    </Modal>
  )
}