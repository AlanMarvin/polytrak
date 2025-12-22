import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import tradefoxLogo from '@/assets/tradefox-logo.png';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src={tradefoxLogo} 
            alt="TradeFox" 
            className="h-8 w-auto dark:brightness-100 brightness-0"
          />
          <span className="hidden font-display text-xl font-bold sm:inline-block">
            Polytrak.io
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/analyze" className="hidden sm:block">
            <Button variant="ghost" size="sm">Analyze</Button>
          </Link>
          <Link to="/markets" className="hidden sm:block">
            <Button variant="ghost" size="sm">Markets</Button>
          </Link>
          <Link to="/blog" className="hidden sm:block">
            <Button variant="ghost" size="sm">Blog</Button>
          </Link>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
