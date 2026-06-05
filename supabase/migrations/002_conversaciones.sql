-- Tabla para guardar conversaciones completas del chatbot
CREATE TABLE IF NOT EXISTS conversaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inmobiliaria_id UUID REFERENCES inmobiliaria(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  tiene_lead BOOLEAN DEFAULT FALSE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único para upsert por sesión
CREATE UNIQUE INDEX IF NOT EXISTS conversaciones_session_idx
  ON conversaciones(inmobiliaria_id, session_id);

-- Índice para queries por fecha
CREATE INDEX IF NOT EXISTS conversaciones_created_idx
  ON conversaciones(inmobiliaria_id, created_at DESC);

-- RLS
ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert conversaciones" ON conversaciones
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update conversaciones" ON conversaciones
  FOR UPDATE USING (true);

CREATE POLICY "Auth read conversaciones" ON conversaciones
  FOR SELECT USING (auth.role() = 'authenticated');

-- Columnas de calificación en leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS presupuesto TEXT,
  ADD COLUMN IF NOT EXISTS plazo TEXT,
  ADD COLUMN IF NOT EXISTS tipo_busqueda TEXT,
  ADD COLUMN IF NOT EXISTS necesita_financiacion BOOLEAN;

-- Índice único parcial para upsert de leads por sesión
CREATE UNIQUE INDEX IF NOT EXISTS leads_session_idx
  ON leads(session_id) WHERE session_id IS NOT NULL;
