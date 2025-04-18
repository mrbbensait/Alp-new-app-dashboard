-- Sayfaları tutan tablo
CREATE TABLE public.sayfalar (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  sayfa_adi TEXT NOT NULL,
  sayfa_yolu TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT sayfalar_pkey PRIMARY KEY (id),
  CONSTRAINT sayfalar_sayfa_yolu_key UNIQUE (sayfa_yolu)
);

-- Rol-sayfa yetkilerini tutan tablo
CREATE TABLE public.rol_sayfa_yetkileri (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  rol_id UUID NOT NULL REFERENCES public.roller(id) ON DELETE CASCADE,
  sayfa_id UUID NOT NULL REFERENCES public.sayfalar(id) ON DELETE CASCADE,
  erisim_var BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT rol_sayfa_yetkileri_pkey PRIMARY KEY (id),
  CONSTRAINT rol_sayfa_yetkileri_rol_sayfa_unique UNIQUE (rol_id, sayfa_id)
);

-- Rol-sayfa yetkilerini güncellemek için trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_rol_sayfa_yetkileri_updated_at
BEFORE UPDATE ON public.rol_sayfa_yetkileri
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

-- RLS Politikaları
ALTER TABLE public.sayfalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rol_sayfa_yetkileri ENABLE ROW LEVEL SECURITY;

-- Sayfalar tablosu için politikalar
CREATE POLICY "Herkes okuyabilir" ON public.sayfalar
  FOR SELECT USING (true);

CREATE POLICY "Herkes ekleyebilir" ON public.sayfalar
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Herkes güncelleyebilir" ON public.sayfalar
  FOR UPDATE USING (true);

CREATE POLICY "Herkes silebilir" ON public.sayfalar
  FOR DELETE USING (true);

-- Rol-sayfa yetkileri tablosu için politikalar
CREATE POLICY "Herkes okuyabilir" ON public.rol_sayfa_yetkileri
  FOR SELECT USING (true);

CREATE POLICY "Herkes ekleyebilir" ON public.rol_sayfa_yetkileri
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Herkes güncelleyebilir" ON public.rol_sayfa_yetkileri
  FOR UPDATE USING (true);

CREATE POLICY "Herkes silebilir" ON public.rol_sayfa_yetkileri
  FOR DELETE USING (true);

-- Patron rolünü bul ve tüm sayfalara erişim izni ver
INSERT INTO public.rol_sayfa_yetkileri (rol_id, sayfa_id, erisim_var)
SELECT 
  r.id as rol_id, 
  s.id as sayfa_id, 
  true as erisim_var
FROM
  public.roller r
  CROSS JOIN public.sayfalar s
WHERE
  r.rol_ad = 'Patron'; 