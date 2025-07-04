# 🧠 ENS AI Profiles - contx.eth

> Transform your X profile into an AI-aware .base.eth identity in 30 seconds

[![Built for ENS Hackathon](https://img.shields.io/badge/Built%20for-ENS%20Hackathon-blue.svg)](https://hackathon.ens.domains/)
[![Base L2](https://img.shields.io/badge/Network-Base%20L2-0052FF.svg)](https://base.org/)
[![Next.js](https://img.shields.io/badge/Framework-Next.js%2015-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://typescriptlang.org/)

## ✨ What is contx.eth?

**contx.eth** creates AI-enhanced ENS profiles by analyzing your X (Twitter) account and storing rich context in .base.eth domains. This enables personalized AI interactions across any platform that supports ENS lookups.

### 🎯 Value Proposition
- **30-second setup**: From X profile to AI-enhanced ENS 
- **Universal compatibility**: Works with Claude, ChatGPT, and future AI agents
- **Self-sovereign**: You own your AI context on-chain
- **Base L2 optimized**: Low gas fees and fast transactions

## 🏆 Hackathon Goals

Targeting **all three ENS prize categories**:

- 🥇 **Most Creative Use Case** ($2,000): Auto-populated AI context in ENS text records
- 🥈 **Best L2 Primary Names** ($3,000): Base L2 integration with .base.eth domains  
- 🥉 **Best ENS Use** ($5,000): ENS as portable AI identity infrastructure

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Privy App ID
- Base L2 RPC URL

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

# Optional (for real Twitter API integration)
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
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

### 3. **Deploy to ENS**
- Registers .base.eth domain on Base L2
- Stores AI context in ENS text records
- Batch transaction for registration + context storage

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
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Authentication**: Privy (Web3 + Social)
- **Blockchain**: Base L2, viem, wagmi
- **Design**: Apple-inspired minimal aesthetic
- **AI**: Smart context extraction and analysis

### Key Components

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── ai/            # AI context generation
│   │   └── twitter/       # X profile fetching
│   ├── dashboard/         # User dashboard
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── BasenameRegistration.tsx
│   ├── RegistrationSuccess.tsx
│   └── ui/               # Reusable components
├── lib/                   # Utilities
│   ├── ens.ts            # ENS contracts & helpers
│   └── hooks/useENS.ts   # ENS integration hook
└── providers/            # Context providers
    └── PrivyProvider.tsx  # Web3 auth wrapper
```

### ENS Integration

**Base L2 Contracts:**
- Registry: `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e`
- Resolver: `0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41`
- Registrar: `0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb`

**Features:**
- Real-time availability checking
- Dynamic pricing from Base registrar
- Batch transactions (register + setText)
- Text record management for AI context

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
- [x] Base L2 ENS registration
- [x] Apple-style UI/UX

### Phase 2: Enhanced Features 🚧
- [ ] Real Twitter API integration (currently mock)
- [ ] MCP server for Claude integration
- [ ] GitHub profile analysis
- [ ] Farcaster integration
- [ ] Context editing and versioning

### Phase 3: AI Ecosystem 🔮
- [ ] Partner integrations (ChatGPT, Claude, etc.)
- [ ] AI agent marketplace
- [ ] Advanced analytics and insights
- [ ] Cross-platform identity sync

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
- Add tests for new features (when framework is set up)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **Documentation**: Check out our [docs](./docs)
- **Issues**: Report bugs via [GitHub Issues](https://github.com/your-org/contxdoteth/issues)
- **Discord**: Join our [community](https://discord.gg/your-invite)
- **Twitter**: Follow [@contxdoteth](https://twitter.com/contxdoteth)

## 🌟 Acknowledgments

- Built for the [ENS Hackathon](https://hackathon.ens.domains/)
- Powered by [Base](https://base.org/) L2
- Authentication by [Privy](https://privy.io/)
- Inspired by the future of AI-human interaction

---

**Made with ❤️ for the ENS Hackathon 2025**

*Transforming social profiles into AI-aware blockchain identities, one .base.eth at a time.*