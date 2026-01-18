import { useState } from 'react';
import { MapPin, Phone, Clock, Send, CheckCircle, Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const orari = [
    { giorno: 'Lunedì', orario: '8:00 - 19:00' },
    { giorno: 'Martedì', orario: '8:00 - 19:00' },
    { giorno: 'Mercoledì', orario: '8:00 - 19:00' },
    { giorno: 'Giovedì', orario: '8:00 - 19:00' },
    { giorno: 'Venerdì', orario: '8:00 - 19:00' },
    { giorno: 'Sabato', orario: '8:00 - 13:00' },
    { giorno: 'Domenica', orario: 'Chiuso' },
];

const serviziOptions = [
    'Epilazione Laser Diodo',
    'Manicure / Pedicure',
    'Trattamenti Viso',
    'Trattamenti Corpo',
    'Altro',
];

interface FormData {
    nome: string;
    email: string;
    telefono: string;
    servizio: string;
    messaggio: string;
}

const EstContatti = () => {
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
            const { error: insertError } = await (supabase as any)
                .from('lead_generati')
                .insert({
                    nome: formData.nome,
                    email: formData.email,
                    telefono: formData.telefono || null,
                    servizio_interessato: formData.servizio || null,
                    messaggio: formData.messaggio || null,
                    cliente: 'esteticamente',
                    stato: 'nuovo',
                });

            if (insertError) {
                console.error('Supabase error:', insertError);
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
        <section id="contatti" className="py-24 bg-gradient-to-b from-[#FFFDF9] to-[#F5EBE0] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#C9A77C]/5 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Section header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-1.5 bg-[#E6D5C3] text-[#5D4E37] text-sm font-medium rounded-full mb-4">
                        Contatti
                    </span>
                    <h2 className="est-heading text-3xl sm:text-4xl md:text-5xl font-bold text-[#5D4E37] mb-4">
                        Fissa il tuo
                        <span className="block text-[#C9A77C]">Appuntamento</span>
                    </h2>
                    <div className="est-divider mx-auto mb-6" />
                    <p className="est-body text-lg text-[#8B8B8B] max-w-2xl mx-auto">
                        Siamo a tua disposizione per consulenze personalizzate e prenotazioni.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Form column */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#E6D5C3]/30 relative z-10">
                        {isSubmitted ? (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="est-heading text-2xl font-bold text-[#5D4E37] mb-4">
                                    Messaggio Inviato!
                                </h3>
                                <p className="est-body text-[#8B8B8B] mb-8">
                                    Grazie per averci contattato. Nicol ti risponderà il prima possibile.
                                </p>
                                <button
                                    onClick={resetForm}
                                    className="est-btn-primary"
                                >
                                    Invia un altro messaggio
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="est-heading text-2xl font-bold text-[#5D4E37] mb-8">Richiedi Informazioni</h3>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="nome" className="block text-sm font-medium text-[#5D4E37] mb-2">
                                                Nome e Cognome
                                            </label>
                                            <input
                                                type="text"
                                                id="nome"
                                                name="nome"
                                                required
                                                value={formData.nome}
                                                onChange={handleInputChange}
                                                className="est-input"
                                                placeholder="Il tuo nome"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="telefono" className="block text-sm font-medium text-[#5D4E37] mb-2">
                                                Telefono
                                            </label>
                                            <input
                                                type="tel"
                                                id="telefono"
                                                name="telefono"
                                                value={formData.telefono}
                                                onChange={handleInputChange}
                                                className="est-input"
                                                placeholder="Il tuo numero"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-[#5D4E37] mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="est-input"
                                            placeholder="la-tua@email.it"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="servizio" className="block text-sm font-medium text-[#5D4E37] mb-2">
                                            Servizio di interesse
                                        </label>
                                        <select
                                            id="servizio"
                                            name="servizio"
                                            value={formData.servizio}
                                            onChange={handleInputChange}
                                            className="est-input appearance-none bg-no-repeat bg-right pr-10 text-[#5D4E37]"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C9A77C'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '24px' }}
                                        >
                                            <option value="" className="text-[#8B8B8B]">Seleziona un servizio</option>
                                            {serviziOptions.map((servizio) => (
                                                <option key={servizio} value={servizio} className="text-[#5D4E37]">
                                                    {servizio}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="messaggio" className="block text-sm font-medium text-[#5D4E37] mb-2">
                                            Messaggio
                                        </label>
                                        <textarea
                                            id="messaggio"
                                            name="messaggio"
                                            rows={4}
                                            value={formData.messaggio}
                                            onChange={handleInputChange}
                                            className="est-input resize-none"
                                            placeholder="Scrivi qui il tuo messaggio..."
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm italic">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full est-btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
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

                    {/* Info column */}
                    <div className="space-y-8">
                        {/* Map or Address card */}
                        <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#E6D5C3]/30">
                            <h4 className="est-heading text-xl font-bold text-[#5D4E37] mb-6 flex items-center gap-2">
                                <MapPin className="w-6 h-6 text-[#C9A227]" />
                                Dove Siamo
                            </h4>
                            <div className="aspect-video rounded-2xl overflow-hidden mb-6 bg-gray-100 border border-[#E6D5C3]/20">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2777.671569430155!2d9.7153!3d45.7!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDQyJzAwLjAiTiA5wrA0MicyNS4xIkU!5e0!3m2!1sit!2sit!4v1705590000000!5m2!1sit!2sit"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                            <p className="est-body text-[#8B8B8B]">
                                Viale G. Zavaritt, 230 A<br />
                                24020 Gorle (BG)
                            </p>
                        </div>

                        {/* Contact Cards */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <a
                                href="tel:+393519262305"
                                className="bg-white rounded-2xl p-5 shadow-lg border border-[#E6D5C3]/30 est-card-hover block"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#F5EBE0] flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-6 h-6 text-[#C9A227]" />
                                    </div>
                                    <div>
                                        <h4 className="est-heading font-semibold text-[#5D4E37] mb-1">Telefono</h4>
                                        <p className="est-body text-lg font-medium text-[#C9A77C]">
                                            351 926 2305
                                        </p>
                                    </div>
                                </div>
                            </a>

                            <a
                                href="mailto:esteticamente.em@gmail.com"
                                className="bg-white rounded-2xl p-5 shadow-lg border border-[#E6D5C3]/30 est-card-hover block"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#F5EBE0] flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-6 h-6 text-[#C9A227]" />
                                    </div>
                                    <div>
                                        <h4 className="est-heading font-semibold text-[#5D4E37] mb-1">Email</h4>
                                        <p className="est-body text-sm font-medium text-[#C9A77C] break-all">
                                            esteticamente.em@gmail.com
                                        </p>
                                    </div>
                                </div>
                            </a>
                        </div>

                        {/* Opening hours */}
                        <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#E6D5C3]/30">
                            <h4 className="est-heading text-xl font-bold text-[#5D4E37] mb-6 flex items-center gap-2">
                                <Clock className="w-6 h-6 text-[#C9A227]" />
                                Orari di Apertura
                            </h4>
                            <div className="space-y-3">
                                {orari.map((item) => (
                                    <div
                                        key={item.giorno}
                                        className={`flex justify-between py-2 border-b border-[#F5EBE0] last:border-0 ${item.orario === 'Chiuso' ? 'text-[#8B8B8B]' : ''
                                            }`}
                                    >
                                        <span className="est-body text-sm text-[#5D4E37]">{item.giorno}</span>
                                        <span className={`est-body text-sm font-semibold ${item.orario === 'Chiuso' ? 'text-[#C9A77C]' : 'text-[#8B6914]'
                                            }`}>
                                            {item.orario}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EstContatti;
