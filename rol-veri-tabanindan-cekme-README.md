# Rol Veritabanı Entegrasyonu

Bu çalışma, kullanıcı ekleme/düzenleme formlarındaki rol seçimi özelliğini statik veriler yerine veritabanından dinamik olarak çekmek için yapılan değişiklikleri içerir.

## Yapılan Değişiklikler

1. **Roller API Endpoint'i Oluşturuldu (`app/api/roller/route.ts`)**
   - Veritabanındaki roller tablosundan rolleri çekmek için API endpoint'i
   - Roller, rol_ad'a göre alfabetik olarak sıralanıyor
   - İsteğe bağlı olarak id parametresi ile belirli bir rol getirilebilir

2. **Personel Modeli Güncellendi (`app/lib/types/index.ts`)**
   - `rol` alanı string enum tipi yerine `rol_id` olarak UUID string tipine dönüştürüldü
   - Veritabanındaki foreign key ilişkisine uygun hale getirildi

3. **Kullanıcı Ekleme Sayfası Güncellendi (`app/formlar/kullanici-kaydi/page.tsx`)**
   - Sayfa yüklendiğinde roller API'den çekiliyor
   - Rol dropdown'ı veritabanındaki rolleri gösteriyor
   - Form verisi rol_id kullanacak şekilde güncellendi

4. **Kullanıcı Listesi Sayfası Güncellendi (`app/formlar/kullanici-listesi/page.tsx`)**
   - Roller API'den çekiliyor
   - Düzenleme modalındaki rol dropdown'ı veritabanındaki rolleri kullanıyor
   - Kullanıcıların rolleri rol_id kullanılarak formatlanıyor

5. **Personel API Güncellendi (`app/api/personel/route.ts`)**
   - Personel ekleme/güncelleme işlemleri rol_id kullanacak şekilde güncellendi

6. **Rol Seed Script'i Oluşturuldu (`app/api/seed-roller/route.ts`)**
   - Veritabanına başlangıç rol verilerini eklemek için bir script
   - Sadece roller tablosu boşsa veri ekliyor

## Yeni API Endpointleri

- **GET /api/roller** - Tüm rolleri getir
- **GET /api/roller?id=<rol_id>** - Belirli bir rolü getir
- **GET /api/seed-roller** - Başlangıç rol verilerini ekle (eğer tablo boşsa)

## Kullanım

1. Öncelikle seed script'i çalıştırarak roller tablosuna varsayılan rolleri ekleyin:
   ```
   GET /api/seed-roller
   ```

2. Artık kullanıcı ekleme ve düzenleme formlarındaki rol dropdown'ları veritabanından dinamik olarak çekilen rolleri gösterecektir.

## Veritabanı Tabloları

**roller:**
```sql
create table public.roller (
  id uuid not null default gen_random_uuid(),
  rol_ad text not null,
  created_at timestamp with time zone not null default now(),
  constraint roller_pkey primary key (id),
  constraint roller_rol_ad_key unique (rol_ad)
)
```

**personel:**
```sql
create table public.personel (
  id uuid not null default gen_random_uuid(),
  ad_soyad text not null,
  kullanici_adi text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  sifre text null,
  rol_id uuid not null,
  constraint personel_pkey primary key (id),
  constraint personel_roller_fkey foreign key (rol_id) references roller (id) on update cascade on delete restrict
)
``` 