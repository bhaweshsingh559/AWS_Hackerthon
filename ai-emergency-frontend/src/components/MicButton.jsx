// src/components/MicButton.jsx
import React from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconMicrophone, IconMicrophoneOff } from "@tabler/icons-react";

export default function MicButton({ listening, onStart, onStop }) {
  return (
    <Tooltip label={listening ? "Stop listening" : "Start voice input"}>
      <ActionIcon
        size="lg"
        radius="md"
        variant="light"
        color={listening ? "red" : "green"}
        onClick={() => (listening ? onStop?.() : onStart?.())}
        title="Mic"
      >
        {listening ? <IconMicrophoneOff size={18} /> : <IconMicrophone size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}