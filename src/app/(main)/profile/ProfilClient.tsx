"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProfileForm } from "@/components/ProfileForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { SignOutButton } from "@/components/SignOutButton";
import type { Profile } from "@/lib/types";
import { lireCache, obtenir, CLE_PROFIL } from "@/lib/cacheSession";
import { CoverImage } from "@/components/CoverImage";
// Les tuiles portaient des emojis dans un carre teinte. Le dessin d'un emoji
// appartient au systeme d'exploitation : il change d'un appareil a l'autre,
// n'a ni la graisse ni la geometrie des icones utilisees partout ailleurs sur
// le site, et se colore tout seul en travers de la teinte de la tuile.
import { Flame, Megaphone, Download, ChevronRight } from "lucide-react";

type Donnees = {
  authentifie: boolean;
  email: string;
  creeLe: string | null;
  profile: Profile | null;
  recentes: { id: string; name: string; city: string; subsector: string | null; cover_url: string | null; cover_color: string | null; is_verified: boolean | null }[];
  favCount: number;
  adsActives: number;
  adsTotal: number;
};

/**
 * Contenu de /profile, chargé après affichage.
 *
 * La page était rendue à la demande, ce qui imposait à chaque visite la
 * validation du jeton auprès de Supabase puis trois requêtes en base avant le
 * premier octet. La coquille part maintenant du cache et tout arrive ici en un
 * seul aller-retour vers /api/user/profile.
 *
 * La mise en page est identique pendant l'attente et après : mêmes blocs,
 * mêmes hauteurs, seules les valeurs changent. C'est ce qui évite que le
 * contenu saute quand les données arrivent.
 */
export function ProfilClient() {
  // On repart de la dernière réponse connue : au retour sur la page, le
  // contenu est là avant même le premier rendu, plus de squelette à revoir.
  // Forme vérifiée avant usage : une valeur inattendue en mémoire ne doit
  // jamais faire tomber la page, elle doit simplement être ignorée.
  const [depuisMemoire] = useState(() => {
    const c = lireCache<Donnees>(CLE_PROFIL);
    return c && Array.isArray(c.recentes) ? c : null;
  });
  const [d, setD] = useState<Donnees | null>(depuisMemoire);
  const [echec, setEchec] = useState(false);

  useEffect(() => {
    let annule = false;
    // La barre de navigation a souvent déjà lancé cet appel : `obtenir`
    // partage la requête en cours au lieu d'en ouvrir une seconde.
    obtenir<Donnees>(CLE_PROFIL, "/api/user/profile")
      .then(({ statut, donnees }) => {
        // Session expirée entre le service de la coquille et cet appel : la
        // page est en cache, elle a donc pu être servie à quelqu'un qui n'a
        // plus de session valide. On repasse par la déconnexion, qui purge
        // les cookies avant d'envoyer vers la connexion.
        if (statut === 401) { window.location.href = "/api/auth/signout?next=/login"; return; }
        if (donnees && !annule) setD(donnees);
        else if (!donnees && !annule) setEchec(true);
      })
      // Sans cet état, un échec laissait la page sur son squelette
      // indéfiniment, sans un mot : constaté en production pendant une
      // interruption de l'API. Un écran figé n'apprend rien à personne.
      .catch(() => { if (!annule) setEchec(true); });
    return () => { annule = true; };
  }, []);

  if (echec) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "48px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Impossible de charger votre profil</p>
        <p style={{ fontSize: 14.5, color: "var(--text-muted)", marginBottom: 20 }}>Tes données sont intactes, c&apos;est l&apos;affichage qui a échoué.</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: "var(--encre)", color: "var(--encre-texte)",
            fontWeight: 700, border: "none", borderRadius: 10, padding: "11px 26px",
            fontSize: 14, cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  const profile = d?.profile ?? null;
  const recentes = d?.recentes ?? [];
  const adsActives = d?.adsActives ?? 0;
  const displayName = profile?.full_name || profile?.username || (d ? "Workie User" : " ");
  const memberSince = d?.creeLe
    ? new Date(d.creeLe).toLocaleDateString("fr-CH", { month: "long", year: "numeric" })
    : "—";
  // Le fondu ne se joue que si les données ont dû être attendues. Il se jouait
  // auparavant à chaque visite, mémoire comprise : la classe était présente dès
  // le premier rendu, donc l'animation partait même quand le contenu était déjà
  // là. La page paraissait charger alors qu'elle n'avait rien à charger — c'est
  // précisément l'impression qu'on cherchait à supprimer.
  const anime = d !== null && depuisMemoire === null;

  // Deux tuiles au plus, et seulement ce sur quoi on peut agir.
  //
  // « 176 entreprises consultées » est un chiffre qui ne mène à rien : on ne
  // le vise pas, on n'en fait rien, il ne dit même pas lesquelles. La liste
  // juste en dessous, elle, les nomme et y ramène.
  //
  // La tuile de régie n'apparaît que pour qui a déjà créé une campagne : un
  // « 0 campagne active » sur le profil de tout le monde n'est pas une
  // statistique, c'est une réclame qui en prend la place.
  const tuiles: { Icone: typeof Flame; value: string; label: string; color: string; href: string | null }[] = [
    { Icone: Flame, value: d ? String(d.favCount) : "—", label: "Entreprises sauvegardées", color: "#f97316", href: "/favorites" },
  ];
  if ((d?.adsTotal ?? 0) > 0) {
    tuiles.push({ Icone: Megaphone, value: String(adsActives), label: `Campagne${adsActives > 1 ? "s" : ""} active${adsActives > 1 ? "s" : ""}`, color: "#8b5cf6", href: "/profile/ads" });
  }

  return (
    <div className={anime ? "apparition" : undefined}>
      {/* ── Header ── */}
      <div className="profile-header" style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 20,
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}>
        {/* Panneau sombre du nom.

            Le mot « Workie » y figurait en filigrane, sur quatre-vingt-seize
            pixels et dans l'ancien logotype en gras extreme. Deux raisons de
            le retirer : ce lettrage n'est plus celui de la marque, et cette
            carte porte l'identite de l'utilisateur, pas la notre. Signer le
            profil de quelqu'un de son propre nom est un reflexe de
            plateforme.

            Le fond degrade cede aussi : il allait de #0d0d14 a #131320, un
            ecart qu'on ne voit pas, et un degrade invisible est un aplat qui
            coute un calcul. */}
        <div className="profil-bandeau" style={{
          position: "relative",
          padding: "32px 32px 28px",
          background: "#101319",
          overflow: "hidden",
        }}>
          {/* Filigrane du logotype.

              Il y figurait en toutes lettres dans l'ancien lettrage en gras
              extreme. C'est le nouveau trace qui reprend sa place, a encre
              claire puisque le bandeau est sombre, et a huit pour cent
              d'opacite : un filigrane se devine, il ne se lit pas, sinon il
              entre en concurrence avec le nom qu'il accompagne.

              Le mot seul, sans le symbole. Le lockup complet figure deja dans
              la barre de navigation, soixante pixels plus haut : le reprendre
              ici montrerait deux fois la meme marque sur un meme ecran. Le mot
              seul se lit comme une signature.

              Ce n'est pas un second dessin mais le meme trace, cadre autrement
              par son viewBox : aucune divergence ne peut s'installer entre les
              deux fichiers.

              Il disparait sous 700 px. Le mot mesure environ deux cent dix
              pixels de large a cette hauteur ; sur un bandeau qui en fait
              deux cent quatre-vingts, il passait derriere le nom au lieu de
              l'accompagner. Le reduire assez pour l'eviter en ferait une
              vignette illisible, et la barre de navigation porte deja la
              marque soixante pixels plus haut. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="profil-filigrane"
            src="/workie-mot.svg"
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              right: 32, top: "50%",
              transform: "translateY(-50%)",
              height: 76, width: "auto",
              opacity: 0.08,
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
          {/* Accent line */}
          <div style={{
            width: 32, height: 3, borderRadius: 2,
            background: "var(--brand)",
            marginBottom: 14,
          }} />
          <h1 style={{
            fontSize: 28, fontWeight: 900,
            // Blanc, et non un jeton de theme : ce nom est pose sur le bandeau
            // sombre du profil, qui reste sombre en mode jour comme en mode
            // nuit. Il avait pris var(--encre-texte) par erreur lors du
            // passage des boutons a l'encre, et devenait donc noir sur noir.
            color: "#fff",
            letterSpacing: "-0.035em",
            lineHeight: 1.1,
            margin: 0,
          }}>
            {displayName}
          </h1>
        </div>

        {/* Ligne d'informations.

            Courriel, canton et ancienneté étaient empilés à l'identique,
            en trois lignes de même taille et de même couleur, dans une
            carte pleine largeur : trois faits de nature différente
            présentés comme une liste à puces sans les puces, et beaucoup
            de vide à droite.

            Ils tiennent sur une ligne, séparés par des points médians,
            comme les chiffres des cartes d'entreprise et du classement. Le
            retour à la ligne reste possible sur écran étroit, où une
            adresse électronique est longue. */}
        <div className="profil-infos" style={{
          padding: "16px 32px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 9,
          fontSize: 14.5,
          color: "var(--text-muted)",
        }}>
          <span>{d?.email ?? " "}</span>
          {(profile?.city || profile?.country) && (
            <>
              <span aria-hidden="true" style={{ opacity: 0.45 }}>&middot;</span>
              <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
            </>
          )}
          <span aria-hidden="true" style={{ opacity: 0.45 }}>&middot;</span>
          <span>Membre depuis {memberSince}</span>
        </div>
        {/* Les chiffres, dans la meme carte que le nom.

            Ils vivaient dans deux cartes flottantes posees juste dessous, avec
            leurs propres bordures et leur propre rayon : trois rectangles pour
            une seule chose, l'identite de la personne et ce qu'elle a fait.
            Un filet suffit a les separer de ce qui precede, et une cloison
            verticale a les separer entre eux. */}
        <div className="profil-chiffres">
          {tuiles.map(({ Icone, value, label, color, href }) => {
            const dedans = (
              <>
                <div className="kpi-icone" style={{ width: 40, height: 40, borderRadius: 11, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icone size={19} color={color} strokeWidth={1.9} aria-hidden="true" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>{label}</p>
                </div>
              </>
            );
            return href
              ? <Link key={label} href={href} className="profil-chiffre">{dedans}</Link>
              : <div key={label} className="profil-chiffre">{dedans}</div>;
          })}
        </div>
      </div>


      {/* ── Main grid ── */}
      <div className="profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>

        {/* Reprendre où l'on en était.
            « Mes avis » occupait cette place. En retirant les avis, la page se
            vidait de sa seule colonne de gauche : elle porte désormais ce que
            la personne a réellement fait sur le site, ses dernières fiches
            ouvertes, avec de quoi y retourner d'un clic. */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 14, overflow: "hidden",
        }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>Reprendre où vous en étiez</p>
          </div>

          {!d ? (
            <div style={{ height: 180 }} aria-hidden="true" />
          ) : recentes.length === 0 ? (
            <div style={{ padding: "36px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Rien encore</p>
              <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 18, lineHeight: 1.6 }}>
                Les entreprises que vous ouvrez se retrouvent ici.
              </p>
              <Link href="/explore" style={{
                display: "inline-block", padding: "10px 22px", borderRadius: 11,
                background: "var(--encre)", color: "var(--encre-texte)", fontWeight: 700, fontSize: 14, textDecoration: "none",
              }}>
                Explorer
              </Link>
            </div>
          ) : (
            recentes.map(c => (
              <Link
                key={c.id}
                href={`/company/${c.id}`}
                className="suggestion-ligne"
                style={{
                  display: "grid", gridTemplateColumns: "56px 1fr 16px", gap: 14, alignItems: "center",
                  padding: "14px 22px", borderTop: "1px solid var(--border)", textDecoration: "none",
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 13, overflow: "hidden", position: "relative",
                  background: c.cover_color ?? "var(--surface3)", flexShrink: 0,
                }}>
                  <CoverImage src={c.cover_url} color={c.cover_color} sizes="56px" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: 15.5, fontWeight: 700, color: "var(--text)", marginBottom: 2,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{c.name}</p>
                  <p style={{ fontSize: 13.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.subsector ? `${c.subsector} · ` : ""}{c.city}
                  </p>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" aria-hidden="true" />
              </Link>
            ))
          )}
        </div>

        {/* Right column */}
        <div className="profile-sidebar" style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Edit form */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 14, overflow: "hidden",
          }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>Modifier le profil</p>
            </div>
            <div style={{ padding: 22 }}>
              {/* Monté seulement une fois les valeurs connues : le formulaire
                  initialise ses champs à la première image et ne les
                  rafraîchit pas ensuite. */}
              {d ? <ProfileForm profile={profile} email={d.email} /> : <div style={{ height: 320 }} aria-hidden="true" />}
            </div>
          </div>

          {/* Réglages */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 14, overflow: "hidden",
          }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>Réglages</p>
            </div>
            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
              <ThemeToggle />
              <a
                href="/api/user/export"
                download
                // Texte et non bouton : on telecharge ses donnees une fois
                // dans sa vie, et un bouton appelle le doigt.
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  color: "var(--text-muted)", fontWeight: 600, fontSize: 13.5,
                  textDecoration: "none", width: "fit-content",
                }}
              >
                <Download size={15} strokeWidth={2} aria-hidden="true" />
                {/* La mention « (RGPD) » est tombée : l'icône a pris la largeur
                    qu'elle occupait, et le libellé passait sur deux lignes dans
                    une colonne de trois cent quarante pixels. C'est le sigle qui
                    part, parce qu'il nomme le règlement plutot que l'action. Ce
                    qu'on veut, c'est ses données ; sous quelle loi on y a droit
                    ne change pas le geste. */}
                Télécharger mes données
              </a>
              <SignOutButton />
              <DeleteAccountButton />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
