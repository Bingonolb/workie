-- Année de naissance — collectée au signup pour connaître la répartition
-- générationnelle des utilisateurs. Volontairement une année seule (pas de
-- date complète) pour rester cohérent avec l'anonymat de la plateforme.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_year INTEGER
  CHECK (birth_year IS NULL OR (birth_year >= 1920 AND birth_year <= EXTRACT(YEAR FROM now())::int - 13));
