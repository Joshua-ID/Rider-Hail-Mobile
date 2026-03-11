import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRideStore } from "../../store/rideStore";

interface PlaceSuggestion {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const NIGERIA_BASE = { latitude: 6.5244, longitude: 3.3792 }; // Lagos

const searchPlaces = async (
  query: string,
  userLat?: number,
  userLng?: number,
): Promise<PlaceSuggestion[]> => {
  await new Promise((r) => setTimeout(r, 300));

  const baseLat = userLat || NIGERIA_BASE.latitude;
  const baseLng = userLng || NIGERIA_BASE.longitude;

  return [
    {
      id: "1",
      name: query,
      address: `${query}, Lagos, Nigeria`,
      latitude: baseLat + (Math.random() * 0.05 - 0.025),
      longitude: baseLng + (Math.random() * 0.05 - 0.025),
    },
    {
      id: "2",
      name: `${query} Central`,
      address: `${query} Central, Lagos Island, Nigeria`,
      latitude: baseLat + (Math.random() * 0.05 - 0.025),
      longitude: baseLng + (Math.random() * 0.05 - 0.025),
    },
    {
      id: "3",
      name: `${query} Area`,
      address: `Near ${query}, Victoria Island, Nigeria`,
      latitude: baseLat + (Math.random() * 0.05 - 0.025),
      longitude: baseLng + (Math.random() * 0.05 - 0.025),
    },
  ];
};

export default function SearchDestinationScreen({ navigation }: any) {
  const { pickup, setDestination } = useRideStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const found = await searchPlaces(
        text,
        pickup?.latitude,
        pickup?.longitude,
      );
      setResults(found);
    } finally {
      setLoading(false);
    }
  };

  const selectDestination = (place: PlaceSuggestion) => {
    setDestination({
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
    });
    navigation.navigate("RideEstimate", {
      pickup,
      destination: {
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Where to?</Text>
      </View>

      <View style={styles.searchBox}>
        <View style={styles.locations}>
          <View style={styles.locationRow}>
            <View style={[styles.dot, styles.dotGreen]} />
            <Text style={styles.locationText} numberOfLines={1}>
              {pickup?.address || "Current location"}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.locationRow}>
            <View style={[styles.dot, styles.dotBlue]} />
            <TextInput
              style={styles.destinationInput}
              placeholder="Enter destination"
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={search}
              autoFocus
            />
          </View>
        </View>
      </View>

      {loading && <ActivityIndicator style={{ margin: 20 }} color="#6C63FF" />}

      {results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => selectDestination(item)}
            >
              <View style={styles.resultIcon}>
                <Text>📍</Text>
              </View>
              <View style={styles.resultText}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultAddress}>{item.address}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : query.length === 0 ? (
        <View style={styles.recent}>
          <Text style={styles.sectionTitle}>Start typing to search</Text>
          <Text style={styles.sectionHint}>
            Results will be based on your current location
          </Text>
        </View>
      ) : !loading && results.length === 0 && query.length >= 2 ? (
        <View style={styles.recent}>
          <Text style={styles.sectionTitle}>No results found</Text>
          <Text style={styles.sectionHint}>Try a different search term</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  backBtn: { marginRight: 16 },
  backText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  searchBox: {
    margin: 16,
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2D2D44",
  },
  locations: {},
  locationRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotGreen: { backgroundColor: "#10B981" },
  dotBlue: { backgroundColor: "#6C63FF" },
  locationText: { flex: 1, color: "#9CA3AF", fontSize: 15 },
  divider: {
    height: 1,
    backgroundColor: "#2D2D44",
    marginVertical: 12,
    marginLeft: 24,
  },
  destinationInput: { flex: 1, color: "#FFFFFF", fontSize: 15, padding: 0 },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A2E",
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resultText: { flex: 1 },
  resultName: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  resultAddress: { color: "#9CA3AF", fontSize: 13, marginTop: 2 },
  recent: { padding: 24, alignItems: "center" },
  sectionTitle: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionHint: { color: "#4B5563", fontSize: 13, textAlign: "center" },
});
