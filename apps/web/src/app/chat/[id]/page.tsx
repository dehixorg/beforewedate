'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Sparkles, Send, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  text: string
  sender: 'me' | 'them' | 'wingman'
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hey! I saw you like hiking. What's your favorite trail?", sender: 'them' }
  ])
  const [input, setInput] = useState('')
  const [blurLevel, setBlurLevel] = useState(80)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    setMessages(prev => [...prev, { id: Date.now().toString(), text: input, sender: 'me' }])
    setInput('')
    
    // Simulate photo unblurring as they chat
    setBlurLevel(prev => Math.max(0, prev - 10))
  }

  const handleAIWingman = () => {
    setMessages(prev => [
      ...prev, 
      { id: Date.now().toString(), text: "Wingman Suggestion: 'I really love the trails around Yosemite. Have you ever been, or do you stick to local mountains?'", sender: 'wingman' }
    ])
  }

  return (
    <div className="h-screen bg-zinc-950 flex flex-col max-w-2xl mx-auto text-white">
      {/* Header */}
      <header className="flex items-center p-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
        <Link href="/matches" className="p-2 mr-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3 border border-zinc-700">
          <img 
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80" 
            alt="Sarah"
            className="w-full h-full object-cover transition-all duration-1000"
            style={{ filter: `blur(${blurLevel / 10}px)` }}
          />
        </div>
        <div className="flex-1">
          <h2 className="font-bold">Sarah</h2>
          <p className="text-xs text-zinc-400">Photo unblurs as you chat ({100 - blurLevel}% clear)</p>
        </div>
        <Link href="/dark-room">
          <div className="p-2 bg-rose-500/10 rounded-full hover:bg-rose-500/20 transition-colors cursor-pointer" title="Enter Dark Room (Conflict Resolution)">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
        </Link>
      </header>

      {/* Chat Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.sender === 'me' 
                    ? 'bg-purple-600 text-white rounded-br-none' 
                    : msg.sender === 'wingman'
                      ? 'bg-zinc-800 border border-purple-500/50 text-purple-200 text-sm italic w-full text-center'
                      : 'bg-zinc-800 text-zinc-100 rounded-bl-none'
                }`}
              >
                {msg.sender === 'wingman' && (
                  <Sparkles className="w-4 h-4 inline-block mr-2 text-purple-400" />
                )}
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-900">
        <div className="flex justify-between mb-3">
          <button 
            onClick={handleAIWingman}
            className="flex items-center text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-full hover:bg-purple-500/20 transition-colors"
          >
            <Sparkles className="w-3 h-3 mr-1.5" />
            AI Wingman Idea
          </button>
        </div>
        
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..." 
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
