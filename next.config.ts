import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack, isServer }) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        CESIUM_BASE_URL: JSON.stringify("/cesium/"),
      })
    );

    // Cesium viene caricato da /cesium/Cesium.js — non bundlarlo in chunk webpack
    if (!isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^cesium$/,
        })
      );
    }

    return config;
  },
};

export default nextConfig;
