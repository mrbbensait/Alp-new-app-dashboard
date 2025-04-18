export interface TableColumn {
  table_name: string;
  column_name: string;
  data_type: string;
}

export interface TableSchema {
  name: string;
  columns: {
    name: string;
    type: string;
  }[];
}

export const rawTableData: TableColumn[] = [
  {
    "table_name": "Bitmiş Ürün Stoğu",
    "column_name": "Reçete Adı",
    "data_type": "text"
  },
  {
    "table_name": "Bitmiş Ürün Stoğu",
    "column_name": "Reçete ID",
    "data_type": "text"
  },
  {
    "table_name": "Bitmiş Ürün Stoğu",
    "column_name": "Müşteri",
    "data_type": "text"
  },
  {
    "table_name": "Bitmiş Ürün Stoğu",
    "column_name": "Ambalaj (ml)",
    "data_type": "numeric"
  },
  {
    "table_name": "Bitmiş Ürün Stoğu",
    "column_name": "Paketlendiği Tarih",
    "data_type": "date"
  },
  {
    "table_name": "Bitmiş Ürün Stoğu",
    "column_name": "STOK / ADET",
    "data_type": "numeric"
  },
  {
    "table_name": "Bitmiş Ürün Stoğu",
    "column_name": "Teslim Edilen",
    "data_type": "numeric"
  },
  {
    "table_name": "Bitmiş Ürün Stoğu",
    "column_name": "Teslimat Tarihi",
    "data_type": "date"
  },
  {
    "table_name": "Bitmiş Ürün Stoğu",
    "column_name": "id",
    "data_type": "bigint"
  },
  {
    "table_name": "Bitmiş Ürün Stoğu",
    "column_name": "Üretim Kuyruğu Referans",
    "data_type": "bigint"
  },
  {
    "table_name": "Bitmiş Ürün Stoğu",
    "column_name": "Kalan Adet",
    "data_type": "numeric"
  },
  {
    "table_name": "Formülasyonlar",
    "column_name": "ID",
    "data_type": "bigint"
  },
  {
    "table_name": "Formülasyonlar",
    "column_name": "Reçete Adı",
    "data_type": "text"
  },
  {
    "table_name": "Formülasyonlar",
    "column_name": "Reçete ID",
    "data_type": "text"
  },
  {
    "table_name": "Formülasyonlar",
    "column_name": "Marka",
    "data_type": "text"
  },
  {
    "table_name": "Formülasyonlar",
    "column_name": "Hammadde Adı",
    "data_type": "text"
  },
  {
    "table_name": "Formülasyonlar",
    "column_name": "Oran(100Kg)",
    "data_type": "numeric"
  },
  {
    "table_name": "Formülasyonlar",
    "column_name": "Birim",
    "data_type": "text"
  },
  {
    "table_name": "Formülasyonlar",
    "column_name": "Notlar",
    "data_type": "text"
  },
  {
    "table_name": "Formülasyonlar",
    "column_name": "Stok Kategori",
    "data_type": "text"
  },
  {
    "table_name": "Müşteriler",
    "column_name": "Müşteri Firma",
    "data_type": "text"
  },
  {
    "table_name": "Müşteriler",
    "column_name": "Yetkili İsim",
    "data_type": "text"
  },
  {
    "table_name": "Müşteriler",
    "column_name": "Marka",
    "data_type": "text"
  },
  {
    "table_name": "Müşteriler",
    "column_name": "Email",
    "data_type": "text"
  },
  {
    "table_name": "Müşteriler",
    "column_name": "Telefon",
    "data_type": "numeric"
  },
  {
    "table_name": "Müşteriler",
    "column_name": "Şehir",
    "data_type": "text"
  },
  {
    "table_name": "Müşteriler",
    "column_name": "Adres",
    "data_type": "text"
  },
  {
    "table_name": "Müşteriler",
    "column_name": "Notlar",
    "data_type": "text"
  },
  {
    "table_name": "Müşteriler",
    "column_name": "Müşteri ID",
    "data_type": "text"
  },
  {
    "table_name": "Müşteriler",
    "column_name": "id",
    "data_type": "bigint"
  },
  {
    "table_name": "Reçeteler",
    "column_name": "Reçete Adı",
    "data_type": "text"
  },
  {
    "table_name": "Reçeteler",
    "column_name": "Marka",
    "data_type": "text"
  },
  {
    "table_name": "Reçeteler",
    "column_name": "Reçete ID",
    "data_type": "text"
  },
  {
    "table_name": "Reçeteler",
    "column_name": "Notlar",
    "data_type": "text"
  },
  {
    "table_name": "Reçeteler",
    "column_name": "id",
    "data_type": "bigint"
  },
  {
    "table_name": "SatınAlma siparişleri",
    "column_name": "id",
    "data_type": "bigint"
  },
  {
    "table_name": "SatınAlma siparişleri",
    "column_name": "Tedarikçi",
    "data_type": "text"
  },
  {
    "table_name": "SatınAlma siparişleri",
    "column_name": "Sipariş Miktarı",
    "data_type": "numeric"
  },
  {
    "table_name": "SatınAlma siparişleri",
    "column_name": "Birim",
    "data_type": "text"
  },
  {
    "table_name": "SatınAlma siparişleri",
    "column_name": "TeslimDurumu",
    "data_type": "boolean"
  },
  {
    "table_name": "SatınAlma siparişleri",
    "column_name": "Notlar",
    "data_type": "text"
  },
  {
    "table_name": "SatınAlma siparişleri",
    "column_name": "Hammadde ID",
    "data_type": "text"
  },
  {
    "table_name": "SatınAlma siparişleri",
    "column_name": "Alınan Ürün",
    "data_type": "text"
  },
  {
    "table_name": "SatınAlma siparişleri",
    "column_name": "Tedarikçi ID",
    "data_type": "text"
  },
  {
    "table_name": "Stok",
    "column_name": "Hammadde Adı",
    "data_type": "text"
  },
  {
    "table_name": "Stok",
    "column_name": "Mevcut Stok",
    "data_type": "numeric"
  },
  {
    "table_name": "Stok",
    "column_name": "Rezerve Edildi",
    "data_type": "numeric"
  },
  {
    "table_name": "Stok",
    "column_name": "Net Stok",
    "data_type": "numeric"
  },
  {
    "table_name": "Stok",
    "column_name": "Birim",
    "data_type": "text"
  },
  {
    "table_name": "Stok",
    "column_name": "Stok Kategori",
    "data_type": "text"
  },
  {
    "table_name": "Stok",
    "column_name": "Kritik Stok",
    "data_type": "numeric"
  },
  {
    "table_name": "Stok",
    "column_name": "Hammadde ID",
    "data_type": "text"
  },
  {
    "table_name": "Stok",
    "column_name": "Notlar",
    "data_type": "text"
  },
  {
    "table_name": "Stok",
    "column_name": "CreatedTime",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "Stok",
    "column_name": "ID",
    "data_type": "bigint"
  },
  {
    "table_name": "suppliers",
    "column_name": "Tedarikçi Adı",
    "data_type": "text"
  },
  {
    "table_name": "suppliers",
    "column_name": "Tedarikçi ID",
    "data_type": "text"
  },
  {
    "table_name": "suppliers",
    "column_name": "Şehir",
    "data_type": "text"
  },
  {
    "table_name": "suppliers",
    "column_name": "Email",
    "data_type": "text"
  },
  {
    "table_name": "suppliers",
    "column_name": "Adres",
    "data_type": "text"
  },
  {
    "table_name": "suppliers",
    "column_name": "Telefon",
    "data_type": "text"
  },
  {
    "table_name": "suppliers",
    "column_name": "Tedarikçi Kategorisi",
    "data_type": "text"
  },
  {
    "table_name": "suppliers",
    "column_name": "Notlar",
    "data_type": "text"
  },
  {
    "table_name": "suppliers",
    "column_name": "createdTime",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Reçete Adı",
    "data_type": "text"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Reçete ID",
    "data_type": "text"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Üretim Emir Tarihi",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Müşteri",
    "data_type": "text"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Bulk Üretim Emri(Kg)",
    "data_type": "numeric"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Üretim Yapıldı mı?",
    "data_type": "boolean"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Üretim Durumu",
    "data_type": "text"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Ambalajlanan Adet",
    "data_type": "numeric"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Kalan Bulk (Kg)",
    "data_type": "numeric"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "id",
    "data_type": "bigint"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Marka",
    "data_type": "text"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Beklenen Adet",
    "data_type": "numeric"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Gerçekleşen Adet",
    "data_type": "numeric"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Fire Adet",
    "data_type": "numeric"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Fire%",
    "data_type": "text"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Üretildiği Tarih",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Son Güncelleme Tarihi",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Ambalaj Emri (ml)",
    "data_type": "numeric"
  },
  {
    "table_name": "Üretim Kuyruğu",
    "column_name": "Ambalajlama 2",
    "data_type": "numeric"
  }
];

// Tablo adlarını çıkaralım
export const tableNames = Array.from(new Set(rawTableData.map(item => item.table_name)));

// Tablolar ve sütunlarını organize edelim
export const tables: TableSchema[] = tableNames.map(tableName => {
  const tableColumns = rawTableData.filter(item => item.table_name === tableName);
  return {
    name: tableName,
    columns: tableColumns.map(column => ({
      name: column.column_name,
      type: column.data_type
    }))
  };
}); 