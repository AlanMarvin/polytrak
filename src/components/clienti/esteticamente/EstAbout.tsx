import { Award, Clock, Heart, Users } from 'lucide-react';

const stats = [
    { icon: Award, value: '5.0', label: 'Stelle su Google' },
    { icon: Users, value: '33+', label: 'Recensioni positive' },
    { icon: Heart, value: '100%', label: 'Clienti soddisfatti' },
    { icon: Clock, value: '6', label: 'Giorni a settimana' },
];

const recensioni = [
    {
        nome: 'Irene M. B.',
        testo: 'È l\'unico centro estetico che ho frequentato con costanza. Mi sono trovata subito a mio agio, prima con lo smalto semipermanente e poi con l\'epilazione laser.',
        rating: 5,
    },
    {
        nome: 'Arianna B.',
        testo: 'Frequento questo centro da quasi un anno per i trattamenti laser e sono davvero soddisfatta. Nicol è incredibilmente competente e aggiornata!',
        rating: 5,
    },
    {
        nome: 'Simona P.',
        testo: 'Conosco Nicol da oltre due anni e lavora con la massima professionalità, cura e pulizia. È come andare a trovare un\'amica!',
        rating: 5,
    },
];

const EstAbout = () => {
    return (
        <section id="about" className="py-24 bg-[#F5EBE0] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#E6D5C3]/30 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Image column */}
                    <div className="relative order-2 lg:order-1">
                        {/* Main image */}
                        <div className="relative z-10">
                            <div className="est-img-frame overflow-hidden">
                                <img
                                    src="/assets/esteticamente/nicol-portrait.jpg"
                                    alt="Nicol - Titolare di Esteticamente Beauty & Nails"
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>

                        {/* Floating badge */}
                        <div className="absolute -bottom-6 -right-6 lg:-right-10 z-20 bg-white rounded-2xl p-4 shadow-xl border border-[#C9A227]/30 est-animate-float">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A227] to-[#C9A77C] flex items-center justify-center">
                                    <Award className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="est-heading text-2xl font-bold text-[#5D4E37]">5.0</p>
                                    <p className="est-body text-sm text-[#8B8B8B]">Stelle Google</p>
                                </div>
                            </div>
                        </div>

                        {/* Decorative shape */}
                        <div className="absolute -top-8 -left-8 w-32 h-32 bg-[#C9A77C]/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#C9A227]/10 rounded-full blur-3xl" />
                    </div>

                    {/* Content column */}
                    <div className="order-1 lg:order-2">
                        <span className="inline-block px-4 py-1.5 bg-[#E6D5C3] text-[#5D4E37] text-sm font-medium rounded-full mb-4">
                            Chi Sono
                        </span>

                        <h2 className="est-heading text-3xl sm:text-4xl md:text-5xl font-bold text-[#5D4E37] mb-6">
                            Ciao, sono
                            <span className="block text-[#C9A77C]">Nicol</span>
                        </h2>

                        <div className="est-divider mb-8" />

                        <div className="space-y-4 est-body text-[#8B8B8B] leading-relaxed">
                            <p>
                                Benvenuta nel mio centro estetico a <strong className="text-[#5D4E37]">Gorle</strong>,
                                alle porte di Bergamo. Qui la bellezza nasce da dentro, e il mio obiettivo
                                è farti sentire a tuo agio mentre ti prendi cura di te stessa.
                            </p>
                            <p>
                                Sono specializzata in <strong className="text-[#C9A77C]">epilazione laser a diodo</strong>,
                                <strong className="text-[#C9A77C]"> manicure e pedicure</strong> semipermanente,
                                e trattamenti viso e corpo all'avanguardia.
                            </p>
                            <p>
                                Ogni cliente viene seguita con <strong>attenzione personalizzata</strong>.
                                Il mio salone è il tuo spazio di relax, dove professionalità e accoglienza
                                si fondono per offrirti un'esperienza unica.
                            </p>
                        </div>

                        {/* Customer reviews carousel */}
                        <div className="mt-8 space-y-4">
                            {recensioni.slice(0, 1).map((recensione) => (
                                <blockquote key={recensione.nome} className="p-6 bg-white rounded-2xl border-l-4 border-[#C9A227] shadow-sm">
                                    <div className="flex gap-1 mb-2">
                                        {[...Array(recensione.rating)].map((_, i) => (
                                            <svg key={i} className="w-4 h-4 text-[#C9A227]" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="est-body text-[#5D4E37] italic">
                                        "{recensione.testo}"
                                    </p>
                                    <cite className="mt-3 flex items-center gap-2 not-italic">
                                        <div className="w-8 h-8 rounded-full bg-[#E6D5C3] flex items-center justify-center">
                                            <span className="text-[#5D4E37] text-sm font-medium">{recensione.nome.charAt(0)}</span>
                                        </div>
                                        <span className="text-sm text-[#8B8B8B]">{recensione.nome}</span>
                                    </cite>
                                </blockquote>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="text-center p-6 bg-white rounded-2xl shadow-sm border border-[#E6D5C3]/30 hover:border-[#C9A227]/50 transition-colors est-card-hover"
                        >
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#E6D5C3] to-[#F5EBE0] flex items-center justify-center">
                                <stat.icon className="w-6 h-6 text-[#5D4E37]" />
                            </div>
                            <p className="est-heading text-3xl font-bold text-[#5D4E37] mb-1">{stat.value}</p>
                            <p className="est-body text-sm text-[#8B8B8B]">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default EstAbout;
