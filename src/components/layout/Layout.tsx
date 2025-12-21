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
      <footer className="border-t border-border/50 py-8">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Polytrak.io</h3>
              <p className="text-sm text-muted-foreground">
                Analyze any Polymarket wallet, get AI-optimized copy trading configuration, and start mirroring profitable traders on TheTradeFox
              </p>
            </div>

            {/* Navigation */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Navigation</h4>
              <nav className="flex flex-col space-y-2">
                <a href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Home
                </a>
                <a href="/analyze" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Analyze Trader
                </a>
                <a href="/markets" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Markets
                </a>
                <a href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </a>
              </nav>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Resources</h4>
              <nav className="flex flex-col space-y-2">
                <a
                  href="https://github.com/AlanMarvin/polytrak"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  GitHub
                </a>
                <a href="/disclaimer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms and Disclaimer
                </a>
                <a
                  href="https://thetradefox.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  TheTradeFox
                </a>
              </nav>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Contact</h4>
              <nav className="flex flex-col space-y-2">
                <a href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </a>
              </nav>
            </div>
          </div>

          <div className="border-t border-border/50 mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>© 2025 Polytrak.io. Use with{' '}
              <a
                href="https://thetradefox.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                TheTradeFox.com
              </a>
              {' '}for automated copy trading.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
