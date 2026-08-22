import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../../src/providers/AuthProvider';
import { supabase } from '../../../../src/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CoachMemoryDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [relationshipId, setRelationshipId] = useState<string | null>(null);
  const [scope, setScope] = useState<'user' | 'couple'>('user');

  useEffect(() => {
    fetchActiveRelationship();
  }, []);

  useEffect(() => {
    if (scope === 'user' || relationshipId) {
      fetchMemories();
    }
  }, [scope, relationshipId]);

  const fetchActiveRelationship = async () => {
    const { data: rel } = await supabase
      .from('relationships')
      .select('id')
      .or(`user_a.eq.${user?.id},user_b.eq.${user?.id}`)
      .neq('state', 'ended')
      .single();
    
    if (rel) setRelationshipId(rel.id);
  };

  const fetchMemories = async () => {
    setLoading(true);
    const refId = scope === 'user' ? user?.id : relationshipId;
    
    if (!refId) {
      setMemories([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/coach/memory/${scope}/${refId}`, {
        headers: { 'x-user-id': user?.id || '' }
      });
      const data = await res.json();
      setMemories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteMemory = (id: string) => {
    Alert.alert('Forget this?', 'The Coach will permanently forget this insight.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Forget', style: 'destructive', onPress: async () => {
          await fetch(`http://localhost:3000/coach/memory/${id}`, {
            method: 'DELETE',
            headers: { 'x-user-id': user?.id || '' }
          });
          setMemories(prev => prev.filter(m => m.id !== id));
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coach Memory</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, scope === 'user' && styles.activeTab]} 
          onPress={() => setScope('user')}
        >
          <Text style={[styles.tabText, scope === 'user' && styles.activeTabText]}>About Me</Text>
        </TouchableOpacity>
        
        {relationshipId && (
          <TouchableOpacity 
            style={[styles.tab, scope === 'couple' && styles.activeTab]} 
            onPress={() => setScope('couple')}
          >
            <Text style={[styles.tabText, scope === 'couple' && styles.activeTabText]}>About Us</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.disclaimer}>
        You are in control. These are the specific insights the Coach remembers to help facilitate better communication. You can securely delete any insight at any time. Raw chat transcripts are never stored here.
      </Text>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#6366f1"/></View>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={<Text style={styles.emptyText}>The Coach hasn't noted any patterns yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.memoryCard}>
              <View style={styles.memoryContent}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.kind.toUpperCase()}</Text>
                </View>
                <Text style={styles.summaryText}>{item.summary}</Text>
                <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteMemory(item.id)}>
                <MaterialCommunityIcons name="delete-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  tabContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: '#e2e8f0' },
  activeTab: { backgroundColor: '#6366f1' },
  tabText: { fontWeight: '600', color: '#64748b' },
  activeTabText: { color: 'white' },
  disclaimer: { paddingHorizontal: 16, fontSize: 13, color: '#64748b', fontStyle: 'italic', marginBottom: 8 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 32 },
  memoryCard: { flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  memoryContent: { flex: 1 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 8 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  summaryText: { fontSize: 15, color: '#1e293b', marginBottom: 8, lineHeight: 22 },
  dateText: { fontSize: 12, color: '#94a3b8' },
  deleteBtn: { padding: 8, justifyContent: 'center' }
});
