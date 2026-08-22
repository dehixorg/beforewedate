import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';

export default function Matches() {
  const { user } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
    
    // Subscribe to matches updates
    const channel = supabase
      .channel('matches_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        fetchMatches();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMatches = async () => {
    if (!user) return;
    
    // Using an RPC or custom query would be cleaner, but for V1 we fetch the matches and then profiles
    const { data: matchesData, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    if (!matchesData || matchesData.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    // Get profiles for the matches
    const otherUserIds = matchesData.map(m => m.user_a === user.id ? m.user_b : m.user_a);
    
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, photos, bio')
      .in('user_id', otherUserIds);

    const enriched = matchesData.map(m => {
      const otherId = m.user_a === user.id ? m.user_b : m.user_a;
      const profile = profilesData?.find(p => p.user_id === otherId);
      return { ...m, profile };
    });

    setMatches(enriched);
    setLoading(false);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const extendMatch = async (matchId: string) => {
    setPurchasing(matchId);
    try {
      const res = await fetch(`http://localhost:3000/payments/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({ item_type: 'extend_match', match_id: matchId })
      });
      if (!res.ok) throw new Error();
      fetchMatches();
    } catch {
      alert('Payment failed.');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Matches</Text>
      
      {matches.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No matches yet.</Text>
          <Text style={styles.emptySub}>Keep swiping to find your person!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 16 }}
          renderItem={({ item }) => {
            const isInitiator = item.initiator_id === user?.id;
            const photoUrl = item.profile?.photos?.[0];
            const expired = new Date(item.expires_at).getTime() < new Date().getTime();

            if (expired && !item.is_initiated) return null; // Shouldn't show, cron catches it eventually

            return (
              <TouchableOpacity 
                style={styles.matchCard}
                onPress={() => router.push(`/chat/${item.id}`)}
              >
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: '#e2e8f0' }]} />
                )}
                
                <View style={styles.matchInfo}>
                  <Text style={styles.name}>{item.profile?.bio ? item.profile.bio.substring(0, 20) + '...' : 'Mystery Match'}</Text>
                  
                  {item.is_initiated ? (
                    <Text style={styles.statusActive}>Chat Active</Text>
                  ) : (
                    <View>
                      {isInitiator ? (
                        <Text style={styles.statusAction}>Your turn to initiate!</Text>
                      ) : (
                        <Text style={styles.statusWaiting}>Waiting for them...</Text>
                      )}
                      <View style={styles.timerRow}>
                        <Text style={styles.timer}>⏳ Expires in {getTimeRemaining(item.expires_at)}</Text>
                        <TouchableOpacity 
                          style={styles.extendBtn}
                          onPress={() => extendMatch(item.id)}
                          disabled={purchasing === item.id}
                        >
                          <Text style={styles.extendText}>{purchasing === item.id ? '...' : '+24h ($0.99)'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0f172a', marginBottom: 24 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -60 },
  emptyText: { fontSize: 20, fontWeight: '600', color: '#64748b' },
  emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
  matchCard: { flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, marginRight: 16 },
  matchInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  statusActive: { color: '#10b981', fontWeight: '500' },
  statusAction: { color: '#0ea5e9', fontWeight: '600' },
  statusWaiting: { color: '#64748b', fontWeight: '500' },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  timer: { fontSize: 12, color: '#f59e0b', fontWeight: '500' },
  extendBtn: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#fde68a' },
  extendText: { fontSize: 10, fontWeight: '700', color: '#d97706' }
});
