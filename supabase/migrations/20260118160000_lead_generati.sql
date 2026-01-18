-- Tabella lead_generati per Centro Estetico Katy e futuri clienti
-- Questa tabella è isolata e non influenza il funzionamento di Polytrak

CREATE TABLE IF NOT EXISTS public.lead_generati (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  messaggio TEXT,
  servizio_interessato TEXT,
  cliente TEXT DEFAULT 'centro-katy' NOT NULL,
  stato TEXT DEFAULT 'nuovo' NOT NULL
);

-- Commento per documentazione
COMMENT ON TABLE public.lead_generati IS 'Lead generati dalle landing page dei clienti di Polytrak';

-- Indice per query per cliente
CREATE INDEX IF NOT EXISTS idx_lead_generati_cliente ON public.lead_generati(cliente);

-- Indice per stato dei lead
CREATE INDEX IF NOT EXISTS idx_lead_generati_stato ON public.lead_generati(stato);

-- Abilita RLS (Row Level Security)
ALTER TABLE public.lead_generati ENABLE ROW LEVEL SECURITY;

-- Policy: Chiunque può inserire un lead (form pubblico)
CREATE POLICY "Inserimento lead pubblico" ON public.lead_generati
  FOR INSERT 
  WITH CHECK (true);

-- Policy: Solo utenti autenticati possono leggere i lead (per dashboard futura)
CREATE POLICY "Lettura lead autenticati" ON public.lead_generati
  FOR SELECT 
  USING (auth.role() = 'authenticated');
