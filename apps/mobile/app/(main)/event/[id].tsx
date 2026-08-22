import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../src/providers/AuthProvider';
import { supabase } from '../../../src/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function EventDiscovery() {
  const { id: eventId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [optIn, setOptIn] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (optIn) {
      fetchCandidates();
      interval = setInterval(sendHeartbeat, 30000); // 30s heartbeat
    }
    return () => clearInterval(interval);
  }, [optIn]);

  const fetchEvent = async () => {
    // Check if user is checked in and get opt_in status
    const { data: checkin } = await supabase
      .from('event_checkins')
      .select('discovery_opt_in')
      .eq('event_id', eventId)
      .eq('user_id', user?.id)
      .single();

    if (checkin) {
      setOptIn(checkin.discovery_opt_in);
    } else {
      Alert.alert('Not Checked In', 'You must check in to this event first.');
      router.back();
    }

    const { data: eventData } = await supabase
      .from('events')
      .select('*, venues(name)')
      .eq('id', eventId)
      .single();
    setEvent(eventData);
    setLoading(false);
  };

  const toggleOptIn = async (val: boolean) => {
    setOptIn(val);
    await fetch(`http://localhost:3000/events/${eventId}/discovery/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user?.id || ''
      },
      body: JSON.stringify({ opt_in: val })
    });
  };

  const fetchCandidates = async () => {
    const res = await fetch(`http://localhost:3000/events/${eventId}/discovery/candidates`, {
      headers: { 'x-user-id': user?.id || '' }
    });
    const data = await res.json();
    setCandidates(data);
  };

  const sendHeartbeat = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      
      const res = await fetch(`http://localhost:3000/events/${eventId}/discovery/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({ lat: loc.coords.latitude, lng: loc.coords.longitude })
      });
      
      const data = await res.json();
      if (!data.success) {
        Alert.alert('Left Event', 'You have left the geofence. Discovery mode deactivated.');
        setOptIn(false);
      } else {
        fetchCandidates(); // refresh deck
      }
    } catch (e) {
      console.log('Heartbeat failed', e);
    }
  };

  const handleLike = async (candidateId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/events/${eventId}/discovery/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({ to_user_id: candidateId })
      });
      const data = await res.json();
      
      if (data.match) {
        Alert.alert(
          'Mutual Interest! 🎉', 
          `Meet your match at: ${data.meetup_point}`
        );
      }
      
      // Remove from UI list
      setCandidates(prev => prev.filter(c => c.user_id !== candidateId));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1"/></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{event?.title}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleTitle}>Ghost Mode 👻</Text>
            <Text style={styles.toggleDesc}>Anonymous discovery in this room</Text>
          </View>
          <Switch value={optIn} onValueChange={toggleOptIn} trackColor={{ true: '#6366f1', false: '#cbd5e1' }} />
        </View>
      </View>

      {optIn ? (
        <FlatList
          data={candidates}
          keyExtractor={item => item.user_id}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No other attendees in Ghost Mode right now.</Text>}
          renderItem={({ item }) => (
            <View style={styles.candidateCard}>
              <View style={styles.candidateHeader}>
                <MaterialCommunityIcons name="incognito" size={24} color="#64748b" />
                <Text style={styles.candidateAlias}>{item.alias}</Text>
              </View>
              <Text style={styles.candidateBio}>"{item.bio_snippet}..."</Text>
              
              <View style={styles.actions}>
                <TouchableOpacity style={styles.passBtn} onPress={() => setCandidates(p => p.filter(c => c.user_id !== item.user_id))}>
                  <MaterialCommunityIcons name="close" size={24} color="#ef4444" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.likeBtn} onPress={() => handleLike(item.user_id)}>
                  <MaterialCommunityIcons name="heart" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <View style={styles.center}>
          <MaterialCommunityIcons name="ghost-off-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyText}>Enable Ghost Mode to discover others here.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  card: { backgroundColor: 'white', padding: 16, margin: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  toggleDesc: { fontSize: 13, color: '#64748b', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#64748b', marginTop: 16 },
  candidateCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  candidateHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  candidateAlias: { fontSize: 18, fontWeight: '700', color: '#334155' },
  candidateBio: { fontSize: 15, color: '#475569', fontStyle: 'italic', marginBottom: 20 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  passBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
  likeBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f43f5e', justifyContent: 'center', alignItems: 'center' },
});
