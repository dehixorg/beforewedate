"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, MessageSquare, Loader2, Flame, Clock, PlusCircle } from "lucide-react";

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMatches(data.matches);
        }
        setLoading(false);
      });
  }, []);

  const handleExtend = async (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/matches/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId })
      });
      const data = await res.json();
      if (data.success) {
        alert("Match extended by 24 hours for 2 USDC!");
        setMatches(matches.map(m => m.matchId === matchId ? { ...m, expiresAt: data.expiresAt } : m));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to calculate hours left
  const getHoursLeft = (expiresAt: string) => {
    const msLeft = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(msLeft / (1000 * 60 * 60)));
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Flame className="w-8 h-8 text-rose-500" />
            Your Matches
          </h1>
          <div className="flex gap-4">
            <Button onClick={() => router.push('/dashboard')} variant="outline" className="border-white/20 text-white hover:bg-white/10">Discover</Button>
            <Button onClick={() => router.push('/profile')} variant="outline" className="border-white/20 text-white hover:bg-white/10">Profile</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
        ) : matches.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-bold text-white mb-2">No Matches Yet</h2>
            <p>Keep swiping to find someone compatible!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {matches.map((match) => {
              const hoursLeft = getHoursLeft(match.expiresAt);
              const isExpired = hoursLeft <= 0;
              const canMessage = match.isInitiated || match.isInitiator;
              
              return (
                <Card 
                  key={match.matchId}
                  className={`bg-white/5 border-white/10 p-4 transition-colors relative overflow-hidden ${
                    isExpired ? 'opacity-50 grayscale cursor-not-allowed' :
                    canMessage ? 'hover:bg-white/10 cursor-pointer group' : 'cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (isExpired) return;
                    if (canMessage) {
                      router.push(`/chat/${match.matchId}`);
                    }
                  }}
                >
                  <div className="aspect-[3/4] rounded-lg bg-gray-900 mb-4 flex items-center justify-center overflow-hidden relative">
                    {match.photo ? (
                      <img src={match.photo} alt={match.alias} className={`w-full h-full object-cover ${canMessage ? 'group-hover:scale-105 transition-transform duration-500' : ''}`} />
                    ) : (
                      <User className="w-12 h-12 text-gray-700" />
                    )}
                    
                    {/* Bumble-style Yellow Timer Ring Logic */}
                    {!match.isInitiated && !isExpired && (
                      <div className="absolute top-2 right-2 bg-yellow-500/90 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <Clock className="w-3 h-3" />
                        {hoursLeft}h left
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-white truncate">{match.alias}</h3>
                  
                  {isExpired ? (
                    <p className="text-xs text-red-400 mt-1">Expired</p>
                  ) : !match.isInitiated && !match.isInitiator ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-yellow-400">Waiting for them to message</p>
                      <Button 
                        size="sm" 
                        className="w-full text-xs h-7 bg-blue-600 hover:bg-blue-700"
                        onClick={(e) => handleExtend(e, match.matchId)}
                      >
                        <PlusCircle className="w-3 h-3 mr-1" /> Extend (2 USDC)
                      </Button>
                    </div>
                  ) : !match.isInitiated && match.isInitiator ? (
                    <p className="text-xs text-yellow-400 mt-1">Your turn to start chat!</p>
                  ) : (
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Matched
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
