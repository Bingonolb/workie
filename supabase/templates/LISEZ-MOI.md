# Courriels envoyés par Supabase

Ces deux courriels ne partent pas du code : Supabase les envoie lui-même,
depuis les modèles saisis dans son tableau de bord. Ils portaient encore
l'ancienne identité (dégradé violet, mot « workie » tapé en texte) sans que
rien dans le dépôt ne le montre.

Les voici versionnés. Pour les appliquer :

1. Tableau de bord Supabase → **Authentication** → **Emails** → **Templates**
2. **Confirm signup** : sujet `{{ if eq .Data.langue "de" }}Bestätigen Sie Ihre Workie-Adresse{{ else }}Confirmez votre adresse Workie{{ end }}`, corps = `confirmation.html`
3. **Reset password** : sujet `{{ if eq .Data.langue "de" }}Ihr neues Workie-Passwort{{ else }}Votre nouveau mot de passe Workie{{ end }}`, corps = `reinitialisation.html`

Le logotype est servi par le site à `https://www.workie.ch/email-logo.png`,
en PNG : Gmail et Outlook refusent le SVG dans un courriel.

Si un modèle change ici, il faut le recoller là-bas : Supabase ne lit pas ce
dossier.

## Le bouton pointe vers workie.ch

Le bouton n'utilise pas `{{ .ConfirmationURL }}`, qui mène à
`xtbdxfzbbuedlktpqpna.supabase.co` : un lien vers un domaine étranger à
l'expéditeur fait classer le courriel en indésirables par Outlook (SCL 5 malgré
SPF, DKIM et DMARC valides). Il mène à `{{ .SiteURL }}/auth/callback?token_hash=…&type=…`, que
`/auth/callback` vérifie lui-même. On part de l'adresse du site plutôt que de
`RedirectTo` : celle-ci dépend de la liste des retours autorisés de Supabase.

## La langue

Les deux modèles choisissent leur langue avec `.Data.langue`, la langue
enregistrée dans le compte à l'inscription (`user_metadata.langue`, posée par
`signUp`). Sans cette donnée (comptes plus anciens, connexion Google), c'est le
français.
