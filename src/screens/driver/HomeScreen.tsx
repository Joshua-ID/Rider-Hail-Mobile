import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Switch, Modal,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { driversAPI, ridesAPI } from '../../services/api';
import { connectSocket, getSocket, emitDriverLocation } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';
import { Ride } from '../../types';

export default function DriverHomeScreen({ navigation }: any) {
  const mapRef = useRef<MapView>(null);
  const { user, logout } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [incomingRide, setIncomingRide] = useState<Ride | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const driverStatus = user?.driver?.status;
  const isApproved = driverStatus === 'APPROVED';

  useEffect(() => {
    setupLocation();
    setupSocket();
    return () => { if (locationInterval.current) clearInterval(locationInterval.current); };
  }, []);

  const setupLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
  };

  const setupSocket = async () => {
    const socket = await connectSocket();
    socket.on('ride:request', (data: any) => {
      if (!activeRide) setIncomingRide(data.ride);
    });
    socket.on('ride:cancelled', () => {
      setActiveRide(null);
      Alert.alert('Ride Cancelled', 'The rider cancelled the ride');
    });
  };

  const toggleOnline = async (value: boolean) => {
    if (!isApproved) {
      Alert.alert('Not Approved', 'Your account is pending approval');
      return;
    }
    try {
      await driversAPI.toggleOnline(value);
      setIsOnline(value);
      if (value && location) {
        locationInterval.current = setInterval(() => {
          if (location) {
            emitDriverLocation(location.latitude, location.longitude, activeRide?.id);
            driversAPI.updateLocation(location.latitude, location.longitude);
          }
        }, 5000);
        // Watch location
        Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 10 },
          (loc) => {
            setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          }
        );
      } else {
        if (locationInterval.current) clearInterval(locationInterval.current);
      }
    } catch {}
  };

  const acceptRide = async () => {
    if (!incomingRide) return;
    try {
      const { data } = await ridesAPI.accept(incomingRide.id);
      setActiveRide(data.data);
      setIncomingRide(null);
      navigation.navigate('Navigation', { rideId: incomingRide.id });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not accept ride');
      setIncomingRide(null);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        region={location ? { ...location, latitudeDelta: 0.03, longitudeDelta: 0.03 } : undefined}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={[styles.statusText, { color: isApproved ? (isOnline ? '#10B981' : '#9CA3AF') : '#F59E0B' }]}>
            {!isApproved ? `⏳ ${driverStatus || 'PENDING'} approval` : isOnline ? '🟢 Online' : '⚫ Offline'}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => Alert.alert('Logout', '', [
          { text: 'Cancel' }, { text: 'Logout', style: 'destructive', onPress: logout }
        ])}>
          <Text style={styles.profileBtnText}>{user?.name?.charAt(0)}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom */}
      <View style={styles.bottomCard}>
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Go {isOnline ? 'Offline' : 'Online'}</Text>
            <Text style={styles.toggleSub}>{isOnline ? 'You are receiving ride requests' : 'Toggle to start accepting rides'}</Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: '#2D2D44', true: '#6C63FF' }}
            thumbColor={isOnline ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>

        <View style={styles.quickNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Earnings')}>
            <Text style={styles.navBtnIcon}>💰</Text>
            <Text style={styles.navBtnText}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('RideHistory')}>
            <Text style={styles.navBtnIcon}>📋</Text>
            <Text style={styles.navBtnText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => Alert.alert('Rating', `Your rating: ${user?.driver?.rating?.toFixed(1) || 'N/A'} ⭐`)}>
            <Text style={styles.navBtnIcon}>⭐</Text>
            <Text style={styles.navBtnText}>{user?.driver?.rating?.toFixed(1) || '–'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => Alert.alert('Rides', `Total rides: ${user?.driver?.totalRides || 0}`)}>
            <Text style={styles.navBtnIcon}>🚗</Text>
            <Text style={styles.navBtnText}>{user?.driver?.totalRides || 0} rides</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Incoming ride modal */}
      <Modal visible={!!incomingRide} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.rideModal}>
            <Text style={styles.modalTitle}>🔔 New Ride Request!</Text>
            <View style={styles.rideDetails}>
              <View style={styles.rideDetailRow}>
                <Text style={styles.rideDetailIcon}>📍</Text>
                <View>
                  <Text style={styles.rideDetailLabel}>Pickup</Text>
                  <Text style={styles.rideDetailValue}>{incomingRide?.pickupAddress}</Text>
                </View>
              </View>
              <View style={styles.rideDetailRow}>
                <Text style={styles.rideDetailIcon}>🏁</Text>
                <View>
                  <Text style={styles.rideDetailLabel}>Destination</Text>
                  <Text style={styles.rideDetailValue}>{incomingRide?.destinationAddress}</Text>
                </View>
              </View>
              <View style={styles.rideStats}>
                <View style={styles.rideStat}>
                  <Text style={styles.rideStatValue}>{incomingRide?.distance} km</Text>
                  <Text style={styles.rideStatLabel}>Distance</Text>
                </View>
                <View style={styles.rideStat}>
                  <Text style={styles.rideStatValue}>{incomingRide?.duration} min</Text>
                  <Text style={styles.rideStatLabel}>Duration</Text>
                </View>
                <View style={styles.rideStat}>
                  <Text style={[styles.rideStatValue, { color: '#10B981' }]}>${incomingRide?.fare?.toFixed(2)}</Text>
                  <Text style={styles.rideStatLabel}>Fare</Text>
                </View>
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => setIncomingRide(null)}>
                <Text style={styles.rejectBtnText}>✕ Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={acceptRide}>
                <Text style={styles.acceptBtnText}>✓ Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 60, backgroundColor: 'rgba(15,15,26,0.92)',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  statusText: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center' },
  profileBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 18 },
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0F0F1A', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  toggleLabel: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  toggleSub: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  quickNav: { flexDirection: 'row', gap: 10 },
  navBtn: { flex: 1, backgroundColor: '#1A1A2E', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2D2D44' },
  navBtnIcon: { fontSize: 22, marginBottom: 4 },
  navBtnText: { color: '#9CA3AF', fontSize: 12, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  rideModal: { backgroundColor: '#0F0F1A', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 20 },
  rideDetails: { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, marginBottom: 20, gap: 14 },
  rideDetailRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rideDetailIcon: { fontSize: 20, marginTop: 2 },
  rideDetailLabel: { color: '#9CA3AF', fontSize: 12 },
  rideDetailValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', marginTop: 2 },
  rideStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#2D2D44', paddingTop: 14 },
  rideStat: { flex: 1, alignItems: 'center' },
  rideStatValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  rideStatLabel: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: 12 },
  rejectBtn: { flex: 1, backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' },
  rejectBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
  acceptBtn: { flex: 2, backgroundColor: '#10B981', borderRadius: 14, padding: 16, alignItems: 'center' },
  acceptBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
