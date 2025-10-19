// src/components/InstructionCard.jsx
import React from "react";
import { Card, Badge, Text, Stack } from "@mantine/core";

export default function InstructionCard({ severity = "UNKNOWN", instructions = [], reasoning = "" }) {
  const color = severity === "CRITICAL" ? "red" : severity === "SEVERE" ? "orange" : severity === "MODERATE" ? "yellow" : "gray";
  return (
    <Card shadow="sm" px="md" py="sm" radius="md" withBorder>
      <Stack spacing={6}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Badge color={color} variant="filled">{severity}</Badge>
          <Text size="xs" color="dimmed">{reasoning}</Text>
        </div>
        <div>
          {instructions && instructions.length ? (
            instructions.map((it, idx) => (
              <Text key={idx} size="sm" style={{ marginTop: idx === 0 ? 6 : 4 }}>
                • {it}
              </Text>
            ))
          ) : (
            <Text size="sm">No instructions provided.</Text>
          )}
        </div>
      </Stack>
    </Card>
  );
}