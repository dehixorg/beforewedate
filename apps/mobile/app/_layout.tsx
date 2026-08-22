import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../src/lib/supabase';
import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://dummy@o0.ingest.sentry.io/0',
  tracesSampleRate: 1.0,
});

export const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY || 'phc_dummy', {
  host: 'https://app.posthog.com'
});

function RootLayoutNav() {
  const { session, isInitialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [isRouting, setIsRouting] = useState(true);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!session && !inAuthGroup) {
      router.replace('/(auth)');
      setIsRouting(false);
    } else if (session) {
      // Check if user has a profile
      supabase.from('profiles').select('user_id').eq('user_id', session.user.id).single()
        .then(({ data }) => {
          if (data) {
            if (segments[0] !== '(main)') {
              router.replace('/(main)/deck');
            }
          } else {
            if (segments[0] !== '(onboarding)') {
              router.replace('/(onboarding)');
            }
          }
          setIsRouting(false);
        });
    }
  }, [session, isInitialized, segments]);

  if (!isInitialized || isRouting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(main)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
