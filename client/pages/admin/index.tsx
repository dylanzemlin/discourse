import { ActionIcon, Badge, Button, Card, ColorSwatch, Divider, Flex, LoadingOverlay, Table, Title, Tooltip, Text } from "@mantine/core";
import { AlertTriangle, File, Hammer, MicrophoneOff, Shield } from "tabler-icons-react";
import { DiscouseUserFlags, hasFlag } from "@lib/api/DiscourseUserFlags";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { showNotification } from "@mantine/notifications";
import { useCallback, useEffect, useState } from "react";
import { openConfirmModal } from "@mantine/modals";
import { PackageType } from "@lib/webrtc/useWRTC";
import dynamic from "next/dynamic";
import useApi from "@lib/useApi";
import Head from "next/head";

export default dynamic(() => Promise.resolve(Users), { ssr: false });

function Users() {
  const usersResult = useApi<any[]>({ url: "/api/v1/admin/users", method: "GET" });
  const [globalState, setGlobalState] = useState<any>({ muted: false, chatDisabled: false });
  const [changingState, setChangingState] = useState(false);
  const { sendMessage, lastMessage, readyState } = useWebSocket(process.env.NEXT_PUBLIC_SOCKET_URI as string, {
    reconnectAttempts: 25,
    reconnectInterval: 3000,
    retryOnError: true,
    onReconnectStop: () => {
      showNotification({
        title: "Server Lost",
        message: "There was an error connecting to the server. Please try again later.",
        color: "red"
      });
    }
  });

  const send = useCallback((type: PackageType, data: any) => {
    const str = JSON.stringify({
      type,
      ...data
    });
    sendMessage(str);
  }, [sendMessage]);

  useEffect(() => {
    if (readyState !== ReadyState.OPEN) {
      return;
    }

    usersResult.refetch();
  }, [readyState]);

  useEffect(() => {
    if (readyState !== ReadyState.OPEN || lastMessage == null) {
      return;
    }

    const packet = JSON.parse(lastMessage.data);
    switch (packet.type) {
      case PackageType.PING: {
        send(PackageType.PING, {});
      } break;

      case PackageType.INIT: {
        send(PackageType.ADMIN_INIT, {});
      } break;

      case PackageType.ADMIN_INIT: {
        setGlobalState(packet.state);
      } break;

      case PackageType.CHANGE_GLOBAL_STATE_ACK: {
        setChangingState(false);
        if(packet.success) {
          setGlobalState(packet.state);
          showNotification({
            title: "Success",
            message: "The global state has been updated.",
            color: "green"
          });
          return;
        }

        showNotification({
          title: "Error",
          message: "There was an error updating the global state.",
          color: "red"
        });
      } break;
    }
  }, [lastMessage, readyState, send])

  const deleteAccount = (id: string) => {
    openConfirmModal({
      title: "Delete Account",
      children: "Are you sure you want to delete this account? This action cannot be undone.",
      labels: { confirm: "Delete", cancel: "Cancel" },
      centered: true,
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const result = await fetch(`/api/v1/admin/users?id=${id}`, { method: "DELETE" });
        if (result.status === 200) {
          showNotification({
            title: "Account Deleted",
            message: "The account has been deleted.",
            color: "green"
          });
          return await usersResult.refetch();
        }

        showNotification({
          title: "Error",
          message: "There was an error deleting the account.",
          color: "red"
        });
      }
    });
  }

  const setAccountMuted = (id: string, muted: boolean) => {
    fetch(`/api/v1/admin/users/${id}/mute`, { method: "POST", body: JSON.stringify({ muted }) });
  }

  const setAdminStatus = (id: string, isAdmin: boolean) => {
    fetch(`/api/v1/admin/users/${id}/admin`, { method: "POST", body: JSON.stringify({ isAdmin }) });
  }

  const toggleMuteAll = () => {
    send(PackageType.CHANGE_GLOBAL_STATE, { key: "muted", value: !globalState.muted });
    setChangingState(true);
  }

  const toggleChat = () => {
    send(PackageType.CHANGE_GLOBAL_STATE, { key: "chatDisabled", value: !globalState.chatDisabled });
    setChangingState(true);
  }

  const clearChat = () => {
    send(PackageType.CLEAR_CHAT, {});
  }

  const cleanSlate = () => {
    openConfirmModal({
      title: "Trigger Operation Clean Slate",
      children: "Are you sure you want to trigger Operation Clean Slate? This action cannot be undone, and will delete ALL user accounts and data.",
      labels: { confirm: "Confirm", cancel: "Cancel" },
      centered: true,
      confirmProps: { color: "red" },
      onConfirm: async () => {
        await fetch(`/api/v1/admin/cleanslate`, { method: "DELETE" });
      }
    });
  }

  return (
    <>
      <Head>
        <title>Discourse - Chaos</title>
      </Head>
      <Flex p="lg" gap="md">
        <Card shadow="lg">
          <Flex direction="column" gap="sm" w="fit-content">
            <LoadingOverlay visible={readyState !== ReadyState.OPEN} />
            <Title order={2}>Global State</Title>
            <Button loading={changingState} leftIcon={<MicrophoneOff />} onClick={toggleMuteAll}>
              { globalState.muted ? "Unmute All" : "Mute All" }
            </Button>

            <Button loading={changingState} leftIcon={<File />} onClick={toggleChat}>
              { globalState.chatDisabled ? "Enable Chat" : "Disable Chat" }
            </Button>

            <Button leftIcon={<MicrophoneOff />} onClick={clearChat}>
              Clear Chat
            </Button>

            <Divider size="lg" label="Danger Zone" labelPosition="center" labelProps={{ color: "#e03131", size: "md" }} />

            <Button color="red" leftIcon={<AlertTriangle />} onClick={cleanSlate}>
              Operation Clean Slate
            </Button>
          </Flex>
        </Card>

        <Card shadow="lg">
          <LoadingOverlay visible={usersResult.loading} />
          <Title order={2}>User Management</Title>
          <Table
            verticalSpacing="md"
            horizontalSpacing="lg"
            sx={{
              "thead > tr > th": {
                textAlign: "center"
              },
              "tbody > tr > td": {
                textAlign: "center",
              },
              "tbody > tr": {
                borderBottom: "1px solid #373A40"
              }
            }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Displayname</th>
                <th>Color</th>
                <th>Auth Type</th>
                <th>Email</th>
                <th>Flags</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersResult.data?.sort((a, b) => b.flags - a.flags).map((user: any) => {
                const isAdmin = hasFlag(user.flags, DiscouseUserFlags.Admin);
                const isMuted = hasFlag(user.flags, DiscouseUserFlags.GlobalMuted);

                return (
                  <tr key={user.id}>
                    <th>{user.id}</th>
                    <th>{user.username}</th>
                    <th>{user.settings.displayName}</th>
                    <th style={{ display: "flex", justifyContent: "center", gap: "0.3rem" }}>
                      <ColorSwatch color={user.settings.color} />
                      <Text>{(user.settings.color as string).replace("#", "")}</Text>
                    </th>
                    <th>
                      <Badge hidden={user.auth_type !== "github"}>Github</Badge>
                      <Badge hidden={user.auth_type !== "google"}>Google</Badge>
                      <Badge hidden={user.auth_type !== "password"}>Email</Badge>
                    </th>
                    <th>{user.email}</th>
                    <th>
                      <Badge hidden={!isAdmin}>Admin</Badge>
                      <Badge hidden={!isMuted}>Muted</Badge>
                    </th>
                    <th>{user.created}</th>
                    <th>
                      <Flex>
                        <Tooltip label="Delete Account">
                          <ActionIcon onClick={() => deleteAccount(user.id)}>
                            <Hammer />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label={isMuted ? "Global Unmute" : "Global Mute"} onClick={() => setAccountMuted(user.id, !setAccountMuted)}>
                          <ActionIcon>
                            <MicrophoneOff color={isMuted ? "red" : undefined} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label={isAdmin ? "Promote to Admin" : "Demote from Admin"} onClick={() => setAdminStatus(user.id, !isAdmin)}>
                          <ActionIcon>
                            <Shield color={isAdmin ? "var(--discourse-primary)" : undefined} />
                          </ActionIcon>
                        </Tooltip>
                      </Flex>
                    </th>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Card>
      </Flex>
    </>
  )
}