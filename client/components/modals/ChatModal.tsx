import { Button, Card, Flex, Modal, TextInput, Title, Text, ScrollArea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { v4 } from "uuid";

type ChatModalProps = {
  messages: any[],
  sendChat: (message: string) => void
}

export default function ChatModal(props: ChatModalProps) {
  const [opened, handler] = useDisclosure(false);
  const [message, setMessage] = useState<string>("");

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
        title="Discourse Chat"
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
                  <div key={v4()} style={{
                    display: "inline",
                    width: "100%"
                  }}>
                    <span style={{ marginRight: "0.3rem", opacity: 0.7 }}>04:15</span>
                    <span style={{ fontWeight: "700", fontSize: "1.05rem", color: message.color }}>{message.author}</span>
                    <span style={{ marginRight: "0.3rem" }}>:</span>
                    <span style={{
                      wordBreak: "break-word",
                      position: "relative",
                      verticalAlign: "baseline"
                    }}>{message.content}</span>
                  </div>
                )
              })}
            </Flex>
          </ScrollArea>
        </Card>
        <Flex gap="sm">
          <TextInput w="100%" placeholder="Send a message" value={message} onChange={(e) => setMessage(e.currentTarget.value)} />
          <Button onClick={() => {
            if (!message || message.length == 0) {
              return;
            }

            props.sendChat(message);
            setMessage("");
          }}>Send</Button>
        </Flex>
      </Modal>
      <Button onClick={handler.open} mr="md">Open Chat</Button>
    </>
  )
}