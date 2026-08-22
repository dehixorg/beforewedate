import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/providers/AuthProvider';
import { supabase } from '../../../src/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DateMarket() {
  const { user } = useAuth();
  const router = useRouter();

  const [venues, setVenues] = useState<any[]>([]);
  const [relationshipId, setRelationshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingVenue, setBookingVenue] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Get relationship
    const { data: rel } = await supabase
      .from('relationships')
      .select('id')
      .or(`user_a.eq.${user?.id},user_b.eq.${user?.id}`)
      .neq('state', 'ended')
      .single();
    
    if (rel) setRelationshipId(rel.id);

    // Get venues
    try {
      const res = await fetch(`http://localhost:3000/dates/venues`, {
        headers: { 'x-user-id': user?.id || '' }
      });
      const data = await res.json();
      setVenues(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const bookDate = async (venueId: string) => {
    if (!relationshipId) return;
    setBookingVenue(venueId);

    // Mock choosing a time: Tomorrow at 7 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);

    try {
      const res = await fetch(`http://localhost:3000/dates/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({
          relationship_id: relationshipId,
          venue_id: venueId,
          booking_time: tomorrow.toISOString()
        })
      });
      
      if (!res.ok) throw new Error('Failed');

      Alert.alert('Date Booked!', 'Your reservation is confirmed.', [
        { text: 'Awesome', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to book date.');
    } finally {
      setBookingVenue(null);
    }
  };

  const renderVenue = ({ item }: { item: any }) => (
    <View style={styles.venueCard}>
      <MaterialCommunityIcons name="storefront-outline" size={32} color="#6366f1" />
      <View style={styles.venueInfo}>
        <Text style={styles.venueName}>{item.name}</Text>
        <Text style={styles.venueTier}>{item.partner_tier.toUpperCase()} PARTNER</Text>
      </View>
      <TouchableOpacity 
        style={styles.bookBtn} 
        onPress={() => bookDate(item.id)}
        disabled={bookingVenue === item.id}
      >
        <Text style={styles.bookBtnText}>
          {bookingVenue === item.id ? 'Booking...' : 'Book Date'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Date Market</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.banner}>
        <MaterialCommunityIcons name="ticket-percent-outline" size={24} color="#0f766e" />
        <Text style={styles.bannerText}>Exclusive perks at partner venues</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#6366f1"/></View>
      ) : (
        <FlatList
          data={venues}
          keyExtractor={item => item.id}
          renderItem={renderVenue}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No partner venues available in your area yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  banner: { flexDirection: 'row', backgroundColor: '#ccfbf1', padding: 16, alignItems: 'center', gap: 8 },
  bannerText: { color: '#0f766e', fontWeight: '600' },
  venueCard: { flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  venueInfo: { flex: 1 },
  venueName: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  venueTier: { fontSize: 10, fontWeight: '700', color: '#6366f1' },
  bookBtn: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  bookBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 32 }
});
