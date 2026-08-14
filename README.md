# BeforeWeMeet - CROO Agent Hackathon 🏆

**BeforeWeMeet** is a consent-first A2A (Agent-to-Agent) compatibility platform that lets two people privately evaluate their relationship compatibility before any identities, photos, or sensitive details are revealed.

It is built specifically for the **CROO Agent Commerce Layer**, enabling paid, callable AI agents to facilitate safe and meaningful connections.

---

## 🚀 The Core Problem

In early dating, there is a massive privacy dilemma:
- **Sharing too early** creates pressure and risks exposing sensitive data to strangers.
- **Not sharing enough** leads to wasted time on incompatible matches.
- **Traditional Platforms** collect and monetize your private data, matching you based on engagement rather than true compatibility.

## 💡 The A2A Solution

BeforeWeMeet solves this by replacing the traditional "matching algorithm" with a **Decentralized Agent Architecture**.

Instead of users swiping endlessly on faces, they define their exact boundaries, preferences, and dealbreakers into a secure **Consent Policy**. When two users cross paths, their respective AI agents communicate directly via **CROO CAP** to securely evaluate the policies. 

If (and only if) the agents determine a high compatibility match, an anonymous 30-minute chat is initiated.

---

## 🛠 Features (End-to-End Relationship Lifecycle)

BeforeWeMeet is not just a dating app; it is a full lifecycle relationship manager.

### 1. Trust & Discovery
- **Web3 Wallet Consent:** Users sign their encrypted consent policies using MetaMask or WalletConnect.
- **Zero-Knowledge Identity:** Trust Scores are generated via ZK proofs, ensuring the network is safe without revealing real names.
- **Serendipity Radar Map:** A beautiful, real-time map plotting the anonymous profiles of people you've crossed paths with.

### 2. Paid A2A Evaluation (CROO Integration)
- **The Compatibility Agent:** A deterministic engine that checks hard boundaries (Gender, Intentions).
- **The Conversation Coach Agent:** Powered by **Azure OpenAI**, this agent analyzes both profiles to generate emotionally intelligent, highly specific ice-breaker questions.
- **On-Chain Settlement:** These agent interactions cost USDC. We utilize **CROO CAP** to seamlessly settle these micro-transactions between agents.

### 3. The "Meet" Phase (Safe Date Hub)
- **30-Minute Blind Chat:** A timer-enforced anonymous chat where the AI Coach can jump in to mediate.
- **Uber MCP Integration:** Agents securely book rides to verified venues without exposing the user's home address.
- **Standby Friends:** Automatically pings emergency contacts with live locations.

### 4. Relationship Evolution Modes
- **Couple Mode:** The AI Coach transforms into an **Argument Mediator Agent**, analyzing disagreements based on initial consent policies.
- **Marriage Mode:** The dashboard evolves into a household manager tracking shared child care schedules and Joint CROO Finances.

---

## 💻 Tech Stack

- **Frontend:** Next.js 14 (App Router), TailwindCSS, shadcn/ui, Lucide Icons
- **Backend:** Node.js, MongoDB (Mongoose)
- **AI Engine:** Azure OpenAI (`gpt-5.4` deployment)
- **A2A Commerce:** Simulated CROO CAP SDK (Settling USDC via Smart Contracts)

---

## 🏁 How to Run Locally

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0...
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_API_KEY=your-api-key
   ```
4. Seed the database with mock profiles:
   ```bash
   npx tsx scripts/seed.ts
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```
6. Visit `http://localhost:3000` to start the journey!

---

*Built with ❤️ for the CROO Agent Hackathon*
