# 🧠 ENS AI Profiles - contx.eth

> Transform your X profile into an AI-aware .basetest.eth identity in 30 seconds

[![Built for ENS Hackathon](https://img.shields.io/badge/Built%20for-ENS%20Hackathon-blue.svg)](https://hackathon.ens.domains/)
[![Base L2](https://img.shields.io/badge/Network-Base%20Sepolia-0052FF.svg)](https://base.org/)
[![Next.js](https://img.shields.io/badge/Framework-Next.js%2015-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://typescriptlang.org/)

## ✨ What is contx.eth?

**contx.eth** creates AI-enhanced ENS profiles by analyzing your X (Twitter) account and storing rich context in .basetest.eth domains. This enables personalized AI interactions across any platform that supports ENS lookups.

### 🎯 Value Proposition
- **30-second setup**: From X profile to AI-enhanced ENS 
- **Universal compatibility**: Works with Claude, ChatGPT, and future AI agents
- **Self-sovereign**: You own your AI context on-chain
- **Base L2 optimized**: Low gas fees and instant transactions
- **Complete resolution**: Forward and reverse lookup in one atomic transaction

## 🏆 Hackathon Goals

Targeting **all three ENS prize categories**:

- 🥇 **Most Creative Use Case** ($2,000): Auto-populated AI context in ENS text records
- 🥈 **Best L2 Primary Names** ($3,000): Base Sepolia integration with .basetest.eth domains  
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
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org

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
- Registers .basetest.eth domain on Base Sepolia
- **Atomic transaction**: NFT mint + registry setup + forward resolution + reverse resolution + **AI context storage**
- Stores comprehensive AI context in ENS text records during registration
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
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Authentication**: Privy (Web3 + Social)
- **Blockchain**: Base Sepolia, viem, wagmi
- **Design**: Apple-inspired minimal aesthetic
- **AI**: Smart context extraction and analysis

### Key Components

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── ai/            # AI context generation
│   │   └── twitter/       # X profile fetching
│   ├── dashboard/         # User dashboard with basename management
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── BasenameRegistration.tsx    # Registration flow
│   ├── RegistrationSuccess.tsx     # Success + verification
│   ├── RegistrationVerification.tsx # Real-time status checking
│   ├── BasenamesList.tsx          # Existing basenames display
│   └── ui/               # Reusable components
├── lib/                   # Utilities
│   ├── ens.ts            # ENS contracts & helpers
│   └── hooks/            
│       ├── useENS.ts     # Main ENS integration hook
│       └── useBasenames.ts # Basename portfolio management
└── providers/            # Context providers
    └── PrivyProvider.tsx  # Web3 auth wrapper
```

### ENS Integration

**Base Sepolia Contracts (Official):**
- **Registry**: `0x1493b2567056c2181630115660963E13A8E32735`
- **L2Resolver**: `0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA`
- **RegistrarController**: `0x49ae3cc2e3aa768b1e5654f5d3c6002144a59581`
- **BaseRegistrar (NFT)**: `0xa0c70ec36c010b55e3c434d6c6ebeec50c705794`
- **ReverseRegistrar**: `0xa0A8401ECF248a9375a0a71C4dedc263dA18dCd7`

**Key Implementation Features:**
- ✅ **Atomic registration**: Single transaction for complete functionality
- ✅ **AI context storage**: All AI data stored as ENS text records during registration
- ✅ **Forward resolution**: `name.basetest.eth` → address
- ✅ **Reverse resolution**: address → `name.basetest.eth` (Base-specific format)
- ✅ **Real-time verification**: Instant status checking post-registration
- ✅ **Portfolio management**: View all owned basenames with reverse record status
- ✅ **Text records**: Complete AI context automatically stored on-chain

## ✅ **BREAKTHROUGH: Text Records Working!**

**🎉 Major Achievement**: Successfully implemented AI context storage in ENS text records during atomic registration on Base Sepolia!

**Verified Transaction**: [`0x2802c7bb...`](https://sepolia.basescan.org/tx/0x2802c7bb0c3f95beca29cd995158fd3109ee434081519a2d6eb27c8d0adb6e5b)

**8 Text Records Stored On-Chain:**
- ✅ `description` - Human-readable bio
- ✅ `keywords` - Topic keywords  
- ✅ `ai.bio` - JSON structured bio array
- ✅ `ai.style` - JSON communication style object
- ✅ `ai.topics` - JSON topics array
- ✅ `ai.traits` - JSON personality traits array
- ✅ `ai.updated` - ISO timestamp
- ✅ `ai.version` - Schema version

**Impact**: Basenames are now truly AI-aware blockchain identities with rich context stored directly on Base L2!

## 🔍 Key Technical Findings

### Base Sepolia Implementation Details

1. **Domain**: Uses `.basetest.eth` instead of `.base.eth` for testnet
2. **Atomic Registration**: Single `register()` call with resolver data creates:
   - NFT ownership
   - Registry ownership  
   - Forward resolution (name → address)
   - Reverse resolution (address → name)
3. **Reverse Records**: Base uses custom node calculation different from standard ENS
4. **No Commit-Reveal**: Direct registration without front-running protection
5. **Instant Resolution**: Forward and reverse work immediately after registration

### Transaction Flow Analysis

**Successful Registration Events:**
```
1. ETHPaymentProcessed    - Payment confirmation
2. Transfer               - NFT minted to user
3. NewOwner              - Registry ownership set
4. NewResolver           - Resolver configured
5. NameRegisteredWithRecord - Registration confirmed
6. AddressChanged        - Forward resolution set (coinType 60)
7. AddrChanged           - Basic address resolution
8. TextChanged (×8)      - AI context stored in text records:
   - description         - Human-readable bio
   - keywords           - Topic keywords
   - ai.bio             - JSON structured bio
   - ai.style           - JSON communication style
   - ai.topics          - JSON topics array
   - ai.traits          - JSON personality traits
   - ai.updated         - ISO timestamp
   - ai.version         - Schema version
9. BaseReverseClaimed    - Reverse record claimed
10. NameChanged          - Reverse name set to user.basetest.eth
11. NameRegistered       - Final confirmation
```

### Resolution Verification

**Working Implementation:**
- ✅ NFT ownership via `ownerOf(tokenId)`
- ✅ Registry ownership via `registry.owner(node)`
- ✅ Forward resolution via `resolver.addr(node)`
- ✅ Reverse resolution via Base-specific node calculation

**Verification Component:**
- Real-time status checking after registration
- Visual indicators for each resolution type
- Automatic refresh and status updates

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
- [x] Base Sepolia ENS registration
- [x] **AI context storage in ENS text records**
- [x] Apple-style UI/UX
- [x] Atomic registration with complete resolution
- [x] Real-time verification and portfolio management
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

```typescript
const registerBasename = async (options: RegistrationOptions) => {
  // Prepare resolver data for atomic registration
  const node = namehash(`${name}.basetest.eth`)
  const setAddrData = encodeFunctionData({
    abi: ENS_RESOLVER_ABI,
    functionName: 'setAddr',
    args: [node, address],
  })

  // Prepare AI context text records
  const ensRecords = formatAIContextForENS(aiContext)
  const textRecordData = Object.entries(ensRecords).map(([key, value]) => 
    encodeFunctionData({
      abi: ENS_RESOLVER_ABI,
      functionName: 'setText',
      args: [node, key, value],
    })
  )

  // Single atomic transaction with AI context
  const hash = await walletClient.writeContract({
    address: REGISTRAR_CONTROLLER_ADDRESS,
    abi: REGISTRAR_CONTROLLER_ABI,
    functionName: 'register',
    args: [{
      name: formattedName,
      owner: address,
      duration: BigInt(duration),
      resolver: L2_RESOLVER_ADDRESS,
      data: [setAddrData, ...textRecordData], // Address + AI context
      reverseRecord: true,
    }],
    value: price,
  })
}
```

### Verification System

```typescript
const RegistrationVerification = ({ baseName }) => {
  // Real-time verification of:
  // - NFT ownership
  // - Registry ownership
  // - Resolver configuration
  // - Forward resolution
  // - Reverse resolution (Base format)
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
- Powered by [Base](https://base.org/) Sepolia L2
- Authentication by [Privy](https://privy.io/)
- Inspired by the future of AI-human interaction
- Special thanks to the Base team for excellent testnet infrastructure

## 🔬 Technical Achievements

### ENS Innovation
- **First** to implement atomic .basetest.eth registration with complete resolution + AI context
- **Advanced** reverse record handling for Base's custom implementation
- **Real-time** verification system for registration status
- **Portfolio** management for multiple basename ownership
- **Complete** AI context storage in ENS text records during registration
- **Verified** end-to-end text record functionality on Base Sepolia

### User Experience
- **Zero** technical knowledge required
- **Instant** registration feedback and verification
- **Clean** Apple-inspired interface
- **Mobile-first** responsive design

---

**Made with ❤️ for the ENS Hackathon 2025**

*Transforming social profiles into AI-aware blockchain identities, one .basetest.eth at a time.*