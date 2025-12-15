import { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border/50 py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>PolyTracker - Polymarket Analytics for Copy Trading</p>
          <p className="mt-1">
            Use with{' '}
            <a 
              href="https://thetradefox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              TheTradeFox.com
            </a>
            {' '}for automated copy trading
          </p>
        </div>
      </footer>
    </div>
  );
}
