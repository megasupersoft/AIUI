/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@aiui/nodes", "@aiui/canvas"],
  output: 'standalone',
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
