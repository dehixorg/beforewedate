"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Timer, MessageCircle, Send, BrainCircuit, User } from "lucide-react";

export default function ChatSession({ params }: { params: Promise<{ matchId: string }> }) {
  const router = useRouter();
  const { matchId } = use(params);
  const [messages, setMessages] = useState<{ sender: 'me' | 'them' | 'ai', text: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [askingAI, setAskingAI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch existing messages
  useEffect(() => {
    fetch(`/api/chat/${matchId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      });
  }, [matchId]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const textToSend = inputValue;
    setInputValue("");
    
    // Optimistic UI update
    setMessages(prev => [...prev, { sender: 'me', text: textToSend }]);
    
    // Send to backend
    try {
      await fetch(`/api/chat/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAskAICoach = async () => {
    setAskingAI(true);
    
    // Simulate hitting the Azure endpoint for a response, then save to DB as AI
    const simulatedCoachResponse = 'Conversation Coach: Based on your mutual profiles, try asking about their long-term location plans!';
    
    try {
      await fetch(`/api/chat/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: simulatedCoachResponse, isAI: true })
      });
      
      setMessages(prev => [...prev, { sender: 'ai', text: simulatedCoachResponse }]);
    } catch(e) {
      console.error(e);
    }
    
    setAskingAI(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-3xl flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-md rounded-t-2xl mt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h2 className="font-bold text-white">Anonymous Match</h2>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-full">
          <Timer className="w-4 h-4 text-rose-400" />
          <span className="font-mono font-bold text-rose-400">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="w-full max-w-3xl flex-1 bg-white/5 border-x border-white/10 p-4 overflow-y-auto space-y-4 h-[60vh] max-h-[60vh]"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.sender === 'me' ? 'justify-end' : msg.sender === 'ai' ? 'justify-center' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[70%] p-3 rounded-2xl ${
                msg.sender === 'me' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : msg.sender === 'ai'
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs italic text-center w-full max-w-md'
                  : 'bg-gray-800 text-white rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="w-full max-w-3xl p-4 border border-white/10 bg-white/5 backdrop-blur-md rounded-b-2xl flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type an honest message..."
            className="flex-1 bg-black/50 border-white/10 text-white focus:border-indigo-500 h-12"
          />
          <Button onClick={handleSend} className="h-12 w-12 bg-indigo-600 hover:bg-indigo-700 p-0 rounded-full flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <Button 
            onClick={handleAskAICoach}
            disabled={askingAI}
            variant="outline" 
            className="text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            {askingAI ? (
              <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"/> Thinking...</span>
            ) : (
              <span className="flex items-center gap-2"><BrainCircuit className="w-3 h-3" /> Ask AI Coach</span>
            )}
          </Button>

          <div className="flex gap-2">
            <Button 
              onClick={() => router.push(`/safe-date/123`)}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Plan Safe Date
            </Button>
            <Button 
              onClick={() => router.push('/dashboard')}
              variant="ghost" 
              className="text-xs text-gray-500 hover:text-white"
            >
              End Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
