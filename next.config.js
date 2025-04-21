/** @type {import('next').NextConfig} */
const { execSync } = require('child_process');

const nextConfig = {
  // ... mevcut yapılandırmalar ...
  
  webpack: (config, { isServer, dev }) => {
    // Sadece sunucu tarafında ve production build'de çalıştır
    if (isServer && !dev) {
      console.log('Sayfalar taranıyor ve veritabanı güncelleniyor...');
      try {
        execSync('node scripts/update-pages.js');
      } catch (error) {
        console.error('Sayfa güncelleme işlemi sırasında hata:', error);
      }
    }
    
    return config;
  },
}

module.exports = nextConfig 