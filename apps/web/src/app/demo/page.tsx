'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Fingerprint, Lock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export default function DemoDashboard() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const handleVerify = () => {
    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      setIsVerified(true)
    }, 2500)
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-12 font-sans text-zinc-100 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <header className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            BeforeWeDate <span className="text-purple-400">Dashboard</span>
          </h2>
          <div className="flex items-center space-x-3 text-sm text-zinc-400 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>End-to-End Encrypted</span>
          </div>
        </header>

        <main className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Verify Your Identity</h1>
              <p className="text-zinc-400">
                To interact with matches, you must prove you are a real human over 18. 
                Using Midnight Compact contracts, your ID document never leaves your device. 
                Only a mathematical Zero-Knowledge proof is generated and sent to our servers.
              </p>
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center">
                  <Fingerprint className="w-5 h-5 mr-2 text-purple-400" />
                  Zero-Knowledge Proof Status
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Generate a client-side proof without exposing PII.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isVerified ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col items-center justify-center text-center space-y-3"
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    <div>
                      <h4 className="text-emerald-300 font-bold text-lg">ZK Proof Verified</h4>
                      <p className="text-emerald-400/80 text-sm mt-1">Trust Score updated to 95/100.</p>
                    </div>
                  </motion.div>
                ) : (
                  <Button 
                    onClick={handleVerify} 
                    disabled={isVerifying}
                    className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg relative overflow-hidden"
                  >
                    {isVerifying ? (
                      <span className="flex items-center space-x-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <Fingerprint className="w-5 h-5 opacity-50" />
                        </motion.div>
                        <span>Generating Compact Proof...</span>
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Scan ID & Generate ZK Proof <ArrowRight className="w-5 h-5 ml-2" />
                      </span>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
              <CardHeader>
                <CardTitle className="text-zinc-200">Your Trust Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="relative">
                  <svg className="w-48 h-48 transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-zinc-800" />
                    <motion.circle 
                      cx="96" cy="96" r="88" 
                      stroke="currentColor" 
                      strokeWidth="12" 
                      fill="transparent" 
                      strokeDasharray="552.9" 
                      initial={{ strokeDashoffset: 552.9 }}
                      animate={{ strokeDashoffset: isVerified ? 55.29 : 276.45 }} // 50 to 95
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={isVerified ? "text-emerald-400" : "text-amber-400"} 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span className="text-5xl font-black text-white">
                      {isVerified ? "95" : "50"}
                    </motion.span>
                    <span className="text-zinc-500 text-sm font-semibold uppercase mt-1">/ 100</span>
                  </div>
                </div>
                
                <div className="mt-8 text-center space-y-2">
                  <div className="flex items-center justify-center text-zinc-400">
                    <ShieldCheck className={`w-5 h-5 mr-2 ${isVerified ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <span>Bot Prevention Active</span>
                  </div>
                  <p className="text-sm text-zinc-500 max-w-xs">
                    {isVerified 
                      ? "You are fully verified. You can now access Ghost Mode and Blind Chat." 
                      : "Your score is low. Verified users may filter your profile out of their swipe deck."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
