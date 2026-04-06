/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@aiui/nodes", "@aiui/canvas"],
  output: 'standalone',
  env: {
    NEXT_PUBLIC_BUILD_ID: new Date().toISOString().slice(0, 19).replace('T', ' '),
  },
  // Dev server — no caching
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }] }];
  },
  async rewrites() {
    // Only active in development — in production caddy handles routing
    if (process.env.NODE_ENV !== 'development') return [];
    const API = 'http://localhost:8000';
    const apiPaths = ['/execute', '/devices', '/models', '/upload', '/uploads', '/comfyui', '/health', '/workflows'];
    return apiPaths.map(p => ({
      source: `${p}/:path*`,
      destination: `${API}${p}/:path*`,
    }));
  },
};

module.exports = nextConfig;
