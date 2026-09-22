# Courriels envoyés par Supabase

Ces deux courriels ne partent pas du code : Supabase les envoie lui-même,
depuis les modèles saisis dans son tableau de bord. Ils portaient encore
l'ancienne identité (dégradé violet, mot « workie » tapé en texte) sans que
rien dans le dépôt ne le montre.

Les voici versionnés. Pour les appliquer :

1. Tableau de bord Supabase → **Authentication** → **Emails** → **Templates**
2. **Confirm signup** : sujet « Confirmez votre adresse Workie », corps = `confirmation.html`
3. **Reset password** : sujet « Votre nouveau mot de passe Workie », corps = `reinitialisation.html`

Le logotype est servi par le site à `https://www.workie.ch/email-logo.png`,
en PNG : Gmail et Outlook refusent le SVG dans un courriel.

Si un modèle change ici, il faut le recoller là-bas : Supabase ne lit pas ce
dossier.
