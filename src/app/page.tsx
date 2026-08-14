import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Lock, BrainCircuit } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-black text-white">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="w-full px-6 py-4 flex items-center justify-between border-b border-white/5 z-10 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-indigo-400" />
          <span className="text-xl font-bold tracking-tighter">BeforeWe<span className="text-indigo-400">Meet</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            CROO Agent Store Live
          </div>
          <Link 
            href="/login" 
            className="text-sm font-medium hover:text-indigo-300 transition-colors"
          >
            Enter App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center z-10 py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8">
          <Zap className="w-4 h-4 text-amber-400" />
          Powered by CROO CAP Layer
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6">
          Private Compatibility. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Evaluated by Agents.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          A consent-first A2A compatibility platform. Two people privately evaluate compatibility using mutually authorized preferences, before any identities are revealed. 
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/login" 
            className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
          >
            Connect Wallet & Start
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a 
            href="#how-it-works" 
            className="flex items-center gap-2 px-8 py-4 rounded-full font-semibold border border-white/20 hover:bg-white/5 transition-colors"
          >
            View Demo
          </a>
        </div>
      </main>

      {/* Features Grid */}
      <section className="border-t border-white/5 bg-white/[0.02] py-24 z-10" id="how-it-works">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-black border border-white/10 hover:border-indigo-500/50 transition-colors group">
            <Lock className="w-10 h-10 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-3">Absolute Privacy</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Set strict consent policies. The Compatibility Agent only evaluates mutually authorized fields. Identities are masked until both parties accept an anonymous invite.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-black border border-white/10 hover:border-purple-500/50 transition-colors group">
            <BrainCircuit className="w-10 h-10 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-3">A2A Composability</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              If the Compatibility Agent finds a match, it automatically hires the Conversation Coach Agent via CAP to generate safe, contextual ice-breakers.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-black border border-white/10 hover:border-emerald-500/50 transition-colors group">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-3">Paid On-Chain</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Every compatibility evaluation is a real transaction settled in USDC via the CROO network. A transparent, sustainable agent economy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
