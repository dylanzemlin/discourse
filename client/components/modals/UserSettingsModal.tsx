import { LoadingOverlay, Modal, Title } from "@mantine/core";
import { useEffect } from "react";
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

  useEffect(() => {
    if(!props.opened) {
      return;
    }
    
    refetch();
  }, [props.opened, refetch]);

  return (
    <Modal opened={props.opened} onClose={props.onClose} title={(
      <Title order={3}>User Settings</Title>
    )} centered>
      <LoadingOverlay visible={loading} />

      {/* Vertical Divider */}
      <div style={{
        width: "100%",
        height: "1px",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
      }} />

    </Modal>
  )
}