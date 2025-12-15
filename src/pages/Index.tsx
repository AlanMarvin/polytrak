import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { LeaderboardTable } from '@/components/traders/LeaderboardTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeFilter } from '@/types/polymarket';
import { mockTraders } from '@/lib/mock-data';
import { Search, TrendingUp, Users, BarChart3, ArrowRight, Zap } from 'lucide-react';

const Index = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTraders = mockTraders.filter(trader => 
    trader.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trader.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Top Traders', value: '500+', icon: Users },
    { label: 'Total Volume', value: '$142M', icon: BarChart3 },
    { label: 'Avg Win Rate', value: '62%', icon: TrendingUp },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container relative py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
              <Zap className="h-4 w-4" />
              <span>Discover profitable Polymarket traders</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Track the <span className="text-primary">smartest</span> traders on Polymarket
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Analyze top traders, track their positions, and find alpha for your copy trading strategy on PolyHub, Stand, or TradeFox.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by wallet address or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-border/50"
                />
              </div>
              <Link to="/markets">
                <Button size="lg" className="h-12 px-6">
                  Explore Markets <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto mt-12 md:mt-16">
            {stats.map((stat) => (
              <div 
                key={stat.label} 
                className="text-center p-4 rounded-lg bg-card/50 border border-border/50"
              >
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="container py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">Top Traders</h2>
            <p className="text-muted-foreground">Ranked by profit and loss performance</p>
          </div>
          
          <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <LeaderboardTable traders={filteredTraders.slice(0, 20)} timeFilter={timeFilter} />

        <div className="mt-6 text-center">
          <Link to="/markets">
            <Button variant="outline" size="lg">
              View All Traders <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border border-primary/20 p-8 md:p-12">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative text-center space-y-4 max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold">
              Ready to copy the best traders?
            </h3>
            <p className="text-muted-foreground">
              Use PolyHub, Stand, or TradeFox to automatically mirror top Polymarket traders' positions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <a 
                href="https://polyhub.bot" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" className="min-w-[180px]">
                  Start Copy Trading
                </Button>
              </a>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="min-w-[180px]">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
