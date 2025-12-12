import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  // Configuración de alias para rutas absolutas
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Configuración específica para cliente si es necesario
    }
    return config;
  },
  // Configuración explícita de turbopack para silenciar el error
  // y mantener compatibilidad con configuraciones existentes
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
