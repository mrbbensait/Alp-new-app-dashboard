import { ComponentType } from 'react';
import PageGuard from '@/app/components/PageGuard';

/**
 * Sayfa oluşturmak için şablon fonksiyon
 * Bu fonksiyon, PageGuard'ı otomatik olarak sayfanıza ekler
 * @param Component Sayfa içeriğini gösteren bileşen
 * @param sayfaYolu Sayfanın yolu (örn. /formlar/kullanici-listesi)
 */
export function createPage<P extends object>(
  Component: ComponentType<P>,
  sayfaYolu: string
) {
  return function Page(props: P) {
    return (
      <PageGuard sayfaYolu={sayfaYolu}>
        <Component {...props} />
      </PageGuard>
    );
  };
} 