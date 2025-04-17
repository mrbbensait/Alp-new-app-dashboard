import React from 'react';

interface TeslimBilgisiModalProps {
  isOpen: boolean;
  teslimBilgisi: {
    urunAdi: string;
    personelAdi: string;
    teslimTarihi: string;
  } | null;
  onClose: () => void;
}

const TeslimBilgisiModal: React.FC<TeslimBilgisiModalProps> = ({ isOpen, teslimBilgisi, onClose }) => {
  if (!isOpen || !teslimBilgisi) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg max-w-md mx-auto p-6 shadow-xl">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Teslim Bilgileri</h3>
        
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-semibold">Ürün:</span> {teslimBilgisi.urunAdi}
        </p>
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-semibold">Teslim Alan:</span> {teslimBilgisi.personelAdi}
        </p>
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-semibold">Teslim Tarihi:</span> {teslimBilgisi.teslimTarihi}
        </p>
        
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
            onClick={onClose}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeslimBilgisiModal; 