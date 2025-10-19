// src/components/SOSPage.jsx
import React, { useState } from "react";
import { Paper, Title, Text, Button, Group } from "@mantine/core";
import { getGeolocation, makeMapsLink } from "../utils/helpers";
import { postAlert } from "../api/http";

export default function SOSPage({ onSent }) {
  const [status, setStatus] = useState("Hold and confirm to send SOS to your emergency contacts.");
  const [loading, setLoading] = useState(false);

  async function sendSOS() {
    const ok = window.confirm("Send SOS now? This will notify your saved emergency contacts.");
    if (!ok) return;
    setLoading(true);
    setStatus("Getting location...");
    try {
      const location = await getGeolocation(10000);
      setStatus(location ? `Location found: ${makeMapsLink(location)}` : "Location unavailable, sending SOS without location.");
      const payload = { message: "SOS: immediate help required", location };
      const resp = await postAlert(payload);
      if (resp?.success) {
        setStatus("✅ SOS sent to contacts.");
        onSent?.();
      } else setStatus("⚠️ Failed to send SOS.");
    } catch (err) {
      console.error(err);
      setStatus("⚠️ Error sending SOS.");
    } finally { setLoading(false); }
  }

  return (
    <Paper p="md" radius="md" withBorder>
      <Title order={3} style={{ marginBottom: 8 }}>Manual SOS</Title>
      <Text size="sm" color="dimmed" style={{ marginBottom: 12 }}>{status}</Text>
      <Group position="center">
        <Button color="red" onClick={sendSOS} loading={loading}>Send SOS Now</Button>
      </Group>
    </Paper>
  );
}