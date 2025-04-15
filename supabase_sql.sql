-- Teslimat Geçmişi tablosunu oluştur
CREATE TABLE public."TeslimatGecmisi" (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    urun_id BIGINT NOT NULL REFERENCES public."Bitmiş Ürün Stoğu"(id) ON DELETE CASCADE,
    teslimat_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    teslimat_miktari NUMERIC NOT NULL,
    kullanici TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) aktifleştirme
ALTER TABLE public."TeslimatGecmisi" ENABLE ROW LEVEL SECURITY;

-- Tüm kullanıcılar için okuma izni olan politika
CREATE POLICY "Herkes teslimat geçmişini görebilir" ON public."TeslimatGecmisi" FOR SELECT USING (true);

-- Sadece kimliği doğrulanmış kullanıcılar için yazma/silme izni
CREATE POLICY "Kimliği doğrulanmış kullanıcılar teslimat geçmişi ekleyebilir" ON public."TeslimatGecmisi" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
