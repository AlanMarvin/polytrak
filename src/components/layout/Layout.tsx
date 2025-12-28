import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
                analytics + copy-trading config for thetradefox
              </p>
            </div>

            {/* Navigation */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Navigation</h4>
              <nav className="flex flex-col space-y-2">
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
                <Link to="/analyze" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Analyze Trader
                </Link>
                <Link to="/scouter" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Scouter
                </Link>
                <Link to="/markets" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Markets
                </Link>
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
                <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  How It Works
                </Link>
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
                <Link to="/disclaimer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms and Disclaimer
                </Link>
                <a
                  href="https://thetradefox.com?ref=POLYTRAK"
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
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
                <a
                  href="https://twitter.com/alanmarv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  X (Twitter)
                </a>
              </nav>
            </div>
          </div>

          <div className="border-t border-border/50 mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>© 2025 Polytrak.io. Use with{' '}
              <a
                href="https://thetradefox.com?ref=POLYTRAK"
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
