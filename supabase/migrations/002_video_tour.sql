-- ============================================================
-- InmoBot — Tour virtual narrado
-- ============================================================

ALTER TABLE propiedades
  ADD COLUMN IF NOT EXISTS audio_tour_url TEXT,
  ADD COLUMN IF NOT EXISTS audio_tour_script JSONB,
  ADD COLUMN IF NOT EXISTS audio_tour_estado TEXT DEFAULT 'none';

-- audio_tour_estado: 'none' | 'generating' | 'done' | 'error'

-- Storage bucket para audios de tour (ejecutar desde Dashboard de Supabase)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('tours-propiedades', 'tours-propiedades', true);
