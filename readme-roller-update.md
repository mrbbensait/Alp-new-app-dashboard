# Rol Yönetimi İyileştirmeleri

Bu güncelleme, rol yönetimi sayfasında tespit edilen sorunları gidermek için yapılan değişiklikleri içerir. 

## Tespit Edilen Sorunlar

1. **Rol Düzenleme Fonksiyonu Eksikliği**
   - Mevcut rollerin bilgileri görüntülenebiliyor ancak düzenlenemiyordu
   - Sayfa erişim yetkilerini güncellemek için bir arayüz yoktu

2. **"Fonksiyon Yetkileri" Kavramı**
   - Bu kavram, kullanıcıların belirli işlevsel özelliklere (örn. rol oluşturma, kullanıcı silme, vb.) erişimini kontrol eden yetkilerdir
   - API ve kodda bu yapı vardı ancak kullanıcı arayüzünde açıkça belirtilmemişti

3. **Veritabanı Şema Sorunları**
   - Roller tablosunda description, permissions ve page_permissions alanları eksik olabilir
   - Bu, bazı yeni rollerin eklenmesinde hatalara yol açıyordu

## Yapılan İyileştirmeler

1. **Rol Düzenleme Arayüzü Eklendi**
   - Rol listesinde her rol için düzenleme butonu eklendi
   - Rol detayları düzenleme formu eklendi
   - Sayfa erişim yetkileri ve fonksiyon yetkileri için düzenleme arayüzü oluşturuldu

2. **Şema Kontrol Mekanizmaları Eklendi**
   - `/api/schema-check` - Roller tablosunun şemasını kontrol eden ve eksik alanları bildiren bir API
   - `/api/schema-update` - Roller tablosuna eksik alanları eklemeye çalışan bir API (RPC desteğine bağlıdır)

## Veritabanı Güncellemeleri

Roller tablosuna aşağıdaki alanların eklenmesi gerekmektedir:

```sql
-- Açıklama sütunu
ALTER TABLE public.roller ADD COLUMN IF NOT EXISTS description TEXT;

-- Fonksiyon yetkileri sütunu (JSON dizi olarak)
ALTER TABLE public.roller ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

-- Sayfa erişim yetkileri sütunu (JSON dizi olarak)
ALTER TABLE public.roller ADD COLUMN IF NOT EXISTS page_permissions JSONB DEFAULT '[]'::jsonb;
```

## Kullanım

1. Öncelikle şema kontrolü yapın:
   ```
   GET /api/schema-check
   ```
   Bu, veritabanınızın doğru şemaya sahip olup olmadığını kontrol edecek ve gerekirse yapmanız gereken değişiklikleri size bildirecektir.

2. Gerekli şema değişikliklerini yapın:
   - Supabase Studio üzerinden manuel olarak
   - Veya `/api/schema-update` API'sini çağırarak (RPC desteği olması durumunda)

3. Rol yönetimi sayfasını kullanın:
   - Artık mevcut rolleri düzenleyebilirsiniz
   - Sayfa erişim yetkilerini ve fonksiyon yetkilerini atayabilirsiniz

## Fonksiyon Yetkileri vs Sayfa Erişim Yetkileri

1. **Fonksiyon Yetkileri (permissions)**
   - Kullanıcının sistem içinde yapabileceği işlemleri belirler
   - Örnek: Kullanıcı oluşturma, silme, rol yönetimi gibi fonksiyonel erişimleri tanımlar
   - Kullanıcı belirli bir sayfaya erişebilse bile, bu yetkileri olmadan ilgili işlemleri yapamaz

2. **Sayfa Erişim Yetkileri (page_permissions)**
   - Kullanıcının görebileceği sayfaları belirler
   - Menüde hangi sayfaların görüneceğini ve hangi sayfalara doğrudan URL ile erişilebileceğini kontrol eder 