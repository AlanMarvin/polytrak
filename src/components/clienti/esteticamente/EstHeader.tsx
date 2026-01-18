import { useState, useEffect } from 'react';
import { Menu, X, Phone } from 'lucide-react';

const EstHeader = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setIsMobileMenuOpen(false);
        }
    };

    const navLinks = [
        { label: 'Home', id: 'hero' },
        { label: 'Servizi', id: 'servizi' },
        { label: 'Chi Siamo', id: 'about' },
        { label: 'Gallery', id: 'gallery' },
        { label: 'Contatti', id: 'contatti' },
    ];

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
                        ? 'bg-[#FFFDF9]/95 backdrop-blur-md shadow-lg py-3'
                        : 'bg-transparent py-5'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <button
                            onClick={() => scrollToSection('hero')}
                            className="flex items-center gap-3 group"
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A77C] to-[#5D4E37] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <span className="text-white font-bold text-xl est-heading">E</span>
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="est-heading text-xl font-semibold text-[#5D4E37]">
                                    Esteticamente
                                </h1>
                                <p className="text-sm text-[#C9A77C] font-medium -mt-1">Beauty & Nails</p>
                            </div>
                        </button>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <button
                                    key={link.id}
                                    onClick={() => scrollToSection(link.id)}
                                    className="est-body text-[#5D4E37] hover:text-[#C9A77C] font-medium transition-colors relative group"
                                >
                                    {link.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#C9A227] to-[#C9A77C] group-hover:w-full transition-all duration-300" />
                                </button>
                            ))}
                        </nav>

                        {/* CTA Button */}
                        <div className="hidden md:flex items-center gap-4">
                            <a
                                href="tel:+393519262305"
                                className="flex items-center gap-2 text-[#5D4E37] hover:text-[#C9A77C] transition-colors"
                            >
                                <Phone className="w-4 h-4" />
                                <span className="est-body font-medium">351 926 2305</span>
                            </a>
                            <a
                                href="https://wa.me/393519262305?text=Ciao!%20Vorrei%20prenotare%20un%20appuntamento"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="est-btn-whatsapp text-sm"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Prenota
                            </a>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-[#5D4E37] hover:text-[#C9A77C] transition-colors"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="est-mobile-menu md:hidden">
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="absolute top-5 right-5 p-2 text-[#5D4E37]"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <nav className="flex flex-col items-center gap-6">
                        {navLinks.map((link) => (
                            <button
                                key={link.id}
                                onClick={() => scrollToSection(link.id)}
                                className="est-heading text-2xl text-[#5D4E37] hover:text-[#C9A77C] transition-colors"
                            >
                                {link.label}
                            </button>
                        ))}
                    </nav>

                    <div className="flex flex-col items-center gap-4 mt-8">
                        <a
                            href="tel:+393519262305"
                            className="flex items-center gap-2 text-[#5D4E37]"
                        >
                            <Phone className="w-5 h-5" />
                            <span className="est-body font-medium text-lg">351 926 2305</span>
                        </a>
                        <a
                            href="https://wa.me/393519262305?text=Ciao!%20Vorrei%20prenotare%20un%20appuntamento"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="est-btn-whatsapp"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Prenota su WhatsApp
                        </a>
                    </div>
                </div>
            )}
        </>
    );
};

export default EstHeader;
