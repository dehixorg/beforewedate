import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

export default function Deck() {
  const { session, user } = useAuth();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  
  const position = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    if (!user) return;
    try {
      // TODO: Use correct local IP for physical device
      const res = await fetch(`http://localhost:3000/recommender/deck`, {
        headers: { 'x-user-id': user.id }
      });
      const data = await res.json();
      setCandidates(data);
    } catch (e) {
      console.error('Error fetching deck:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeComplete = async (direction: 'left' | 'right') => {
    const candidate = candidates[currentIndex];
    
    // Animate to next card
    Animated.timing(position, {
      toValue: { x: 0, y: 0 },
      duration: 0,
      useNativeDriver: false
    }).start();

    setCurrentIndex((prevIndex) => prevIndex + 1);

    // Write to interactions table
    if (user && candidate) {
      await supabase.from('interactions').insert({
        from_user_id: user.id,
        to_user_id: candidate.user_id,
        type: direction === 'right' ? 'like' : 'pass'
      });
    }
  };

  const forceSwipe = (direction: 'right' | 'left') => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false
    }).start(() => handleSwipeComplete(direction));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          // Reset position
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: false
          }).start();
        }
      }
    })
  ).current;

  const buyCompliment = async (targetUserId: string) => {
    Alert.alert(
      'Send Compliment ($1.99)',
      'Stand out by sending a direct compliment before matching!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Purchase', 
          onPress: async () => {
            setPurchasing(true);
            try {
              const res = await fetch(`http://localhost:3000/payments/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
                body: JSON.stringify({ item_type: 'compliment', target_user_id: targetUserId })
              });
              if (!res.ok) throw new Error();
              Alert.alert('Sent!', 'Your compliment has been sent.');
              forceSwipe('right');
            } catch {
              Alert.alert('Error', 'Payment failed.');
            } finally {
              setPurchasing(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderCards = () => {
    if (currentIndex >= candidates.length) {
      return (
        <View style={styles.center}>
          <Text style={{ fontSize: 18, color: '#666' }}>No more profiles near you!</Text>
        </View>
      );
    }

    return candidates.map((item, i) => {
      if (i < currentIndex) return null;

      if (i === currentIndex) {
        return (
          <Animated.View
            key={item.user_id}
            style={[
              position.getLayout(),
              styles.cardStyle,
              {
                transform: [
                  {
                    rotate: position.x.interpolate({
                      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
                      outputRange: ['-120deg', '0deg', '120deg']
                    })
                  }
                ]
              }
            ]}
            {...panResponder.panHandlers}
          >
            <CardContent item={item} onCompliment={() => buyCompliment(item.user_id)} purchasing={purchasing} />
          </Animated.View>
        );
      }

      // Next cards in stack
      return (
        <Animated.View key={item.user_id} style={[styles.cardStyle, { top: 10 * (i - currentIndex), zIndex: -i }]}>
          <CardContent item={item} />
        </Animated.View>
      );
    }).reverse();
  };

  return <View style={styles.container}>{renderCards()}</View>;
}

function CardContent({ item, onCompliment, purchasing }: { item: any, onCompliment?: () => void, purchasing?: boolean }) {
  const photoUrl = item.photos && item.photos.length > 0 ? item.photos[0] : null;

  return (
    <View style={styles.cardInner}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }]}>
          <Text>No Photo</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.bioText}>{item.bio || 'Mysterious person.'}</Text>
        {item.prompts && item.prompts.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: '600' }}>{item.prompts[0].q}</Text>
            <Text style={{ color: '#444' }}>{item.prompts[0].a}</Text>
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.metaText}>{Math.round(item.distance_meters / 1000)} km away</Text>
          {item.verified && <Text style={styles.verifiedBadge}>✓ Verified</Text>}
        </View>
        
        {onCompliment && (
          <TouchableOpacity 
            style={styles.complimentBtn} 
            onPress={onCompliment}
            disabled={purchasing}
          >
            <Text style={styles.complimentBtnText}>{purchasing ? '...' : 'Send Compliment 💌'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 60, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardStyle: { position: 'absolute', width: '100%', marginTop: 60, alignSelf: 'center' },
  cardInner: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, height: 500 },
  image: { width: '100%', height: '70%', resizeMode: 'cover' },
  info: { padding: 16, flex: 1 },
  bioText: { fontSize: 18, fontWeight: '500', color: '#1e293b' },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto', marginBottom: 12 },
  metaText: { color: '#64748b', fontSize: 12, fontWeight: '500' },
  verifiedBadge: { color: '#0ea5e9', fontSize: 12, fontWeight: '700' },
  complimentBtn: { backgroundColor: '#fdf4ff', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#f5d0fe' },
  complimentBtnText: { color: '#c026d3', fontWeight: '700' },
});
