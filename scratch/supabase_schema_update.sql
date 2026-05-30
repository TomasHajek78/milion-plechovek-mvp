-- SQL příkaz pro aktualizaci tabulky "pickups" v Supabase
-- Tento kód zkopírujte a spusťte v sekci "SQL Editor" ve vašem projektu na Supabase.

ALTER TABLE pickups 
ADD COLUMN IF NOT EXISTS is_analyzed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS analysis_json JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS aluminum_weight_g NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS energy_saved_kwh NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS money_saved_czk NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS co2_saved_kg NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_code TEXT;

-- Volitelně: Vytvoření indexu pro rychlé vyhledávání neanalyzovaných řádků
CREATE INDEX IF NOT EXISTS idx_pickups_is_analyzed ON pickups(is_analyzed) WHERE is_analyzed = false;

-- Volitelně: Vytvoření indexu pro rychlé vyhledávání týmů
CREATE INDEX IF NOT EXISTS idx_pickups_team_code ON pickups(team_code);
