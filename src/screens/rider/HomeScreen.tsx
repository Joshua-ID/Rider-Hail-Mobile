import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { useAuthStore } from "../../store/authStore";
import { useRideStore } from "../../store/rideStore";
import { driversAPI } from "../../services/api";
import { Driver } from "../../types";

export default function RiderHomeScreen({ navigation }: any) {
  const mapRef = useRef<MapView>(null);
  const { user, logout } = useAuthStore();
  const { pickup, setPickup, currentRide } = useRideStore();
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);
  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null); // null until we get real location

  useEffect(() => {
    getLocation();
    if (
      currentRide &&
      ["ACCEPTED", "DRIVER_ARRIVING", "IN_PROGRESS"].includes(
        currentRide.status,
      )
    ) {
      navigation.navigate("TrackRide", { rideId: currentRide.id });
    }
  }, []);

  useEffect(() => {
    if (pickup) fetchNearbyDrivers();
  }, [pickup]);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Location access required");
      // fallback to a default only if permission denied
      setRegion({
        latitude: 6.5244,
        longitude: 3.3792,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }); // Lagos
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;

      const [geocoded] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const address = geocoded
        ? `${geocoded.street || ""} ${geocoded.city || ""}`.trim()
        : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

      setPickup({ latitude, longitude, address });
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion);
    } catch (e) {
      Alert.alert("Error", "Could not get your location. Please try again.");
    }
  };

  const fetchNearbyDrivers = async () => {
    if (!pickup) return;
    try {
      const { data } = await driversAPI.getNearby(
        pickup.latitude,
        pickup.longitude,
      );
      setNearbyDrivers(data.data || []);
    } catch {}
  };

  // Show loading spinner until we have real location
  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {nearbyDrivers.map((driver) =>
          driver.locationLat && driver.locationLng ? (
            <Marker
              key={driver.id}
              coordinate={{
                latitude: driver.locationLat,
                longitude: driver.locationLng,
              }}
              title={driver.user?.name || "Driver"}
            >
              <View style={styles.driverMarker}>
                <Text style={styles.driverMarkerText}>🚗</Text>
              </View>
            </Marker>
          ) : null,
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            Hello, {user?.name?.split(" ")[0]} 👋
          </Text>
          <Text style={styles.greetingSubtext}>Where are you going?</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() =>
            Alert.alert("Logout", "Are you sure?", [
              { text: "Cancel" },
              { text: "Logout", style: "destructive", onPress: logout },
            ])
          }
        >
          <Text style={styles.profileBtnText}>{user?.name?.charAt(0)}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate("SearchDestination")}
          activeOpacity={0.8}
        >
          <Text style={styles.searchIcon}>📍</Text>
          <View style={styles.searchContent}>
            <Text style={styles.searchFrom} numberOfLines={1}>
              {pickup?.address || "Current location"}
            </Text>
            <Text style={styles.searchPlaceholder}>Where to?</Text>
          </View>
          <View style={styles.searchArrow}>
            <Text style={styles.searchArrowText}>›</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          {["Work", "Home", "Gym", "Airport"].map((place) => (
            <TouchableOpacity
              key={place}
              style={styles.quickBtn}
              onPress={() => navigation.navigate("SearchDestination")}
            >
              <Text style={styles.quickBtnText}>{place}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate("RideHistory")}
        >
          <Text style={styles.historyBtnText}>📋 Ride History</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.recenter} onPress={getLocation}>
        <Text style={styles.recenterText}>◎</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0F0F1A",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: { color: "#9CA3AF", fontSize: 16 },
  map: { flex: 1 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "rgba(15,15,26,0.92)",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {},
  greetingText: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  greetingSubtext: { fontSize: 14, color: "#9CA3AF", marginTop: 2 },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
  },
  profileBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 18 },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0F0F1A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2D2D44",
  },
  searchIcon: { fontSize: 20, marginRight: 12 },
  searchContent: { flex: 1 },
  searchFrom: { fontSize: 12, color: "#9CA3AF", marginBottom: 2 },
  searchPlaceholder: { fontSize: 16, color: "#FFFFFF", fontWeight: "600" },
  searchArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
  },
  searchArrowText: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  quickActions: { flexDirection: "row", gap: 8, marginTop: 16 },
  quickBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: "#1A1A2E",
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2D2D44",
  },
  quickBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "500" },
  historyBtn: {
    marginTop: 12,
    padding: 14,
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2D2D44",
  },
  historyBtnText: { color: "#9CA3AF", fontSize: 15, fontWeight: "500" },
  driverMarker: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  driverMarkerText: { fontSize: 20 },
  recenter: {
    position: "absolute",
    right: 16,
    bottom: 260,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0F0F1A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  recenterText: { color: "#6C63FF", fontSize: 22 },
});
