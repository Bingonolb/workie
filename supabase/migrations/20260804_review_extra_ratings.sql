-- Élargit les catégories notées pour être plus représentatif du feedback
-- Gen Z (flexibilité, reconnaissance, charge de travail, diversité), et
-- ajoute "reviendrais-tu travailler ici ?" à côté du recommend existant.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS rating_flexibility NUMERIC,
  ADD COLUMN IF NOT EXISTS rating_recognition NUMERIC,
  ADD COLUMN IF NOT EXISTS rating_workload NUMERIC,
  ADD COLUMN IF NOT EXISTS rating_diversity NUMERIC,
  ADD COLUMN IF NOT EXISTS would_return TEXT CHECK (would_return IN ('oui','peut_etre','non'));
