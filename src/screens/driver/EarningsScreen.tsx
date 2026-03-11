import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { driversAPI } from '../../services/api';

export default function EarningsScreen() {
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEarnings(); }, []);

  const loadEarnings = async () => {
    try {
      const { data } = await driversAPI.getEarnings();
      setEarnings(data.data);
    } catch {} finally { setLoading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#6C63FF" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalAmount}>${earnings?.total?.toFixed(2) || '0.00'}</Text>
        <Text style={styles.totalRides}>{earnings?.totalRides || 0} total rides</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.periodCard}>
          <Text style={styles.periodLabel}>Today</Text>
          <Text style={styles.periodAmount}>${earnings?.today?.earnings?.toFixed(2) || '0.00'}</Text>
          <Text style={styles.periodRides}>{earnings?.today?.rides || 0} rides</Text>
        </View>
        <View style={styles.periodCard}>
          <Text style={styles.periodLabel}>This Week</Text>
          <Text style={styles.periodAmount}>${earnings?.week?.earnings?.toFixed(2) || '0.00'}</Text>
          <Text style={styles.periodRides}>{earnings?.week?.rides || 0} rides</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Rides</Text>
      {earnings?.recentRides?.map((ride: any) => (
        <View key={ride.id} style={styles.rideRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rideAddr} numberOfLines={1}>{ride.pickupAddress}</Text>
            <Text style={styles.rideDate}>{new Date(ride.completedAt).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.rideFare}>${ride.fare?.toFixed(2)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' },
  totalCard: { backgroundColor: '#6C63FF', borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 16 },
  totalLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 8 },
  totalAmount: { fontSize: 40, fontWeight: '800', color: '#FFFFFF' },
  totalRides: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  periodCard: { flex: 1, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#2D2D44' },
  periodLabel: { color: '#9CA3AF', fontSize: 13, marginBottom: 6 },
  periodAmount: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  periodRides: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#9CA3AF', fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  rideRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2D2D44' },
  rideAddr: { color: '#FFFFFF', fontSize: 14 },
  rideDate: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  rideFare: { color: '#10B981', fontSize: 16, fontWeight: '700' },
});
