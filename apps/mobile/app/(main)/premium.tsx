import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/providers/AuthProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Premium() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/payments/subscribe`, {
        method: 'POST',
        headers: { 'x-user-id': user?.id || '' }
      });
      if (!res.ok) throw new Error('Failed');

      Alert.alert('Welcome to BeforeWeDate+', 'Your account has been upgraded!', [
        { text: 'Awesome', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={28} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <MaterialCommunityIcons name="star-shooting-outline" size={64} color="#f59e0b" style={styles.icon} />
        <Text style={styles.title}>BeforeWeDate<Text style={{color: '#f59e0b'}}>+</Text></Text>
        <Text style={styles.subtitle}>Unlock the ultimate relationship journey.</Text>

        <View style={styles.features}>
          <FeatureItem icon="eye-outline" text="See everyone who liked you" />
          <FeatureItem icon="filter-variant" text="Advanced Filters (Min Trust Score)" />
          <FeatureItem icon="infinity" text="Unlimited daily likes" />
          <FeatureItem icon="robot-outline" text="Unlimited AI Coach sessions" />
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.subscribeBtn} onPress={subscribe} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.subscribeBtnText}>Subscribe for $14.99/mo</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.disclaimer}>Cancel anytime. Secure checkout powered by Stripe.</Text>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: any, text: string }) {
  return (
    <View style={styles.featureItem}>
      <MaterialCommunityIcons name={icon} size={24} color="#f59e0b" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', paddingTop: 50 },
  header: { paddingHorizontal: 16, alignItems: 'flex-end' },
  content: { flex: 1, padding: 24, alignItems: 'center' },
  icon: { marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 40 },
  features: { width: '100%', gap: 20 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  featureText: { fontSize: 16, fontWeight: '600', color: '#334155' },
  spacer: { flex: 1 },
  subscribeBtn: { width: '100%', backgroundColor: '#f59e0b', padding: 18, borderRadius: 30, alignItems: 'center', marginBottom: 16 },
  subscribeBtnText: { color: 'white', fontSize: 18, fontWeight: '700' },
  disclaimer: { fontSize: 12, color: '#94a3b8', textAlign: 'center' }
});
