'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Shield, Fingerprint, Sparkles, LockKeyhole } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'code'>('phone')

  // Bypasses the backend completely for hackathon judges
  function triggerDemoMode() {
    router.push('/demo')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
      
      {/* Background aesthetics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-5xl grid md:grid-cols-2 gap-12 z-10"
      >
        
        {/* Philosophy & Vision Side */}
        <div className="flex flex-col justify-center space-y-8 p-6 md:p-0">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              BeforeWeDate <span className="text-purple-400">Verified</span>
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed max-w-md">
              A zero-knowledge trust layer for dating. Prove you're a real, age-verified human without ever exposing your ID to a stranger or our servers.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200">Midnight ZK Contracts</h3>
                <p className="text-sm text-zinc-500 mt-1">Cryptographic proofs guarantee identity without data honeypots.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                <LockKeyhole className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200">Absolute Privacy</h3>
                <p className="text-sm text-zinc-500 mt-1">Your ID document never touches our Azure servers or the blockchain.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                <Sparkles className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200">AI Relationship Coach</h3>
                <p className="text-sm text-zinc-500 mt-1">Private, in-chat LLM wingman to break the ice authentically.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Card Side */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-white">Sign In</CardTitle>
              <CardDescription className="text-zinc-400">
                Enter your phone number to access your encrypted profile.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep('code'); }}>
                {step === 'phone' ? (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-zinc-300">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+1 (555) 000-0000" 
                      className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-purple-500"
                    />
                    <Button type="submit" className="w-full mt-4 bg-white text-black hover:bg-zinc-200">
                      Continue
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="token" className="text-zinc-300">Verification Code</Label>
                    <Input 
                      id="token" 
                      type="text" 
                      placeholder="123456" 
                      className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 text-center tracking-widest text-lg focus-visible:ring-purple-500"
                    />
                    <Button type="button" className="w-full mt-4 bg-white text-black hover:bg-zinc-200">
                      Verify Securely
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col bg-zinc-950/50 rounded-b-xl border-t border-zinc-800 p-6 mt-4">
               <div className="w-full text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                    <Fingerprint className="w-4 h-4" />
                    <span>Hackathon Judges</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 transition-all duration-300" 
                    onClick={triggerDemoMode}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Launch Interactive Demo
                  </Button>
                  <p className="text-[11px] text-zinc-500 leading-tight">
                    Bypasses backend auth to showcase the Midnight ZK verification flow and UI.
                  </p>
               </div>
            </CardFooter>
          </Card>
        </div>

      </motion.div>
    </div>
  )
}
