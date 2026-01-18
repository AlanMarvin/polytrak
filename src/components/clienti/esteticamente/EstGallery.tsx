import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const galleryImages = [
    { src: '/assets/esteticamente/reception.jpg', alt: 'Reception Esteticamente Beauty & Nails' },
    { src: '/assets/esteticamente/nicol-portrait.jpg', alt: 'Nicol - Titolare' },
    { src: '/assets/esteticamente/gallery/laser-diodo.jpg', alt: 'Epilazione Laser Diodo' },
    { src: '/assets/esteticamente/gallery/giveaway.jpg', alt: 'Giveaway e Promozioni' },
    { src: '/assets/esteticamente/gallery/anniversario.jpg', alt: '1 Anno di Esteticamente' },
];

const EstGallery = () => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openLightbox = (index: number) => {
        setCurrentIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => setLightboxOpen(false);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
    };

    return (
        <section id="gallery" className="py-24 bg-gradient-to-b from-[#F5EBE0] to-[#FFFDF9] relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-1.5 bg-[#E6D5C3] text-[#5D4E37] text-sm font-medium rounded-full mb-4">
                        Gallery
                    </span>
                    <h2 className="est-heading text-3xl sm:text-4xl md:text-5xl font-bold text-[#5D4E37] mb-4">
                        Il Nostro Salone
                    </h2>
                    <div className="est-divider mx-auto mb-6" />
                    <p className="est-body text-lg text-[#8B8B8B] max-w-2xl mx-auto">
                        Scopri l'atmosfera calda e accogliente del nostro centro estetico
                    </p>
                </div>

                {/* Gallery grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {galleryImages.map((image, index) => (
                        <button
                            key={image.src}
                            onClick={() => openLightbox(index)}
                            className={`relative overflow-hidden rounded-2xl group cursor-pointer ${index === 0 ? 'col-span-2 row-span-2' : ''
                                }`}
                        >
                            <img
                                src={image.src}
                                alt={image.alt}
                                className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${index === 0 ? 'h-80 md:h-[500px]' : 'h-40 md:h-60'
                                    }`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#5D4E37]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="est-body text-sm font-medium">{image.alt}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Instagram CTA */}
                <div className="text-center mt-12">
                    <p className="est-body text-[#8B8B8B] mb-4">
                        Seguici su Instagram per vedere tutti i nostri lavori
                    </p>
                    <a
                        href="https://www.instagram.com/esteticamente_beauty_lab"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-shadow"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                        Seguici su Instagram
                    </a>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 p-2 text-white hover:text-[#C9A227] transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 p-2 text-white hover:text-[#C9A227] transition-colors"
                    >
                        <ChevronLeft className="w-10 h-10" />
                    </button>

                    <img
                        src={galleryImages[currentIndex].src}
                        alt={galleryImages[currentIndex].alt}
                        className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    />

                    <button
                        onClick={goToNext}
                        className="absolute right-4 p-2 text-white hover:text-[#C9A227] transition-colors"
                    >
                        <ChevronRight className="w-10 h-10" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {galleryImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-[#C9A227] w-6' : 'bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};

export default EstGallery;
