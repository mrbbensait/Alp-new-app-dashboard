-- Teslimat Geçmişi sayfasını ekle
INSERT INTO public.sayfalar (sayfa_adi, sayfa_yolu)
VALUES ('Teslimat Geçmişi', '/teslimat-gecmisi')
ON CONFLICT (sayfa_yolu) DO NOTHING;

-- Patron rolüne Teslimat Geçmişi sayfası için yetki ver
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
  s.sayfa_yolu = '/teslimat-gecmisi'
ON CONFLICT (rol_id, sayfa_id) DO NOTHING;

-- Yönetici rolüne Teslimat Geçmişi sayfası için yetki ver
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
  s.sayfa_yolu = '/teslimat-gecmisi'
ON CONFLICT (rol_id, sayfa_id) DO NOTHING; 