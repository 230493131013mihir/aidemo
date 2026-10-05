import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="card-harvest max-w-md w-full p-8 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-extrabold text-primary">404</span>
          <h1 className="text-xl sm:text-2xl font-bold text-text">
            {t('notFound.title')}
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            {t('notFound.subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="btn-primary w-full sm:w-auto text-xs py-2.5 px-4"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>{t('common.backToHome')}</span>
          </Link>

          <Link
            to="/dashboard"
            className="btn-secondary w-full sm:w-auto text-xs py-2.5 px-4"
          >
            <LayoutDashboard className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>{t('common.backToDashboard')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
