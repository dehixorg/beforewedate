import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

export default function SignUp() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState(''); // Expected format: YYYY-MM-DD
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!phone || !dob) {
      Alert.alert('Error', 'Please enter both phone and date of birth.');
      return;
    }

    setLoading(true);
    // signInWithOtp will send the SMS and embed the DOB in user_metadata 
    // for the Postgres Trigger to enforce the 18+ age gate on verification.
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        data: { dob },
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else {
      router.push({ pathname: '/(auth)/verify', params: { phone } });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="+1234567890"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        placeholder="1995-10-31"
        value={dob}
        onChangeText={setDob}
      />
      
      <Text style={styles.disclaimer}>
        You must be at least 18 years old to use BeforeWeDate.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Send OTP" onPress={handleSignUp} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 16 },
  disclaimer: { fontSize: 12, color: '#666', marginBottom: 24 },
});
