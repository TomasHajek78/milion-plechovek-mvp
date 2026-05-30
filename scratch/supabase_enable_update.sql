-- SQL příkazy pro povolení aktualizace řádků (UPDATE) v Supabase.
-- Zkopírujte a spusťte v SQL Editoru v administraci Supabase.

-- Možnost 1 (Nejjednodušší pro MVP): Vypnutí Row Level Security (RLS) na tabulce pickups.
-- Tím se tabulka plně zpřístupní pro čtení, zápis i aktualizace přes API.
ALTER TABLE pickups DISABLE ROW LEVEL SECURITY;

-- Možnost 2 (Pokud chcete zachovat RLS zapnuté): Povolení politik pro UPDATE pro anonymní uživatele.
-- Odkomentujte a spusťte tyto řádky, pokud nechcete RLS vypínat:
-- CREATE POLICY "Allow anon update" ON pickups FOR UPDATE TO anon USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow anon update public" ON pickups FOR UPDATE TO public USING (true) WITH CHECK (true);
