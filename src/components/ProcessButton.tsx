import { useTranslation } from 'react-i18next';

interface ProcessButtonProps {
  disabled: boolean;
  isProcessing: boolean;
  progress: number;
  onClick: () => void;
}

export function ProcessButton({ disabled, isProcessing, progress, onClick }: ProcessButtonProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={disabled || isProcessing}
        className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors ${
          disabled || isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
        }`}
      >
        {isProcessing ? t('button.processing') : t('button.generate')}
      </button>

      {isProcessing && (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right mt-1">
            {Math.round(progress * 100)}%
          </p>
        </div>
      )}
    </div>
  );
}
