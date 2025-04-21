# Rol Yönetimi - Özel Eylem Yetkileri

Bu belge, sistemdeki özel eylem yetkilerini nasıl yöneteceğinizi açıklar.

## Özel Eylem Yetkileri Nedir?

Sistemde bazı özel eylemler için (sayfa erişiminin yanı sıra) yetkilendirme gerekir. Örneğin:

- Üretim Kuyruğu sayfasında Reçete Adı'na tıklayabilme yetkisi
- Belirli bir işlemi gerçekleştirebilme yetkisi
- Bazı özel verileri görüntüleyebilme yetkisi

## Nasıl Yeni Özel Eylem Yetkisi Eklerim?

1. Öncelikle `sayfalar` tablosuna bu eylem için bir kayıt eklemelisiniz:

```sql
INSERT INTO public.sayfalar (sayfa_adi, sayfa_yolu)
VALUES ('Üretim Kuyruğu - Reçete Görüntüleme', '/uretim-kuyrugu/recete-goruntulenebilir');
```

2. Ardından, Rol Yönetimi sayfasından, ilgili role bu sayfaya erişim yetkisi vermelisiniz.

## Mevcut Özel Eylem Yetkileri

| Eylem Adı | Yetki Yolu | Açıklama |
|-----------|------------|----------|
| Üretim Kuyruğu Reçete Tıklama | `/uretim-kuyrugu/recete-goruntulenebilir` | Üretim Kuyruğu sayfasında Reçete Adı'na tıklayarak detayları görüntüleme yetkisi |

## Yetkilendirme Kodu

Sistem, `AuthContext` içindeki `sayfaYetkileri` dizisini kullanarak bu yetkileri kontrol eder. Bir kullanıcının belirli bir eylemi gerçekleştirebilmesi için, o eylemin yetki yolunun (`sayfa_yolu`) kullanıcının `sayfaYetkileri` dizisinde bulunması gerekir.

Örnek kontrol kodu:

```javascript
// Bir eylemi gerçekleştirmeden önce yetki kontrolü
if (userPermissions.includes('/uretim-kuyrugu/recete-goruntulenebilir')) {
  // Eylemi gerçekleştir
} else {
  // Erişimi engelle
}
```

Patron rolü otomatik olarak tüm yetkilere sahiptir. 