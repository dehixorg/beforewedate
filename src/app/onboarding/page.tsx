"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BrainCircuit, ShieldCheck, ArrowRight, Wallet, CheckCircle } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  // Form State
  const [preferences, setPreferences] = useState({
    relationshipGoal: "Long-term relationship",
    communicationStyle: "Frequent texting",
    socialEnergy: "Introverted",
    interests: "Technology, Reading, Coffee",
    locationApprox: "Bangalore",
  });

  const [consent, setConsent] = useState({
    allowRelationshipGoal: true,
    allowCommunicationStyle: true,
    allowSocialEnergy: true,
    allowInterests: true,
    allowLocation: false, // Private by default
  });

  const handleNext = () => setStep(2);

  const handleConnectWallet = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setWalletConnected(true);
      setTimeout(() => {
        setShowWalletModal(false);
        router.push("/dashboard");
      }, 1000);
    }, 2000);
  };

  const handleSubmit = () => {
    setShowWalletModal(true);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      
      <Card className="w-full max-w-2xl bg-black/60 border-white/10 backdrop-blur-xl p-8 shadow-2xl z-10 relative">
        <div className="flex items-center gap-2 mb-8 text-indigo-400">
          <BrainCircuit className="w-6 h-6" />
          <span className="font-bold tracking-tight">BeforeWeMeet</span>
        </div>

        {step === 1 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-2">Build your Preference Profile</h1>
            <p className="text-gray-400 mb-8">This data is encrypted and only evaluated by the Compatibility Agent based on your consent rules.</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="goal" className="text-gray-300">Relationship Goal</Label>
                <Input 
                  id="goal" 
                  value={preferences.relationshipGoal}
                  onChange={(e) => setPreferences({...preferences, relationshipGoal: e.target.value})}
                  className="bg-white/5 border-white/10 text-white focus:border-indigo-500" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comm" className="text-gray-300">Communication Style</Label>
                <Input 
                  id="comm" 
                  value={preferences.communicationStyle}
                  onChange={(e) => setPreferences({...preferences, communicationStyle: e.target.value})}
                  className="bg-white/5 border-white/10 text-white focus:border-indigo-500" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="energy" className="text-gray-300">Social Energy</Label>
                <Input 
                  id="energy" 
                  value={preferences.socialEnergy}
                  onChange={(e) => setPreferences({...preferences, socialEnergy: e.target.value})}
                  className="bg-white/5 border-white/10 text-white focus:border-indigo-500" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests" className="text-gray-300">Interests (Comma separated)</Label>
                <Input 
                  id="interests" 
                  value={preferences.interests}
                  onChange={(e) => setPreferences({...preferences, interests: e.target.value})}
                  className="bg-white/5 border-white/10 text-white focus:border-indigo-500" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location" className="text-gray-300">Approximate Location (For Serendipity Map)</Label>
                <Input 
                  id="location" 
                  value={preferences.locationApprox}
                  onChange={(e) => setPreferences({...preferences, locationApprox: e.target.value})}
                  className="bg-white/5 border-white/10 text-white focus:border-indigo-500" 
                />
              </div>

              <Button onClick={handleNext} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-8 h-12 text-lg">
                Continue to Consent Policy
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <h1 className="text-3xl font-bold">Consent Policy Manager</h1>
            </div>
            <p className="text-gray-400 mb-8">Choose exactly what the Compatibility Agent is allowed to read during a paid evaluation.</p>

            <div className="space-y-6 bg-white/5 p-6 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base text-white">Relationship Goal</Label>
                  <p className="text-sm text-gray-400">Allow agent to compare relationship goals.</p>
                </div>
                <Switch 
                  checked={consent.allowRelationshipGoal}
                  onCheckedChange={(c) => setConsent({...consent, allowRelationshipGoal: c})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base text-white">Communication Style</Label>
                  <p className="text-sm text-gray-400">Allow agent to check for communication friction.</p>
                </div>
                <Switch 
                  checked={consent.allowCommunicationStyle}
                  onCheckedChange={(c) => setConsent({...consent, allowCommunicationStyle: c})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base text-white">Interests & Hobbies</Label>
                  <p className="text-sm text-gray-400">Allow agent to find common ground.</p>
                </div>
                <Switch 
                  checked={consent.allowInterests}
                  onCheckedChange={(c) => setConsent({...consent, allowInterests: c})}
                />
              </div>

              <div className="flex items-center justify-between opacity-75">
                <div>
                  <Label className="text-base text-white">Exact Location</Label>
                  <p className="text-sm text-gray-400">Keep private until identity is revealed.</p>
                </div>
                <Switch 
                  checked={consent.allowLocation}
                  onCheckedChange={(c) => setConsent({...consent, allowLocation: c})}
                />
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              className="w-full bg-white text-black hover:bg-gray-200 mt-8 h-12 text-lg font-semibold"
            >
              <span className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Sign Consent & Enter Dashboard
              </span>
            </Button>
            <p className="text-center text-xs text-gray-500 mt-4">
              By signing, you authorize the BeforeWeMeet agent to evaluate your profile via CROO CAP.
            </p>
          </div>
        )}
      </Card>

      {/* Web3 Wallet Modal (Demo) */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent className="bg-black border border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="w-6 h-6 text-indigo-400" />
              Connect Web3 Wallet
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a provider to sign your Consent Policy on-chain.
            </DialogDescription>
          </DialogHeader>

          {walletConnected ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Wallet Connected!</h3>
              <p className="text-gray-400">Signature verified. Redirecting...</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <Button 
                onClick={handleConnectWallet}
                disabled={loading}
                className="w-full h-14 bg-[#F6851B]/10 hover:bg-[#F6851B]/20 border border-[#F6851B]/30 text-white flex justify-between px-6"
              >
                <span className="flex items-center gap-3">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" className="w-6 h-6" alt="MetaMask" />
                  MetaMask
                </span>
                {loading && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              </Button>

              <Button 
                onClick={handleConnectWallet}
                disabled={loading}
                className="w-full h-14 bg-[#3b99fc]/10 hover:bg-[#3b99fc]/20 border border-[#3b99fc]/30 text-white flex justify-between px-6"
              >
                <span className="flex items-center gap-3">
                  <img src="https://cryptologos.cc/logos/walletconnect-wtc-logo.svg?v=032" className="w-6 h-6 invert" alt="WalletConnect" />
                  WalletConnect
                </span>
              </Button>
              
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Trust Verification Required
                </div>
                <p className="text-xs text-gray-500">
                  After connecting, you will be prompted to verify your identity via a zero-knowledge proof. This guarantees a Trust Score of 90+ across the network without revealing your real name.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
