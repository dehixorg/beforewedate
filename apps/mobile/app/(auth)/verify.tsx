import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

export default function Verify() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!token) {
      Alert.alert('Error', 'Please enter the OTP token.');
      return;
    }

    setLoading(true);
    // Upon successful verification, if this is a new user, Supabase will attempt
    // to insert a row into auth.users. Our Postgres trigger will intercept this,
    // enforce the 18+ check using the DOB we stored in user_metadata during
    // signInWithOtp, and create the public.users row. If they fail the 18+ check,
    // an exception is raised and the auth fails.
    const { error } = await supabase.auth.verifyOtp({
      phone: phone || '',
      token,
      type: 'sms',
    });
    setLoading(false);

    if (error) {
      Alert.alert('Verification Failed', error.message);
    }
    // If successful, the AuthProvider's onAuthStateChange listener will 
    // detect the session and the _layout.tsx will redirect the user automatically.
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Phone</Text>
      <Text style={styles.subtitle}>Enter the code sent to {phone}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="123456"
        value={token}
        onChangeText={setToken}
        keyboardType="number-pad"
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Verify OTP" onPress={handleVerify} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 24, fontSize: 24, textAlign: 'center', letterSpacing: 8 },
});
