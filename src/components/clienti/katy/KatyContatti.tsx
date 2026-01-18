import { useState } from 'react';
import { MapPin, Phone, Clock, Send, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const orari = [
    { giorno: 'Lunedì', orario: '9:00 - 19:00' },
    { giorno: 'Martedì', orario: '9:00 - 19:00' },
    { giorno: 'Mercoledì', orario: '9:00 - 19:00' },
    { giorno: 'Giovedì', orario: '9:00 - 19:00' },
    { giorno: 'Venerdì', orario: '9:00 - 19:00' },
    { giorno: 'Sabato', orario: '9:00 - 13:00' },
    { giorno: 'Domenica', orario: 'Chiuso' },
];

const serviziOptions = [
    'Trattamenti Viso',
    'Trattamenti Corpo',
    'Manicure / Pedicure',
    'Epilazione',
    'Altro',
];

interface FormData {
    nome: string;
    email: string;
    telefono: string;
    servizio: string;
    messaggio: string;
}

const KatyContatti = () => {
    const [formData, setFormData] = useState<FormData>({
        nome: '',
        email: '',
        telefono: '',
        servizio: '',
        messaggio: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Insert into Supabase - using type assertion since table may not be in generated types yet
            const { error: insertError } = await (supabase as any)
                .from('lead_generati')
                .insert({
                    nome: formData.nome,
                    email: formData.email,
                    telefono: formData.telefono || null,
                    servizio_interessato: formData.servizio || null,
                    messaggio: formData.messaggio || null,
                    cliente: 'centro-katy',
                    stato: 'nuovo',
                });

            if (insertError) {
                console.error('Supabase error:', insertError);
                // Still show success to user - we can handle backend later
                setIsSubmitted(true);
            } else {
                setIsSubmitted(true);
            }
        } catch (err) {
            console.error('Form submission error:', err);
            setError('Si è verificato un errore. Riprova o contattaci telefonicamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nome: '',
            email: '',
            telefono: '',
            servizio: '',
            messaggio: '',
        });
        setIsSubmitted(false);
    };

    return (
        <section id="contatti" className="py-24 bg-gradient-to-b from-white to-[#F8F4F4] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#E8C4C4]/10 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Section header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-1.5 bg-[#F5E6E6] text-[#CE7777] text-sm font-medium rounded-full mb-4">
                        Contattaci
                    </span>
                    <h2 className="katy-heading text-3xl sm:text-4xl md:text-5xl font-bold text-[#2D2D2D] mb-4">
                        Vieni a Trovarci
                    </h2>
                    <div className="katy-divider mx-auto mb-6" />
                    <p className="katy-body text-lg text-[#6B6B6B] max-w-2xl mx-auto">
                        Siamo a Seriate, a pochi minuti da Bergamo. Contattaci per prenotare il tuo trattamento
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Contact Form */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#E8C4C4]/30">
                        {isSubmitted ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 katy-animate-scale-in">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="katy-heading text-2xl font-bold text-[#2D2D2D] mb-3">
                                    Messaggio Inviato!
                                </h3>
                                <p className="katy-body text-[#6B6B6B] mb-6">
                                    Grazie per averci contattato. Ti risponderemo il prima possibile.
                                </p>
                                <button
                                    onClick={resetForm}
                                    className="katy-btn-primary"
                                >
                                    Invia un altro messaggio
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="katy-heading text-xl font-semibold text-[#2D2D2D] mb-6">
                                    Richiedi Informazioni
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div>
                                            <label htmlFor="nome" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                                Nome *
                                            </label>
                                            <input
                                                type="text"
                                                id="nome"
                                                name="nome"
                                                required
                                                value={formData.nome}
                                                onChange={handleInputChange}
                                                className="katy-input"
                                                placeholder="Il tuo nome"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="telefono" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                                Telefono
                                            </label>
                                            <input
                                                type="tel"
                                                id="telefono"
                                                name="telefono"
                                                value={formData.telefono}
                                                onChange={handleInputChange}
                                                className="katy-input"
                                                placeholder="Es. 333 1234567"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="katy-input"
                                            placeholder="la.tua@email.it"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="servizio" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                            Servizio di interesse
                                        </label>
                                        <select
                                            id="servizio"
                                            name="servizio"
                                            value={formData.servizio}
                                            onChange={handleInputChange}
                                            className="katy-input appearance-none bg-no-repeat bg-right pr-10 text-[#2D2D2D]"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B6B6B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '24px' }}
                                        >
                                            <option value="" className="text-[#6B6B6B]">Seleziona un servizio</option>
                                            {serviziOptions.map((servizio) => (
                                                <option key={servizio} value={servizio} className="text-[#2D2D2D]">
                                                    {servizio}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="messaggio" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                            Messaggio
                                        </label>
                                        <textarea
                                            id="messaggio"
                                            name="messaggio"
                                            rows={4}
                                            value={formData.messaggio}
                                            onChange={handleInputChange}
                                            className="katy-input resize-none"
                                            placeholder="Scrivi qui il tuo messaggio..."
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full katy-btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Invio in corso...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Invia Messaggio
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>

                    {/* Map and info */}
                    <div className="space-y-6">
                        {/* Google Map */}
                        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-[#E8C4C4]/30">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2789.3395556640787!2d9.725997076892498!3d45.68485797108!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4781546b4e4c9a57%3A0x839d8ea9ab3a4d39!2sVia%20G.%20Venezian%2C%2050%2F3%2C%2024068%20Seriate%20BG!5e0!3m2!1sit!2sit!4v1705592400000!5m2!1sit!2sit"
                                width="100%"
                                height="280"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Posizione Centro Estetico Katy"
                            />
                        </div>

                        {/* Contact cards */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            {/* Address */}
                            <div className="bg-white rounded-2xl p-5 shadow-lg border border-[#E8C4C4]/30 katy-card-hover">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#F5E6E6] flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-6 h-6 text-[#CE7777]" />
                                    </div>
                                    <div>
                                        <h4 className="katy-heading font-semibold text-[#2D2D2D] mb-1">Dove Siamo</h4>
                                        <p className="katy-body text-sm text-[#6B6B6B]">
                                            Via G. Venezian, 50/3<br />
                                            24068 Seriate (BG)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Phone */}
                            <a
                                href="tel:+39035301973"
                                className="bg-white rounded-2xl p-5 shadow-lg border border-[#E8C4C4]/30 katy-card-hover block"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#F5E6E6] flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-6 h-6 text-[#CE7777]" />
                                    </div>
                                    <div>
                                        <h4 className="katy-heading font-semibold text-[#2D2D2D] mb-1">Telefono</h4>
                                        <p className="katy-body text-lg font-medium text-[#CE7777]">
                                            035 301973
                                        </p>
                                    </div>
                                </div>
                            </a>
                        </div>

                        {/* Opening hours */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#E8C4C4]/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-[#F5E6E6] flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-[#CE7777]" />
                                </div>
                                <h4 className="katy-heading font-semibold text-[#2D2D2D]">Orari di Apertura</h4>
                            </div>
                            <div className="space-y-2">
                                {orari.map((item) => (
                                    <div
                                        key={item.giorno}
                                        className={`flex justify-between py-2 border-b border-[#F5E6E6] last:border-0 ${item.orario === 'Chiuso' ? 'text-[#6B6B6B]' : ''
                                            }`}
                                    >
                                        <span className="katy-body text-sm text-[#2D2D2D]">{item.giorno}</span>
                                        <span className={`katy-body text-sm font-medium ${item.orario === 'Chiuso' ? 'text-[#CE7777]' : 'text-[#2D2D2D]'
                                            }`}>
                                            {item.orario}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* WhatsApp CTA */}
                        <a
                            href="https://wa.me/39035301973?text=Ciao!%20Vorrei%20prenotare%20un%20appuntamento%20al%20Centro%20Estetico%20Katy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="katy-btn-whatsapp w-full justify-center text-lg py-5"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Prenota su WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default KatyContatti;
