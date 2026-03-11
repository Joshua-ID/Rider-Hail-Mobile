import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ridesAPI } from '../../services/api';
import { Ride } from '../../types';

export default function RideHistoryScreen({ navigation }: any) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRides(); }, []);

  const loadRides = async () => {
    try {
      const { data } = await ridesAPI.history();
      setRides(data.data.rides);
    } catch {} finally { setLoading(false); }
  };

  const statusColor = (s: string) => ({
    COMPLETED: '#10B981', CANCELLED: '#EF4444', IN_PROGRESS: '#6C63FF',
  }[s] || '#9CA3AF');

  if (loading) return <View style={styles.center}><ActivityIndicator color="#6C63FF" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>No rides yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.route}>
                <View style={styles.routePoint}>
                  <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.address} numberOfLines={1}>{item.pickupAddress}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                  <View style={[styles.dot, { backgroundColor: '#6C63FF' }]} />
                  <Text style={styles.address} numberOfLines={1}>{item.destinationAddress}</Text>
                </View>
              </View>
              <View style={styles.fareBox}>
                <Text style={styles.fare}>${item.fare?.toFixed(2)}</Text>
                <Text style={[styles.status, { color: statusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.date}>{new Date(item.requestedAt).toLocaleDateString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' },
  empty: { color: '#9CA3AF', textAlign: 'center', marginTop: 40, fontSize: 16 },
  card: { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2D2D44' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  route: { flex: 1, marginRight: 12 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  address: { flex: 1, color: '#FFFFFF', fontSize: 14 },
  routeLine: { height: 12, width: 1, backgroundColor: '#2D2D44', marginLeft: 4, marginVertical: 3 },
  fareBox: { alignItems: 'flex-end' },
  fare: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  status: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  date: { color: '#9CA3AF', fontSize: 12, marginTop: 10 },
});
