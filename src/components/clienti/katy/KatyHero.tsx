import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const heroImages = [
    '/assets/katy/hero-bg-1.jpg',
    '/assets/katy/hero-bg-2.jpg',
    '/assets/katy/hero-bg-3.jpg',
];

const KatyHero = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Auto-rotate background images
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
        }, 5000); // Change every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const scrollToServizi = () => {
        const element = document.getElementById('servizi');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section
            id="hero"
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
        >
            {/* Background images slideshow */}
            <div className="absolute inset-0">
                {heroImages.map((src, index) => (
                    <div
                        key={src}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
                {/* Overlay to fade the images and ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#F5E6E6]/90 via-[#E8C4C4]/85 to-[#F5E6E6]/90" />
                {/* Additional soft blur overlay */}
                <div className="absolute inset-0 backdrop-blur-[2px]" />
            </div>

            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Floating shapes */}
                <div className="absolute top-20 left-10 w-64 h-64 bg-white/30 rounded-full blur-3xl katy-animate-float" />
                <div className="absolute bottom-32 right-20 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl katy-animate-float" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-[#CE7777]/25 rounded-full blur-2xl katy-animate-float" style={{ animationDelay: '2s' }} />

                {/* Gold accent lines */}
                <div className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-[#D4AF37]/50 to-transparent" />
                <div className="absolute bottom-0 right-1/3 w-px h-48 bg-gradient-to-t from-transparent via-[#D4AF37]/50 to-transparent" />
            </div>

            {/* Image indicators */}
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {heroImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex
                            ? 'bg-[#CE7777] w-6'
                            : 'bg-[#CE7777]/40 hover:bg-[#CE7777]/60'
                            }`}
                        aria-label={`Vai all'immagine ${index + 1}`}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Badge */}
                <div className="katy-animate-fade-in opacity-0" style={{ animationDelay: '0.2s' }}>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-[#D4AF37]/40 text-sm font-medium text-[#2D2D2D] mb-8 shadow-lg">
                        <span className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <svg key={i} className="w-4 h-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </span>
                        <span className="text-[#6B6B6B]">96% recensioni positive</span>
                    </span>
                </div>

                {/* Headline */}
                <h1
                    className="katy-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#2D2D2D] mb-6 katy-animate-fade-in opacity-0 drop-shadow-sm"
                    style={{ animationDelay: '0.4s' }}
                >
                    La tua bellezza,
                    <br />
                    <span className="text-[#CE7777]">la nostra passione</span>
                </h1>

                {/* Subheadline */}
                <p
                    className="katy-body text-lg sm:text-xl md:text-2xl text-[#4A4A4A] max-w-2xl mx-auto mb-4 katy-animate-fade-in opacity-0 drop-shadow-sm"
                    style={{ animationDelay: '0.6s' }}
                >
                    Da oltre <strong className="text-[#CE7777]">20 anni</strong> ci prendiamo cura della tua bellezza
                    nel cuore di Seriate, Bergamo.
                </p>

                {/* Experience badge */}
                <div
                    className="flex items-center justify-center gap-3 mb-10 katy-animate-fade-in opacity-0"
                    style={{ animationDelay: '0.7s' }}
                >
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-md">
                        <span className="text-2xl">✨</span>
                        <span className="katy-body text-sm font-medium text-[#2D2D2D]">
                            Professionalità • Cura • Relax
                        </span>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 katy-animate-fade-in opacity-0"
                    style={{ animationDelay: '0.8s' }}
                >
                    <a
                        href="https://wa.me/393339338986?text=Ciao!%20Vorrei%20prenotare%20un%20appuntamento%20al%20Centro%20Estetico%20Katy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="katy-btn-whatsapp text-lg px-8 py-4"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Prenota su WhatsApp
                    </a>

                    <a
                        href="tel:+393339338986"
                        className="katy-btn-gold text-lg px-8 py-4 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Chiamaci Ora
                    </a>
                </div>

                {/* Trust indicators */}
                <div
                    className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-[#4A4A4A] katy-animate-fade-in opacity-0"
                    style={{ animationDelay: '1s' }}
                >
                    <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full">
                        <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Prodotti di qualità</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full">
                        <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Team esperto</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full">
                        <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Ambiente accogliente</span>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <button
                onClick={scrollToServizi}
                className="katy-scroll-indicator text-[#CE7777] hover:text-[#D4AF37] transition-colors"
                aria-label="Scorri verso il basso"
            >
                <ChevronDown className="w-8 h-8" />
            </button>
        </section>
    );
};

export default KatyHero;
