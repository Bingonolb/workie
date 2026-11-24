
/**
 * Styles et barre de navigation de la landing, partagés avec les pages
 * marketing (Pour les entreprises). Les règles voyagent avec la page (voir la
 * note dans app/page.tsx) et ne peuvent pas diverger d'une page à l'autre.
 */
const CSS = `
        /* Rythme des fonds.

           Les sections alternaient entre --bg et --surface2 : 2 % d'ecart,
           invisible. Ces deux tons creusent l'ecart jusqu'a ce qu'il se voie,
           et le ton d'accent donne a la page un moment colore la ou l'on veut
           que l'oeil s'arrete.

           En theme sombre, le ton souleve va vers le clair : sur un fond
           sombre, une surface qui s'eclaircit se lit comme un panneau pose au
           dessus, alors qu'une surface qui s'assombrit se lit comme un trou. */
        .landing-tons {
          --ton: #1e2129;
          --ton-carte: #2a2e3a;
          --ton-accent: #1a1338;
          --ton-accent-bord: rgba(139,92,246,0.22);
        }
        html.light .landing-tons {
          --ton: #e5e9f0;
          --ton-carte: #ffffff;
          --ton-accent: #ebe6fb;
          --ton-accent-bord: rgba(91,63,214,0.16);
        }
        .landing-ton {
          background: var(--ton);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        /* Une carte posee sur le ton souleve doit se souleve a son tour :
           laissee sur --surface, elle devient plus sombre que la section qui
           la porte en theme sombre, et le rapport s'inverse. */
        .landing-ton .landing-parcours-etape,
        .landing-ton .faq-item { background: var(--ton-carte); }
        .landing-accent {
          background: var(--ton-accent);
          border-top: 1px solid var(--ton-accent-bord);
          border-bottom: 1px solid var(--ton-accent-bord);
        }

        .landing-hero-deux-col {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 56px;
          align-items: center;
          max-width: 1120px;
          margin: 0 auto;
          padding: 76px 24px 84px;
          width: 100%;
        }
        .landing-chiffres {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 26px;
          max-width: 430px;
          padding-top: 30px;
          border-top: 1px solid var(--border);
        }
        .landing-eyebrow {
          text-align: center;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 14px;
        }
        /* Un titre suivi d'un chapeau resserre sa marge basse : les 46 px
           prevus pour un titre qui precede directement le contenu s'ajoutaient
           aux 44 px du chapeau, et titre, phrase et cartes flottaient a egale
           distance sans que rien ne dise lequel appartenait a lequel. */
        .landing-h2.avec-chapo { margin-bottom: 14px; }
        .landing-chapo {
          font-size: 15.5px;
          color: var(--text-muted);
          line-height: 1.65;
          max-width: 560px;
          margin: 0 auto 40px;
          text-align: center;
        }

        .landing-h2 {
          text-align: center;
          font-size: clamp(23px, 3.4vw, 34px);
          font-weight: 750;
          letter-spacing: -0.032em;
          margin-bottom: 46px;
        }
        .landing-bande {
          position: relative;
          min-height: 420px;
          display: flex;
          align-items: center;
          background-image: url("https://images.pexels.com/photos/303335/pexels-photo-303335.jpeg?auto=compress&cs=tinysrgb&w=1880");
          background-size: cover;
          background-position: center 42%;
        }
        /* Seconde bande : une autre vue, et un cadrage plus bas, pour que les
           deux images ne se ressemblent pas. */
        .landing-bande-2 {
          background-image: url("https://images.pexels.com/photos/27678917/pexels-photo-27678917.jpeg?auto=compress&cs=tinysrgb&w=1880");
          background-position: center 55%;
          min-height: 340px;
        }
        .landing-bande-voile {
          position: absolute;
          inset: 0;
          /* Assombrissement uniforme plutôt qu'un dégradé latéral. L'ancien
             laissait la droite en pleine lumière : sur un thème sombre, la
             bande s'y déchirait, et les détails de la photo se battaient avec
             le texte. */
          background: linear-gradient(90deg, rgba(8,10,16,0.86) 0%, rgba(8,10,16,0.74) 60%, rgba(8,10,16,0.62) 100%);
        }
        .landing-bande-texte {
          position: relative;
          max-width: 1120px;
          margin: 0 auto;
          padding: 64px 24px;
          width: 100%;
        }
        /* Silhouettes des deux emplacements publicitaires. Le trait plein
           marque l'annonce, les traits creux le contenu autour. */
        .apercu-format {
          flex-shrink: 0;
          width: 46px;
          display: grid;
          gap: 3px;
          padding: 5px;
          border: 1px solid var(--border2);
          border-radius: 7px;
          background: var(--surface);
        }
        .apercu-format span { border-radius: 2px; background: var(--surface3); display: block; }
        .apercu-carre {
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 15px 15px;
        }
        .apercu-carre span:nth-child(1) { background: var(--brand); }
        .apercu-plein {
          grid-template-rows: 8px 20px 5px;
        }
        .apercu-plein span:nth-child(2) { background: var(--brand); }


        /* Les deux etapes du parcours, reliees par une fleche. Sur telephone
           elles s'empilent et la fleche pivote d'un quart de tour : une fleche
           horizontale entre deux blocs empiles designerait le vide a droite. */
        .landing-parcours {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 32px;
          align-items: center;
        }
        .landing-parcours-etape {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 28px 26px;
        }
        .landing-parcours-fleche { flex-shrink: 0; }
        .landing-quatre {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 980px) { .landing-quatre { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 560px) { .landing-quatre { grid-template-columns: 1fr; gap: 12px; } }
        .landing-pub {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 56px;
          align-items: center;
        }
        @media (max-width: 900px) { .landing-pub { grid-template-columns: 1fr; gap: 36px; } }
        @media (max-width: 760px) {
          .landing-parcours {
            grid-template-columns: 1fr;
            gap: 18px;
            justify-items: stretch;
          }
          .landing-parcours-fleche {
            transform: rotate(90deg);
            justify-self: center;
          }
        }

        .landing-pourqui {
          display: grid;
          grid-template-columns: 0.72fr 1.28fr;
          gap: 56px;
          max-width: 1000px;
          margin: 0 auto;
          align-items: start;
        }
        @media (max-width: 900px) {
          .landing-hero-deux-col {
            grid-template-columns: 1fr;
            gap: 0;
            padding: 30px 20px 48px;
          }
          /* Sur téléphone, l'ordre suit le raisonnement plutôt que l'effet.
             Une version précédente mettait l'aperçu tout en haut : on voyait
             une carte de notes sans savoir de quoi il s'agissait. On annonce
             d'abord ce qu'on fait, on le prouve ensuite, on propose d'agir en
             dernier.

             La règle display:contents dissout la colonne de texte pour que ses
             enfants deviennent des cases de la grille et puissent être
             ordonnés un à un. */
          .hero-texte { display: contents; }
          .hero-titre    { order: 1; margin-bottom: 14px; }
          .hero-accroche { order: 2; margin-bottom: 26px; }
          .landing-apercu { order: 3; margin-bottom: 30px; }
          .hero-cta-row  { order: 4; margin-bottom: 30px; }
          .landing-chiffres { order: 5; }
          .landing-chiffres { grid-template-columns: repeat(3, 1fr); gap: 0 16px; max-width: none; }
        }
        @media (max-width: 900px) {
          /* La regle « .landing-apercu > div { padding: 18px } » a ete retiree.
             Elle servait l'ancien apercu statique, une carte a marges ; posee
             sur la pile, elle ajoutait dix-huit pixels autour de la carte
             entiere, et la photo flottait au milieu d'un cadre vide. */
        }

        /* Sur téléphone, on retire ce qui n'aide pas à lire.
           Les chapeaux en capitales (« COMMENT ÇA MARCHE », « POUR QUI »)
           étiquettent une section qu'on voit d'un coup d'œil sur grand écran.
           Sur une colonne unique, où l'on découvre la page section par
           section, ils ajoutent une ligne et un temps de lecture sans rien
           apprendre : le titre juste en dessous dit déjà de quoi il s'agit.

           Et les sections passent de 88 à 56 pixels de marge verticale : la
           respiration d'un grand écran devient du vide sur un téléphone, où
           chaque écran de défilement compte. */
        @media (max-width: 768px) {
          .landing-eyebrow { display: none; }
          .landing-section { padding-top: 56px !important; padding-bottom: 56px !important; }
          .landing-h2 { margin-bottom: 30px; font-size: clamp(22px, 6.5vw, 27px); }
          .landing-bande-texte { padding: 48px 20px; }
        }

        @media (max-width: 820px) {
          .landing-pourqui { grid-template-columns: 1fr; gap: 34px; }
          .landing-bande { min-height: 340px; background-position: center; }
          .landing-bande-voile {
            background: linear-gradient(180deg, rgba(8,10,16,0.7) 0%, rgba(8,10,16,0.88) 100%);
          }
        }
      `;

export function StylesLanding() {
  return <style>{CSS}</style>;
}

// Le menu, traduit, vit dans son propre composant navigateur.
export { NavLanding } from "@/components/NavLanding";
