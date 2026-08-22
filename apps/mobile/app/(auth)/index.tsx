import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function AuthIndex() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BeforeWeDate</Text>
      <Text style={styles.subtitle}>A consent-first dating app.</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Sign Up" onPress={() => router.push('/(auth)/signup')} />
        <View style={{ height: 16 }} />
        <Button title="Log In" onPress={() => router.push('/(auth)/login')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 48 },
  buttonContainer: { width: '100%' },
});
