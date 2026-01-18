import { useEffect } from 'react';
import KatyHeader from '@/components/clienti/katy/KatyHeader';
import KatyHero from '@/components/clienti/katy/KatyHero';
import KatyServizi from '@/components/clienti/katy/KatyServizi';
import KatyAbout from '@/components/clienti/katy/KatyAbout';
import KatyGallery from '@/components/clienti/katy/KatyGallery';
import KatyContatti from '@/components/clienti/katy/KatyContatti';
import KatyFooter from '@/components/clienti/katy/KatyFooter';
import '@/components/clienti/katy/katy-styles.css';

const CentroKaty = () => {
    useEffect(() => {
        // Set page title
        document.title = 'Centro Estetico Katy | Trattamenti Viso, Corpo, Mani a Seriate Bergamo';

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', 'Centro Estetico Katy a Seriate (Bergamo) - Da oltre 20 anni trattamenti professionali viso, corpo, manicure, pedicure ed epilazione. Prenota il tuo appuntamento!');
        } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = 'Centro Estetico Katy a Seriate (Bergamo) - Da oltre 20 anni trattamenti professionali viso, corpo, manicure, pedicure ed epilazione. Prenota il tuo appuntamento!';
            document.head.appendChild(meta);
        }

        // Add structured data
        const existingScript = document.getElementById('katy-structured-data');
        if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'katy-structured-data';
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BeautySalon",
                "name": "Centro Estetico Katy",
                "image": "https://katy.polytrak.io/assets/katy/katy-portrait.jpg",
                "description": "Centro estetico professionale a Seriate, Bergamo. Trattamenti viso, corpo, manicure, pedicure, epilazione da oltre 20 anni.",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Via G. Venezian, 50/3",
                    "addressLocality": "Seriate",
                    "addressRegion": "BG",
                    "postalCode": "24068",
                    "addressCountry": "IT"
                },
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": 45.684857,
                    "longitude": 9.728184
                },
                "telephone": "+39035301973",
                "url": "https://katy.polytrak.io",
                "priceRange": "€€",
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "ratingCount": "8"
                },
                "openingHoursSpecification": [
                    {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                        "opens": "09:00",
                        "closes": "19:00"
                    },
                    {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": "Saturday",
                        "opens": "09:00",
                        "closes": "13:00"
                    }
                ],
                "sameAs": [
                    "https://www.facebook.com/CentroEsteticoKaty"
                ]
            });
            document.head.appendChild(script);
        }

        // Cleanup on unmount
        return () => {
            const scriptToRemove = document.getElementById('katy-structured-data');
            if (scriptToRemove) {
                scriptToRemove.remove();
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-white overflow-x-hidden">
            <KatyHeader />
            <main>
                <KatyHero />
                <KatyServizi />
                <KatyAbout />
                <KatyGallery />
                <KatyContatti />
            </main>
            <KatyFooter />
        </div>
    );
};

export default CentroKaty;
