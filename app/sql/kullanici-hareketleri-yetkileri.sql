-- Kullanıcı Hareketleri sayfasını ekle
INSERT INTO public.sayfalar (sayfa_adi, sayfa_yolu)
VALUES ('Kullanıcı Hareketleri', '/ayarlar/kullanici-hareketleri')
ON CONFLICT (sayfa_yolu) DO NOTHING;

-- Patron rolüne Kullanıcı Hareketleri sayfası için yetki ver
INSERT INTO public.rol_sayfa_yetkileri (rol_id, sayfa_id, erisim_var)
SELECT 
  r.id as rol_id, 
  s.id as sayfa_id, 
  true as erisim_var
FROM
  public.roller r
  CROSS JOIN public.sayfalar s
WHERE
  r.rol_ad = 'Patron' AND
  s.sayfa_yolu = '/ayarlar/kullanici-hareketleri'
ON CONFLICT (rol_id, sayfa_id) DO NOTHING;

-- Yönetici rolüne Kullanıcı Hareketleri sayfası için yetki ver
INSERT INTO public.rol_sayfa_yetkileri (rol_id, sayfa_id, erisim_var)
SELECT 
  r.id as rol_id, 
  s.id as sayfa_id, 
  true as erisim_var
FROM
  public.roller r
  CROSS JOIN public.sayfalar s
WHERE
  r.rol_ad = 'Yönetici' AND
  s.sayfa_yolu = '/ayarlar/kullanici-hareketleri'
ON CONFLICT (rol_id, sayfa_id) DO NOTHING; 