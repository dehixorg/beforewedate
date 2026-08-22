import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, Alert, ActionSheetIOS } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/providers/AuthProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BlindChat() {
  const { id: matchId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const [match, setMatch] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [timeLeft, setTimeLeft] = useState<string>('--:--');
  const [isTyping, setIsTyping] = useState(false);
  const [chatLocked, setChatLocked] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [unlockPending, setUnlockPending] = useState(false);
  
  const channelRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    fetchData();
    
    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`public:messages:match_id=eq.${matchId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, (payload) => {
        setMessages((prev) => [payload.new, ...prev]);
        fetchMatch();
      })
      .subscribe();
      
    // Subscribe to match updates (for unlock state)
    const matchChannel = supabase
      .channel(`public:matches:id=eq.${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, (payload) => {
        setMatch(payload.new);
      })
      .subscribe();

    // Subscribe to presence
    const presenceChannel = supabase.channel(`room:${matchId}`, {
      config: { presence: { key: user?.id } }
    });

    presenceChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId !== user?.id) {
          setIsTyping(payload.payload.isTyping);
        }
      })
      .subscribe();

    channelRef.current = presenceChannel;

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(matchChannel);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [matchId]);

  useEffect(() => {
    if (match?.initiated_at) {
      startCountdown(match.initiated_at);
    }
  }, [match?.initiated_at]);

  const fetchMatch = async () => {
    const { data } = await supabase.from('matches').select('*').eq('id', matchId).single();
    if (data) setMatch(data);
  };

  const fetchData = async () => {
    await fetchMatch();
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });
    
    if (msgs) setMessages(msgs);
  };
  
  // Fetch partner profile whenever match loads (for the reveal)
  useEffect(() => {
    if (match && user) {
      const otherId = match.user_a === user.id ? match.user_b : match.user_a;
      supabase.from('profiles').select('*').eq('user_id', otherId).single().then(({ data }) => {
        if (data) setPartnerProfile(data);
      });
    }
  }, [match?.id, user?.id]);

  const startCountdown = (initiatedAt: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const endTime = new Date(initiatedAt).getTime() + 30 * 60 * 1000;
    
    timerRef.current = setInterval(() => {
      const now = new Date().getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft('00:00');
        
        // If not unlocked by both, lock chat
        if (!(match?.unlocked_by_a && match?.unlocked_by_b)) {
          setChatLocked(true);
        }
      } else {
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);
  };

  const sendMessage = async () => {
    if (!text.trim() || chatLocked) return;

    const messageText = text.trim();
    setText('');
    handleTyping(false); // clear typing

    try {
      // POST to NestJS Moderation API instead of direct insert
      const response = await fetch(`http://localhost:3000/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          match_id: matchId,
          text: messageText
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('Message Blocked', errorData.message || 'Your message violated community guidelines.');
      }
    } catch (error) {
      console.error('Send error:', error);
      Alert.alert('Error', 'Could not send message.');
    }
  };

  const handleReport = () => {
    const otherUserId = match?.user_a === user?.id ? match?.user_b : match?.user_a;
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Block & Report'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            submitReport(otherUserId);
          }
        }
      );
    } else {
      Alert.alert(
        'Block & Report',
        'Are you sure you want to block this user and report them?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Block & Report', style: 'destructive', onPress: () => submitReport(otherUserId) }
        ]
      );
    }
  };

  const submitReport = async (reportedId: string) => {
    try {
      await fetch(`http://localhost:3000/chat/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          reported_id: reportedId,
          match_id: matchId,
          reason: 'Manual user report'
        })
      });
      Alert.alert('Reported', 'User has been blocked and reported.');
      router.replace('/(main)/matches');
    } catch (e) {
      Alert.alert('Error', 'Failed to report user.');
    }
  };

  const askCoach = async () => {
    try {
      Alert.alert('Asking Coach...', 'The coach is typing a suggestion.');
      await fetch(`http://localhost:3000/coach/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({ match_id: matchId })
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to reach coach.');
    }
  };

  const handleUnlock = async () => {
    try {
      setUnlockPending(true);
      const { data, error } = await supabase.rpc('toggle_unlock', { target_match_id: matchId });
      if (error) throw error;
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setUnlockPending(false);
    }
  };

  const handleTyping = (typing: boolean) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user?.id, isTyping: typing }
      });
    }
  };

  if (!match) return <View style={styles.center}><ActivityIndicator /></View>;

  const isInitiator = match.initiator_id === user?.id;
  const isUserA = match.user_a === user?.id;
  const hasIUnlocked = isUserA ? match.unlocked_by_a : match.unlocked_by_b;
  const isFullyUnlocked = match.unlocked_by_a && match.unlocked_by_b;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1e293b" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          {isFullyUnlocked && partnerProfile?.photos?.[0] ? (
            <Image source={{ uri: partnerProfile.photos[0] }} style={styles.avatarPlaceholder} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="incognito" size={20} color="#64748b" />
            </View>
          )}
          <Text style={styles.headerName}>
            {isFullyUnlocked ? partnerProfile?.bio?.substring(0, 15) : 'Mystery Match'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {!isFullyUnlocked && (
            <TouchableOpacity 
              onPress={handleUnlock} 
              style={[styles.unlockButton, hasIUnlocked ? styles.unlockPending : {}]}
              disabled={unlockPending}
            >
              <MaterialCommunityIcons name={hasIUnlocked ? "lock-open-outline" : "lock-outline"} size={16} color={hasIUnlocked ? "#f59e0b" : "#6366f1"} />
              <Text style={[styles.unlockText, hasIUnlocked ? { color: '#f59e0b' } : {}]}>
                {hasIUnlocked ? 'Pending...' : 'Unlock'}
              </Text>
            </TouchableOpacity>
          )}

          {!isFullyUnlocked && (
            <View style={styles.timerBadge}>
              <MaterialCommunityIcons name="timer-outline" size={16} color="#0ea5e9" />
              <Text style={styles.timerText}>
                {match.initiated_at ? timeLeft : '30:00'}
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={handleReport} style={styles.reportButton}>
            <MaterialCommunityIcons name="shield-alert-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => {
          if (item.is_ai) {
            return (
              <View style={[styles.messageBubble, styles.aiMessage]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 }}>
                  <MaterialCommunityIcons name="robot-outline" size={14} color="#6366f1" />
                  <Text style={styles.aiName}>AI Coach</Text>
                </View>
                <Text style={styles.aiMessageText}>{item.text}</Text>
              </View>
            );
          }

          const isMine = item.sender_id === user?.id;
          return (
            <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
              <Text style={[styles.messageText, isMine ? styles.myMessageText : {}]}>{item.text}</Text>
            </View>
          );
        }}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>They are typing...</Text>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputArea}>
        {chatLocked && !isFullyUnlocked ? (
          <View style={styles.lockedBox}>
            <Text style={styles.lockedText}>Time's up! The chat has ended without a mutual unlock.</Text>
          </View>
        ) : (!match.is_initiated && !isInitiator) ? (
          <View style={styles.lockedBox}>
            <Text style={styles.lockedText}>Waiting for them to send the first message...</Text>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(val) => {
                setText(val);
                handleTyping(val.length > 0);
              }}
              placeholder="Type a message..."
              placeholderTextColor="#94a3b8"
              onSubmitEditing={sendMessage}
            />
            {text.length === 0 ? (
              <TouchableOpacity style={styles.coachButton} onPress={askCoach}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#f59e0b" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                <MaterialCommunityIcons name="send" size={20} color="white" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backButton: { padding: 4 },
  headerTitle: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  timerText: { color: '#0ea5e9', fontWeight: '700', fontSize: 12 },
  unlockButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4, borderWidth: 1, borderColor: '#c7d2fe' },
  unlockPending: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
  unlockText: { color: '#6366f1', fontWeight: '700', fontSize: 12 },
  reportButton: { padding: 4, marginLeft: 8 },
  messageList: { padding: 16, gap: 12 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  myMessage: { backgroundColor: '#0ea5e9', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirMessage: { backgroundColor: '#e2e8f0', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, color: '#1e293b' },
  myMessageText: { color: 'white' },
  aiMessage: { backgroundColor: '#eef2ff', alignSelf: 'center', maxWidth: '90%', borderRadius: 12, borderWidth: 1, borderColor: '#c7d2fe' },
  aiName: { fontSize: 12, fontWeight: '700', color: '#6366f1' },
  aiMessageText: { fontSize: 14, color: '#312e81', fontStyle: 'italic' },
  typingContainer: { paddingHorizontal: 24, paddingBottom: 8 },
  typingText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  inputArea: { flexDirection: 'row', padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e2e8f0', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, marginRight: 8 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center' },
  coachButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center' },
  lockedBox: { flex: 1, backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, alignItems: 'center' },
  lockedText: { color: '#64748b', fontSize: 14, fontWeight: '500' }
});
