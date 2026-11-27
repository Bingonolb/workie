# Contrôle du parcours entreprise, avant chaque mise en ligne

Les tests automatiques (`npx vitest run`) gardent les règles : activation
après paiement (`activation-paiement.test.ts`), reprise d'une demande et
sécurité du retour de paiement (`parcours-revendication.test.ts`). Cette liste
couvre ce qu'ils ne voient pas : le parcours réel, dans un vrai navigateur.

À faire sur **workie-test**, avec la fiche de test **Wevenz Sàrl**, une fois en
français et une fois en allemand (`/de/…`), une fois sur ordinateur et une fois
sur téléphone. Avant de commencer : effacer le compte de test et sa demande.

## Prérequis

- [ ] `STRIPE_WEBHOOK_SECRET` (Vercel, Production et Preview) = la clé de
      signature de la destination « workie-webhook » dans Stripe. Contrôle :
      Stripe → Webhooks → workie-webhook → taux d'erreur à 0 %.
- [ ] Prix de test actifs sur l'essai : `ABO_PRIX_TEST` = 1,
      `NEXT_PUBLIC_PRIX_PUB_TEST` = 5. Jamais en production.

## 1. Demande

- [ ] Recherche « wevenz » → la fiche → ⋯ → « Gérer la fiche ».
- [ ] Formulaire : téléphone obligatoire, mot de passe deux fois, l'œil
      affiche et masque, deux mots de passe différents bloquent l'envoi.
- [ ] Code reçu par e-mail, dans la bonne langue ; mauvais code refusé.

## 2. Attente de validation

- [ ] Après le code : écran « Demande reçue ».
- [ ] Fermer le navigateur. Rouvrir la page plus tard, connecté : toujours
      « Demande reçue », jamais le formulaire.
- [ ] Admin (sur workie-test) : la demande montre nom, fonction, e-mail et
      téléphone cliquable. Accepter.

## 3. Paiement

- [ ] E-mail « demande acceptée », lien vers workie-test.
- [ ] Lien ouvert sans être connecté : « Reprenez votre demande », adresse
      masquée, puis connexion et arrivée au paiement.
- [ ] Lien ouvert connecté avec un autre compte : « Changer de compte ».
- [ ] Page Stripe : 1,00 CHF, bonne langue.
- [ ] Retour : indicateur « Ouverture de votre espace… », puis l'espace
      s'ouvre seul en moins de 30 secondes.
- [ ] Un seul e-mail « abonnement actif ».

## 4. Espace entreprise

- [ ] Menus : « Entreprise » à la place de « Profil » (haut et bas), la
      pastille en haut à droite mène au profil.
- [ ] En-tête Workie Business, état de l'abonnement, onglets ; sur téléphone
      l'onglet ouvert est visible.
- [ ] Tableau de bord : 6 chiffres (visites, postuler, votre site, favoris,
      partages, rang), toucher un chiffre change la courbe, 7/30/90 jours.
- [ ] Profil : carte « Votre entreprise » (nom, fonction, e-mail, téléphone),
      en lecture seule.
- [ ] Modifier la description, la bannière, le logo : visible sur la fiche.
- [ ] En coulisses : ajouter 2 photos (aperçu, « Envoi… », fondu), légende,
      ordre, retrait ; sur la fiche : mosaïque (ordinateur), bande
      (téléphone), plein écran.
- [ ] Ajouter, modifier, retirer une offre.
- [ ] Pub : création depuis l'onglet Publicités, page Stripe à 5,00 CHF,
      retour dans l'onglet : la campagne est « Active » tout de suite.

## 4 bis. Statistiques (depuis un autre appareil, sans compte)

- [ ] Ouvrir la fiche : +1 visite (pas plus en rechargeant le même jour).
- [ ] Cliquer « Offres d'emploi » : +1 « Votre site ».
- [ ] Partager la fiche : +1 « Partages ». Le lien partagé ouvre bien la
      fiche (workie-test sur l'essai, workie.ch en production).
- [ ] Les mêmes gestes faits par le compte de l'entreprise ne comptent pas.

## 5. Fin d'abonnement

- [ ] Abonnement → « Gérer mon abonnement » → résilier sur Stripe.
- [ ] De retour sur Workie : « Résiliation programmée » et la date de fin.

## Cas limites

- [ ] Payer deux fois de suite (deux onglets) : un seul abonnement actif.
- [ ] Retour de paiement avec l'adresse tronquée (sans `session=`) : l'espace
      s'ouvre quand même.
- [ ] Demande refusée par l'admin : e-mail de refus, la page propose de
      recommencer.
