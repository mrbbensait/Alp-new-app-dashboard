import React from 'react';

interface UretimUyariModalProps {
  isOpen: boolean;
  onClose: () => void;
  receteAdi: string;
}

const UretimUyariModal: React.FC<UretimUyariModalProps> = ({
  isOpen,
  onClose,
  receteAdi
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg max-w-md mx-auto p-6 shadow-xl w-full border-l-4 border-red-500">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <svg className="h-12 w-12 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-xl leading-6 font-medium text-red-600 mb-4">UYARI!</h3>
          
          <div className="mt-2 mb-6 text-center">
            <p className="text-base text-gray-700 mb-2">
              <span className="font-bold text-gray-900 block mb-3">{receteAdi}</span>
              <span className="block text-lg font-medium mb-2">Henüz üretimi yapılmamış ürünün ambalajlaması yapılamaz!</span>
              <span className="block text-sm text-gray-600 mt-2">Önce "Üretim Yapıldı mı?" kutucuğunu işaretleyip üretim işlemini tamamlamanız gerekmektedir.</span>
            </p>
          </div>
          
          <div className="mt-5">
            <button
              type="button"
              className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={onClose}
            >
              Anladım
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UretimUyariModal; 