import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../../src/providers/AuthProvider';
import { supabase } from '../../../../src/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DarkRoomChat() {
  const { id: sessionId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState('active');
  const [modalVisible, setModalVisible] = useState(false);
  const [proposedSummary, setProposedSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchSession();
    const subscription = supabase
      .channel(`dark_room_${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dark_room_messages', filter: `session_id=eq.${sessionId}` }, (payload) => {
        setMessages(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dark_room_sessions', filter: `id=eq.${sessionId}` }, (payload) => {
        setStatus(payload.new.status);
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [sessionId]);

  const fetchSession = async () => {
    const { data: session } = await supabase.from('dark_room_sessions').select('*').eq('id', sessionId).single();
    if (session) setStatus(session.status);

    const { data: msgs } = await supabase
      .from('dark_room_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    
    setMessages(msgs || []);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || status !== 'active') return;
    const text = inputText.trim();
    setInputText('');

    try {
      await fetch(`http://localhost:3000/dark-room/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({ text })
      });
    } catch (e) {
      Alert.alert('Error sending message');
    }
  };

  const endSession = async () => {
    Alert.alert('End Session?', 'The Coach will analyze this conversation to extract a helpful insight, then the chat log will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End & Summarize', style: 'default', onPress: proposeSummary }
    ]);
  };

  const proposeSummary = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`http://localhost:3000/dark-room/${sessionId}/propose-summary`, {
        method: 'POST',
        headers: { 'x-user-id': user?.id || '' }
      });
      const data = await res.json();
      setProposedSummary(data.proposed_summary);
      setModalVisible(true);
    } catch (e) {
      Alert.alert('Error generating summary');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConsent = async (approve: boolean) => {
    setModalVisible(false);
    try {
      await fetch(`http://localhost:3000/dark-room/${sessionId}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({ approve, summary: proposedSummary })
      });
      Alert.alert('Session Complete', 'The raw transcript has been permanently deleted from our servers.');
      router.back();
    } catch (e) {
      Alert.alert('Error completing session');
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === user?.id;
    const isAi = item.is_ai;

    if (isAi) {
      return (
        <View style={styles.coachBubble}>
          <MaterialCommunityIcons name="robot-outline" size={16} color="#6366f1" style={{ marginRight: 6 }} />
          <Text style={styles.coachText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.msgText, isMe ? styles.myMsgText : styles.theirMsgText]}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>The Dark Room</Text>
        <TouchableOpacity onPress={endSession} disabled={status !== 'active' || isProcessing}>
          <Text style={[styles.endBtn, (status !== 'active' || isProcessing) && {opacity: 0.5}]}>End</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ padding: 16 }}
      />

      {status === 'active' && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#94a3b8"
            multiline
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <MaterialCommunityIcons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {status === 'completed' && (
        <View style={styles.endedBanner}>
          <Text style={styles.endedText}>This session is completed and permanently purged.</Text>
        </View>
      )}

      {/* Consent Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Coach Insight</Text>
            <Text style={styles.modalDesc}>To help facilitate future conversations, the Coach noted the following tactic that worked well today:</Text>
            
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>{proposedSummary}</Text>
            </View>

            <Text style={styles.modalWarning}>Regardless of your choice below, the raw chat transcript of this session will be permanently deleted right now.</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.discardBtn} onPress={() => handleConsent(false)}>
                <Text style={styles.discardBtnText}>Discard Insight</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keepBtn} onPress={() => handleConsent(true)}>
                <Text style={styles.keepBtnText}>Keep Insight</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' }, // Dark theme
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  endBtn: { color: '#f43f5e', fontWeight: '600', fontSize: 16 },
  coachBubble: { alignSelf: 'center', backgroundColor: '#e0e7ff', padding: 12, borderRadius: 12, marginVertical: 8, maxWidth: '85%', flexDirection: 'row' },
  coachText: { color: '#3730a3', fontStyle: 'italic', flexShrink: 1 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginVertical: 4 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#6366f1', borderBottomRightRadius: 4 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#334155', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15 },
  myMsgText: { color: 'white' },
  theirMsgText: { color: '#f1f5f9' },
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#1e293b', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#334155' },
  input: { flex: 1, backgroundColor: '#0f172a', color: 'white', borderRadius: 20, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, maxHeight: 100, marginRight: 12 },
  sendBtn: { backgroundColor: '#6366f1', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  endedBanner: { backgroundColor: '#f43f5e', padding: 16, alignItems: 'center' },
  endedText: { color: 'white', fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: 'white', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  modalDesc: { color: '#475569', marginBottom: 16, lineHeight: 20 },
  summaryBox: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  summaryText: { fontSize: 16, fontStyle: 'italic', color: '#334155', lineHeight: 24 },
  modalWarning: { fontSize: 12, color: '#f43f5e', marginBottom: 24, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 12 },
  discardBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#fee2e2', alignItems: 'center' },
  discardBtnText: { color: '#ef4444', fontWeight: '600' },
  keepBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#6366f1', alignItems: 'center' },
  keepBtnText: { color: 'white', fontWeight: '600' }
});
