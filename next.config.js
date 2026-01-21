const withNextIntl = require('next-intl/plugin')(
  './i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,

  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://api.carwiseiq.com' : 'http://127.0.0.1:8000'),
  },

  // Security headers (applied to all document responses)
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || (isDev ? 'http://localhost:8000' : 'https://api.carwiseiq.com');
    const reportUri = `${apiBase.replace(/\/$/, '')}/api/csp-report`;
    
    // Build connect-src sources
    const connectSrcs = ["'self'"];
    
    // Add Supabase URLs (always, for both dev and prod)
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
    if (supabaseUrl) {
      connectSrcs.push(supabaseUrl);
    }
    connectSrcs.push('https://*.supabase.co');
    
    // In development, add relaxed connect-src
    if (isDev) {
      connectSrcs.push(
        'http://localhost:3002',
        'http://127.0.0.1:3002',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'ws:',
        'chrome-extension:'
      );
    } else {
      // Production: strict CSP - only allow production domains
      // Add API base URL (should be https://api.carwiseiq.com)
      if (apiBase && !apiBase.includes('localhost') && !apiBase.includes('127.0.0.1')) {
        connectSrcs.push(apiBase);
      }
      // Explicitly allow carwiseiq.com and api.carwiseiq.com
      connectSrcs.push('https://carwiseiq.com', 'https://api.carwiseiq.com');
    }
    
    // Build img-src sources
    const imgSrcs = ["'self'", 'data:', 'blob:', 'https:'];
    if (isDev) {
      imgSrcs.push('http://localhost:8000', 'http://127.0.0.1:8000');
    } else {
      // Production: only allow HTTPS images from trusted domains
      imgSrcs.push('https://carwiseiq.com', 'https://api.carwiseiq.com', 'https://cdn.iqcars.io');
    }
    
    // Build script-src sources
    const scriptSrcs = ["'self'", "'unsafe-inline'", "'unsafe-eval'"];
    if (isDev) {
      scriptSrcs.push('chrome-extension:');
    }
    // Production: no chrome-extension, no ws:, no localhost
    
    // Build CSP directives
    const cspDirectives = [
      "default-src 'self'",
      `script-src ${scriptSrcs.join(' ')}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src ${imgSrcs.join(' ')}`,
      "font-src 'self' data:",
      `connect-src ${connectSrcs.join(' ')}`,
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      `report-uri ${reportUri}`,
    ];
    
    const csp = cspDirectives.join('; ');
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },

  // Image optimization - preserve quality for car images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    // Higher quality for better image rendering
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: (() => {
      const isDev = process.env.NODE_ENV !== 'production';
      const patterns = [
        { protocol: 'https', hostname: 'cdn.iqcars.io', pathname: '/**' },
        { protocol: 'https', hostname: 'api.carwiseiq.com', pathname: '/uploads/**' },
        { protocol: 'https', hostname: 'api.carwiseiq.com', pathname: '/api/car-images/**' },
      ];
      
      // Only add localhost patterns in development
      if (isDev) {
        patterns.push(
          { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/uploads/**' },
          { protocol: 'http', hostname: 'localhost', port: '55730', pathname: '/uploads/**' },
          { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/api/car-images/**' },
          { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/uploads/**' },
          { protocol: 'http', hostname: '127.0.0.1', port: '55730', pathname: '/uploads/**' },
          { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/api/car-images/**' }
        );
      }
      
      return patterns;
    })(),
    unoptimized: false,
  },

  // Prevent build cache issues
  webpack: (config, { dev, isServer }) => {
    // Ignore Windows system files to prevent Watchpack errors
    config.watchOptions = {
      ignored: [
        '**/node_modules/**',
        'C:/pagefile.sys',
        'C:/swapfile.sys',
        'C:/hiberfil.sys',
        'C:/DumpStack.log.tmp'
      ],
    }

    // Disable filesystem cache to prevent cache corruption and reduce build size
    // This prevents .next/cache from growing too large (Cloudflare Pages 25MB limit)
    config.cache = false

    // Only apply custom splitChunks in production builds to avoid vendor-chunks errors in dev
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for large libraries
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/](recharts)[\\/]/,
              priority: 20,
              enforce: true,
            },
            radix: {
              name: 'radix-ui',
              test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
              priority: 15,
              enforce: true,
            },
            // Shared chunk for common code
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    return config
  },

  // Experimental features to improve stability and performance
  experimental: {
    // Optimize package imports - include lucide-react to prevent vendor-chunks errors
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-select',
      '@radix-ui/react-dropdown-menu',
      'recharts',
      'framer-motion',
    ],
  },

  // Compression
  compress: true,

  // Power optimizations
  poweredByHeader: false,
};

const config = withNextIntl(nextConfig);
config.env = { ...config.env, _next_intl_trailing_slash: 'false' };
module.exports = config;
