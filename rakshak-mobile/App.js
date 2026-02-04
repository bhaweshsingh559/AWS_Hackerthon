import React, { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";

const SAFETY_PROGRAMS = [
  {
    id: "health",
    label: "Health Emergency",
    summary: "Cardiac, breathing, or medical emergencies.",
    steps: ["Call emergency services.", "Keep the person still.", "Share live location."],
  },
  {
    id: "fire",
    label: "Fire Safety",
    summary: "Evacuate quickly and alert responders.",
    steps: ["Move away from smoke.", "Avoid elevators.", "Call fire emergency."],
  },
  {
    id: "accident",
    label: "Accidental Safety",
    summary: "Road/workplace accident guidance.",
    steps: ["Move to safety.", "Call emergency services.", "Share location."],
  },
  {
    id: "girls",
    label: "Girls Safety",
    summary: "Harassment/stalking response steps.",
    steps: ["Move to a safe spot.", "Alert contacts.", "Call police."],
  },
];

export default function App() {
  const [activeProgramId, setActiveProgramId] = useState("health");
  const [locationStatus, setLocationStatus] = useState("idle");
  const [coords, setCoords] = useState(null);
  const [liveSharing, setLiveSharing] = useState(false);
  const [wakePhraseEnabled, setWakePhraseEnabled] = useState(true);

  const selectedProgram = useMemo(
    () => SAFETY_PROGRAMS.find((program) => program.id === activeProgramId) || SAFETY_PROGRAMS[0],
    [activeProgramId]
  );

  const requestLocation = async () => {
    setLocationStatus("requesting");
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationStatus("blocked");
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    setLocationStatus("ready");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.brand}>Rakshak</Text>
          <Text style={styles.subtitle}>Emergency AI Assistant (Mobile)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Live Location</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestLocation}>
            <Text style={styles.primaryButtonText}>
              {locationStatus === "ready" ? "Refresh Location" : "Detect Location"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.meta}>
            {coords ? `Lat ${coords.lat.toFixed(4)}, Lon ${coords.lon.toFixed(4)}` : "Location not detected"}
          </Text>
          <TouchableOpacity
            style={[styles.secondaryButton, liveSharing && styles.secondaryButtonActive]}
            onPress={() => setLiveSharing((prev) => !prev)}
          >
            <Text style={styles.secondaryButtonText}>
              {liveSharing ? "Stop Live Sharing" : "Start Live Sharing"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Safety Programs</Text>
          {SAFETY_PROGRAMS.map((program) => (
            <TouchableOpacity
              key={program.id}
              style={[styles.programItem, activeProgramId === program.id && styles.programItemActive]}
              onPress={() => setActiveProgramId(program.id)}
            >
              <Text style={styles.programLabel}>{program.label}</Text>
              <Text style={styles.programSummary}>{program.summary}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{selectedProgram.label}</Text>
          <Text style={styles.meta}>{selectedProgram.summary}</Text>
          {selectedProgram.steps.map((step) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.dot} />
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Start SOS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Voice Assistant</Text>
          <Text style={styles.meta}>Wake phrase required to start listening.</Text>
          <TouchableOpacity
            style={[styles.secondaryButton, wakePhraseEnabled && styles.secondaryButtonActive]}
            onPress={() => setWakePhraseEnabled((prev) => !prev)}
          >
            <Text style={styles.secondaryButtonText}>
              {wakePhraseEnabled ? "Wake phrase ON" : "Wake phrase OFF"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  scroll: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  brand: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2ee7f2",
  },
  subtitle: {
    color: "#a8b3cf",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#121a2a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#23314f",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#eaf0ff",
    marginBottom: 12,
  },
  meta: {
    color: "#a8b3cf",
    marginTop: 8,
    marginBottom: 8,
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: "#4c7dff",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#0b0f19",
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#2ee7f2",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonActive: {
    backgroundColor: "rgba(46,231,242,0.2)",
  },
  secondaryButtonText: {
    color: "#eaf0ff",
    fontWeight: "600",
  },
  programItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#23314f",
    marginBottom: 10,
  },
  programItemActive: {
    borderColor: "#2ee7f2",
    backgroundColor: "rgba(46,231,242,0.12)",
  },
  programLabel: {
    color: "#eaf0ff",
    fontWeight: "600",
  },
  programSummary: {
    color: "#a8b3cf",
    fontSize: 12,
    marginTop: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2ee7f2",
    marginRight: 8,
  },
  stepText: {
    color: "#eaf0ff",
    fontSize: 13,
  },
});
