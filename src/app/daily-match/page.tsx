"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Eye, LogOut, MessageSquare, TimerReset } from "lucide-react";

export default function DailyMatchPage() {
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([
    { sender: "system", text: "BeforeWeMeet Agent matched you! Identities are hidden. You have 30 minutes." },
    { sender: "system", text: "Today's Topic: What is a non-negotiable value for you in a relationship?" }
  ]);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins
  const [vote, setVote] = useState<"pending" | "reveal" | "leave">("pending");
  const [matchVote, setMatchVote] = useState<"pending" | "reveal" | "leave">("pending");
  const [identityRevealed, setIdentityRevealed] = useState(false);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "me", text: input }]);
    setInput("");

    // Simulate reply
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: "them", text: "That's a great point. For me, it's absolute honesty and transparency." }]);
    }, 2000);
  };

  const handleReveal = () => {
    setVote("reveal");
    // Simulate other person revealing
    setTimeout(() => {
      setMatchVote("reveal");
      setIdentityRevealed(true);
      setMessages(prev => [...prev, { sender: "system", text: "Both users agreed to reveal! Identity Unlocked." }]);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-3xl h-[85vh] bg-white/5 border-white/10 backdrop-blur-xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden border-2 border-white/10">
              {identityRevealed ? (
                // Dummy photo for revealed state
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="Match" className="w-full h-full object-cover" />
              ) : (
                <MessageSquare className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="font-bold">{identityRevealed ? "Priya S." : "Anonymous Match"}</h2>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Developer fast-forward for demo */}
            <button onClick={() => setTimeLeft(5)} className="hidden md:flex items-center gap-1 text-xs text-gray-500 hover:text-white" title="Fast-forward timer (Demo)">
              <TimerReset className="w-4 h-4" />
            </button>
            <div className="font-mono text-xl font-bold text-amber-400">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'system' ? (
                <div className="w-full text-center my-2">
                  <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full border border-indigo-500/30">
                    {msg.text}
                  </span>
                </div>
              ) : (
                <div className={`max-w-[70%] rounded-2xl p-3 ${
                  msg.sender === 'me' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white/10 text-white rounded-bl-none border border-white/5'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              )}
            </div>
          ))}
          {vote === "reveal" && !identityRevealed && (
            <div className="w-full text-center my-2">
              <span className="text-emerald-400 text-xs">Waiting for match to vote...</span>
            </div>
          )}
        </div>

        {/* Input Area / Voting Area */}
        <div className="p-4 border-t border-white/10 bg-black/40">
          {timeLeft === 0 || identityRevealed ? (
            <div className="flex gap-4">
              {!identityRevealed ? (
                <>
                  <Button 
                    onClick={() => setVote("leave")}
                    className="flex-1 h-12 bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500/10"
                    disabled={vote !== "pending"}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Chat
                  </Button>
                  <Button 
                    onClick={handleReveal}
                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={vote !== "pending"}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Reveal Identity
                  </Button>
                </>
              ) : (
                <div className="w-full text-center text-emerald-400 font-bold p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  Identity Revealed! You can now view their full profile.
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="bg-white/5 border-white/10 focus:border-indigo-500"
              />
              <Button onClick={handleSend} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
