/** @type {import('next').NextConfig} */
const { execSync } = require('child_process');

const nextConfig = {
  // ... mevcut yapılandırmalar ...
  
  webpack: (config, { isServer, dev }) => {
    // Sayfa tarama ve veritabanı güncelleme kodu kaldırıldı
    // Bu işlem Vercel'de environment variable sorunları oluşturuyordu
    
    return config;
  },
}

module.exports = nextConfig 