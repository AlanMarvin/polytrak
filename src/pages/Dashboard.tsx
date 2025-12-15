import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlist } from '@/hooks/useWatchlist';
import { mockTraders } from '@/lib/mock-data';
import { Star, Trash2, ExternalLink, Copy, Users, TrendingUp, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ title: "Copied!", description: "Address copied to clipboard" });
  };

  // Get trader data for watchlist items
  const watchlistWithData = watchlist.map(item => {
    const trader = mockTraders.find(t => t.address === item.trader_address);
    return { ...item, trader };
  });

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your watchlist and track your favorite traders
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Watching</p>
                  <p className="text-2xl font-bold">{watchlist.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profitable Traders</p>
                  <p className="text-2xl font-bold">
                    {watchlistWithData.filter(w => w.trader && w.trader.pnl > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Traders</p>
                  <p className="text-2xl font-bold">{mockTraders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Watchlist */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Your Watchlist
              </CardTitle>
              <Link to="/">
                <Button variant="outline" size="sm">
                  Find Traders
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {watchlist.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="mb-4">Your watchlist is empty</p>
                <Link to="/">
                  <Button>Browse Traders</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trader</TableHead>
                    <TableHead>PnL</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead className="hidden md:table-cell">Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {watchlistWithData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link 
                          to={`/trader/${item.trader_address}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {item.trader_name || formatAddress(item.trader_address)}
                        </Link>
                        {item.trader_name && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatAddress(item.trader_address)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.trader ? (
                          <span className={`font-mono font-semibold ${item.trader.pnl >= 0 ? 'stat-profit' : 'stat-loss'}`}>
                            {item.trader.pnl >= 0 ? '+' : '-'}${Math.abs(item.trader.pnl).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.trader ? (
                          <span className="font-mono">{item.trader.winRate.toFixed(1)}%</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => copyAddress(item.trader_address)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Link to={`/trader/${item.trader_address}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeFromWatchlist(item.trader_address)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
