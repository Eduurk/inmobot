-- ============================================================
-- PresuBot — Tablas exclusivas de inventario genérico
-- NO modifica ninguna tabla existente de InmoBot
-- ============================================================

-- Productos / Materiales
CREATE TABLE IF NOT EXISTS presubot_productos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku          TEXT,
  nombre       TEXT NOT NULL,
  stock_actual NUMERIC DEFAULT 0,
  precio_venta NUMERIC,
  creado_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS presubot_productos_nombre_idx
  ON presubot_productos USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS presubot_productos_sku_idx
  ON presubot_productos (sku)
  WHERE sku IS NOT NULL;

-- Movimientos de stock
CREATE TABLE IF NOT EXISTS presubot_movimientos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id       UUID NOT NULL REFERENCES presubot_productos(id) ON DELETE CASCADE,
  cantidad          NUMERIC NOT NULL,
  tipo_movimiento   TEXT NOT NULL CHECK (tipo_movimiento IN ('entrada_factura', 'venta_web')),
  remito_referencia TEXT,
  creado_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS presubot_movimientos_producto_idx
  ON presubot_movimientos (producto_id);
CREATE INDEX IF NOT EXISTS presubot_movimientos_tipo_idx
  ON presubot_movimientos (tipo_movimiento);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE presubot_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presubot_movimientos ENABLE ROW LEVEL SECURITY;

-- Chatbot puede leer productos (consulta de stock)
CREATE POLICY "presubot_productos_public_read" ON presubot_productos
  FOR SELECT USING (true);

-- Sólo service role / autenticado puede escribir
CREATE POLICY "presubot_productos_auth_write" ON presubot_productos
  FOR ALL USING (auth.role() = 'authenticated');

-- Movimientos: lectura y escritura autenticada
CREATE POLICY "presubot_movimientos_auth_all" ON presubot_movimientos
  FOR ALL USING (auth.role() = 'authenticated');
