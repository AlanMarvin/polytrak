import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const galleryImages = [
    {
        src: '/assets/katy/gallery/torta-anniversario.jpg',
        alt: 'Celebrazione 20 anni Centro Estetico Katy',
        caption: '20 anni di bellezza insieme a voi',
    },
    {
        src: '/assets/katy/gallery/trattamento.jpg',
        alt: 'Trattamento idratante professionale',
        caption: 'Trattamenti con prodotti di qualità',
    },
    {
        src: '/assets/katy/gallery/prodotti.jpg',
        alt: 'Prodotti e materiali del centro',
        caption: 'I nostri strumenti professionali',
    },
    {
        src: '/assets/katy/gallery/fiori.jpg',
        alt: 'Composizione floreale del centro',
        caption: 'Atmosfera accogliente e curata',
    },
    {
        src: '/assets/katy/katy-portrait.jpg',
        alt: 'Katy - Titolare',
        caption: 'Katy, sempre pronta ad accoglierti',
    },
];

const KatyGallery = () => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openLightbox = (index: number) => {
        setCurrentIndex(index);
        setLightboxOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        document.body.style.overflow = '';
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
    };

    return (
        <section id="gallery" className="py-24 bg-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F5E6E6]/30 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Section header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-1.5 bg-[#F5E6E6] text-[#CE7777] text-sm font-medium rounded-full mb-4">
                        Gallery
                    </span>
                    <h2 className="katy-heading text-3xl sm:text-4xl md:text-5xl font-bold text-[#2D2D2D] mb-4">
                        I Nostri Momenti
                    </h2>
                    <div className="katy-divider mx-auto mb-6" />
                    <p className="katy-body text-lg text-[#6B6B6B] max-w-2xl mx-auto">
                        Scorci del nostro centro e dei trattamenti che offriamo ogni giorno con passione
                    </p>
                </div>

                {/* Gallery grid - Masonry style */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryImages.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => openLightbox(index)}
                            className={`group relative overflow-hidden rounded-2xl katy-card-hover ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                                }`}
                        >
                            <img
                                src={image.src}
                                alt={image.alt}
                                className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${index === 0 ? 'h-64 md:h-full' : 'h-48 md:h-56'
                                    }`}
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Caption */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <p className="text-white text-sm font-medium katy-body">{image.caption}</p>
                            </div>

                            {/* Zoom icon */}
                            <div className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <svg className="w-5 h-5 text-[#CE7777]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Facebook CTA */}
                <div className="text-center mt-12">
                    <p className="katy-body text-[#6B6B6B] mb-4">
                        Seguici su Facebook per vedere tutti i nostri lavori
                    </p>
                    <a
                        href="https://www.facebook.com/CentroEsteticoKaty"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#1877F2] text-white font-medium rounded-full hover:bg-[#166FE5] transition-colors shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Visita la nostra pagina
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    {/* Close button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 z-50 p-2 text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {/* Navigation buttons */}
                    <button
                        onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                        className="absolute left-4 z-50 p-2 text-white/80 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-10 h-10" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); goToNext(); }}
                        className="absolute right-4 z-50 p-2 text-white/80 hover:text-white transition-colors"
                    >
                        <ChevronRight className="w-10 h-10" />
                    </button>

                    {/* Image */}
                    <div
                        className="max-w-4xl max-h-[80vh] px-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={galleryImages[currentIndex].src}
                            alt={galleryImages[currentIndex].alt}
                            className="max-w-full max-h-[75vh] object-contain mx-auto rounded-lg"
                        />
                        <p className="text-white text-center mt-4 katy-body">
                            {galleryImages[currentIndex].caption}
                        </p>
                        <p className="text-white/50 text-center text-sm mt-2">
                            {currentIndex + 1} / {galleryImages.length}
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
};

export default KatyGallery;
