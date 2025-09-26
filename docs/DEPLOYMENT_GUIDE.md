# 🚀 GNUS DAO Cloudflare Pages Deployment Guide

This guide provides step-by-step instructions for deploying the GNUS DAO governance platform to Cloudflare Pages with full IPFS functionality.

## 📋 Prerequisites

### 1. Required Accounts
- **GitHub Account**: For repository hosting and CI/CD
- **Cloudflare Account**: For Pages hosting and domain management
- **Pinata Account**: For IPFS pinning service (optional but recommended)
- **WalletConnect Account**: For Web3 wallet integration

### 2. Required Secrets/Environment Variables
You need to configure these environment variables in Cloudflare Pages:

#### **Required Variables:**
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS=0x1234567890123456789012345678901234567890
NODE_ENV=production
STATIC_EXPORT=true
```

#### **Optional Variables (for enhanced functionality):**
```bash
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_BASE_RPC_URL=https://base-mainnet.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_KEY
```

## 🔧 Setup Instructions

### Step 1: Configure GitHub Secrets

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

```bash
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_SEPOLIA_RPC_URL=your_sepolia_rpc_url
NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS=your_dao_contract_address
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
```

### Step 2: Configure Cloudflare Pages

1. **Create a new Cloudflare Pages project:**
   - Go to Cloudflare Dashboard > Pages
   - Click "Create a project"
   - Connect your GitHub repository
   - Set project name: `gnus-dao-web`

2. **Configure build settings:**
   ```bash
   Build command: yarn build:cloudflare
   Build output directory: out
   Root directory: (leave empty)
   ```

3. **Add environment variables in Cloudflare Pages:**
   - Go to your project > Settings > Environment variables
   - Add all the required variables listed above

### Step 3: Configure Custom Domain (Optional)

1. **Add custom domain:**
   - Go to your project > Custom domains
   - Add your domain (e.g., `dao.gnus.ai`)
   - Follow DNS configuration instructions

2. **SSL/TLS Settings:**
   - Ensure SSL/TLS encryption mode is set to "Full (strict)"
   - Enable "Always Use HTTPS"

## 🚀 Deployment Process

### Automatic Deployment (Recommended)

The project is configured for automatic deployment via GitHub Actions:

1. **Push to main/master branch** triggers production deployment
2. **Pull requests** trigger preview deployments
3. **Build process includes:**
   - TypeScript type checking
   - ESLint linting with auto-fixes
   - Next.js production build
   - Static export for Cloudflare Pages
   - Build validation

### Manual Deployment

If you need to deploy manually:

```bash
# 1. Install dependencies
yarn install

# 2. Fix any linting issues
node scripts/targeted-lint-fix.js

# 3. Build for Cloudflare Pages
yarn build:cloudflare

# 4. Validate deployment
node scripts/validate-deployment.js

# 5. Deploy to Cloudflare Pages (using Wrangler CLI)
npx wrangler pages deploy out --project-name=gnus-dao-web
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. **Build Fails with Linting Errors**
```bash
# Run the targeted lint fix script
node scripts/targeted-lint-fix.js

# Or manually fix specific issues
yarn lint --fix
```

#### 2. **Environment Variables Not Working**
- Verify all required variables are set in Cloudflare Pages
- Check variable names match exactly (case-sensitive)
- Ensure `NEXT_PUBLIC_` prefix for client-side variables

#### 3. **IPFS Upload Fails**
- Verify Pinata API credentials are correct
- Check Pinata account limits and usage
- Ensure CORS is properly configured

#### 4. **Wallet Connection Issues**
- Verify WalletConnect Project ID is valid
- Check network RPC URLs are accessible
- Ensure contract addresses are correct for the target network

#### 5. **Static Export Issues**
- Verify `STATIC_EXPORT=true` is set
- Check for dynamic imports that need lazy loading
- Ensure no server-side only code in client components

### Build Logs Analysis

Monitor these key indicators in build logs:

```bash
✅ TypeScript type check passed
✅ Linting passed (warnings allowed)
✅ Build completed successfully
✅ Static export generated
✅ Build validation completed
```

## 📊 Performance Optimization

### Cloudflare Pages Features

The deployment automatically includes:

1. **Global CDN**: Content served from 200+ locations worldwide
2. **Edge Caching**: Static assets cached at edge locations
3. **Brotli Compression**: Automatic compression for faster loading
4. **HTTP/3 Support**: Latest protocol for improved performance
5. **Security Headers**: CSP, HSTS, and other security measures

### Bundle Analysis

Monitor bundle sizes in build output:
```bash
Route (app)                              Size     First Load JS
┌ ○ /                                    15 kB           472 kB
├ ○ /proposals                           8.48 kB         457 kB
└ ○ /treasury                            3.17 kB         451 kB
```

## 🔒 Security Considerations

### Environment Variables
- Never commit secrets to repository
- Use GitHub Secrets for CI/CD
- Configure environment variables in Cloudflare Pages dashboard
- Rotate API keys regularly

### Content Security Policy
The deployment includes strict CSP headers:
```bash
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'
```

### HTTPS and Security Headers
- All traffic redirected to HTTPS
- Security headers automatically applied
- XSS protection enabled
- Clickjacking protection enabled

## 📈 Monitoring and Maintenance

### Cloudflare Analytics
Monitor deployment health via:
- Cloudflare Pages dashboard
- Real User Monitoring (RUM)
- Core Web Vitals tracking
- Error rate monitoring

### GitHub Actions Monitoring
Track deployment status:
- Build success/failure rates
- Build duration trends
- Linting issue trends
- Test coverage reports

## 🆘 Support and Resources

### Documentation Links
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [WalletConnect Documentation](https://docs.walletconnect.com/)
- [Pinata IPFS Documentation](https://docs.pinata.cloud/)

### Getting Help
- Check GitHub Issues for known problems
- Review Cloudflare Pages logs for deployment issues
- Monitor browser console for client-side errors
- Use GitHub Discussions for community support

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] GitHub secrets properly set
- [ ] Cloudflare Pages project created
- [ ] Custom domain configured (if applicable)
- [ ] Build passes locally with `yarn build:cloudflare`
- [ ] All tests passing
- [ ] Security headers validated
- [ ] Performance metrics acceptable
- [ ] IPFS functionality tested
- [ ] Wallet connection tested on target networks

**🎉 Ready for deployment!**
