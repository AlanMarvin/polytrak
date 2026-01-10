import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    ArrowRight, Calendar, Clock, Activity, Zap,
    Target, Bot, Shield, CheckCircle, Smartphone
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { StructuredData } from '@/components/seo/StructuredData';
import tradefoxLogo from '@/assets/tradefox-logo.png';
import polycopLogo from '@/assets/polycop-logo.png';
import polygunLogo from '@/assets/polygun-logo.png';

const BlogIntegrations = () => {
    return (
        <Layout>
            <SEOHead
                title="PolyCop & PolyGun Support Added - Complete Copy Trading Analysis for Polymarket | PolyTrak"
                description="PolyTrak now supports AI-optimized copy trading settings for PolyCop and PolyGun, alongside TradeFox. Unified fee analysis and net return estimates for all major bots."
                canonicalUrl="/blog/integrations"
                ogType="article"
                article={{
                    publishedTime: '2026-01-09',
                    modifiedTime: '2026-01-09',
                    author: 'PolyTrak',
                }}
            />
            <StructuredData
                schema={{
                    type: 'Article',
                    headline: 'PolyTrak Now Supports PolyCop and PolyGun Copy Trading Analysis',
                    description: 'We have updated PolyTrak to provide specialized AI analysis and configuration for all three major Polymarket copy trading bots.',
                    author: 'PolyTrak',
                    publisher: 'PolyTrak',
                    datePublished: '2026-01-09',
                    dateModified: '2026-01-09',
                    url: 'https://polytrak.io/blog/integrations',
                }}
            />

            <article className="container py-12 max-w-4xl">
                {/* Article Header */}
                <header className="mb-12">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Company News</Badge>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <time dateTime="2026-01-09">January 9, 2026</time>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>4 min read</span>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                        Now Supporting PolyCop & PolyGun: Unified Analysis for All Major Bots
                    </h1>

                    <p className="text-xl text-muted-foreground leading-relaxed">
                        We've expanded our AI analysis engine. You can now generate optimized risk settings and see net return estimates for TradeFox, PolyCop, and PolyGun—all in one place.
                    </p>
                </header>

                {/* Feature Image Area - Abstract "Integration" Visual */}
                <div className="relative mb-12 rounded-xl overflow-hidden border border-border/50">
                    <div className="aspect-video bg-gradient-to-br from-slate-900 via-primary/5 to-slate-900 flex items-center justify-center p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-2xl items-center">
                            {/* TradeFox */}
                            <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-background/50 border border-primary/20 backdrop-blur-sm">
                                <img src={tradefoxLogo} alt="TradeFox" className="h-8 w-auto object-contain" />
                                <Badge variant="outline" className="border-primary/50 text-primary">Live</Badge>
                            </div>

                            {/* PolyCop */}
                            <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-background/50 border border-orange-500/20 backdrop-blur-sm relative">
                                <div className="absolute -top-3 -right-3 animate-pulse">
                                    <Badge className="bg-orange-500">New</Badge>
                                </div>
                                <img src={polycopLogo} alt="PolyCop" className="h-12 w-auto object-contain" />
                            </div>

                            {/* PolyGun */}
                            <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-background/50 border border-cyan-500/20 backdrop-blur-sm relative">
                                <div className="absolute -top-3 -right-3 animate-pulse delay-75">
                                    <Badge className="bg-cyan-500">New</Badge>
                                </div>
                                <img src={polygunLogo} alt="PolyGun" className="h-12 w-auto object-contain" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Summary */}
                <Card className="bg-primary/5 border-primary/20 mb-12">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-primary/20">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">What's New</h3>
                                <p className="text-muted-foreground">
                                    Our "Analyze Trader" page now has dedicated tabs for <strong>PolyCop</strong> and <strong>PolyGun</strong>.
                                    Toggle between them to see platform-specific fee calculations, net return estimates, and one-click configuration commands optimized for each bot's unique mechanism.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Separator className="mb-12" />

                {/* Section 1: Why Separate Support? */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6">Why Platform-Specific Analysis Matters</h2>
                    <p className="text-muted-foreground mb-6">
                        Copy trading isn't "one size fits all." Different bots have different fee structures and execution speeds.
                        A profitable trader on one platform might lose money on another if fees eat up the edge.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <Card className="glass-card">
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" /> Fee Structures
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    TradeFox uses a tiered system with rebates. PolyCop and PolyGun typically have flat percentage fees.
                                    Our new <strong>Fee Impact</strong> engine calculates the exact "drag" on your PnL for each bot separately.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="glass-card">
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Bot className="h-5 w-5 text-primary" /> Configuration Syntax
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Each bot uses different commands. We now generate the exact copy-paste config text you need for
                                    PolyCop's Telegram bot or TradeFox's interface, with zero manual conversion.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Section 2: Net Return Ranges */}
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-accent/10">
                            <Activity className="h-5 w-5 text-accent" />
                        </div>
                        <h2 className="text-2xl font-bold">Introducing "Net Return Range"</h2>
                    </div>

                    <p className="text-muted-foreground mb-6">
                        We've replaced the simple "Estimated Return" with a more robust <strong>Net Return Range</strong>.
                    </p>

                    <div className="p-6 rounded-xl bg-background/40 border border-border/50">
                        <div className="flex items-start gap-4">
                            <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-semibold text-lg text-green-500 mb-2">Detailed Reality Check</h4>
                                <p className="text-muted-foreground">
                                    Instead of promising a single number (e.g., "+20%"), we now show a range (e.g., "+15% to +22%").
                                    This accounts for slippage, missed trades, and platform fees. If fees are too high for a strategy
                                    (like high-frequency scalping), the net return might show as negative, warning you <strong>before</strong> you copy.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Visual Upgrades */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6">Visual Upgrades & Risk Regimes</h2>
                    <p className="text-muted-foreground mb-6">
                        We've also cleaned up the UI. The <strong>Strategy Analysis</strong> block is now shared across all platforms,
                        giving you a clear view of the "Risk Regime" (Conservative vs. Aggressive) regardless of which bot you use.
                    </p>
                    <p className="text-muted-foreground">
                        Whether you use the advanced interface of TradeFox or the quick Telegram commands of PolyCop,
                        you get the same deep, AI-powered insight into <em>who</em> you are copying.
                    </p>
                </section>

                <Separator className="mb-12" />

                {/* CTA */}
                <Card className="bg-gradient-to-r from-primary/10 via-background to-accent/10 border-primary/20">
                    <CardContent className="p-8 text-center">
                        <h3 className="text-2xl font-bold mb-2">Try the new integrations now</h3>
                        <p className="text-muted-foreground mb-6">
                            Pick your favorite bot and find a profitable trader to copy today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link to="/analyze">
                                <Button size="lg">
                                    Analyze a Trader <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

            </article>
        </Layout>
    );
};

export default BlogIntegrations;
