import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Terjadi kesalahan pada aplikasi.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white text-zinc-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full border border-zinc-200 p-8 text-center">
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">RC STORE</p>
            <h1 className="font-display text-2xl font-semibold mb-3">
              Terjadi Gangguan Sementara
            </h1>
            <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
              Sistem mengalami kendala saat memuat data. Silakan muat ulang halaman untuk melanjutkan.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-zinc-950 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
