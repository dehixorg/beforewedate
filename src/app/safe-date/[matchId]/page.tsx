"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, MapPin, Car, Coffee, Users, CheckCircle2, Navigation } from "lucide-react";

export default function SafeDateHub() {
  const router = useRouter();
  const [uberBooked, setUberBooked] = useState(false);
  const [friendsPinged, setFriendsPinged] = useState(false);

  const handleUberMCP = () => {
    // Demo Mode: Simulate calling Uber MCP to book a ride
    setUberBooked(true);
  };

  const handlePingFriends = () => {
    // Demo Mode: Simulate sending SMS to emergency contacts
    setFriendsPinged(true);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      <header className="flex items-center justify-between mb-12 border-b border-white/10 pb-6 relative z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <h1 className="text-2xl font-bold tracking-tight">Safe Date Hub</h1>
        </div>
        <Button onClick={() => router.push("/dashboard")} variant="outline" className="border-white/20 text-white hover:bg-white/10">
          Back to Dashboard
        </Button>
      </header>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Designated Restaurants (Demo) */}
        <Card className="bg-white/5 border-white/10 p-8 backdrop-blur-md">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Coffee className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Designated Safe Venues</h2>
              <p className="text-gray-400">
                These venues are partnered with BeforeWeMeet. They have dedicated safety protocols, verified staff, and emergency exits mapped.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-4 cursor-pointer hover:bg-emerald-500/10 transition">
              <h3 className="font-bold text-lg text-white">The Roastery Coffee House</h3>
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> Bangalore Central</p>
              <div className="mt-4 flex gap-2">
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">Verified Staff</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">CCTV Active</span>
              </div>
            </div>
            <div className="border border-white/10 bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition opacity-50">
              <h3 className="font-bold text-lg text-white">Third Wave Coffee</h3>
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> Indiranagar</p>
            </div>
          </div>
        </Card>

        {/* Uber MCP (Demo) */}
        <Card className="bg-white/5 border-white/10 p-8 backdrop-blur-md">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Uber MCP Integration</h2>
                <p className="text-gray-400 mb-6 max-w-lg">
                  Do not reveal your home address. The BeforeWeMeet Uber Agent will securely book a ride for you directly to the verified venue.
                </p>
                
                {uberBooked ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-4 inline-flex">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <div>
                      <p className="font-bold text-emerald-400">UberX Booked Successfully</p>
                      <p className="text-sm text-gray-300">Driver is 4 mins away. License: KA-01-HC-1234</p>
                    </div>
                  </div>
                ) : (
                  <Button onClick={handleUberMCP} className="bg-white text-black hover:bg-gray-200 h-12 px-8 font-bold">
                    <Navigation className="w-4 h-4 mr-2" />
                    Book Ride via Uber MCP
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Standby Friends (Demo) */}
        <Card className="bg-white/5 border-white/10 p-8 backdrop-blur-md">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Standby Friends</h2>
              <p className="text-gray-400">
                Keep your trusted circle updated automatically if you feel unsafe or just want them to track your location.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
              <div>
                <p className="font-bold text-white">Rahul K.</p>
                <p className="text-sm text-gray-500">+91 98765 43210</p>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">Active Standby</span>
            </div>
            
            {friendsPinged ? (
              <div className="text-indigo-400 font-bold p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-center">
                Live location link & venue details SMS sent to Rahul K.
              </div>
            ) : (
              <Button onClick={handlePingFriends} variant="outline" className="w-full h-12 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10">
                Ping Emergency Contacts Now
              </Button>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
