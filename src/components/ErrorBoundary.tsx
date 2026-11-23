import React from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { ID_TEXT } from '../i18n/id';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary menangkap kendala:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold text-[#0F172A] mb-2">
              {ID_TEXT.errorPage.judulError}
            </h1>
            <p className="text-base text-slate-600 mb-6 leading-relaxed">
              {ID_TEXT.errorPage.deskripsiError}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium text-base inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>{ID_TEXT.errorPage.tombolMuatUlang}</span>
              </button>
              <a
                href="/beranda"
                onClick={() => this.setState({ hasError: false })}
                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0F172A] font-medium text-base inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] whitespace-nowrap"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                <span>{ID_TEXT.app.kembaliKeBeranda}</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
