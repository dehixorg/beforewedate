import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/providers/AuthProvider';
import { supabase } from '../../../src/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RelationshipDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [relationship, setRelationship] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Pulse State
  const [pulseScore, setPulseScore] = useState<number>(3);
  const [pulseNote, setPulseNote] = useState('');
  const [insight, setInsight] = useState<string>('');
  const [submittingPulse, setSubmittingPulse] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchRelationship();
  }, []);

  const fetchRelationship = async () => {
    // 1. Get Relationship
    const { data: rel } = await supabase
      .from('relationships')
      .select('*')
      .or(`user_a.eq.${user?.id},user_b.eq.${user?.id}`)
      .neq('state', 'ended')
      .single();

    if (!rel) {
      // User is not in a relationship, redirect to deck
      router.replace('/deck');
      return;
    }
    setRelationship(rel);

    // 2. Get Partner Info
    const partnerId = rel.user_a === user?.id ? rel.user_b : rel.user_a;
    const { data: pData } = await supabase
      .from('profiles')
      .select('*, users(phone)')
      .eq('user_id', partnerId)
      .single();
      
    setPartner(pData);

    // 3. Get Pulse Insight
    fetchInsight(rel.id);

    // 4. Get Upcoming Dates
    fetchBookings(rel.id);

    setLoading(false);
  };

  const fetchBookings = async (relId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/dates/bookings/${relId}`, {
        headers: { 'x-user-id': user?.id || '' }
      });
      const data = await res.json();
      setBookings(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInsight = async (relId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/relationships/${relId}/pulse/insight`, {
        headers: { 'x-user-id': user?.id || '' }
      });
      const data = await res.json();
      setInsight(data.insight);
    } catch (e) {
      console.error(e);
    }
  };

  const submitPulse = async () => {
    if (!relationship) return;
    setSubmittingPulse(true);
    try {
      await fetch(`http://localhost:3000/relationships/${relationship.id}/pulse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({ score: pulseScore, note: pulseNote })
      });
      Alert.alert('Pulse Logged', 'Your private feeling tracker has been updated.');
      setPulseNote('');
      fetchInsight(relationship.id);
    } catch (e) {
      Alert.alert('Error', 'Failed to log pulse.');
    } finally {
      setSubmittingPulse(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      const res = await fetch(`http://localhost:3000/relationships/${relationship.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({ action })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        Alert.alert('Action Failed', data.message);
        return;
      }

      if (action === 'end' || action === 'end_now') {
        Alert.alert('Relationship Ended', 'You have been restored to the dating pool.');
        router.replace('/deck');
      } else {
        fetchRelationship();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const confirmAction = (action: string, title: string, message: string) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: action.includes('end') ? 'destructive' : 'default', onPress: () => handleAction(action) }
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1"/></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Relationship Hub</Text>
      </View>

      <View style={styles.partnerCard}>
        <MaterialCommunityIcons name="heart-pulse" size={48} color="#f43f5e" />
        <Text style={styles.partnerName}>You & {partner?.users?.phone}</Text>
        <Text style={styles.statusText}>Status: {relationship?.state.toUpperCase()}</Text>
      </View>

      {relationship?.state === 'official' && (
        <>
          {/* Coach Insight */}
          {insight ? (
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <MaterialCommunityIcons name="robot-outline" size={20} color="#6366f1" />
                <Text style={styles.insightTitle}>Coach Insight</Text>
              </View>
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ) : null}

          {/* Pulse Logger */}
          <View style={styles.pulseCard}>
            <Text style={styles.pulseTitle}>Log Private Pulse</Text>
            <Text style={styles.pulseSub}>How connected did you feel today? (Partner cannot see this)</Text>
            
            <View style={styles.scoreRow}>
              {[1, 2, 3, 4, 5].map(score => (
                <TouchableOpacity 
                  key={score} 
                  style={[styles.scoreBtn, pulseScore === score && styles.scoreBtnActive]}
                  onPress={() => setPulseScore(score)}
                >
                  <Text style={[styles.scoreText, pulseScore === score && styles.scoreTextActive]}>{score}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.pulseInput}
              placeholder="Optional private note..."
              value={pulseNote}
              onChangeText={setPulseNote}
            />

            <TouchableOpacity style={styles.pulseSubmitBtn} onPress={submitPulse} disabled={submittingPulse}>
              <Text style={styles.pulseSubmitText}>{submittingPulse ? 'Saving...' : 'Save Pulse'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={styles.actionsContainer}>
        {relationship?.state === 'official' && (
          <>
            <TouchableOpacity 
              style={[styles.btn, styles.dateMarketBtn]}
              onPress={() => router.push('/date-market')}
            >
              <MaterialCommunityIcons name="ticket-star" size={24} color="white" />
              <Text style={styles.dateMarketBtnText}>Browse Date Ideas</Text>
            </TouchableOpacity>

            {bookings.length > 0 && (
              <View style={styles.bookingsContainer}>
                <Text style={styles.bookingsTitle}>Upcoming Dates</Text>
                {bookings.map(b => (
                  <View key={b.id} style={styles.bookingCard}>
                    <MaterialCommunityIcons name="calendar-clock" size={20} color="#6366f1" />
                    <View>
                      <Text style={styles.bookingVenue}>{b.venues.name}</Text>
                      <Text style={styles.bookingTime}>{new Date(b.booking_time).toLocaleString()}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.btn, styles.pauseBtn]}
              onPress={() => confirmAction('pause', 'Take a Break', 'This will pause the relationship. You both stay off the market. There is a 48h cool-down before you can un-pause.')}
            >
              <MaterialCommunityIcons name="pause" size={24} color="#f59e0b" />
              <Text style={styles.pauseBtnText}>Take a Break</Text>
            </TouchableOpacity>
          </>
        )}

        {relationship?.state === 'paused' && (
          <TouchableOpacity 
            style={[styles.btn, styles.unpauseBtn]}
            onPress={() => handleAction('unpause')}
          >
            <MaterialCommunityIcons name="play" size={24} color="white" />
            <Text style={styles.unpauseBtnText}>Un-Pause</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.btn, styles.endBtn]}
          onPress={() => confirmAction('end', 'End Relationship', 'This will end the relationship for both of you and notify your partner. You will return to the dating pool.')}
        >
          <MaterialCommunityIcons name="close" size={24} color="#ef4444" />
          <Text style={styles.endBtnText}>End Relationship</Text>
        </TouchableOpacity>

      </View>

      {/* ALWAYS REACHABLE SAFETY EXIT */}
      <View style={styles.safetyContainer}>
        <Text style={styles.safetyNote}>If you need to leave immediately without confirmation prompts, use the Safety Exit. Your partner will not be asked for permission.</Text>
        <TouchableOpacity 
          style={[styles.btn, styles.safetyBtn]}
          onPress={() => handleAction('end_now')} // No confirm dialog here
        >
          <MaterialCommunityIcons name="shield-alert" size={24} color="white" />
          <Text style={styles.safetyBtnText}>End Now (Safety Exit)</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { padding: 16, paddingTop: 50, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  partnerCard: { backgroundColor: 'white', margin: 16, padding: 32, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  partnerName: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginTop: 16 },
  statusText: { fontSize: 14, color: '#64748b', marginTop: 8, fontWeight: '600' },
  actionsContainer: { padding: 16, gap: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, borderWidth: 1 },
  pauseBtn: { borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  pauseBtnText: { color: '#b45309', fontWeight: '600', fontSize: 16 },
  unpauseBtn: { borderColor: '#10b981', backgroundColor: '#10b981' },
  unpauseBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  endBtn: { borderColor: '#ef4444', backgroundColor: 'transparent' },
  endBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 16 },
  
  insightCard: { backgroundColor: '#eef2ff', marginHorizontal: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#c7d2fe' },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  insightTitle: { fontSize: 14, fontWeight: '700', color: '#3730a3' },
  insightText: { fontSize: 14, color: '#312e81', lineHeight: 20 },

  pulseCard: { backgroundColor: 'white', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  pulseTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  pulseSub: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  scoreBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  scoreBtnActive: { backgroundColor: '#6366f1' },
  scoreText: { fontSize: 16, fontWeight: '600', color: '#475569' },
  scoreTextActive: { color: 'white' },
  pulseInput: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  pulseSubmitBtn: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, alignItems: 'center' },
  pulseSubmitText: { color: 'white', fontWeight: '600' },

  dateMarketBtn: { borderColor: '#6366f1', backgroundColor: '#6366f1' },
  dateMarketBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  
  bookingsContainer: { backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  bookingsTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  bookingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  bookingVenue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  bookingTime: { fontSize: 12, color: '#64748b' },

  safetyContainer: { marginTop: 'auto', padding: 24, backgroundColor: '#fee2e2' },
  safetyNote: { fontSize: 12, color: '#991b1b', textAlign: 'center', marginBottom: 12 },
  safetyBtn: { borderColor: '#dc2626', backgroundColor: '#dc2626', borderWidth: 0 },
  safetyBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
