"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, ShieldCheck, Zap, Heart, CheckCircle2, AlertCircle, MessageCircle, X, Send, GitMerge, Star, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { CoupleMode } from "@/components/modes/CoupleMode";
import { MarriageMode } from "@/components/modes/MarriageMode";
import { SerendipityMap } from "@/components/modes/SerendipityMap";

export default function DashboardPage() {
  const router = useRouter();
  const [lifeStage, setLifeStage] = useState<"dating" | "couple" | "marriage">("dating");
  const [activeTab, setActiveTab] = useState<"discover" | "serendipity">("discover");
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMap, setShowMap] = useState(false);
  
  // Interaction State
  const [interacting, setInteracting] = useState(false);
  const [newMatch, setNewMatch] = useState<any>(null);
  const [currentMode, setCurrentMode] = useState("dating");
  const [myCoordinates, setMyCoordinates] = useState<[number, number]>([0,0]);

  // Compliment Modal State
  const [showComplimentModal, setShowComplimentModal] = useState(false);
  const [complimentMessage, setComplimentMessage] = useState("");
  const [complimentSending, setComplimentSending] = useState(false);
  const [complimentSent, setComplimentSent] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await fetch('/api/discovery');
        const data = await res.json();
        if (data.success) {
          setProfiles(data.profiles);
          if (data.myMode) {
            setCurrentMode(data.myMode);
          }
          if (data.myCoordinates) {
            setMyCoordinates(data.myCoordinates);
          }
        }
      } catch (error) {
        console.error("Error fetching profiles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  // Reset index when switching tabs
  useEffect(() => {
    setCurrentIndex(0);
    setResult(null);
    if (activeTab === "serendipity") {
      setShowMap(true);
    } else {
      setShowMap(false);
    }
  }, [activeTab]);

  const runCompatibilityCheck = async (id: string) => {
    setAnalyzing(id);
    
    try {
      const res = await fetch('/api/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: id })
      });
      const data = await res.json();
      
      if (data.success) {
        setResult(data.result);
      }
    } catch (error) {
      console.error("Error running compatibility:", error);
    } finally {
      setAnalyzing(null);
    }
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev + 1);
    setResult(null);
    setComplimentSent(false);
  };

  const handleSendCompliment = async () => {
    if (!complimentMessage.trim()) return;
    setComplimentSending(true);
    try {
      const res = await fetch('/api/compliment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: profile.id, message: complimentMessage })
      });
      if (res.ok) {
        setComplimentSent(true);
        setTimeout(() => {
          setShowComplimentModal(false);
          setComplimentMessage("");
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setComplimentSending(false);
    }
  };

  const handleInteract = async (action: 'like' | 'pass' | 'superlike') => {
    if (!profile || interacting) return;
    setInteracting(true);
    
    try {
      const res = await fetch('/api/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: profile.id, action })
      });
      const data = await res.json();
      
      if (data.success && data.isMatch) {
        setNewMatch(profile);
      } else {
        handleNext();
      }
    } catch (e) {
      console.error(e);
      handleNext();
    } finally {
      setInteracting(false);
    }
  };

  const profilesToDisplay = activeTab === "discover" ? profiles : profiles.filter(p => p.crossedPaths);
  const profile = profilesToDisplay[currentIndex];

  const handleMarkerClick = (clickedProfile: any) => {
    const idx = profilesToDisplay.findIndex(p => p.id === clickedProfile.id);
    if (idx !== -1) {
      setCurrentIndex(idx);
      setShowMap(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12 border-b border-white/10 pb-6">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-black bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent">
            BeforeWeMeet
          </h1>
          <Badge variant="outline" className="border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-500/10 uppercase tracking-widest text-xs px-3 py-1">
            Mode: {currentMode}
          </Badge>
        </div>

        {/* Life Stage Toggle */}
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 w-fit">
          <Button 
            variant="ghost" 
            onClick={() => setLifeStage("dating")}
            className={`rounded-full px-6 ${lifeStage === "dating" ? "bg-indigo-500 text-white" : "text-gray-400 hover:text-white"}`}
          >
            Dating
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setLifeStage("couple")}
            className={`rounded-full px-6 ${lifeStage === "couple" ? "bg-rose-500 text-white" : "text-gray-400 hover:text-white"}`}
          >
            Couple
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setLifeStage("marriage")}
            className={`rounded-full px-6 ${lifeStage === "marriage" ? "bg-emerald-500 text-white" : "text-gray-400 hover:text-white"}`}
          >
            Marriage
          </Button>
        </div>

        <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10">
          <Button variant="ghost" size="sm" onClick={() => router.push('/matches')} className="text-gray-400 hover:text-white">
            <MessageCircle className="w-4 h-4 mr-2" /> Matches
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push('/profile')} className="text-gray-400 hover:text-white">
            <User className="w-4 h-4 mr-2" /> Profile
          </Button>
          <div className="h-4 w-[1px] bg-white/20 mx-2" />
          <span className="text-sm text-gray-400">Wallet Balance:</span>
          <span className="font-mono font-bold text-emerald-400">142.50 USDC</span>
        </div>
      </header>

      {lifeStage === "couple" && <CoupleMode />}
      {lifeStage === "marriage" && <MarriageMode />}

      {/* Dating Mode UI */}
      {lifeStage === "dating" && (
        <>
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
        <Button 
          variant={activeTab === "discover" ? "default" : "outline"}
          onClick={() => setActiveTab("discover")}
          className={activeTab === "discover" ? "bg-white text-black hover:bg-gray-200" : "bg-transparent text-white border-white/20"}
        >
          Global Discovery
        </Button>
        <Button 
          variant={activeTab === "serendipity" ? "default" : "outline"}
          onClick={() => setActiveTab("serendipity")}
          className={activeTab === "serendipity" ? "bg-white text-black hover:bg-gray-200" : "bg-transparent text-white border-white/20"}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Crossed Paths
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Feed / Swipe Deck / Map */}
        <div className="space-y-6 flex flex-col items-center w-full">
          {loading ? (
            <div className="text-center py-24 text-gray-500">Loading private network...</div>
          ) : showMap ? (
            <SerendipityMap profiles={profilesToDisplay} myCoordinates={myCoordinates} onMarkerClick={handleMarkerClick} />
          ) : !profile ? (
            <div className="text-center py-24 text-gray-500">
              <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-white/10" />
              <h2 className="text-xl font-bold text-white mb-2">You're all caught up!</h2>
              <p>Check back later for more compatible profiles.</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {activeTab === "serendipity" && !showMap && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowMap(true)}
                  className="mb-4 border-white/20 text-white hover:bg-white/10"
                >
                  <MapPin className="w-4 h-4 mr-2" /> Back to Radar Map
                </Button>
              )}
              <Card className="w-full max-w-lg bg-white/5 border-white/10 p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
              {/* Profile Details */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {profile.alias} <span className="text-gray-400 font-normal">, {profile.age}</span>
                  </h3>
                  <p className="text-md text-indigo-300 mb-3">{profile.jobTitle}</p>
                  <div className="flex gap-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {profile.distance} miles away</span>
                    <span>•</span>
                    <span>{profile.sharedInterests} Mutual Interests</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
                    Trust Score: {profile.trustScore}
                  </Badge>
                  <Button 
                    onClick={() => handleInteract('superlike')}
                    disabled={interacting}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs h-7"
                  >
                    <Star className="w-3 h-3 mr-1" /> Super Like
                  </Button>
                </div>
              </div>

              {/* Vertical Scroll Bumble Profile */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pb-4 pr-2 custom-scrollbar">
                {/* Primary Photo */}
                {profile.photos && profile.photos.length > 0 && (
                  <div className="aspect-[3/4] rounded-xl overflow-hidden relative">
                    <img src={profile.photos[0]} alt={profile.alias} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Bio */}
                <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                  <p className="text-base text-gray-300 italic">"{profile.bio}"</p>
                </div>

                {/* Prompts & Remaining Photos Interleaved */}
                {profile.prompts?.map((prompt: any, idx: number) => (
                  <div key={idx} className="space-y-4">
                    <div className="bg-emerald-500/10 p-5 rounded-xl border border-emerald-500/20">
                      <p className="text-xs text-emerald-400 font-bold mb-1 uppercase tracking-wider">{prompt.question}</p>
                      <p className="text-lg text-white font-medium">{prompt.answer}</p>
                    </div>
                    {/* Render next photo if available */}
                    {profile.photos && profile.photos[idx + 1] && (
                      <div className="aspect-[4/5] rounded-xl overflow-hidden relative">
                        <img src={profile.photos[idx + 1]} alt={`${profile.alias} ${idx + 2}`} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Area */}
              {result?.id === profile.id ? (
                <div className="animate-in fade-in zoom-in duration-300 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-6">
                  {result.eligible ? (
                    <div className="flex items-center gap-2 text-emerald-400 mb-4">
                      <CheckCircle2 className="w-6 h-6" />
                      <span className="font-bold text-lg">Compatible ({result.score}% Alignment)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400 mb-4">
                      <AlertCircle className="w-6 h-6" />
                      <span className="font-bold text-lg">Not Eligible for Match</span>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {result.aligned?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Aligned On</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.aligned.map((a: string) => (
                            <Badge key={a} variant="secondary" className="bg-white/10 text-white">{a}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {result.discuss?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-2">Needs Discussion</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.discuss.map((d: string) => (
                            <Badge key={d} variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">{d}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.coachQuestions?.length > 0 && (
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 mb-2 text-purple-400">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm font-bold">Conversation Coach Agent (A2A Call)</span>
                        </div>
                        <p className="text-sm text-gray-300 italic">"{result.coachQuestions[0]}"</p>
                      </div>
                    )}

                    <div className="flex gap-4 mt-6 pt-4">
                      {result.eligible && (
                        <Button 
                          onClick={() => handleInteract('like')}
                          disabled={interacting}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-12"
                        >
                          <Heart className="w-5 h-5 mr-2" /> Like Profile
                        </Button>
                      )}
                      <Button onClick={() => handleInteract('pass')} disabled={interacting} variant="outline" className="flex-1 h-12 border-white/20 hover:bg-white/10 text-red-400">
                        <X className="w-5 h-5 mr-2" /> Pass
                      </Button>
                    </div>
                  </div>
                </div>
              ) : analyzing === profile.id ? (
                <div className="bg-black/40 border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center text-center h-[280px]">
                  <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-6" />
                  <p className="font-medium text-indigo-400 mb-2">Evaluating Consent Policies...</p>
                  <p className="text-sm text-gray-500 font-mono">CROO Agent Call In Progress</p>
                </div>
              ) : (
                <div className="flex items-center gap-4 mt-8">
                  {/* Pass Button */}
                  <Button 
                    onClick={() => handleInteract('pass')}
                    disabled={interacting}
                    className="w-16 h-16 rounded-full bg-black border-2 border-red-500/50 text-red-400 hover:bg-red-500/20 transition-all hover:scale-110 flex-shrink-0"
                  >
                    <X className="w-8 h-8" />
                  </Button>

                  {/* Evaluate Button */}
                  <Button 
                    onClick={() => runCompatibilityCheck(profile.id)}
                    className="flex-1 h-16 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all hover:scale-105 text-lg shadow-lg shadow-indigo-500/25"
                  >
                    <Zap className="w-6 h-6 mr-2" />
                    Evaluate Agent
                  </Button>

                  {/* Like Button */}
                  <Button 
                    onClick={() => handleInteract('like')}
                    disabled={interacting}
                    className="w-16 h-16 rounded-full bg-black border-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 transition-all hover:scale-110 flex-shrink-0"
                  >
                    <Heart className="w-6 h-6" />
                  </Button>
                </div>
              )}
            </Card>
            </div>
          )}
        </div>

        {/* Transaction Timeline / Sidebar */}
        <div className="hidden lg:block">
          <Card className="bg-white/5 border-white/10 p-6 sticky top-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
              <Zap className="w-5 h-5 text-amber-400" />
              Agent Transactions
            </h3>
            
            <div className="space-y-4">
              {result ? (
                <>
                  {result.transactions?.dependencyPayment && (
                    <div className="animate-in slide-in-from-right-4 relative pl-6 border-l border-white/10 pb-4">
                      <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-emerald-400" />
                      <p className="text-sm font-medium text-white">ConversationCoach Agent</p>
                      <p className="text-xs text-gray-400 mb-1">Generated custom ice-breakers via Azure OpenAI</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-gray-500">{result.transactions.dependencyPayment.substring(0, 14)}...</span>
                        <span className="text-emerald-400">-0.10 USDC</span>
                      </div>
                    </div>
                  )}
                  <div className="animate-in slide-in-from-right-4 relative pl-6 border-l border-white/10 pb-4">
                    <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-emerald-400" />
                    <p className="text-sm font-medium text-white">CompatibilityAgent</p>
                    <p className="text-xs text-gray-400 mb-1">Evaluated mutual consent fields deterministically</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-gray-500">{result.transactions.compatibilityPayment?.substring(0, 14)}...</span>
                      <span className="text-emerald-400">-0.50 USDC</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-sm text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No recent agent calls.<br/>Evaluate a profile to see A2A transactions.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Compliment Modal */}
      {profile && (
        <Dialog open={showComplimentModal} onOpenChange={setShowComplimentModal}>
          <DialogContent className="bg-black border border-white/10 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Heart className="w-6 h-6 text-pink-400" />
                Premium Compliment
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Stand out by sending {profile.alias.split(' ')[0]} a direct message before you match. Cost: <span className="text-emerald-400 font-mono">0.25 USDC</span>
              </DialogDescription>
            </DialogHeader>

            {complimentSent ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Compliment Sent!</h3>
                <p className="text-gray-400">Transaction settled on-chain.</p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <Input 
                  value={complimentMessage}
                  onChange={(e) => setComplimentMessage(e.target.value)}
                  placeholder={`Hi ${profile.alias.split(' ')[0]}, I loved your bio...`}
                  className="bg-white/5 border-white/10 text-white focus:border-pink-500 placeholder:text-gray-600 h-12"
                />
                
                <Button 
                  onClick={handleSendCompliment}
                  disabled={complimentSending || !complimentMessage.trim()}
                  className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold"
                >
                  {complimentSending ? (
                    <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" /> Send Premium Compliment
                    </span>
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      
      {/* New Match Modal */}
      {newMatch && (
        <Dialog open={!!newMatch} onOpenChange={() => {
          setNewMatch(null);
          handleNext();
        }}>
          <DialogContent className="bg-black border border-white/10 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-center text-emerald-400 mb-4">
                It's a Match!
              </DialogTitle>
              <DialogDescription className="text-center text-gray-300">
                You and {newMatch.alias} have mutually liked each other. You can now securely enter the 30-Minute Blind Chat.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 mt-8">
              <Button 
                onClick={() => router.push(`/chat/${newMatch.id}`)}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg"
              >
                Enter Chat Now
              </Button>
              <Button 
                onClick={() => {
                  setNewMatch(null);
                  handleNext();
                }}
                variant="outline" 
                className="w-full h-14 border-white/20 text-white hover:bg-white/10 font-bold"
              >
                Keep Swiping
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* End Dating Mode UI */}
        </>
      )}
    </div>
  );
}
