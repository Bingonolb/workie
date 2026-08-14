"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Retour depuis une fiche entreprise.
 *
 * Il pointait en dur sur « /explore ». Venu du swipe, on retombait donc sur la
 * grille, et sur une autre entreprise que celle qu'on regardait : le geste ne
 * défaisait pas le précédent, il en faisait un autre.
 *
 * Un vrai retour en arrière rend l'écran quitté tel qu'il était, quel qu'il
 * soit — swipe, grille filtrée, favoris, classement — sans que cette page ait
 * à savoir d'où l'on vient. C'est aussi ce que fait le geste de retour du
 * téléphone, donc les deux concordent enfin.
 *
 * Le lien reste un vrai lien pour les deux cas où l'historique ne dit rien
 * d'utile : une fiche ouverte depuis un lien partagé ou depuis un moteur de
 * recherche. Là, remonter en arrière sortirait du site.
 *
 * L'état part à « faux » pour que le rendu du serveur, partagé par tous et mis
 * en cache, soit celui qui convient à un visiteur venu de l'extérieur.
 */
export function BoutonRetour({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const [retourPossible, setRetourPossible] = useState(false);

  useEffect(() => {
    // Referrer vide : accès direct, ou navigation interne qui ne l'a pas
    // changé. La longueur de l'historique départage les deux.
    const memeSite = document.referrer === "" || document.referrer.startsWith(window.location.origin);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRetourPossible(window.history.length > 1 && memeSite);
  }, []);

  return (
    <Link
      href="/explore"
      className={className}
      style={style}
      onClick={e => {
        if (!retourPossible) return; // navigation normale vers /explore
        e.preventDefault();
        window.history.back();
      }}
    >
      <ArrowLeft size={14} aria-hidden="true" /> Retour
    </Link>
  );
}
