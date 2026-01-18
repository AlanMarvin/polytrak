import { Sparkles, Zap, Hand, Heart } from 'lucide-react';

const servizi = [
    {
        icon: Hand,
        title: 'Manicure & Pedicure',
        description: 'Semipermanente, ricostruzione unghie e nail art personalizzate per mani e piedi sempre curati.',
        features: ['Semipermanente', 'Ricostruzione', 'Nail Art', 'Gel'],
    },
    {
        icon: Zap,
        title: 'Epilazione Laser Diodo',
        description: 'Tecnologia laser di ultima generazione per una depilazione definitiva, sicura e indolore.',
        features: ['Indolore', 'Risultati duraturi', 'Tutti i fototipi', 'Veloce'],
    },
    {
        icon: Sparkles,
        title: 'Trattamenti Viso',
        description: 'Pulizia del viso, trattamenti anti-age, idratazione profonda e peeling per una pelle radiosa.',
        features: ['Pulizia profonda', 'Anti-age', 'Idratazione', 'Peeling'],
    },
    {
        icon: Heart,
        title: 'Trattamenti Corpo',
        description: 'Specializzati in Calco Metabolico Skulptur® per tonificare i tessuti e modellare il corpo con risultati visibili.',
        features: ['Calco Metabolico', 'Modellamento', 'Tonificazione', 'Cellulite'],
    },
];

const EstServizi = () => {
    return (
        <section id="servizi" className="py-24 bg-gradient-to-b from-[#FFFDF9] to-[#F5EBE0] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A77C]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C9A227]/10 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Section header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-1.5 bg-[#E6D5C3] text-[#5D4E37] text-sm font-medium rounded-full mb-4">
                        I Nostri Servizi
                    </span>
                    <h2 className="est-heading text-3xl sm:text-4xl md:text-5xl font-bold text-[#5D4E37] mb-4">
                        Cura e Bellezza
                        <span className="block text-[#C9A77C]">su Misura</span>
                    </h2>
                    <div className="est-divider mx-auto mb-6" />
                    <p className="est-body text-lg text-[#8B8B8B] max-w-2xl mx-auto">
                        Scopri tutti i nostri trattamenti personalizzati per valorizzare la tua bellezza naturale
                    </p>
                </div>

                {/* Services grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {servizi.map((servizio, index) => (
                        <div
                            key={servizio.title}
                            className="group bg-white rounded-2xl p-6 shadow-lg border border-[#E6D5C3]/50 est-card-hover"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {/* Icon */}
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#E6D5C3] to-[#F5EBE0] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <servizio.icon className="w-7 h-7 text-[#5D4E37]" />
                            </div>

                            {/* Content */}
                            <h3 className="est-heading text-xl font-semibold text-[#5D4E37] mb-3">
                                {servizio.title}
                            </h3>
                            <p className="est-body text-sm text-[#8B8B8B] mb-4 leading-relaxed">
                                {servizio.description}
                            </p>

                            {/* Features */}
                            <div className="flex flex-wrap gap-2">
                                {servizio.features.map((feature) => (
                                    <span
                                        key={feature}
                                        className="px-2.5 py-1 bg-[#F5EBE0] text-[#5D4E37] text-xs font-medium rounded-full"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-12">
                    <p className="est-body text-[#8B8B8B] mb-4">
                        Vuoi saperne di più sui nostri trattamenti?
                    </p>
                    <a
                        href="https://wa.me/393519262305?text=Ciao!%20Vorrei%20avere%20maggiori%20informazioni%20sui%20vostri%20servizi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="est-btn-primary inline-flex items-center gap-2"
                    >
                        Contattaci per info
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
};

export default EstServizi;
