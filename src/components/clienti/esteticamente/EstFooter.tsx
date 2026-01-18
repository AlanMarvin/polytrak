import { MapPin, Phone, Heart, Mail, Instagram } from 'lucide-react';

const EstFooter = () => {
    const currentYear = new Date().getFullYear();

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <footer className="bg-[#5D4E37] text-white relative overflow-hidden">
            {/* Decorative top border */}
            <div className="h-1 bg-gradient-to-r from-[#C9A77C] via-[#C9A227] to-[#C9A77C]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand column */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-20 h-20 overflow-hidden">
                                <img
                                    src="/assets/esteticamente/logo.jpg"
                                    alt="Esteticamente Beauty & Nails Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>
                        <p className="est-body text-[#E6D5C3] leading-relaxed mb-6 max-w-md">
                            La bellezza nasce da dentro. Ci prendiamo cura di te con professionalità,
                            competenza e i migliori prodotti sul mercato a <strong className="text-white">Gorle</strong>.
                        </p>
                        <div className="flex items-center gap-4">
                            {/* Instagram */}
                            <a
                                href="https://www.instagram.com/esteticamente_beauty_lab"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 flex items-center justify-center transition-all"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            {/* WhatsApp */}
                            <a
                                href="https://wa.me/393519262305"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#25D366] flex items-center justify-center transition-colors"
                                aria-label="WhatsApp"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h4 className="est-heading text-lg font-semibold mb-6">Menu</h4>
                        <nav className="space-y-3">
                            {[
                                { label: 'Home', id: 'hero' },
                                { label: 'Servizi', id: 'servizi' },
                                { label: 'Chi Siamo', id: 'about' },
                                { label: 'Gallery', id: 'gallery' },
                                { label: 'Contatti', id: 'contatti' },
                            ].map((link) => (
                                <button
                                    key={link.id}
                                    onClick={() => scrollToSection(link.id)}
                                    className="block est-body text-[#E6D5C3] hover:text-white transition-colors"
                                >
                                    {link.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Contact info */}
                    <div>
                        <h4 className="est-heading text-lg font-semibold mb-6">Contatti</h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-[#C9A77C] flex-shrink-0 mt-0.5" />
                                <p className="est-body text-[#E6D5C3] text-sm">
                                    Viale G. Zavaritt, 230 A<br />
                                    24020 Gorle (BG)
                                </p>
                            </div>
                            <a
                                href="tel:+393519262305"
                                className="flex items-center gap-3 text-[#E6D5C3] hover:text-white transition-colors"
                            >
                                <Phone className="w-5 h-5 text-[#C9A77C]" />
                                <span className="est-body text-sm">351 926 2305</span>
                            </a>
                            <a
                                href="mailto:esteticamente.em@gmail.com"
                                className="flex items-center gap-3 text-[#E6D5C3] hover:text-white transition-colors"
                            >
                                <Mail className="w-5 h-5 text-[#C9A77C]" />
                                <span className="est-body text-sm break-all">esteticamente.em@gmail.com</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-16 pt-8 border-t border-white/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="est-body text-sm text-[#E6D5C3]/60">
                            © {currentYear} Esteticamente Beauty & Nails. Tutti i diritti riservati.
                        </p>
                        <p className="est-body text-sm text-[#E6D5C3]/60 flex items-center gap-1">
                            Creato con <Heart className="w-4 h-4 text-[#C9A77C] inline" /> da{' '}
                            <a
                                href="https://polytrak.io"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white hover:underline"
                            >
                                Polytrak.io
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C9A77C]/5 rounded-full blur-3xl" />
        </footer>
    );
};

export default EstFooter;
