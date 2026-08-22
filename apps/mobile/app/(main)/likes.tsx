import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/providers/AuthProvider';
import { supabase } from '../../../src/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Likes() {
  const { user } = useAuth();
  const router = useRouter();

  const [likes, setLikes] = useState<any[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;
    
    // Check Premium Status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('user_id', user.id)
      .single();
      
    setIsPremium(profile?.is_premium || false);

    // Fetch Likes (Interactions where type=like and to_user_id=user.id)
    const { data: interactions } = await supabase
      .from('interactions')
      .select('from_user_id, profiles!interactions_from_user_id_fkey(bio, photos, verified)')
      .eq('to_user_id', user.id)
      .eq('type', 'like');

    setLikes(interactions || []);
    setLoading(false);
  };

  const handleLikePress = (item: any) => {
    if (!isPremium) {
      router.push('/premium');
    } else {
      Alert.alert('Match?', 'This would take you to their full profile in a real app.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Who Liked You</Text>
      
      {!isPremium && (
        <View style={styles.upsellCard}>
          <MaterialCommunityIcons name="star-circle-outline" size={32} color="#f59e0b" />
          <Text style={styles.upsellTitle}>Upgrade to BeforeWeDate+</Text>
          <Text style={styles.upsellText}>See exactly who liked you and match with them instantly.</Text>
          <TouchableOpacity style={styles.upsellBtn} onPress={() => router.push('/premium')}>
            <Text style={styles.upsellBtnText}>Unlock Likes</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={likes}
        keyExtractor={(item, idx) => item.from_user_id + idx}
        numColumns={2}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={<Text style={styles.emptyText}>No likes yet. Keep swiping!</Text>}
        renderItem={({ item }) => {
          const photoUrl = item.profiles?.photos?.[0];
          return (
            <TouchableOpacity style={styles.gridItem} onPress={() => handleLikePress(item)} activeOpacity={0.8}>
              {photoUrl ? (
                <Image 
                  source={{ uri: photoUrl }} 
                  style={[styles.image, !isPremium && styles.blurredImage]} 
                  blurRadius={isPremium ? 0 : 20}
                />
              ) : (
                <View style={[styles.image, { backgroundColor: '#e2e8f0' }]} />
              )}
              {isPremium && (
                <View style={styles.infoOverlay}>
                  <Text style={styles.nameText} numberOfLines={1}>{item.profiles?.bio || 'Someone'}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', paddingTop: 60, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  upsellCard: { backgroundColor: '#fef3c7', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  upsellTitle: { fontSize: 18, fontWeight: '700', color: '#b45309', marginVertical: 8 },
  upsellText: { fontSize: 14, color: '#92400e', textAlign: 'center', marginBottom: 16 },
  upsellBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  upsellBtnText: { color: 'white', fontWeight: '700' },
  grid: { gap: 12, paddingBottom: 40 },
  gridItem: { flex: 1, aspectRatio: 0.7, margin: 6, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f1f5f9' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  blurredImage: { opacity: 0.7 },
  infoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: 'rgba(0,0,0,0.4)' },
  nameText: { color: 'white', fontWeight: '600', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 }
});
