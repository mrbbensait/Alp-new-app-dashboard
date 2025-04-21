'use client';

import { createPage } from '@/app/lib/createPage';

function OrnekSayfaIcerigi() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Örnek Sayfa</h1>
      <p>Bu sayfa, createPage şablonu kullanılarak oluşturulmuştur.</p>
      <p>PageGuard bileşeni otomatik olarak entegre edilmiştir.</p>
    </div>
  );
}

// createPage kullanarak sayfa oluştur ve PageGuard'ı otomatik entegre et
export default createPage(OrnekSayfaIcerigi, '/ornek-sayfa'); 