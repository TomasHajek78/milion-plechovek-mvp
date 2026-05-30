-- SQL příkaz pro přidání sloupce "is_verified" do tabulky "pickups" v Supabase.
-- Zkopírujte tento kód a spusťte jej v sekci "SQL Editor" ve vaší administraci Supabase.

ALTER TABLE pickups 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Volitelně: Vytvoření indexu pro rychlé vyhledávání neověřených řádků
CREATE INDEX IF NOT EXISTS idx_pickups_is_verified ON pickups(is_verified) WHERE is_verified = false;

-- Pokud chcete, můžete všechny dosud existující zpracované sběry jednorázově označit jako ověřené:
-- UPDATE pickups SET is_verified = true WHERE is_analyzed = true;
