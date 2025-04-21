/**
 * Mevcut sayfanın yenileme (F5 veya tarayıcıdaki yenile düğmesi ile) 
 * durumunda olup olmadığını kontrol eder.
 * @returns {boolean} Sayfa yenileme durumunda ise true, değilse false döner
 */
export function isPageRefresh(): boolean {
  if (typeof window === 'undefined') {
    return false; // Server-side rendering durumunda
  }
  
  try {
    // F5 ile yenileme kontrolü
    if (window.performance && window.performance.navigation) {
      return window.performance.navigation.type === 1;
    }
    
    // Modern tarayıcılar için Navigation API kullanımı
    if (window.performance && window.performance.getEntriesByType) {
      const navigationEntries = window.performance.getEntriesByType('navigation');
      if (navigationEntries && navigationEntries.length > 0) {
        // @ts-ignore - PerformanceNavigationTiming tipini kontrol et
        return navigationEntries[0].type === 'reload';
      }
    }
    
    // History API tabanlı kontrol (sayfa geçmişi)
    // Yenileme durumunda document.referrer URL'si ile mevcut URL aynı olur
    if (document.referrer) {
      const currentUrl = window.location.href.split('#')[0]; // Fragment'i kaldır
      const referrerUrl = document.referrer.split('#')[0]; // Fragment'i kaldır
      return currentUrl === referrerUrl;
    }
    
    return false;
  } catch (error) {
    console.error('Sayfa yenileme kontrolü sırasında hata:', error);
    return false;
  }
} 