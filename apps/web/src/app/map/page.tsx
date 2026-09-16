'use client'

import { motion } from 'framer-motion'
import { MapPin, Ghost, ShieldCheck, ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'

export default function GhostModeMap() {
  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden text-white relative">
      
      {/* Background Map Simulation */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at center, #27272a 2px, transparent 2px)',
        backgroundSize: '40px 40px'
      }}></div>
      
      {/* Radar Sweep Animation */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -mt-[400px] -ml-[400px] rounded-full border border-purple-500/10 pointer-events-none"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(168, 85, 247, 0.2) 360deg)'
        }}
      />

      <header className="flex justify-between items-center p-6 z-10 bg-gradient-to-b from-zinc-950 to-transparent">
        <Link href="/matches" className="p-3 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-bold tracking-tight text-purple-400 flex items-center">
            <Ghost className="w-5 h-5 mr-2" /> Ghost Mode
          </h1>
          <p className="text-xs text-zinc-500">The Continental Bar, NYC</p>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-full">
          <MapPin className="w-5 h-5 text-emerald-400" />
        </div>
      </header>

      <main className="flex-1 relative z-10">
        
        {/* Center Pulse (You) */}
        <div className="absolute top-1/2 left-1/2 -mt-4 -ml-4">
          <motion.div 
            animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-purple-500 rounded-full"
          />
          <div className="relative w-8 h-8 bg-purple-600 rounded-full border-2 border-white shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center justify-center">
             <Ghost className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Nearby User 1 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="absolute top-[30%] left-[60%] flex flex-col items-center cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] mb-2 group-hover:scale-110 transition-transform">
             <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80" alt="Nearby" className="w-full h-full object-cover blur-sm" />
          </div>
          <div className="bg-zinc-900 border border-emerald-500/50 text-xs px-2 py-1 rounded-md text-emerald-400 flex items-center font-bold">
            <ShieldCheck className="w-3 h-3 mr-1" /> 88
          </div>
        </motion.div>

        {/* Nearby User 2 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute top-[65%] left-[25%] flex flex-col items-center cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] mb-2 group-hover:scale-110 transition-transform">
             <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80" alt="Nearby" className="w-full h-full object-cover blur-sm" />
          </div>
          <div className="bg-zinc-900 border border-emerald-500/50 text-xs px-2 py-1 rounded-md text-emerald-400 flex items-center font-bold">
            <ShieldCheck className="w-3 h-3 mr-1" /> 99
          </div>
        </motion.div>

      </main>

      <div className="bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-800 p-6 z-10 rounded-t-3xl">
        <h3 className="text-lg font-bold mb-2 flex items-center">
          <Users className="w-5 h-5 mr-2 text-purple-400" />
          2 Verified Singles Nearby
        </h3>
        <p className="text-sm text-zinc-400 mb-6">
          You are completely anonymous. Tap a profile on the radar to send a "Ghost Ping". If they accept, you can match digitally while in the same room.
        </p>
        <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-4 rounded-xl transition-colors">
          Exit Ghost Mode
        </button>
      </div>
    </div>
  )
}
