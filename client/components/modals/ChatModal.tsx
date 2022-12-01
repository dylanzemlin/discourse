import { Button, Card, Flex, Modal, TextInput, Box, ScrollArea, Menu, ActionIcon, Title } from "@mantine/core";
import { DiscouseUserFlags } from "@lib/api/DiscourseUserFlags";
import { useAuthentication } from "@lib/context/auth";
import { useDisclosure } from "@mantine/hooks";
import { Menu2, X } from "tabler-icons-react";
import { useState } from "react";
import { v4 } from "uuid";

type ChatModalProps = {
  messages: any[],
  sendChat: (message: string) => void,
  clearChat: () => void,
  deleteChat: (id: string) => void
}

export default function ChatModal(props: ChatModalProps) {
  const [message, setMessage] = useState<string>("");
  const [opened, handler] = useDisclosure(false);
  const auth = useAuthentication();

  if (!opened) {
    return (
      <Button onClick={handler.open} mr="md">Open Chat</Button>
    )
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={handler.close}
        title={
          <Title order={3}>Discourse Chat</Title>
        }
        size="xl"
        centered
        padding="md"
      >
        <Card w="100%" mb="sm">
          {/* Loop through messages in reverse */}
          <ScrollArea>
            <Flex mah="70vh" direction="column" gap="xs">
              {props.messages?.map((message) => {
                return (
                  <Box sx={{
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.15)"
                    },
                    padding: "0.1rem"
                  }} key={v4()} style={{
                    display: "inline",
                    width: "100%"
                  }}>
                    {auth.hasFlag(DiscouseUserFlags.Admin) && (
                      <Menu
                        position="right"
                      >
                        <Menu.Target>
                          <span style={{ marginRight: "0.3rem" }}>
                            <X size={12} />
                          </span>
                        </Menu.Target>

                        <Menu.Dropdown>
                          <Menu.Item onClick={() => props.deleteChat(message.id)}>Delete</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    )}
                    <span style={{ marginRight: "0.3rem", opacity: 0.7 }}>{message.time}</span>
                    <span style={{ fontWeight: "700", fontSize: "1.05rem", color: message.color }}>{message.author}</span>
                    <span style={{ marginRight: "0.3rem" }}>:</span>
                    <span style={{
                      wordBreak: "break-word",
                      position: "relative",
                      verticalAlign: "baseline"
                    }}>{message.content}</span>
                  </Box>
                )
              })}
            </Flex>
          </ScrollArea>
        </Card>
        <Flex gap="sm">
          <TextInput w="100%" placeholder="Send a message" value={message} onChange={(e) => setMessage(e.currentTarget.value)} onKeyUp={(e) => {
            if (e.key !== "Enter") {
              return;
            }

            props.sendChat(message);
            setMessage("");
          }} />
          <Button onClick={() => {
            if (!message || message.length == 0) {
              return;
            }

            props.sendChat(message);
            setMessage("");
          }}>Send</Button>
          {auth.hasFlag(DiscouseUserFlags.Admin) && (
            <Menu>
              <Menu.Target>
                <ActionIcon pt="xs">
                  <Menu2 size={60} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item onClick={props.clearChat}>Clear Chat</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}

        </Flex>
      </Modal>
      <Button onClick={handler.open} mr="md">Open Chat</Button>
    </>
  )
}