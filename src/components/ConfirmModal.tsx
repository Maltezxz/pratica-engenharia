import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const icons = {
    danger: <XCircle className="w-8 h-8 text-red-400" />,
    warning: <AlertCircle className="w-8 h-8 text-yellow-400" />,
    info: <CheckCircle className="w-8 h-8 text-blue-400" />,
  };

  const confirmStyles = {
    danger: 'bg-gradient-to-r from-red-600 to-red-500 hover:shadow-red-500/50',
    warning: 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:shadow-yellow-500/50',
    info: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-blue-500/50',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="relative backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {icons[type]}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  {title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 p-6 pt-0">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all duration-200 font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold ${confirmStyles[type]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
