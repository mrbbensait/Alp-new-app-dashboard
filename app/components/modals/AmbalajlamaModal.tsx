import { useState, useEffect } from 'react';

interface AmbalajlamaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (miktar: number) => void;
  receteAdi: string;
  ambalajlananAdet: number | null;
  ambalajlama2: number | null;
}

const AmbalajlamaModal: React.FC<AmbalajlamaModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  receteAdi,
  ambalajlananAdet,
  ambalajlama2
}) => {
  const [miktar, setMiktar] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMiktar('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleMiktarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setMiktar(value);
      setErrorMessage(null);
    }
  };

  const handleConfirm = () => {
    const miktarNumber = parseInt(miktar, 10);
    
    if (isNaN(miktarNumber) || miktarNumber <= 0) {
      setErrorMessage('Lütfen geçerli bir miktar giriniz (0\'dan büyük olmalı)');
      return;
    }
    
    onConfirm(miktarNumber);
  };

  if (!isOpen) return null;

  // Gösterme modunu belirle
  let durum = 'ilk';
  if (ambalajlananAdet && ambalajlananAdet > 0) {
    durum = ambalajlama2 && ambalajlama2 > 0 ? 'ucuncu' : 'ikinci';
  }
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg max-w-md mx-auto p-6 shadow-xl w-full">
        <div className="text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Ambalajlama Adeti Gir</h3>
          
          <div className="mt-2 mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-indigo-700 block mb-2">{receteAdi}</span>
            </p>
            
            {durum !== 'ilk' && (
              <div className="bg-gray-50 p-3 rounded-md border mb-4">
                <h4 className="font-medium text-sm mb-2">Mevcut Durum:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-left">1. Ambalajlama:</div>
                  <div className="text-right font-medium">{ambalajlananAdet || 0} adet</div>
                  
                  {durum === 'ucuncu' && (
                    <>
                      <div className="text-left">2. Ambalajlama:</div>
                      <div className="text-right font-medium">{ambalajlama2 || 0} adet</div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="miktar" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                {durum === 'ilk' ? '1. Ambalajlama Adeti:' : 
                 durum === 'ikinci' ? '2. Ambalajlama Adeti:' : 
                 'Ek Ambalajlama Adeti:'}
              </label>
              <input
                type="number"
                id="miktar"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={miktar}
                onChange={handleMiktarChange}
                placeholder="Ambalajlanan adet sayısını giriniz"
                min="1"
              />
              {errorMessage && (
                <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
              )}
            </div>
          </div>
          
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              className="w-full sm:col-start-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleConfirm}
            >
              Kaydet
            </button>
            <button
              type="button"
              className="mt-3 sm:mt-0 sm:col-start-2 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onClose}
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbalajlamaModal; 