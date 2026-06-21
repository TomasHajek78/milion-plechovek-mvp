-- SQL příkaz pro aktualizaci tabulky pickups a funkce admin_update_pickup v Supabase.
-- Zkopírujte celý tento kód a spusťte jej v "SQL Editoru" ve vaší administraci Supabase.
-- Tento patch přidá sloupec pro stav ověření a zajistí, že se při ruční úpravě v administraci
-- automaticky přepočítají ekologické hodnoty (váha, ušetřená energie, CO2) a označí se jako "ověřené" administrátorem.

-- 1. Přidání sloupce "is_verified" do tabulky "pickups", pokud ještě neexistuje
ALTER TABLE pickups ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 2. Vytvoření indexu pro rychlé vyhledávání neověřených řádků
CREATE INDEX IF NOT EXISTS idx_pickups_is_verified ON pickups(is_verified) WHERE is_verified = false;

-- 3. Aktualizace funkce admin_update_pickup
DROP FUNCTION IF EXISTS admin_update_pickup(uuid, text, text, text, text, boolean, jsonb, integer);

CREATE OR REPLACE FUNCTION admin_update_pickup(
    p_id uuid, 
    p_secret text, 
    p_nickname text, 
    p_team text, 
    p_notes text, 
    p_is_analyzed boolean, 
    p_analysis_json jsonb, 
    p_count integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_can jsonb;
    v_vol text;
    v_weight numeric;
    v_total_weight numeric := 0;
    v_energy numeric := 0;
    v_money numeric := 0;
    v_co2 numeric := 0;
BEGIN
    -- Ověření administrátorského hesla (akceptujeme jak původní, tak zjednodušené z PWA)
    IF p_secret != 'tomasadmin123' AND p_secret != 'milion2026' THEN
        RAISE EXCEPTION 'Neplatné administrátorské heslo';
    END IF;
    
    -- Přepočet váhy na základě položek v analysis_json
    IF p_analysis_json IS NOT NULL AND jsonb_typeof(p_analysis_json) = 'array' AND jsonb_array_length(p_analysis_json) > 0 THEN
        FOR v_can IN SELECT * FROM jsonb_array_elements(p_analysis_json) LOOP
            v_vol := coalesce(v_can->>'volume_liters', v_can->>'volume', 'Unknown');
            
            -- Váhy plechovek dle objemu
            IF v_vol = '0.5' OR v_vol = '0.5 L' OR v_vol = '0.5 l' THEN
                v_weight := 16.0;
            ELSIF v_vol = '0.44' OR v_vol = '0.44 L' OR v_vol = '0.44 l' THEN
                v_weight := 15.0;
            ELSIF v_vol = '0.33' OR v_vol = '0.33 L' OR v_vol = '0.33 l' THEN
                v_weight := 13.5;
            ELSIF v_vol = '0.25' OR v_vol = '0.25 L' OR v_vol = '0.25 l' THEN
                v_weight := 10.0;
            ELSIF v_vol = '0.2' OR v_vol = '0.2 L' OR v_vol = '0.2 l' THEN
                v_weight := 8.0;
            ELSE
                v_weight := 14.0;
            END IF;
            v_total_weight := v_total_weight + v_weight;
        END LOOP;
    ELSE
        -- Záložní výpočet podle počtu, pokud je seznam prázdný
        v_total_weight := p_count * 14.0;
    END IF;
    
    -- Výpočet ekologických úspor (ENERGY_SAVED_KWH_PER_KG = 14, CO2_SAVED_KG_PER_KG = 6.2)
    v_energy := round((v_total_weight / 1000.0) * 14.0, 3);
    v_money := round((v_total_weight / 1000.0) * 14.0, 2);
    v_co2 := round((v_total_weight / 1000.0) * 6.2, 2);
    
    -- Provedení samotné aktualizace řádku
    UPDATE pickups 
    SET nickname = p_nickname,
        team_code = p_team,
        notes = p_notes,
        is_analyzed = p_is_analyzed,
        analysis_json = p_analysis_json,
        count = p_count,
        aluminum_weight_g = round(v_total_weight, 2),
        energy_saved_kwh = v_energy,
        money_saved_czk = v_money,
        co2_saved_kg = v_co2,
        is_verified = true -- Označeno jako manuálně zkontrolované/opravené
    WHERE id = p_id;
    
    RETURN true;
END;
$$;
