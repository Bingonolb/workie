-- Empêche l'énumération des comptes par le stockage.
--
-- Le bucket avatars range les fichiers sous {userId}/{uuid}.ext, et sa
-- politique de lecture couvrait tout le bucket pour le rôle public. Or
-- l'endpoint /storage/v1/object/list s'appuie sur cette même politique :
-- n'importe qui pouvait donc lister le bucket et récupérer les UUID
-- d'authentification des utilisateurs. Vérifié en production avec la seule clé
-- anon, la requête renvoyait les identifiants des comptes existants — c'est
-- exactement l'énumération que l'architecture veut rendre impossible.
--
-- Le bucket reste public : les images continuent d'être servies par
-- /storage/v1/object/public/..., chemin qui ne consulte pas les politiques.
-- Seul le listage, qui lui les consulte, se referme. Vérifié après coup :
-- listage vide, et l'avatar répond toujours 200.
--
-- Deux politiques faisaient doublon sur avatars (« avatars publicly readable »
-- et « public_read_avatars ») ; elles disparaissent toutes les deux.
drop policy if exists "avatars publicly readable" on storage.objects;
drop policy if exists "public_read_avatars"       on storage.objects;
drop policy if exists "watch photos publicly readable" on storage.objects;

-- Un utilisateur connecté garde la main sur son propre dossier, ce dont
-- dépendent le remplacement et la suppression de son avatar.
create policy "avatars_read_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "watch_photos_read_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'watch-photos' and (select auth.uid())::text = (storage.foldername(name))[1]);

-- Bornes d'envoi : ces buckets acceptaient n'importe quel type de fichier et
-- n'importe quelle taille. Un avatar de 1,3 Mo a été mesuré en production, ce
-- qui pèse d'abord sur les visiteurs qui l'affichent.
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
 where id in ('avatars','watch-photos');

update storage.buckets
   set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
 where id = 'covers';
