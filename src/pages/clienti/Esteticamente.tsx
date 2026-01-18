import { useEffect } from 'react';
import EstHeader from '@/components/clienti/esteticamente/EstHeader';
import EstHero from '@/components/clienti/esteticamente/EstHero';
import EstServizi from '@/components/clienti/esteticamente/EstServizi';
import EstAbout from '@/components/clienti/esteticamente/EstAbout';
import EstGallery from '@/components/clienti/esteticamente/EstGallery';
import EstContatti from '@/components/clienti/esteticamente/EstContatti';
import EstFooter from '@/components/clienti/esteticamente/EstFooter';
import '@/components/clienti/esteticamente/esteticamente-styles.css';

const Esteticamente = () => {
    useEffect(() => {
        // Scroll to top on mount
        window.scrollTo(0, 0);

        // SEO Dynamic Metadata
        document.title = "Esteticamente Beauty & Nails | Gorle Bergamo | Manicure, Laser, Viso";

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute("content", "Esteticamente Beauty & Nails a Gorle (Bergamo). Specializzati in epilazione laser diodo, manicure, pedicure e trattamenti viso personalizzati. Professionalità di Nicol.");
        }

        // JSON-LD Structured Data
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.innerHTML = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BeautySalon",
            "name": "Esteticamente Beauty & Nails",
            "image": "https://polytrak.io/assets/esteticamente/reception.jpg",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Viale G. Zavaritt, 230 A",
                "addressLocality": "Gorle",
                "addressRegion": "BG",
                "postalCode": "24020",
                "addressCountry": "IT"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": 45.7,
                "longitude": 9.7153
            },
            "url": "https://polytrak.io/clienti/esteticamente",
            "telephone": "+393519262305",
            "openingHoursSpecification": [
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "opens": "08:00",
                    "closes": "19:00"
                },
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": "Saturday",
                    "opens": "08:00",
                    "closes": "13:00"
                }
            ],
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "33"
            }
        });
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#FFFDF9]">
            <EstHeader />
            <main>
                <EstHero />
                <EstServizi />
                <EstAbout />
                <EstGallery />
                <EstContatti />
            </main>
            <EstFooter />
        </div>
    );
};

export default Esteticamente;
