# Pravidla a přihlašovací údaje pro projekt Milion plechovek

Tento soubor obsahuje trvalá pravidla a přihlašovací údaje, které si jako AI asistent musím zapamatovat pro budoucí práci na tomto codebase.

## Administrátorská hesla a oprávnění
- **Původní / Databázové heslo**: `tomasadmin123`
  - Toto heslo se používá pro ověření na úrovni databázových funkcí (RPC v Supabase), jako jsou `admin_update_pickup` a `admin_delete_pickup`.
- **Klientské heslo v PWA**: `milion2026`
  - Toto heslo zadává Tomáš (administrátor) do uživatelského rozhraní mobilní aplikace.
- **Kompatibilita a překlad**:
  - Na klientské straně (ve frontendu) se zadané heslo `milion2026` automaticky překládá na `tomasadmin123` před odesláním požadavku do databáze, aby byla zachována zpětná kompatibilita a bezpečnost.
