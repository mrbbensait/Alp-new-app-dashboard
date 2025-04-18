import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // İlk olarak tablonun varlığını kontrol edelim
    const { data: tableInfo, error: tableError } = await supabase
      .from('roller')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Tablo erişim hatası:', tableError);
      return NextResponse.json(
        { 
          success: false, 
          error: tableError.message,
          message: "Roller tablosuna erişim sağlanamadı. Tablonun varlığını kontrol edin."
        },
        { status: 500 }
      );
    }

    // Mevcut kolon yapısını kontrol edelim
    const sampleRow = tableInfo?.[0] || {};
    const missingColumns = [];
    
    if (!('description' in sampleRow)) {
      missingColumns.push('description');
    }
    
    if (!('permissions' in sampleRow)) {
      missingColumns.push('permissions');
    }
    
    if (!('page_permissions' in sampleRow)) {
      missingColumns.push('page_permissions');
    }
    
    if (missingColumns.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tüm gerekli sütunlar zaten mevcut.',
        schema: {
          tableName: 'roller',
          columns: Object.keys(sampleRow)
        }
      });
    }
    
    // Eksik alanları raporla
    return NextResponse.json({
      success: false,
      message: `Roller tablosunda eksik alanlar bulundu: ${missingColumns.join(', ')}`,
      missingColumns,
      currentColumns: Object.keys(sampleRow),
      instructions: [
        "Supabase Studio'yu açın",
        "Table Editor -> roller tablosunu seçin",
        "Schema bölümüne gelin",
        "Her eksik sütun için '+' düğmesine tıklayın ve aşağıdaki kolonları ekleyin:",
        ...missingColumns.map(col => {
          if (col === 'description') {
            return "- description: text, nullable (NOT NULL işaretlemeyin)";
          } else if (col === 'permissions' || col === 'page_permissions') {
            return `- ${col}: jsonb, default değeri '[]'`;
          }
          return `- ${col}`;
        })
      ]
    });
    
  } catch (error: any) {
    console.error('Şema kontrol hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Şema kontrol edilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 