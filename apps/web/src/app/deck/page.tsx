'use client'

import { useState } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Heart, X, ShieldCheck, MapPin, Sparkles } from 'lucide-react'

// Mock Data for the Demo Deck
const mockProfiles = [
  {
    id: '1',
    name: 'Sarah',
    age: 26,
    trustScore: 95,
    distance: '2 miles away',
    bio: 'Coffee addict and weekend hiker. Looking for someone to get lost in the mountains with.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=60'
  },
  {
    id: '2',
    name: 'Michael',
    age: 28,
    trustScore: 88,
    distance: '5 miles away',
    bio: 'Software engineer by day, amateur chef by night. I make a mean carbonara.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=60'
  },
  {
    id: '3',
    name: 'Jessica',
    age: 25,
    trustScore: 99,
    distance: '1 mile away',
    bio: 'Dog mom to a golden retriever. Always down for a spontaneous road trip.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=60'
  }
]

export default function SwipeDeck() {
  const [cards, setCards] = useState(mockProfiles)

  // Framer Motion constraints
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-18, 18])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  // Handle Swipe Event
  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) {
      handleSwipe('right')
    } else if (info.offset.x < -100) {
      handleSwipe('left')
    }
  }

  const handleSwipe = (direction: 'left' | 'right') => {
    setCards((prev) => prev.slice(1))
    // Here we would typically send the swipe to our NestJS API
    console.log(`Swiped ${direction} on card!`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center overflow-hidden p-4">
      
      {/* Navigation Bar */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <h1 className="text-2xl font-bold text-white tracking-tight">BeforeWeDate</h1>
        <div className="flex space-x-4">
          <button className="text-zinc-400 hover:text-white transition-colors">Matches</button>
          <button className="text-zinc-400 hover:text-white transition-colors">Ghost Mode</button>
        </div>
      </nav>

      {/* Swipe Deck */}
      <div className="relative w-full max-w-sm h-[600px] flex items-center justify-center mt-12">
        <AnimatePresence>
          {cards.length > 0 ? (
            cards.map((profile, index) => {
              const isTop = index === 0
              return (
                <motion.div
                  key={profile.id}
                  className="absolute w-full h-full bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden"
                  style={isTop ? { x, rotate, opacity } : { scale: 1 - index * 0.05, y: index * 20 }}
                  drag={isTop ? "x" : false}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.8}
                  onDragEnd={isTop ? handleDragEnd : undefined}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ x: x.get() > 0 ? 300 : -300, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${profile.image})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  </div>

                  <div className="absolute bottom-0 w-full p-6 text-white">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <h2 className="text-3xl font-bold flex items-center">
                          {profile.name}, {profile.age}
                          {profile.trustScore > 90 && (
                            <ShieldCheck className="w-6 h-6 ml-2 text-emerald-400" />
                          )}
                        </h2>
                        <div className="flex items-center text-zinc-300 mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {profile.distance}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 border-emerald-400 bg-black/50 backdrop-blur-md">
                        <span className="text-sm font-bold text-emerald-400">{profile.trustScore}</span>
                      </div>
                    </div>

                    <p className="text-zinc-300 text-sm mb-6 line-clamp-3">
                      {profile.bio}
                    </p>

                    <div className="flex justify-center space-x-6">
                      <button 
                        onClick={() => handleSwipe('left')}
                        className="w-14 h-14 bg-zinc-800/80 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all backdrop-blur-md"
                      >
                        <X className="w-6 h-6" />
                      </button>
                      <button 
                        className="w-14 h-14 bg-zinc-800/80 rounded-full flex items-center justify-center text-purple-400 hover:bg-purple-500 hover:text-white transition-all backdrop-blur-md"
                      >
                        <Sparkles className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => handleSwipe('right')}
                        className="w-14 h-14 bg-zinc-800/80 rounded-full flex items-center justify-center text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all backdrop-blur-md"
                      >
                        <Heart className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            }).reverse()
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-500">
              <Sparkles className="w-12 h-12 mb-4 opacity-50" />
              <p>You've seen everyone nearby!</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
