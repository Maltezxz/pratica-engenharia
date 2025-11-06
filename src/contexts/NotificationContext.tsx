import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastType } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface NotificationContextType {
  showToast: (type: ToastType, message: string) => void;
  showConfirm: (options: ConfirmOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions) => {
    setConfirmOptions(options);
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmOptions) {
      confirmOptions.onConfirm();
      setConfirmOptions(null);
    }
  }, [confirmOptions]);

  const handleCancel = useCallback(() => {
    if (confirmOptions) {
      confirmOptions.onCancel?.();
      setConfirmOptions(null);
    }
  }, [confirmOptions]);

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}

      <div className="fixed top-4 right-4 z-[90] flex flex-col gap-3">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={removeToast}
          />
        ))}
      </div>

      {confirmOptions && (
        <ConfirmModal
          title={confirmOptions.title}
          message={confirmOptions.message}
          confirmText={confirmOptions.confirmText}
          cancelText={confirmOptions.cancelText}
          type={confirmOptions.type}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
