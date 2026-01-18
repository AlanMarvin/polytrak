import { Sparkles, Heart, Hand, Flower2 } from 'lucide-react';

const services = [
    {
        icon: Sparkles,
        title: 'Trattamenti Viso',
        description: 'Pulizia del viso, trattamenti anti-age, idratazione profonda e peeling per una pelle luminosa e giovane.',
        features: ['Pulizia profonda', 'Anti-age', 'Idratazione', 'Peeling'],
        color: 'from-pink-400 to-rose-500',
        bgColor: 'bg-pink-50',
    },
    {
        icon: Heart,
        title: 'Trattamenti Corpo',
        description: 'Massaggi rilassanti, trattamenti rimodellanti, bendaggi e percorsi benessere personalizzati.',
        features: ['Massaggi', 'Rimodellamento', 'Bendaggi', 'Drenanti'],
        color: 'from-rose-400 to-red-500',
        bgColor: 'bg-rose-50',
    },
    {
        icon: Hand,
        title: 'Mani & Piedi',
        description: 'Manicure, pedicure, ricostruzione unghie e trattamenti specifici per mani e piedi sempre curati.',
        features: ['Manicure', 'Pedicure', 'Ricostruzione', 'Gel'],
        color: 'from-amber-400 to-orange-500',
        bgColor: 'bg-amber-50',
    },
    {
        icon: Flower2,
        title: 'Epilazione',
        description: 'Ceretta tradizionale, luce pulsata e tecniche delicate per una pelle liscia e setosa.',
        features: ['Ceretta', 'Luce pulsata', 'Indolore', 'Duratura'],
        color: 'from-purple-400 to-violet-500',
        bgColor: 'bg-purple-50',
    },
];

const KatyServizi = () => {
    return (
        <section id="servizi" className="py-24 bg-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#F5E6E6] to-transparent" />
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#E8C4C4]/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Section header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-1.5 bg-[#F5E6E6] text-[#CE7777] text-sm font-medium rounded-full mb-4">
                        Cosa Offriamo
                    </span>
                    <h2 className="katy-heading text-3xl sm:text-4xl md:text-5xl font-bold text-[#2D2D2D] mb-4">
                        I Nostri Servizi
                    </h2>
                    <div className="katy-divider mx-auto mb-6" />
                    <p className="katy-body text-lg text-[#6B6B6B] max-w-2xl mx-auto">
                        Scopri tutti i trattamenti che abbiamo selezionato per prenderci cura di te
                        con professionalità e prodotti di alta qualità.
                    </p>
                </div>

                {/* Services grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 katy-stagger">
                    {services.map((service, index) => (
                        <div
                            key={service.title}
                            className="group katy-card-hover bg-white rounded-2xl p-6 border border-[#E8C4C4]/50 hover:border-[#D4AF37]/50 opacity-0 katy-animate-fade-in-up"
                            style={{ animationDelay: `${0.1 * (index + 1)}s`, animationFillMode: 'forwards' }}
                        >
                            {/* Icon */}
                            <div className={`w-16 h-16 ${service.bgColor} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                <service.icon className={`w-8 h-8 bg-gradient-to-br ${service.color} bg-clip-text`} style={{ color: '#CE7777' }} />
                            </div>

                            {/* Title */}
                            <h3 className="katy-heading text-xl font-semibold text-[#2D2D2D] mb-3 group-hover:text-[#CE7777] transition-colors">
                                {service.title}
                            </h3>

                            {/* Description */}
                            <p className="katy-body text-[#6B6B6B] text-sm leading-relaxed mb-4">
                                {service.description}
                            </p>

                            {/* Features */}
                            <div className="flex flex-wrap gap-2">
                                {service.features.map((feature) => (
                                    <span
                                        key={feature}
                                        className="text-xs px-3 py-1 bg-[#F8F4F4] text-[#6B6B6B] rounded-full"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>

                            {/* Hover indicator */}
                            <div className="mt-5 pt-4 border-t border-[#E8C4C4]/30 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-sm font-medium text-[#CE7777]">Scopri di più</span>
                                <svg className="w-4 h-4 text-[#CE7777] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-16">
                    <p className="katy-body text-[#6B6B6B] mb-6">
                        Vuoi saperne di più sui nostri trattamenti?
                    </p>
                    <a
                        href="https://wa.me/39035301973?text=Ciao!%20Vorrei%20avere%20maggiori%20informazioni%20sui%20vostri%20servizi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="katy-btn-primary inline-flex items-center gap-2"
                    >
                        Contattaci per info
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
};

export default KatyServizi;
