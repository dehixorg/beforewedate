# BeforeWeDate Verified

A zero-knowledge trust layer for dating. Prove you're a real, age-verified human without ever exposing your ID to a stranger, a third-party vendor, or our servers.

**Submission for Akindo Wave Hacks - Midnight Network**  
[Hackathon Event Link](https://app.akindo.io/wave-hacks/jaMZjqPOBsLXvjdG)

---

## 🏆 Hackathon Vision: The Zero-Knowledge Trust Layer

Modern dating apps force a dangerous trade-off: you either blindly trust an unverified stranger's claims, or you hand over a highly sensitive scan of your Government ID to a centralized third-party verification vendor (creating a massive honeypot of personal data). 

Unverified profiles enable catfishing and unsafe real-world meetups. Centralized verification strips users of their privacy. 

**BeforeWeDate** solves this by integrating **Midnight Compact contracts**. Before meeting up in real life, either side can prove they are a real, age-verified, unique person. Only a cryptographic pass/fail proof is ever shared. The underlying ID document never touches our servers, the other user's device, or the blockchain.

## ✨ Ecosystem Features

1. **The "Reality Check" Trust Score (Powered by Midnight ZK):**
   Every user has a dynamic Trust Score (0-100). Premium users can set a "Trust Filter", guaranteeing high-quality, verified matches without compromising privacy.
2. **Time-Boxed "Blind" Chat:**
   Stop judging books purely by their cover. When you match, photos are heavily blurred. You are dropped into a realtime chat where you must actually talk to each other to slowly reveal your profiles.
3. **The AI Relationship Coach:**
   Your personal wingman, built directly into the chat. The AI (running securely in our private Azure tenant) reads both profiles and suggests highly personalized icebreakers to revive the spark.
4. **"Ghost Mode" (Geospatial Serendipity):**
   When you walk into a "Partner Venue," toggle on Ghost Mode to see an anonymous radar of other singles currently in the same room. You match digitally while sitting 20 feet apart.

## 🛠️ Tech Stack
- **Zero-Knowledge Layer:** Midnight Network (Compact contracts, Midnight JS SDK)
- **Web App / Admin Dashboard:** Next.js (React 19, Tailwind CSS v4, Shadcn)
- **Mobile App:** React Native (Expo), TypeScript
- **Backend API:** NestJS (Node.js) 
- **Database & Auth:** Supabase (PostgreSQL) with `pgvector` & `PostGIS`
- **AI & Moderation:** Azure OpenAI (`gpt-4o-mini`) & Azure AI Content Safety

## 🚀 Demo
The web app contains a special **Demo Mode** designed specifically for hackathon judges to bypass SMS authentication and explore the UI without needing a real backend connection.
