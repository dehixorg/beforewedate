import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

export default function OnboardingProfile() {
  const { user, session } = useAuth();
  const [mode, setMode] = useState<'dating' | 'bff'>('dating');
  const [gender, setGender] = useState<'M' | 'F' | 'NB'>('F');
  const [bio, setBio] = useState('');
  const [prompts, setPrompts] = useState<{ q: string; a: string }[]>([]);
  const [photos, setPhotos] = useState<string[]>([]); // local URIs
  const [loading, setLoading] = useState(false);
  const [trustScore, setTrustScore] = useState<number>(50);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhotos([...photos, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const uploadPhotosToSupabase = async (): Promise<string[]> => {
    const uploadedPaths: string[] = [];
    if (!user) return [];

    for (let i = 0; i < photos.length; i++) {
      const base64Str = photos[i].split(',')[1];
      if (!base64Str) continue;

      const path = `${user.id}/photo_${Date.now()}_${i}.jpg`;
      const { data, error } = await supabase.storage
        .from('profile_photos')
        .upload(path, decode(base64Str), { contentType: 'image/jpeg' });

      if (error) {
        console.error('Error uploading image', error);
      } else if (data) {
        const { data: publicData } = supabase.storage.from('profile_photos').getPublicUrl(path);
        uploadedPaths.push(publicData.publicUrl);
      }
    }
    return uploadedPaths;
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Capture Location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      // PostGIS Point format string: POINT(lon lat)
      const locationPoint = `POINT(${location.coords.longitude} ${location.coords.latitude})`;

      // 2. Upload Photos
      const publicPhotoUrls = await uploadPhotosToSupabase();

      // 3. Save to Supabase Profiles Table
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: user.id,
        mode,
        gender,
        bio,
        prompts,
        photos: publicPhotoUrls,
        location: locationPoint,
      });

      if (profileError) throw profileError;

      // 4. Ping APIs
      // TODO: Replace with your actual local network IP or ngrok for physical devices.
      const trustScoreUrl = `http://localhost:3000/users/${user.id}/trust-score/recalculate`;
      const embeddingsUrl = `http://localhost:3000/embeddings/profile/${user.id}/sync`;
      
      const [trustResponse, embedResponse] = await Promise.all([
        fetch(trustScoreUrl, { method: 'POST' }),
        fetch(embeddingsUrl, { method: 'POST' })
      ]);
      
      const data = await trustResponse.json();
      
      if (data && data.new_score) {
        setTrustScore(data.new_score);
        Alert.alert('Success', `Profile saved! Trust Score: ${data.new_score}. Embedding generation triggered.`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const addPrompt = () => {
    if (prompts.length < 3) {
      setPrompts([...prompts, { q: 'What makes you happy?', a: '' }]);
    } else {
      Alert.alert('Max Prompts', 'You can only add up to 3 prompts.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.scoreBanner}>
        <Text style={styles.scoreText}>🏆 Trust Score: {trustScore}</Text>
        <Text style={styles.scoreSubtitle}>Add photos, prompts, and a long bio to increase!</Text>
      </View>

      <Text style={styles.label}>Mode</Text>
      <View style={styles.modeContainer}>
        <Button title="Dating" color={mode === 'dating' ? 'blue' : 'gray'} onPress={() => setMode('dating')} />
        <Button title="BFF" color={mode === 'bff' ? 'blue' : 'gray'} onPress={() => setMode('bff')} />
      </View>

      <Text style={styles.label}>Gender (Private)</Text>
      <View style={styles.modeContainer}>
        <Button title="Female" color={gender === 'F' ? 'blue' : 'gray'} onPress={() => setGender('F')} />
        <Button title="Male" color={gender === 'M' ? 'blue' : 'gray'} onPress={() => setGender('M')} />
        <Button title="Non-Binary" color={gender === 'NB' ? 'blue' : 'gray'} onPress={() => setGender('NB')} />
      </View>

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Tell us about yourself..."
        multiline
        value={bio}
        onChangeText={setBio}
      />

      <Text style={styles.label}>Photos</Text>
      <View style={styles.photoGrid}>
        {photos.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.photo} />
        ))}
        {photos.length < 6 && (
          <View style={styles.photoPlaceholder}>
            <Button title="+" onPress={pickImage} />
          </View>
        )}
      </View>

      <Text style={styles.label}>Prompts</Text>
      {prompts.map((p, i) => (
        <View key={i} style={styles.promptContainer}>
          <Text style={styles.promptQ}>{p.q}</Text>
          <TextInput
            style={styles.input}
            value={p.a}
            onChangeText={(txt) => {
              const newPrompts = [...prompts];
              newPrompts[i].a = txt;
              setPrompts(newPrompts);
            }}
            placeholder="Your answer..."
          />
        </View>
      ))}
      <Button title="Add Prompt" onPress={addPrompt} />

      <View style={{ marginVertical: 32 }}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Button title="Save Profile & Enable Location" onPress={handleSaveProfile} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  scoreBanner: { backgroundColor: '#f0f9ff', padding: 16, borderRadius: 12, marginBottom: 24, alignItems: 'center' },
  scoreText: { fontSize: 20, fontWeight: 'bold', color: '#0369a1' },
  scoreSubtitle: { fontSize: 12, color: '#0284c7', marginTop: 4 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 16 },
  modeContainer: { flexDirection: 'row', gap: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, fontSize: 16 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: 100, height: 100, borderRadius: 8 },
  photoPlaceholder: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  promptContainer: { marginBottom: 12 },
  promptQ: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
});
