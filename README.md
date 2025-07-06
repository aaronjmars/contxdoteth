# 🧠 ENS AI Profiles - contx.eth

> Transform your X profile into an AI-aware .contx.eth identity in 30 seconds

[![Built for ENS Hackathon](https://img.shields.io/badge/Built%20for-ENS%20Hackathon-blue.svg)](https://hackathon.ens.domains/)
[![Base L2](https://img.shields.io/badge/Network-Base%20Sepolia-0052FF.svg)](https://base.org/)
[![Next.js](https://img.shields.io/badge/Framework-Next.js%2015-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://typescriptlang.org/)

## ✨ What is contx.eth?

**contx.eth** creates AI-enhanced ENS profiles by analyzing your X (Twitter) account and storing rich context in .contx.eth domains. This enables personalized AI interactions across any platform that supports ENS lookups.

### 🎯 Value Proposition
- **30-second setup**: From X profile to AI-enhanced ENS 
- **Universal compatibility**: Works with Claude, ChatGPT, and future AI agents
- **Self-sovereign**: You own your AI context on-chain
- **Base L2 optimized**: Low gas fees and instant transactions
- **Complete resolution**: Forward and reverse lookup with custom registry

## 🏆 Hackathon Goals

Targeting **all three ENS prize categories**:

- 🥇 **Most Creative Use Case** ($2,000): Auto-populated AI context in ENS text records
- 🥈 **Best L2 Primary Names** ($3,000): Base Sepolia integration with custom .contx.eth domains  
- 🥉 **Best ENS Use** ($5,000): ENS as portable AI identity infrastructure

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Privy App ID
- Base Sepolia RPC URL
- Base Sepolia testnet ETH

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/contxdoteth.git
cd contxdoteth

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values
```

### Environment Variables

```bash
# Required
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org

# Contract Addresses
NEXT_PUBLIC_BASE_REGISTRY_ADDRESS=0xa2bbe9b6a4ca01806b1cfac4174e4976ce2b0d70
NEXT_PUBLIC_ETH_RESOLVER_ADDRESS=0x20cb27a5f5c77968650aaaa66e11ba9334689068

# Optional
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://eth.llamarpc.com
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_BASESCAN_URL=https://sepolia.basescan.org
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🏗️ How It Works

### 1. **Connect X Account**
- Secure OAuth via Privy
- Extracts profile data and recent tweets
- Analyzes communication style and interests

### 2. **Generate AI Context** 
- Smart analysis of bio, tweets, and engagement patterns
- Extracts personality traits, topics, and communication preferences
- Creates structured context optimized for AI interactions

### 3. **Deploy to Custom Registry**
- Registers .contx.eth domain via ContxRegistry contract
- **Atomic transaction**: Registration + AI context storage + forward resolution
- Stores comprehensive AI context in contract text records during registration
- Instant registration with complete functionality and AI-enhanced profile

### 4. **AI-Enhanced Interactions**
- Any AI agent can read your ENS profile
- Personalized responses based on your stored context
- Universal compatibility across platforms

## 📊 AI Context Schema

The app stores structured data in ENS text records:

```json
{
  "ai.bio": ["Frontend developer", "Web3 builder", "Coffee enthusiast"],
  "ai.style": {
    "all": ["concise", "technical", "friendly"],
    "chat": ["casual", "helpful"]
  },
  "ai.topics": ["react", "web3", "ai", "typescript", "coffee"],
  "ai.traits": ["curious", "builder", "analytical"],
  "ai.updated": "2025-07-04T12:00:00Z",
  "ai.version": "1.0"
}
```

## 🛠️ Technical Architecture

### Core Technologies
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS 4
- **Authentication**: Privy (Web3 + Social)
- **Blockchain**: Base Sepolia, viem, wagmi
- **Design**: Apple-inspired minimal aesthetic
- **AI**: OpenAI integration for context extraction

### Key Components

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── ai/            # AI context generation
│   │   ├── ccip-read/     # CCIP-Read ENS resolution
│   │   └── twitter/       # Twitter profile integration
│   ├── dashboard/         # User dashboard
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── Hero.tsx          # Landing page hero
│   ├── LandingPage.tsx   # Main landing page
│   ├── TwitterConnectionScreen.tsx # Twitter auth flow
│   └── ui/               # Reusable components
├── lib/                   # Utilities
│   ├── ens.ts            # ENS contracts & helpers
│   └── hooks/            
│       ├── useENS.ts     # Main ENS integration hook
│       └── useTwitterConnection.ts # Twitter auth handling
└── providers/            # Context providers
    └── PrivyProvider.tsx  # Web3 auth wrapper
```

### Smart Contracts

**Custom Implementation:**
- **ContxRegistry**: Custom ENS subdomain registry with key-value profile storage
- **ContxResolver**: CCIP-Read resolver for ENS compatibility

**Key Implementation Features:**
- ✅ **Custom registry**: `.contx.eth` domains with ContxRegistry contract
- ✅ **AI context storage**: All AI data stored as text records during registration
- ✅ **Forward resolution**: `name.contx.eth` → address
- ✅ **Text records**: Complete AI context automatically stored on-chain
- ✅ **Real-time verification**: Instant status checking post-registration
- ✅ **Profile management**: View and update ENS records through dashboard

## 🎨 Design System

**Apple-inspired minimal aesthetic:**
- **Colors**: Primary (#0071e3), Success (#34c759), Warning (#ff9500)
- **Typography**: SF Pro Display/Text system fonts
- **Components**: Rounded corners, subtle shadows, smooth transitions
- **Responsive**: Mobile-first design with seamless desktop experience

## 🔮 Future Roadmap

### Phase 1: Core Platform ✅
- [x] Twitter OAuth integration
- [x] AI context generation  
- [x] Custom ENS registry (.contx.eth)
- [x] **AI context storage in ENS text records**
- [x] Apple-style UI/UX
- [x] Atomic registration with complete resolution
- [x] Real-time verification and profile management
- [x] **Text records working end-to-end**

### Phase 2: Enhanced Features 🚧
- [ ] Real Twitter API integration (currently mock)
- [ ] MCP server for Claude integration
- [ ] GitHub profile analysis
- [ ] Farcaster integration
- [ ] Context editing and versioning
- [ ] Base mainnet deployment

### Phase 3: AI Ecosystem 🔮
- [ ] Partner integrations (ChatGPT, Claude, etc.)
- [ ] AI agent marketplace
- [ ] Advanced analytics and insights
- [ ] Cross-platform identity sync

## 🔧 Developer Experience

### Registration Implementation

The app uses a streamlined dashboard approach for registration:

```typescript
// Main registration flow in dashboard
const handleRegister = async () => {
  // 1. Generate AI context from Twitter
  const contextResponse = await fetch('/api/ai/generate-context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, twitterUsername })
  })
  
  // 2. Process registration data
  const registrationResponse = await fetch('/api/x-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, walletAddress, aiContext })
  })
  
  // 3. Register via ContxRegistry contract
  const registerHash = await walletClient.writeContract({
    address: CONTX_REGISTRY_ADDRESS,
    abi: CONTX_REGISTRY_ABI,
    functionName: 'register',
    args: [username, displayName, bio]
  })
  
  // 4. Set AI context text records (batch update)
  const textHash = await walletClient.writeContract({
    address: CONTX_REGISTRY_ADDRESS,
    abi: CONTX_REGISTRY_ABI,
    functionName: 'updateFields',
    args: [username, keys, values]
  })
}
```

### Profile Management

```typescript
// View and update ENS records
const handleViewRecords = async () => {
  // Check if username exists
  const address = await publicClient.readContract({
    address: CONTX_REGISTRY_ADDRESS,
    abi: CONTX_REGISTRY_ABI,
    functionName: 'getAddress',
    args: [username]
  })
  
  // Get field names and values
  const fieldNames = await publicClient.readContract({
    address: CONTX_REGISTRY_ADDRESS,
    abi: CONTX_REGISTRY_ABI,
    functionName: 'getFieldNames',
    args: [username]
  })
  
  const fieldValues = await publicClient.readContract({
    address: CONTX_REGISTRY_ADDRESS,
    abi: CONTX_REGISTRY_ABI,
    functionName: 'getFields',
    args: [username, fieldNames]
  })
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Maintain Apple-style design consistency
- Test manually through dashboard interface

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **Documentation**: Check out our [docs](./docs)
- **Issues**: Report bugs via [GitHub Issues](https://github.com/your-org/contxdoteth/issues)
- **Discord**: Join our [community](https://discord.gg/your-invite)
- **Twitter**: Follow [@contxdoteth](https://twitter.com/contxdoteth)

## 🌟 Acknowledgments

- Built for the [ENS Hackathon](https://hackathon.ens.domains/)
- Powered by [Base](https://base.org/) Sepolia L2
- Authentication by [Privy](https://privy.io/)
- Inspired by the future of AI-human interaction
- Special thanks to the Base team for excellent testnet infrastructure

## 🔬 Technical Achievements

### ENS Innovation
- **Custom** .contx.eth registry with atomic registration + AI context
- **Advanced** key-value storage for profile data
- **Real-time** verification system for registration status
- **Complete** AI context storage in ENS text records during registration
- **Streamlined** dashboard interface for registration and management

### User Experience
- **Zero** technical knowledge required
- **Instant** registration feedback and verification
- **Clean** Apple-inspired interface
- **Mobile-first** responsive design
- **Comprehensive** profile management through dashboard

---

**Made with ❤️ for the ENS Hackathon 2025**

*Transforming social profiles into AI-aware blockchain identities, one .contx.eth at a time.*