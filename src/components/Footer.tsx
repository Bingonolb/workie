import Link from "next/link";
import { Logo } from "@/components/Logo";

/**
 * Le pied de page, et sa disparition sur téléphone.
 *
 * Il portait le logotype, une accroche et sept liens sur trois lignes. Sur un
 * écran de téléphone, dès qu'une liste est courte, ce pavé occupe le tiers
 * inférieur de l'écran et devient la chose la plus visible de la page : on
 * voyait deux entreprises dans un classement, puis un bandeau de marque.
 *
 * Sur téléphone il ne reste donc que ce qu'on est tenu de rendre accessible :
 * les trois pages légales et le contact, sur une ligne, en petit. Le logotype
 * est déjà en haut de l'écran et la marque n'a pas besoin d'être signée deux
 * fois. L'accroche disparaît aussi : elle annonçait des avis et des salaires,
 * ce que le site ne fait plus.
 */

const lien: React.CSSProperties = { fontSize: 12, color: "var(--text-muted)", textDecoration: "none" };

export function Footer() {
  return (
    <footer className="pied">
      <div className="pied-interieur">
        <div className="pied-marque">
          <Logo taille={24} />
        </div>
        <nav className="pied-liens">
          {/* /salaires n'était liée depuis aucune navigation : page publique,
              indexée, mais introuvable depuis l'interface. */}
          <Link href="/salaires" style={lien} className="pied-lien-large">Salaires</Link>
          <Link href="/annonceurs" style={lien} className="pied-lien-large">Annonceurs</Link>
          <Link href="/cgu" style={lien}>CGU</Link>
          <Link href="/confidentialite" style={lien}>Confidentialité</Link>
          <Link href="/mentions-legales" style={lien}>Mentions légales</Link>
          <a href="mailto:contact@workie.ch" style={lien}>Contact</a>
          <span style={lien}>© {new Date().getFullYear()} Workie</span>
        </nav>
      </div>
    </footer>
  );
}
