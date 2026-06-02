-- ============================================================
-- InmoBot — Schema inicial
-- ============================================================

-- Inmobiliaria
CREATE TABLE IF NOT EXISTS inmobiliaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  telefono TEXT,
  whatsapp TEXT,
  email TEXT,
  direccion TEXT,
  ciudad TEXT DEFAULT 'Necochea',
  logo_url TEXT,
  chatbot_nombre TEXT DEFAULT 'Asistente',
  chatbot_prompt_extra TEXT,
  chatbot_activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Propiedades
CREATE TABLE IF NOT EXISTS propiedades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inmobiliaria_id UUID REFERENCES inmobiliaria(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  operacion TEXT NOT NULL,
  precio NUMERIC,
  moneda TEXT DEFAULT 'USD',
  precio_periodo TEXT,
  direccion TEXT,
  zona TEXT,
  metros_cuadrados NUMERIC,
  ambientes INTEGER,
  dormitorios INTEGER,
  banos INTEGER,
  cochera BOOLEAN DEFAULT false,
  apto_credito BOOLEAN DEFAULT false,
  descripcion TEXT,
  caracteristicas TEXT[],
  estado TEXT DEFAULT 'disponible',
  destacada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fotos de propiedades
CREATE TABLE IF NOT EXISTS fotos_propiedad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propiedad_id UUID REFERENCES propiedades(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  es_principal BOOLEAN DEFAULT false,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads capturados por el chatbot
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inmobiliaria_id UUID REFERENCES inmobiliaria(id),
  propiedad_id UUID REFERENCES propiedades(id),
  nombre TEXT,
  telefono TEXT,
  email TEXT,
  consulta TEXT,
  canal TEXT DEFAULT 'chatbot',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE inmobiliaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE propiedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_propiedad ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- inmobiliaria: lectura pública, escritura autenticada
CREATE POLICY "inmobiliaria_public_read" ON inmobiliaria
  FOR SELECT USING (true);
CREATE POLICY "inmobiliaria_auth_write" ON inmobiliaria
  FOR ALL USING (auth.role() = 'authenticated');

-- propiedades: lectura pública, escritura autenticada
CREATE POLICY "propiedades_public_read" ON propiedades
  FOR SELECT USING (true);
CREATE POLICY "propiedades_auth_write" ON propiedades
  FOR ALL USING (auth.role() = 'authenticated');

-- fotos_propiedad: lectura pública, escritura autenticada
CREATE POLICY "fotos_public_read" ON fotos_propiedad
  FOR SELECT USING (true);
CREATE POLICY "fotos_auth_write" ON fotos_propiedad
  FOR ALL USING (auth.role() = 'authenticated');

-- leads: inserción pública (chatbot), lectura autenticada
CREATE POLICY "leads_public_insert" ON leads
  FOR INSERT WITH CHECK (true);
CREATE POLICY "leads_auth_read" ON leads
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "leads_auth_delete" ON leads
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- Storage bucket para fotos
-- (ejecutar desde el Dashboard de Supabase o con la API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('fotos-propiedades', 'fotos-propiedades', true);

-- ============================================================
-- Datos de ejemplo (opcional)
-- ============================================================
-- INSERT INTO inmobiliaria (nombre, descripcion, ciudad, whatsapp, email, chatbot_nombre)
-- VALUES (
--   'Sur Propiedades',
--   'Inmobiliaria especializada en la costa atlántica',
--   'Necochea',
--   '+542262123456',
--   'contacto@surpropiedades.com',
--   'Asistente Sur'
-- );
