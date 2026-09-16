'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function DarkRoomPage() {
  const [step, setStep] = useState(1)

  return (
    <div className="h-screen bg-rose-950 flex flex-col text-white">
      
      <header className="flex items-center p-6 border-b border-rose-900/50 bg-rose-950/80 backdrop-blur-md sticky top-0 z-10">
        <Link href="/matches" className="p-2 mr-4 bg-rose-900 rounded-full hover:bg-rose-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="font-bold text-rose-100 flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-rose-400" />
            The Dark Room
          </h2>
          <p className="text-xs text-rose-300">AI-Moderated Conflict Resolution</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
        {step === 1 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-rose-900/40 border border-rose-800/50 rounded-3xl p-8 text-center backdrop-blur-xl"
          >
            <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Are you feeling unsafe?</h1>
            <p className="text-rose-200 mb-8 leading-relaxed text-sm">
              The Dark Room is a secure, AI-moderated environment. If a conversation has made you uncomfortable, you can move it here. Our AI will analyze the chat context and mediate the situation, or securely disconnect you while protecting your identity.
            </p>
            
            <div className="space-y-3">
              <button onClick={() => setStep(2)} className="w-full py-4 bg-rose-600 hover:bg-rose-500 rounded-xl font-bold transition-colors">
                Yes, Mediate Convo
              </button>
              <button className="w-full py-4 bg-rose-950/50 hover:bg-rose-900 border border-rose-800/50 rounded-xl font-bold transition-colors">
                Disconnect & Block
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-rose-900/40 border border-rose-800/50 rounded-3xl p-8 text-center backdrop-blur-xl"
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Mediation Active</h1>
            <p className="text-rose-200 mb-8 leading-relaxed text-sm">
              The AI Wingman is now reviewing the chat context. A temporary pause has been placed on the match. We will guide both parties through a constructive resolution.
            </p>
            <Link href="/matches">
              <button className="w-full py-4 bg-rose-600 hover:bg-rose-500 rounded-xl font-bold transition-colors">
                Return to Matches
              </button>
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  )
}
