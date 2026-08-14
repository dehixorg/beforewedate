"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Camera, Save, MapPin, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [bio, setBio] = useState("");
  const [age, setAge] = useState<number>(18);
  const [gender, setGender] = useState("");
  const [distance, setDistance] = useState(50);
  const [photos, setPhotos] = useState<(string | File)[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // Bumble additions
  const [mode, setMode] = useState("dating");
  const [prompts, setPrompts] = useState<{question: string, answer: string}[]>([
    { question: "We'll get along if...", answer: "" },
    { question: "My personal hell is...", answer: "" },
    { question: "A non-negotiable for me is...", answer: "" }
  ]);
  
  // Fake GPS coordinate setting for demo
  const [lat, setLat] = useState(40.7128); // NYC
  const [lng, setLng] = useState(-74.0060);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile) {
          setBio(data.profile.bio || "");
          setAge(data.profile.age || 25);
          setGender(data.profile.gender || "");
          setDistance(data.profile.discoveryMaxDistance || 50);
          setPhotos(data.profile.photos || []);
          setPreviewUrls(data.profile.photos || []);
          setMode(data.profile.mode || "dating");
          if (data.profile.prompts && data.profile.prompts.length > 0) {
            setPrompts(data.profile.prompts);
          }
          if (data.profile.location?.coordinates) {
            setLng(data.profile.location.coordinates[0]);
            setLat(data.profile.location.coordinates[1]);
          }
        }
        setLoading(false);
      });
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPhotos(prev => [...prev, file]);
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => [...prev, url]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.append("bio", bio);
    formData.append("age", age.toString());
    formData.append("gender", gender);
    formData.append("mode", mode);
    formData.append("prompts", JSON.stringify(prompts));
    formData.append("discoveryMaxDistance", distance.toString());
    formData.append("lat", lat.toString());
    formData.append("lng", lng.toString());
    
    photos.forEach((photo) => {
      formData.append("photos", photo);
    });

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
      });
      if (res.ok) {
        alert("Profile saved successfully!");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <Button onClick={() => router.push('/dashboard')} variant="outline" className="border-white/20 text-white">Back to Dashboard</Button>
        </div>

        <div className="space-y-8">
          {/* Photos Section */}
          <Card className="bg-white/5 border-white/10 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Camera className="w-5 h-5 text-rose-500"/> Photos</h2>
            <div className="grid grid-cols-3 gap-4">
              {previewUrls.map((url, i) => (
                <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden relative group border border-white/10">
                  <img src={url} alt={`Photo ${i}`} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => {
                      setPhotos(p => p.filter((_, idx) => idx !== i));
                      setPreviewUrls(p => p.filter((_, idx) => idx !== i));
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              {previewUrls.length < 6 && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[3/4] rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center hover:bg-white/5 transition-colors text-gray-400"
                >
                  <Camera className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">Add Photo</span>
                </button>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </Card>

          {/* About Section */}
          <Card className="bg-white/5 border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">About Me</h2>
            
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Bio</label>
              <Textarea 
                value={bio} 
                onChange={e => setBio(e.target.value)} 
                className="bg-black/50 border-white/10 text-white h-24"
                placeholder="Write something about yourself..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Age</label>
                <Input type="number" value={age} onChange={e => setAge(parseInt(e.target.value))} className="bg-black/50 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Gender</label>
                <select 
                  value={gender} 
                  onChange={e => setGender(e.target.value)}
                  className="w-full h-10 bg-black/50 border border-white/10 rounded-md px-3 text-white"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Bumble Profile Prompts */}
          <Card className="bg-white/5 border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">Profile Prompts</h2>
            {prompts.map((prompt, i) => (
              <div key={i} className="bg-black/30 p-4 rounded-lg border border-white/5">
                <p className="text-emerald-400 text-sm font-bold mb-2">{prompt.question}</p>
                <Textarea 
                  value={prompt.answer} 
                  onChange={e => {
                    const newPrompts = [...prompts];
                    newPrompts[i].answer = e.target.value;
                    setPrompts(newPrompts);
                  }} 
                  className="bg-black/50 border-white/10 text-white h-20"
                  placeholder="Your answer..."
                />
              </div>
            ))}
          </Card>

          {/* Discovery Settings */}
          <Card className="bg-white/5 border-white/10 p-6 space-y-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-500"/> Discovery Settings</h2>
            
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Bumble Mode</label>
              <select 
                value={mode} 
                onChange={e => setMode(e.target.value)}
                className="w-full h-10 bg-black/50 border border-white/10 rounded-md px-3 text-white mb-6"
              >
                <option value="dating">Date (Romance)</option>
                <option value="bff">BFF (Friendship)</option>
                <option value="bizz">Bizz (Networking)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-400 block">Maximum Distance</label>
                <span className="text-white font-bold">{distance} mi.</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={distance} 
                onChange={e => setDistance(parseInt(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <label className="text-sm text-indigo-300 block mb-2 font-bold">Current Location (GPS Mock)</label>
              <div className="grid grid-cols-2 gap-4">
                <Input type="number" step="0.01" value={lat} onChange={e => setLat(parseFloat(e.target.value))} placeholder="Lat" className="bg-black/50 border-white/10 text-white" />
                <Input type="number" step="0.01" value={lng} onChange={e => setLng(parseFloat(e.target.value))} placeholder="Lng" className="bg-black/50 border-white/10 text-white" />
              </div>
            </div>
          </Card>

          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Profile</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
