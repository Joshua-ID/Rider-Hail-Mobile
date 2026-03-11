import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Linking,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { ridesAPI } from '../../services/api';
import { connectSocket, getSocket } from '../../services/socket';
import { useRideStore } from '../../store/rideStore';
import { Ride } from '../../types';

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: '🔍 Finding your driver...',
  ACCEPTED: '✅ Driver is on the way!',
  DRIVER_ARRIVING: '🚗 Driver arriving...',
  DRIVER_ARRIVED: '📍 Driver has arrived!',
  IN_PROGRESS: '🚀 Ride in progress',
  COMPLETED: '🎉 Ride completed!',
  CANCELLED: '❌ Ride cancelled',
};

export default function TrackRideScreen({ navigation, route }: any) {
  const { rideId } = route.params;
  const mapRef = useRef<MapView>(null);
  const { setCurrentRide, setDriverLocation, driverLocation, clearRide } = useRideStore();
  const [ride, setRide] = useState<Ride | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    loadRide();
    setupSocket();
    return () => { getSocket()?.off('driver:location_update'); };
  }, []);

  const loadRide = async () => {
    try {
      const { data } = await ridesAPI.get(rideId);
      setRide(data.data);
      setCurrentRide(data.data);
    } catch {}
  };

  const setupSocket = async () => {
    const socket = await connectSocket();
    socket.on('driver:location_update', (data: any) => {
      if (data.rideId === rideId) {
        setDriverLocation({ latitude: data.lat, longitude: data.lng });
        mapRef.current?.animateCamera({ center: { latitude: data.lat, longitude: data.lng } });
      }
    });
    socket.on('ride:accepted', (data: any) => { setRide(data.ride); setCurrentRide(data.ride); });
    socket.on('ride:started', (data: any) => { setRide(data.ride); setCurrentRide(data.ride); });
    socket.on('ride:completed', (data: any) => {
      setRide(data.ride); setCurrentRide(data.ride);
      setShowRating(true);
    });
    socket.on('ride:cancelled', (data: any) => {
      setRide(data.ride);
      Alert.alert('Ride Cancelled', data.reason || 'Your ride was cancelled', [
        { text: 'OK', onPress: () => { clearRide(); navigation.navigate('Home'); } }
      ]);
    });
  };

  const cancelRide = () => {
    Alert.alert('Cancel Ride', 'Are you sure?', [
      { text: 'No' },
      {
        text: 'Yes, cancel', style: 'destructive',
        onPress: async () => {
          try {
            await ridesAPI.cancel(rideId, 'Rider cancelled');
            clearRide(); navigation.navigate('Home');
          } catch {}
        }
      }
    ]);
  };

  const submitRating = async () => {
    try {
      await ridesAPI.rate(rideId, rating);
      navigation.navigate('Payment', { rideId });
    } catch {
      navigation.navigate('Home');
    }
  };

  if (!ride) return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;

  const driverLat = driverLocation?.latitude || ride.driver?.locationLat;
  const driverLng = driverLocation?.longitude || ride.driver?.locationLng;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={{
          latitude: ride.pickupLat,
          longitude: ride.pickupLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={{ latitude: ride.pickupLat, longitude: ride.pickupLng }} pinColor="#10B981" title="Pickup" />
        <Marker coordinate={{ latitude: ride.destinationLat, longitude: ride.destinationLng }} pinColor="#6C63FF" title="Destination" />
        {driverLat && driverLng && (
          <Marker coordinate={{ latitude: driverLat, longitude: driverLng }}>
            <View style={styles.driverMarker}><Text style={{ fontSize: 24 }}>🚗</Text></View>
          </Marker>
        )}
        <Polyline
          coordinates={[
            { latitude: ride.pickupLat, longitude: ride.pickupLng },
            { latitude: ride.destinationLat, longitude: ride.destinationLng },
          ]}
          strokeColor="#6C63FF" strokeWidth={3} lineDashPattern={[5, 3]}
        />
      </MapView>

      {/* Rating modal overlay */}
      {showRating && (
        <View style={styles.ratingOverlay}>
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Rate your driver</Text>
            <Text style={styles.ratingDriverName}>{ride.driver?.user?.name}</Text>
            <View style={styles.stars}>
              {[1,2,3,4,5].map(s => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Text style={[styles.star, s <= rating && styles.starActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.submitRatingBtn} onPress={submitRating}>
              <Text style={styles.submitRatingText}>Submit Rating</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{STATUS_LABELS[ride.status] || ride.status}</Text>
      </View>

      {/* Bottom info */}
      <View style={styles.bottomCard}>
        {ride.driver && (
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{ride.driver.user?.name?.charAt(0) || 'D'}</Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{ride.driver.user?.name}</Text>
              <Text style={styles.driverVehicle}>
                {ride.driver.vehicleMake} {ride.driver.vehicleModel} · {ride.driver.vehiclePlate}
              </Text>
              <Text style={styles.driverRating}>⭐ {ride.driver.rating.toFixed(1)}</Text>
            </View>
            {ride.driver.user?.phone && (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${ride.driver!.user!.phone}`)}
              >
                <Text style={styles.callBtnText}>📞</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.rideInfo}>
          <View style={styles.fareInfo}>
            <Text style={styles.fareLabel}>Estimated Fare</Text>
            <Text style={styles.fareValue}>${ride.fare?.toFixed(2)}</Text>
          </View>
          {ride.status === 'COMPLETED' && (
            <TouchableOpacity style={styles.payBtn} onPress={() => navigation.navigate('Payment', { rideId })}>
              <Text style={styles.payBtnText}>Pay Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {['REQUESTED', 'ACCEPTED'].includes(ride.status) && (
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelRide}>
            <Text style={styles.cancelBtnText}>Cancel Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  loading: { color: '#FFFFFF', textAlign: 'center', marginTop: 100 },
  map: { flex: 1 },
  driverMarker: { backgroundColor: 'white', borderRadius: 20, padding: 4 },
  statusBar: {
    position: 'absolute', top: 60, left: 16, right: 16,
    backgroundColor: 'rgba(15,15,26,0.95)', borderRadius: 16,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2D2D44',
  },
  statusText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  bottomCard: {
    backgroundColor: '#0F0F1A', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#2D2D44',
  },
  driverInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  driverAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  driverAvatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  driverDetails: { flex: 1 },
  driverName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  driverVehicle: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  driverRating: { color: '#F59E0B', fontSize: 13, marginTop: 2 },
  callBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2D2D44',
  },
  callBtnText: { fontSize: 20 },
  rideInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  fareInfo: {},
  fareLabel: { color: '#9CA3AF', fontSize: 13 },
  fareValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  payBtn: { backgroundColor: '#10B981', borderRadius: 12, padding: 12, paddingHorizontal: 20 },
  payBtnText: { color: '#FFFFFF', fontWeight: '700' },
  cancelBtn: {
    backgroundColor: 'transparent', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#EF4444',
  },
  cancelBtnText: { color: '#EF4444', fontWeight: '600' },
  ratingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  ratingCard: { backgroundColor: '#1A1A2E', borderRadius: 24, padding: 32, width: '100%', alignItems: 'center' },
  ratingTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  ratingDriverName: { color: '#9CA3AF', fontSize: 16, marginBottom: 20 },
  stars: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  star: { fontSize: 40, color: '#2D2D44' },
  starActive: { color: '#F59E0B' },
  submitRatingBtn: { backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, width: '100%', alignItems: 'center' },
  submitRatingText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
