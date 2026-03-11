import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { ridesAPI } from '../../services/api';
import { useRideStore } from '../../store/rideStore';
import { RideEstimate } from '../../types';

export default function RideEstimateScreen({ navigation, route }: any) {
  const { pickup, destination } = route.params;
  const { setCurrentRide } = useRideStore();
  const [estimate, setEstimate] = useState<RideEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => { fetchEstimate(); }, []);

  const fetchEstimate = async () => {
    try {
      const { data } = await ridesAPI.estimate({
        originLat: pickup.latitude,
        originLng: pickup.longitude,
        destLat: destination.latitude,
        destLng: destination.longitude,
      });
      setEstimate(data.data);
    } catch {
      Alert.alert('Error', 'Could not get ride estimate');
    } finally {
      setLoading(false);
    }
  };

  const requestRide = async () => {
    if (!estimate) return;
    setRequesting(true);
    try {
      const { data } = await ridesAPI.create({
        pickupLat: pickup.latitude,
        pickupLng: pickup.longitude,
        pickupAddress: pickup.address,
        destinationLat: destination.latitude,
        destinationLng: destination.longitude,
        destinationAddress: destination.address,
        distance: estimate.distance,
        duration: estimate.duration,
        fare: estimate.fare,
      });
      setCurrentRide(data.data);
      navigation.navigate('TrackRide', { rideId: data.data.id });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not request ride');
    } finally {
      setRequesting(false);
    }
  };

  const midLat = (pickup.latitude + destination.latitude) / 2;
  const midLng = (pickup.longitude + destination.longitude) / 2;
  const latDelta = Math.abs(pickup.latitude - destination.latitude) * 1.5 + 0.01;
  const lngDelta = Math.abs(pickup.longitude - destination.longitude) * 1.5 + 0.01;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
      >
        <Marker coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }} pinColor="#10B981" />
        <Marker coordinate={{ latitude: destination.latitude, longitude: destination.longitude }} pinColor="#6C63FF" />
        <Polyline
          coordinates={[
            { latitude: pickup.latitude, longitude: pickup.longitude },
            { latitude: destination.latitude, longitude: destination.longitude },
          ]}
          strokeColor="#6C63FF"
          strokeWidth={3}
          lineDashPattern={[5, 3]}
        />
      </MapView>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.route}>
          <View style={styles.routePoint}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.routeText} numberOfLines={1}>{pickup.address}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routePoint}>
            <View style={[styles.dot, { backgroundColor: '#6C63FF' }]} />
            <Text style={styles.routeText} numberOfLines={1}>{destination.address}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color="#6C63FF" style={{ marginVertical: 24 }} />
        ) : estimate ? (
          <>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{estimate.distance} km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{estimate.duration} min</Text>
                <Text style={styles.statLabel}>Est. Time</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>${estimate.fare}</Text>
                <Text style={styles.statLabel}>Fare</Text>
              </View>
            </View>

            <View style={styles.vehicleTypes}>
              {[
                { name: 'Economy', icon: '🚗', mult: 1 },
                { name: 'Comfort', icon: '🚙', mult: 1.3 },
                { name: 'Premium', icon: '🏎', mult: 1.8 },
              ].map(({ name, icon, mult }) => (
                <TouchableOpacity key={name} style={styles.vehicleCard}>
                  <Text style={styles.vehicleIcon}>{icon}</Text>
                  <Text style={styles.vehicleName}>{name}</Text>
                  <Text style={styles.vehicleFare}>${(estimate.fare * mult).toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.requestBtn, requesting && styles.requestBtnDisabled]}
              onPress={requestRide}
              disabled={requesting}
            >
              <Text style={styles.requestBtnText}>
                {requesting ? 'Finding driver...' : `Request Ride · $${estimate.fare}`}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  backBtn: {
    position: 'absolute', top: 60, left: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#0F0F1A', justifyContent: 'center', alignItems: 'center',
  },
  backText: { color: '#FFFFFF', fontSize: 20 },
  card: {
    backgroundColor: '#0F0F1A', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  route: { marginBottom: 20 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  routeText: { flex: 1, color: '#FFFFFF', fontSize: 14 },
  routeLine: { height: 16, width: 1, backgroundColor: '#2D2D44', marginLeft: 5, marginVertical: 4 },
  stats: {
    flexDirection: 'row', backgroundColor: '#1A1A2E',
    borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#2D2D44',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#2D2D44' },
  vehicleTypes: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  vehicleCard: {
    flex: 1, backgroundColor: '#1A1A2E', borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#2D2D44',
  },
  vehicleIcon: { fontSize: 24, marginBottom: 4 },
  vehicleName: { color: '#9CA3AF', fontSize: 12, marginBottom: 4 },
  vehicleFare: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  requestBtn: { backgroundColor: '#6C63FF', borderRadius: 16, padding: 18, alignItems: 'center' },
  requestBtnDisabled: { opacity: 0.6 },
  requestBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
