// Portfolio de Jean-Baptiste Caignec : petites interactions, sans dépendance.
// Le site reste entièrement utilisable sans JavaScript : ce script ne fait
// qu'ajouter des effets et l'envoi du formulaire sans rechargement.

"use strict";

document.documentElement.classList.add("js");

const mouvementReduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Année du pied de page
document.querySelectorAll(".annee").forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});

// Effet « machine à écrire » sur la ligne du hero
const tape = document.querySelector(".tape");
if (tape && !mouvementReduit) {
  const texte = tape.dataset.texte || tape.textContent;
  tape.textContent = "";
  let i = 0;
  const ecrire = () => {
    tape.textContent = texte.slice(0, ++i);
    if (i < texte.length) {
      setTimeout(ecrire, 35 + Math.random() * 45);
    }
  };
  setTimeout(ecrire, 500);
}

// Apparition des panneaux au défilement
const aReveler = document.querySelectorAll(".revele");
if ("IntersectionObserver" in window && !mouvementReduit) {
  const observateur = new IntersectionObserver(
    (entrees) => {
      entrees.forEach((entree) => {
        if (entree.isIntersecting) {
          entree.target.classList.add("visible");
          observateur.unobserve(entree.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  aReveler.forEach((el) => observateur.observe(el));
} else {
  aReveler.forEach((el) => el.classList.add("visible"));
}

// Formulaire de contact : envoi vers Formspree en arrière-plan.
// Sans JavaScript, le formulaire est envoyé normalement (redirection Formspree).
const formulaire = document.querySelector(".formulaire");
if (formulaire) {
  const statut = formulaire.querySelector(".formulaire-statut");
  const bouton = formulaire.querySelector("button[type=submit]");

  const afficher = (message, type) => {
    statut.textContent = message;
    statut.className = "formulaire-statut " + type;
  };

  formulaire.addEventListener("submit", async (evenement) => {
    evenement.preventDefault();

    // Adresse non injectée par nginx (serveur de dev sans .env, par exemple)
    if (!formulaire.action.startsWith("https://formspree.io/")) {
      afficher("Le formulaire n'est pas encore configuré. Réessaie plus tard.", "erreur");
      return;
    }

    bouton.disabled = true;
    afficher("Transmission en cours…", "");

    try {
      const reponse = await fetch(formulaire.action, {
        method: "POST",
        body: new FormData(formulaire),
        headers: { Accept: "application/json" },
      });

      if (reponse.ok) {
        formulaire.reset();
        afficher("Message envoyé ! Je te réponds dès que possible.", "ok");
      } else {
        afficher("L'envoi a échoué. Vérifie les champs et réessaie.", "erreur");
      }
    } catch {
      afficher("Connexion impossible. Réessaie dans un instant.", "erreur");
    } finally {
      bouton.disabled = false;
    }
  });
}
