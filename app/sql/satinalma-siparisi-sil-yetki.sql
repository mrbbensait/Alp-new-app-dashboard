-- Roller tablosuna satinalma_siparisi_sil kolonu ekleme
DO $$
BEGIN
    -- Sütunun var olup olmadığını kontrol et
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'roller' 
        AND column_name = 'satinalma_siparisi_sil'
    ) THEN
        -- Sütunu ekle
        ALTER TABLE public.roller ADD COLUMN satinalma_siparisi_sil BOOLEAN NOT NULL DEFAULT false;
        
        -- Patron rolüne otomatik olarak yetki ver
        UPDATE public.roller 
        SET satinalma_siparisi_sil = true 
        WHERE rol_ad = 'Patron';
        
        RAISE NOTICE 'satinalma_siparisi_sil kolonu eklendi ve Patron rolüne yetki verildi.';
    ELSE
        RAISE NOTICE 'satinalma_siparisi_sil kolonu zaten mevcut.';
    END IF;
END $$; 