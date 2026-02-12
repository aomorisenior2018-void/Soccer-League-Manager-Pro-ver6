
import React, { useState } from 'react';

interface ActionButtonsProps {
  onClearScores: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onClearScores 
}) => {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
        <i className="fa-solid fa-sliders text-indigo-500"></i> 操作パネル
      </h3>
      
      <div className="pt-2">
        {!isConfirmingClear ? (
          <button 
            type="button"
            onClick={() => setIsConfirmingClear(true)}
            className="w-full py-4 px-4 text-rose-600 bg-rose-50/30 hover:bg-rose-50 border border-rose-100 rounded-xl font-bold flex items-center justify-between transition-all active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-trash-can"></i> 全スコアをクリア
            </span>
            <i className="fa-solid fa-triangle-exclamation text-rose-300"></i>
          </button>
        ) : (
          <div className="flex flex-col gap-3 p-1">
            <p className="text-sm text-rose-600 font-bold text-center mb-1">
              現在のカテゴリの<br/>全スコアを消去しますか？
            </p>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => {
                  onClearScores();
                  setIsConfirmingClear(false);
                }}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-check"></i> はい
              </button>
              <button 
                type="button"
                onClick={() => setIsConfirmingClear(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-xmark"></i> いいえ
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-400 leading-tight">
        ※スコアをクリアすると元に戻せません。保存済みのクラウドデータがある場合は「読込」で復旧可能です。
      </p>
    </div>
  );
};

export default ActionButtons;
