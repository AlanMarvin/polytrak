import { Award, Clock, Heart, Users } from 'lucide-react';

const stats = [
    { icon: Award, value: '20+', label: 'Anni di esperienza' },
    { icon: Users, value: '1000+', label: 'Clienti soddisfatti' },
    { icon: Heart, value: '96%', label: 'Recensioni positive' },
    { icon: Clock, value: '50+', label: 'Trattamenti disponibili' },
];

const KatyAbout = () => {
    return (
        <section id="about" className="py-24 bg-[#F8F4F4] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#E8C4C4]/20 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Image column */}
                    <div className="relative order-2 lg:order-1">
                        {/* Main image */}
                        <div className="relative z-10">
                            <div className="katy-img-frame overflow-hidden">
                                <img
                                    src="/assets/katy/katy-portrait.jpg"
                                    alt="Katy - Titolare del Centro Estetico"
                                    className="w-full h-auto object-cover aspect-[4/5]"
                                />
                            </div>
                        </div>

                        {/* Floating badge */}
                        <div className="absolute -bottom-6 -right-6 lg:-right-10 z-20 bg-white rounded-2xl p-4 shadow-xl border border-[#D4AF37]/30 katy-animate-float">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8962F] flex items-center justify-center">
                                    <Award className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="katy-heading text-2xl font-bold text-[#2D2D2D]">20+</p>
                                    <p className="katy-body text-sm text-[#6B6B6B]">Anni di esperienza</p>
                                </div>
                            </div>
                        </div>

                        {/* Decorative shape */}
                        <div className="absolute -top-8 -left-8 w-32 h-32 bg-[#CE7777]/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl" />
                    </div>

                    {/* Content column */}
                    <div className="order-1 lg:order-2">
                        <span className="inline-block px-4 py-1.5 bg-[#E8C4C4] text-[#CE7777] text-sm font-medium rounded-full mb-4">
                            Chi Siamo
                        </span>

                        <h2 className="katy-heading text-3xl sm:text-4xl md:text-5xl font-bold text-[#2D2D2D] mb-6">
                            Passione e professionalità
                            <span className="block text-[#CE7777]">dal 2004</span>
                        </h2>

                        <div className="katy-divider mb-8" />

                        <div className="space-y-4 katy-body text-[#6B6B6B] leading-relaxed">
                            <p>
                                Sono <strong className="text-[#CE7777]">Katia</strong>, e insieme a <strong className="text-[#CE7777]">Silvia</strong> ci
                                dedichiamo con passione alla bellezza delle donne di Seriate e Bergamo da oltre 20 anni.
                            </p>
                            <p>
                                Il nostro centro estetico è un luogo dove la <strong>professionalità</strong> si unisce
                                all'<strong>accoglienza familiare</strong>: ogni cliente viene seguita con attenzione
                                personalizzata per rispondere alle esigenze specifiche di ciascuna.
                            </p>
                            <p>
                                Utilizziamo solo <strong>prodotti di qualità eccellente</strong> e tecniche all'avanguardia
                                per garantire risultati visibili e duraturi. Qui ti sentirai davvero coccolata.
                            </p>
                        </div>

                        {/* Testimonial quote */}
                        <blockquote className="mt-8 p-6 bg-white rounded-2xl border-l-4 border-[#D4AF37] shadow-sm">
                            <p className="katy-body text-[#2D2D2D] italic">
                                "Professionalità, cura e relax unici. Katia e Silvia hanno una grande capacità
                                di accoglienza, l'ambiente è curato e pulito. Ci si sente davvero coccolati!"
                            </p>
                            <cite className="mt-3 flex items-center gap-2 not-italic">
                                <div className="w-8 h-8 rounded-full bg-[#E8C4C4] flex items-center justify-center">
                                    <span className="text-[#CE7777] text-sm font-medium">C</span>
                                </div>
                                <span className="text-sm text-[#6B6B6B]">Cliente verificata</span>
                            </cite>
                        </blockquote>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className="text-center p-6 bg-white rounded-2xl shadow-sm border border-[#E8C4C4]/30 hover:border-[#D4AF37]/50 transition-colors katy-card-hover"
                        >
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#E8C4C4] to-[#F5E6E6] flex items-center justify-center">
                                <stat.icon className="w-6 h-6 text-[#CE7777]" />
                            </div>
                            <p className="katy-heading text-3xl font-bold text-[#2D2D2D] mb-1">{stat.value}</p>
                            <p className="katy-body text-sm text-[#6B6B6B]">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default KatyAbout;
