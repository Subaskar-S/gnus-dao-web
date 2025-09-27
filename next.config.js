/** @type {import('next').NextConfig} */
const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev')

// Setup Cloudflare development platform
if (process.env.NODE_ENV === 'development') {
  setupDevPlatform()
}

const nextConfig = {
  // Core Next.js optimizations
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,

  // Cloudflare Pages configuration
  ...(process.env.CLOUDFLARE_PAGES === 'true' && {
    // Additional configuration for Cloudflare Pages
    // Edge Runtime is handled by the adapter
  }),

  // Fallback to static export for other deployments
  ...(process.env.NODE_ENV === 'production' && process.env.STATIC_EXPORT === 'true' && process.env.CLOUDFLARE_PAGES !== 'true' && {
    output: 'export',
    trailingSlash: true,
    distDir: 'out',
  }),

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      '@heroicons/react',
      'react-hot-toast',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      '@walletconnect/ethereum-provider',
      '@reown/appkit',
      'ethers'
    ],
    // Disabled optimizeCss due to critters dependency issue
    // optimizeCss: true,
    webVitalsAttribution: ['CLS', 'LCP'],
    // Edge Runtime compatibility handled by @cloudflare/next-on-pages adapter
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? { properties: ['^data-testid$'] } : false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Image optimization with security
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'dweb.link',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.infura.io',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'gnus.ai',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'geniusventures.io',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Enhanced security headers (disabled for static export)
  ...(!(process.env.NODE_ENV === 'production' && process.env.STATIC_EXPORT === 'true') && {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://verify.walletconnect.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-src 'none';",
            },
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()',
            },
          ],
        },
      ];
    },
  }),

  // Simplified webpack configuration for Web3 compatibility
  webpack: (config, { isServer }) => {
    // Handle node modules that need polyfills
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        buffer: false,
        util: false,
        // Handle Node.js built-in modules
        'node:fs': false,
        'node:path': false,
        'node:crypto': false,
        'node:stream': false,
        'node:util': false,
        'node:url': false,
        'node:buffer': false,
        // IPFS-specific polyfills
        'ipfs-http-client': false,
        'multiformats': false,
      };
    }

    // Handle ESM modules
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    }

    // Handle Reown AppKit and WalletConnect dependencies
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }

    // Resolve alias for problematic dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      '@walletconnect/keyvaluestorage': require.resolve('@walletconnect/keyvaluestorage'),
    };

    // Handle specific module resolution for WalletConnect
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    // Add a custom plugin to handle node: scheme imports
    config.plugins.push({
      apply: (compiler) => {
        compiler.hooks.normalModuleFactory.tap('NodeSchemePlugin', (factory) => {
          factory.hooks.beforeResolve.tap('NodeSchemePlugin', (resolveData) => {
            if (resolveData.request && resolveData.request.startsWith('node:')) {
              const moduleName = resolveData.request.slice(5); // Remove 'node:' prefix
              resolveData.request = moduleName;
            }
          });
        });
      },
    });

    // Ignore specific warnings from dependencies
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Critical dependency: the request of a dependency is an expression/,
    ];

    return config;
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },

  // SEO-friendly redirects (disabled for static export)
  ...(!(process.env.NODE_ENV === 'production' && process.env.STATIC_EXPORT === 'true') && {
    async redirects() {
      return [
        {
          source: '/governance',
          destination: '/dao/proposals',
          permanent: true,
        },
        {
          source: '/vote',
          destination: '/dao/proposals',
          permanent: true,
        },
        {
          source: '/voting',
          destination: '/dao/proposals',
          permanent: true,
        },
      ];
    },
  }),
};

module.exports = nextConfig;
