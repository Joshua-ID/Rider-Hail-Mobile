import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ridesAPI, paymentsAPI } from '../../services/api';
import { useRideStore } from '../../store/rideStore';
import { Ride } from '../../types';

export default function PaymentScreen({ navigation, route }: any) {
  const { rideId } = route.params;
  const { clearRide } = useRideStore();
  const [ride, setRide] = useState<Ride | null>(null);
  const [method, setMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadRide(); }, []);

  const loadRide = async () => {
    try {
      const { data } = await ridesAPI.get(rideId);
      setRide(data.data);
      if (data.data.payment?.status === 'COMPLETED') {
        navigation.replace('Home');
      }
    } catch {}
  };

  const confirmPayment = async () => {
    setLoading(true);
    try {
      await paymentsAPI.confirm(rideId, method);
      Alert.alert('Payment Successful! 🎉', 'Thank you for riding with us!', [
        { text: 'OK', onPress: () => { clearRide(); navigation.navigate('Home'); } }
      ]);
    } catch {
      Alert.alert('Payment failed', 'Please try again');
    } finally { setLoading(false); }
  };

  if (!ride) return <View style={styles.center}><ActivityIndicator color="#6C63FF" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment</Text>
        <Text style={styles.subtitle}>Ride completed ✅</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Distance</Text>
          <Text style={styles.summaryValue}>{ride.distance} km</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duration</Text>
          <Text style={styles.summaryValue}>{ride.duration} min</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryTotal]}>
          <Text style={styles.totalLabel}>Total Fare</Text>
          <Text style={styles.totalValue}>${ride.fare?.toFixed(2)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Payment Method</Text>
      <View style={styles.methods}>
        {(['CASH', 'CARD'] as const).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.methodCard, method === m && styles.methodCardActive]}
            onPress={() => setMethod(m)}
          >
            <Text style={styles.methodIcon}>{m === 'CASH' ? '💵' : '💳'}</Text>
            <Text style={[styles.methodName, method === m && styles.methodNameActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.payBtn, loading && styles.payBtnDisabled]}
        onPress={confirmPayment}
        disabled={loading}
      >
        <Text style={styles.payBtnText}>
          {loading ? 'Processing...' : `Pay $${ride.fare?.toFixed(2)}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', padding: 24, paddingTop: 80 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { color: '#9CA3AF', fontSize: 16, marginTop: 4 },
  summary: { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#2D2D44' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: '#9CA3AF', fontSize: 15 },
  summaryValue: { color: '#FFFFFF', fontSize: 15 },
  summaryTotal: { borderTopWidth: 1, borderTopColor: '#2D2D44', paddingTop: 12, marginTop: 4 },
  totalLabel: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  totalValue: { color: '#10B981', fontSize: 24, fontWeight: '800' },
  sectionTitle: { color: '#9CA3AF', fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  methods: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  methodCard: { flex: 1, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#2D2D44' },
  methodCardActive: { borderColor: '#6C63FF', backgroundColor: '#6C63FF15' },
  methodIcon: { fontSize: 32, marginBottom: 8 },
  methodName: { color: '#9CA3AF', fontWeight: '600' },
  methodNameActive: { color: '#6C63FF' },
  payBtn: { backgroundColor: '#6C63FF', borderRadius: 16, padding: 18, alignItems: 'center' },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
