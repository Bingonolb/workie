/**
 * Le filtre automatique d'une annonce, avant qu'elle parte en diffusion.
 *
 * Les annonces sont publiées dès le paiement, sans relecture humaine
 * préalable : faire patienter un annonceur qui vient de payer, sans lui
 * annoncer de délai, est le meilleur moyen de le perdre. Deux garde-fous
 * remplacent ce blocage. Celui-ci, automatique, refuse à la création ce qui se
 * détecte sans humain. Et le signalement, qui met une annonce en pause dès que
 * deux personnes distinctes la remontent.
 *
 * Le service utilisé est le point de modération d'OpenAI, qui lit le texte et
 * l'image. Il est gratuit, et `omni-moderation-latest` est le seul de ses
 * modèles qui accepte une image.
 *
 * Sans clé configurée, la fonction laisse passer. C'est délibéré : couper les
 * ventes parce qu'une variable d'environnement manque serait une panne plus
 * sûre que le risque qu'on cherche à écarter, et le signalement reste en
 * place. L'absence de clé est journalisée pour qu'elle ne passe pas inaperçue.
 */

/** Ce qu'on refuse. Les autres catégories du service sont ignorées. */
const CATEGORIES_REFUSEES: Record<string, string> = {
  "sexual": "contenu à caractère sexuel",
  "sexual/minors": "contenu sexuel impliquant des mineurs",
  "violence": "violence",
  "violence/graphic": "violence explicite",
  "hate": "propos haineux",
  "hate/threatening": "menaces haineuses",
  "harassment": "harcèlement",
  "harassment/threatening": "menaces",
  "self-harm": "incitation à l'automutilation",
  "self-harm/intent": "incitation à l'automutilation",
  "self-harm/instructions": "incitation à l'automutilation",
  "illicit": "activité illégale",
  "illicit/violent": "activité illégale et violente",
};

type Verdict = { refusee: false } | { refusee: true; motif: string };

export async function verifierAnnonce(annonce: {
  headline: string;
  bodyText?: string | null;
  imageUrl?: string | null;
}): Promise<Verdict> {
  const cle = process.env.OPENAI_API_KEY;
  if (!cle) {
    console.warn("[moderation] OPENAI_API_KEY absente : l'annonce part sans filtre automatique.");
    return { refusee: false };
  }

  const texte = [annonce.headline, annonce.bodyText].filter(Boolean).join("\n");
  const entrees: unknown[] = [{ type: "text", text: texte }];
  if (annonce.imageUrl) {
    entrees.push({ type: "image_url", image_url: { url: annonce.imageUrl } });
  }

  try {
    // Le délai est court et l'échec laisse passer : la création d'une campagne
    // ne peut pas dépendre de la disponibilité d'un service tiers.
    const reponse = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cle}` },
      body: JSON.stringify({ model: "omni-moderation-latest", input: entrees }),
      signal: AbortSignal.timeout(8000),
    });
    if (!reponse.ok) {
      console.error("[moderation] réponse", reponse.status);
      return { refusee: false };
    }

    const donnees = await reponse.json() as {
      results?: { flagged: boolean; categories: Record<string, boolean> }[];
    };

    for (const resultat of donnees.results ?? []) {
      if (!resultat.flagged) continue;
      for (const [categorie, active] of Object.entries(resultat.categories ?? {})) {
        if (active && CATEGORIES_REFUSEES[categorie]) {
          return { refusee: true, motif: CATEGORIES_REFUSEES[categorie] };
        }
      }
    }
    return { refusee: false };
  } catch (e) {
    console.error("[moderation]", e);
    return { refusee: false };
  }
}
