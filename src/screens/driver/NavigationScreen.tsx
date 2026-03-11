import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { ridesAPI } from '../../services/api';
import { emitDriverLocation } from '../../services/socket';
import { Ride } from '../../types';

const STEPS: { from: string; to: string; action: string; status: string; next: string }[] = [
  { from: 'ACCEPTED', to: 'Pickup', action: '📍 Arrived at Pickup', status: 'DRIVER_ARRIVED', next: 'DRIVER_ARRIVED' },
  { from: 'DRIVER_ARRIVED', to: 'Destination', action: '🚀 Start Ride', status: 'IN_PROGRESS', next: 'IN_PROGRESS' },
  { from: 'IN_PROGRESS', to: 'Destination', action: '🏁 Complete Ride', status: 'COMPLETED', next: 'COMPLETED' },
];

export default function DriverNavigationScreen({ navigation, route }: any) {
  const { rideId } = route.params;
  const mapRef = useRef<MapView>(null);
  const [ride, setRide] = useState<Ride | null>(null);
  const [driverLoc, setDriverLoc] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadRide();
    startLocationTracking();
  }, []);

  const loadRide = async () => {
    const { data } = await ridesAPI.get(rideId);
    setRide(data.data);
  };

  const startLocationTracking = async () => {
    await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 10 },
      (loc) => {
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setDriverLoc(coords);
        emitDriverLocation(coords.latitude, coords.longitude, rideId);
      }
    );
  };

  const updateStatus = async (status: string) => {
    try {
      const { data } = await ridesAPI.updateStatus(rideId, status);
      setRide(data.data);
      if (status === 'COMPLETED') {
        navigation.navigate('Home');
        Alert.alert('Ride Completed! 🎉', `You earned $${data.data.fare?.toFixed(2)}`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not update status');
    }
  };

  const openMapsNavigation = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  if (!ride) return <View style={styles.container} />;

  const currentStep = STEPS.find(s => s.from === ride.status);
  const targetLat = ride.status === 'IN_PROGRESS' ? ride.destinationLat : ride.pickupLat;
  const targetLng = ride.status === 'IN_PROGRESS' ? ride.destinationLng : ride.pickupLng;
  const targetAddress = ride.status === 'IN_PROGRESS' ? ride.destinationAddress : ride.pickupAddress;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={driverLoc ? { ...driverLoc, latitudeDelta: 0.05, longitudeDelta: 0.05 } : {
          latitude: ride.pickupLat, longitude: ride.pickupLng, latitudeDelta: 0.05, longitudeDelta: 0.05,
        }}
      >
        {driverLoc && (
          <Marker coordinate={driverLoc}>
            <View style={styles.driverMarker}><Text style={{ fontSize: 22 }}>🚗</Text></View>
          </Marker>
        )}
        <Marker coordinate={{ latitude: ride.pickupLat, longitude: ride.pickupLng }} pinColor="#10B981" title="Pickup" />
        <Marker coordinate={{ latitude: ride.destinationLat, longitude: ride.destinationLng }} pinColor="#6C63FF" title="Destination" />
        {driverLoc && (
          <Polyline
            coordinates={[driverLoc, { latitude: targetLat, longitude: targetLng }]}
            strokeColor="#6C63FF" strokeWidth={3} lineDashPattern={[5, 3]}
          />
        )}
      </MapView>

      {/* Top card */}
      <View style={styles.topCard}>
        <Text style={styles.topLabel}>
          {ride.status === 'IN_PROGRESS' ? '🚀 Heading to destination' : '📍 Heading to pickup'}
        </Text>
        <Text style={styles.topAddress} numberOfLines={2}>{targetAddress}</Text>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => openMapsNavigation(targetLat, targetLng)}
        >
          <Text style={styles.navBtnText}>Open in Maps 🗺</Text>
        </TouchableOpacity>
      </View>

      {/* Rider info */}
      <View style={styles.bottomCard}>
        <View style={styles.riderRow}>
          <View style={styles.riderAvatar}>
            <Text style={styles.riderAvatarText}>{ride.rider?.name?.charAt(0) || 'R'}</Text>
          </View>
          <View style={styles.riderInfo}>
            <Text style={styles.riderName}>{ride.rider?.name}</Text>
            <Text style={styles.riderFare}>Fare: ${ride.fare?.toFixed(2)}</Text>
          </View>
          {ride.rider?.phone && (
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${ride.rider!.phone}`)}
            >
              <Text style={{ fontSize: 20 }}>📞</Text>
            </TouchableOpacity>
          )}
        </View>

        {currentStep && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(currentStep.next)}>
            <Text style={styles.actionBtnText}>{currentStep.action}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  driverMarker: { backgroundColor: 'white', borderRadius: 20, padding: 4 },
  topCard: {
    position: 'absolute', top: 60, left: 16, right: 16,
    backgroundColor: 'rgba(15,15,26,0.95)', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#2D2D44',
  },
  topLabel: { color: '#9CA3AF', fontSize: 13, marginBottom: 4 },
  topAddress: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  navBtn: { backgroundColor: '#6C63FF', borderRadius: 10, padding: 10, alignItems: 'center' },
  navBtnText: { color: '#FFFFFF', fontWeight: '600' },
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0F0F1A', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  riderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  riderAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  riderAvatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  riderInfo: { flex: 1 },
  riderName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  riderFare: { color: '#10B981', fontSize: 14, marginTop: 2 },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2D2D44' },
  actionBtn: { backgroundColor: '#10B981', borderRadius: 16, padding: 18, alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
