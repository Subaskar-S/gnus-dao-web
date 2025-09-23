# GNUS DAO Governance Platform

Enterprise-grade GNUS DAO governance platform with quadratic voting, multi-chain support, and Diamond pattern integration.

## 🚀 Features

- **Modern Wallet Integration**: Support for MetaMask, Coinbase Wallet, and WalletConnect v2
- **Multi-Chain Support**: Base, SKALE, Polygon, Arbitrum, and Ethereum networks
- **Quadratic Voting**: Advanced voting mechanisms for fair governance
- **Diamond Pattern**: Modular smart contract architecture (EIP-2535)
- **Real-time Updates**: Live proposal and voting data
- **Mobile Responsive**: Optimized for all devices
- **Dark/Light Theme**: User preference support

## 🛠 Technology Stack

- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with custom components
- **Web3**: Ethers.js v6, WalletConnect v2, Reown AppKit
- **State Management**: Redux Toolkit with TypeScript
- **Authentication**: Sign-In with Ethereum (SIWE)
- **Package Manager**: Yarn (recommended)

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- Yarn package manager (recommended)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gnus-dao-website
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
   NEXT_PUBLIC_ENVIRONMENT=development
   ```

## 🚀 Development

### Start development server
```bash
yarn dev
```

The application will be available at `http://localhost:3000`

### Build for production
```bash
yarn build
```

### Start production server
```bash
yarn start
```

### Type checking
```bash
yarn type-check
```

### Linting
```bash
yarn lint
yarn lint:fix
```

## 🌐 Deployment

### Cloudflare Pages (Recommended)

1. **Build the application**
   ```bash
   yarn build
   ```

2. **Deploy to Cloudflare Pages**
   - Connect your repository to Cloudflare Pages
   - Set build command: `yarn build`
   - Set output directory: `.next`
   - Configure environment variables

### Static Export (Alternative)

For static hosting platforms:

```bash
yarn build:static
```

This generates a static export in the `out` directory.

## 🔧 Configuration

### Supported Networks

The application supports the following networks:

- **Base** (Chain ID: 8453) - Default
- **SKALE Europa Hub** (Chain ID: 1351057110)
- **Polygon** (Chain ID: 137)
- **Arbitrum One** (Chain ID: 42161)
- **Ethereum Mainnet** (Chain ID: 1)

### Wallet Configuration

Supported wallet connectors:

- **MetaMask**: Browser extension and mobile app
- **Coinbase Wallet**: Browser extension and mobile app
- **WalletConnect v2**: 300+ mobile wallets via QR code

## 🏗 Architecture

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── auth/              # Authentication components
│   ├── layout/            # Layout components
│   ├── proposals/         # Proposal-related components
│   ├── ui/                # Reusable UI components
│   ├── voting/            # Voting components
│   └── wallet/            # Wallet connection components
├── lib/                   # Utility libraries
│   ├── auth/              # Authentication logic
│   ├── config/            # Configuration files
│   ├── contracts/         # Smart contract interfaces
│   ├── utils/             # Utility functions
│   └── web3/              # Web3 integration
└── styles/                # Global styles
```

### Key Components

- **WalletSelectionModal**: Modern wallet connection interface
- **ConnectWalletButton**: Reusable wallet connection component
- **QuadraticVotingModal**: Advanced voting interface
- **ProposalCard**: Proposal display component

## 🔐 Security

- **SIWE Authentication**: Secure wallet-based authentication
- **Input Validation**: Comprehensive form validation
- **Error Boundaries**: Graceful error handling
- **CSP Headers**: Content Security Policy implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for the GNUS DAO community**
