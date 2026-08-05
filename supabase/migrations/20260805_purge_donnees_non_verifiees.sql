-- Purge des données d'entreprise présentées comme des faits sans source.
--
-- Constat à l'origine (mesuré en base) :
--   - avg_salary_chf : 529 entreprises affichaient un salaire moyen alors que
--     14 seulement avaient un salaire déclaré dans un avis. Le trigger
--     update_company_stats ne calcule ce champ que depuis les avis publiés :
--     les ~515 autres valeurs avaient été pré-remplies. Le site annonce
--     pourtant « salaires réels en Suisse ».
--   - employee_range : échelles incompatibles mélangées (« 1000+ », « 1001-5000 »,
--     « 10000+ », « 10001+ »), et 4 entreprises seulement en « 1-10 » dans un
--     pays dominé par les micro-entreprises. Non sourcé.
--   - description : prose générée par gabarit sectoriel. Ulysse Nardin et une
--     bijouterie de quartier partageaient le même texte mot pour mot.
--   - is_verified : 414 badges « vérifié » alors qu'aucun processus de
--     vérification n'existe (3 revendications approuvées au total).
--   - founded_year : exact pour quelques marques connues, inventé pour le reste,
--     sans moyen de distinguer les deux.
--
-- Les valeurs sont conservées dans companies_donnees_non_verifiees_backup :
-- l'opération reste réversible tant que cette table existe.

UPDATE public.companies
SET avg_salary_chf = NULL
WHERE avg_salary_chf IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.company_id = companies.id
      AND r.salary_chf IS NOT NULL
      AND COALESCE(r.status, 'published') = 'published'
  );

UPDATE public.companies SET
  description    = NULL,
  employee_range = NULL,
  founded_year   = NULL,
  is_verified    = false;

-- Plus de valeur par défaut : une taille non saisie doit rester inconnue
-- plutôt que d'affirmer « 51-200 » sans source.
ALTER TABLE public.companies ALTER COLUMN employee_range DROP DEFAULT;
