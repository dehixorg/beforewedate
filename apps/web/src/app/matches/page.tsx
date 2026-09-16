'use client'

import { motion } from 'framer-motion'
import { MessageCircle, ShieldCheck, Ghost } from 'lucide-react'
import Link from 'next/link'

const matches = [
  {
    id: '1',
    name: 'Sarah',
    lastMessage: "I'd love to go hiking sometime!",
    time: '2m ago',
    trustScore: 95,
    blurLevel: 80, // High blur because they just matched
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80'
  },
  {
    id: '2',
    name: 'Michael',
    lastMessage: 'What is your favorite pasta dish?',
    time: '1h ago',
    trustScore: 88,
    blurLevel: 40, // Medium blur, they've talked a bit
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80'
  },
  {
    id: '3',
    name: 'Jessica',
    lastMessage: 'The AI Wingman just saved this convo 😂',
    time: 'Yesterday',
    trustScore: 99,
    blurLevel: 0, // No blur, they unlocked each other
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
  }
]

export default function MatchesPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 pb-24 max-w-2xl mx-auto">
      <header className="flex justify-between items-center mb-8 pt-8">
        <h1 className="text-3xl font-bold tracking-tight">Your Matches</h1>
        <Link href="/map" className="p-3 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors">
          <Ghost className="w-5 h-5 text-zinc-400 hover:text-purple-400" />
        </Link>
      </header>

      <div className="space-y-4">
        {matches.map((match, i) => (
          <Link href={`/chat/${match.id}`} key={match.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center p-4 bg-zinc-900/50 hover:bg-zinc-800/50 rounded-2xl border border-zinc-800/50 backdrop-blur-sm transition-all group mt-4"
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-zinc-800 group-hover:border-purple-500/50 transition-colors">
                <img 
                  src={match.image} 
                  alt={match.name}
                  className="w-full h-full object-cover transition-all duration-700"
                  style={{ filter: `blur(${match.blurLevel / 10}px)` }}
                />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-semibold flex items-center">
                    {match.name}
                    {match.trustScore >= 90 && <ShieldCheck className="w-4 h-4 ml-1.5 text-emerald-400" />}
                  </h3>
                  <span className="text-xs text-zinc-500 font-medium">{match.time}</span>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-1 group-hover:text-zinc-300 transition-colors">
                  {match.lastMessage}
                </p>
              </div>

              <div className="ml-4 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                <MessageCircle className="w-4 h-4 text-zinc-400 group-hover:text-white" />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
      
      {/* Bottom Nav Placeholder */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900 p-4 flex justify-around items-center">
         <Link href="/deck" className="text-zinc-500 hover:text-white font-medium">Swipe Deck</Link>
         <Link href="/matches" className="text-white font-bold border-b-2 border-purple-500 pb-1">Matches</Link>
         <Link href="/demo" className="text-zinc-500 hover:text-white font-medium">Trust Score</Link>
      </div>
    </div>
  )
}
