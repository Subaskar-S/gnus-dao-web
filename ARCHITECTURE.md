# 🏗️ GNUS DAO Platform Architecture

## Overview

The GNUS DAO Governance Platform is a modern, enterprise-grade decentralized autonomous organization (DAO) platform built with Next.js 14, featuring quadratic voting, multi-chain support, and Diamond pattern smart contract integration.

## System Architecture

### Technology Stack

#### Frontend Technologies
- **Next.js 14**: React framework with App Router for modern web development
- **React 18**: Component-based UI library with concurrent features
- **TypeScript 5.5**: Static type checking for enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Framer Motion**: Animation library for smooth user interactions

#### Web3 Technologies
- **Ethers.js v6**: Ethereum blockchain interaction library
- **WalletConnect v2**: Universal wallet connection protocol
- **MetaMask**: Browser wallet integration
- **SIWE**: Sign-In with Ethereum for authentication

#### State Management
- **Redux Toolkit**: Predictable state container with TypeScript support
- **React Query**: Server state management and caching
- **Local Storage**: Persistent user preferences

#### Development Tools
- **Jest**: Unit testing framework
- **Playwright**: End-to-end testing
- **ESLint**: Code linting and quality enforcement
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality gates

#### Infrastructure
- **Cloudflare Pages**: Static site hosting with edge computing
- **GitHub Actions**: Continuous integration and deployment
- **Wrangler**: Cloudflare development and deployment CLI
- **Pinata**: IPFS pinning service for decentralized storage

## Detailed Architecture

### 1. Frontend Architecture

#### Next.js 14 App Router Structure
```
src/app/
├── layout.tsx              # Root layout with providers
├── page.tsx               # Landing page
├── proposals/             # Proposal management
│   ├── page.tsx          # Proposals listing
│   ├── [id]/             # Dynamic proposal routes
│   │   └── page.tsx      # Individual proposal details
├── treasury/             # Treasury management
├── analytics/            # DAO analytics
└── governance/           # Governance settings
```

#### Component Architecture
```
src/components/
├── ui/                   # Base UI components
│   ├── Button.tsx        # Reusable button component
│   ├── Modal.tsx         # Modal dialog component
│   └── Input.tsx         # Form input component
├── proposals/            # Proposal-specific components
│   ├── CreateProposalModal.tsx
│   ├── ProposalCard.tsx
│   └── ProposalList.tsx
├── voting/              # Voting interface components
│   ├── VotingButtons.tsx
│   └── QuadraticVotingModal.tsx
├── wallet/              # Wallet connection components
│   ├── WalletButton.tsx
│   └── WalletModal.tsx
└── providers/           # Context providers
    ├── Web3Provider.tsx
    └── ThemeProvider.tsx
```

### 2. Smart Contract Integration

#### Diamond Pattern (EIP-2535)
The platform integrates with a Diamond pattern smart contract for upgradeability and modularity:

```solidity
// Contract Address: 0x57AE78C65F7Dd6d158DE9F4cA9CCeaA98C988199 (Sepolia)

contract GNUSDAODiamond {
    // Diamond storage and facet management
    
    // Proposal Facet Functions
    function propose(string title, string ipfsHash) external returns (uint256);
    function getProposalBasic(uint256 proposalId) external view returns (...);
    function getProposalStatus(uint256 proposalId) external view returns (...);
    
    // Voting Facet Functions
    function vote(uint256 proposalId, uint256 votes) external;
    function hasVoted(uint256 proposalId, address voter) external view returns (bool);
    function getVote(uint256 proposalId, address voter) external view returns (uint256);
    
    // Configuration Functions
    function getVotingConfig() external view returns (...);
}
```

#### Contract Service Layer
```typescript
// src/lib/contracts/gnusDaoService.ts
class GNUSDAOService {
    private contract: Contract | null = null;
    private provider: ethers.Provider | null = null;
    private signer: ethers.Signer | null = null;
    
    async initialize(provider: ethers.Provider, signer: ethers.Signer, chainId: number);
    async createProposal(title: string, ipfsHash: string): Promise<ContractTransactionResponse>;
    async castVote(proposalId: bigint, support: VoteSupport): Promise<ContractTransactionResponse>;
    async getProposal(proposalId: bigint): Promise<Proposal | null>;
    async getProposalState(proposalId: bigint): Promise<ProposalState>;
}
```

### 3. State Management Architecture

#### Redux Store Structure
```typescript
interface RootState {
    web3: {
        wallet: WalletState;
        provider: ethers.BrowserProvider | null;
        signer: ethers.JsonRpcSigner | null;
        currentNetwork: NetworkConfig;
        gnusDaoInitialized: boolean;
        tokenBalance: bigint;
        votingPower: bigint;
    };
    proposals: {
        proposals: Proposal[];
        loading: boolean;
        error: string | null;
        selectedProposal: Proposal | null;
    };
    voting: {
        userVotes: Record<string, VoteReceipt>;
        votingPower: bigint;
        voteCredits: bigint;
    };
}
```

#### State Flow
1. **Wallet Connection**: User connects wallet → Web3 state updated
2. **Contract Initialization**: Provider/signer available → DAO service initialized
3. **Data Loading**: Service initialized → Proposals and voting data loaded
4. **User Actions**: User votes/creates proposals → State updated → UI reflects changes

### 4. IPFS Integration

#### Pinata Service Integration
```typescript
// src/lib/ipfs/client.ts
class IPFSService {
    private pinataApiKey: string;
    private pinataSecretKey: string;
    private pinataJWT: string;
    
    async uploadProposalMetadata(metadata: ProposalMetadata): Promise<IPFSUploadResult>;
    async uploadFile(file: File): Promise<IPFSUploadResult>;
    async retrieveMetadata(hash: string): Promise<ProposalMetadata>;
}
```

#### Metadata Structure
```typescript
interface ProposalMetadata {
    title: string;
    description: string;
    category: 'treasury' | 'protocol' | 'governance' | 'community';
    author: string;
    created: number;
    version: string;
    attachments?: IPFSUploadResult[];
    tags?: string[];
    discussionUrl?: string;
    votingPeriod?: {
        start: number;
        end: number;
    };
    executionDelay?: number;
}
```

### 5. Build and Deployment Architecture

#### Hybrid Build Strategy
The platform uses a hybrid build approach for Cloudflare Pages:

1. **Static Site Generation (SSG)**: Pre-rendered pages for optimal performance
2. **Runtime API Routes**: Dynamic functionality via Cloudflare Pages Functions
3. **Edge Computing**: Global distribution with edge caching

#### Build Process
```bash
# scripts/build-hybrid.js
1. Next.js static export → Static HTML/CSS/JS
2. API route extraction → Cloudflare Functions
3. Asset optimization → CDN-ready files
4. Runtime configuration → Environment variable injection
```

#### Deployment Pipeline
```yaml
# .github/workflows/deploy.yml
1. Code Quality Checks (TypeScript, ESLint, Tests)
2. Build Verification (Hybrid build success)
3. Cloudflare Pages Deployment
4. Preview Deployments for PRs
```

## Key Architectural Decisions

### 1. Next.js 14 App Router
**Decision**: Use Next.js 14 with App Router instead of Pages Router
**Rationale**: 
- Better performance with React Server Components
- Improved developer experience with file-based routing
- Enhanced SEO capabilities
- Future-proof architecture

### 2. Diamond Pattern Smart Contracts
**Decision**: Integrate with Diamond pattern contracts (EIP-2535)
**Rationale**:
- Upgradeability without losing state
- Modular architecture for feature separation
- Gas optimization through function delegation
- Enterprise-grade contract management

### 3. Redux Toolkit for State Management
**Decision**: Use Redux Toolkit instead of React Context
**Rationale**:
- Predictable state updates for complex Web3 interactions
- Time-travel debugging capabilities
- Middleware support for async operations
- TypeScript integration

### 4. Cloudflare Pages for Hosting
**Decision**: Deploy on Cloudflare Pages instead of traditional hosting
**Rationale**:
- Global edge distribution for performance
- Integrated CI/CD with GitHub
- Serverless functions for dynamic features
- Cost-effective scaling

### 5. IPFS with Pinata for Storage
**Decision**: Use IPFS with Pinata pinning service
**Rationale**:
- Decentralized storage aligns with Web3 principles
- Immutable content addressing
- Reliable pinning service for availability
- Cost-effective for metadata storage
