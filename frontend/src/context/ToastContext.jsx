import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({
    type = 'success',
    title = '',
    message = '',
    duration = 4000
  }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, type, title, message };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Floating Animated Popup Container */}
      <div 
        aria-live="polite"
        className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success' || toast.type === 'celebrate';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto transform transition-all duration-300 ease-out translate-y-0 opacity-100 rounded-2xl p-4 shadow-xl border backdrop-blur-md flex items-start gap-3.5 ${
                isSuccess
                  ? 'bg-white/95 border-emerald-300 text-emerald-950 shadow-emerald-900/10'
                  : isError
                  ? 'bg-white/95 border-red-300 text-red-950 shadow-red-900/10'
                  : 'bg-white/95 border-primary/30 text-text shadow-primary/10'
              }`}
            >
              {/* 3D / Highlighted Icon Badge */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isSuccess
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/30'
                    : isError
                    ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-500/30'
                    : 'bg-gradient-to-tr from-primary to-emerald-600 text-white shadow-primary/30'
                }`}
              >
                {toast.type === 'celebrate' ? (
                  <Sparkles className="w-5 h-5 animate-pulse" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isError ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                {toast.title && (
                  <h4 className="font-bold text-sm leading-tight text-text tracking-tight">
                    {toast.title}
                  </h4>
                )}
                {toast.message && (
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {toast.message}
                  </p>
                )}
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-muted hover:text-text p-1 rounded-lg hover:bg-secondary transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
