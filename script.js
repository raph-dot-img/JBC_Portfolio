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
      afficher("Le formulaire n'est pas encore configuré. Réessayez plus tard.", "erreur");
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
        afficher("Message envoyé ! Je vous réponds dès que possible.", "ok");
      } else {
        afficher("L'envoi a échoué. Vérifiez les champs et réessayez.", "erreur");
      }
    } catch {
      afficher("Connexion impossible. Réessayez dans un instant.", "erreur");
    } finally {
      bouton.disabled = false;
    }
  });
}

// --------------------------------------------------------------------------
// Easter egg : faux terminal caché, ouvert par la touche 7 / è / ` (même
// touche sur un clavier AZERTY). Rien n'existe dans la page avant l'appui.
// --------------------------------------------------------------------------
(() => {
  const INVITE = "jb@caignec:~$";
  const net = (texte) => texte.replace(/\s+/g, " ").trim();

  // Les fichiers reprennent le contenu des sections de la page.
  const FICHIERS = {
    "motivation.txt": "profil",
    "formation.txt": "formation",
    "experience.txt": "experience",
    "competences.txt": "competences",
    "langues.txt": "langues",
    "contact.txt": "contact",
  };

  const lireSection = (id) => {
    const section = document.getElementById(id);
    if (!section) return "";
    const lignes = [];
    section.querySelectorAll(":scope > p, :scope > ul > li").forEach((el) => {
      if (el.tagName === "P") {
        lignes.push(net(el.textContent));
        return;
      }
      const titre = el.querySelector("h3");
      const entete = el.querySelector(".langue-entete");
      if (titre) {
        const lieu = el.querySelector("p");
        const date = el.querySelector(".puce");
        lignes.push("- " + net(titre.textContent) + (lieu ? " : " + net(lieu.textContent) : "") + (date ? " (" + net(date.textContent) + ")" : ""));
      } else if (entete) {
        const [langue, niveau] = [...entete.children].map((s) => net(s.textContent));
        const jauge = [...el.querySelectorAll(".jauge i")].map((i) => (i.classList.contains("plein") ? "■" : "□")).join("");
        lignes.push("- " + langue.padEnd(10) + niveau.padEnd(4) + jauge);
      } else {
        lignes.push("- " + net(el.textContent));
      }
    });
    if (id === "contact") lignes.push("Le formulaire se trouve tout en bas de la page.");
    return lignes.join("\n");
  };

  const LOGO = [
    "     _ ____   ____ ",
    "    | | __ ) / ___|",
    " _  | |  _ \\| |    ",
    "| |_| | |_) | |___ ",
    " \\___/|____/ \\____|",
  ];

  const fastfetch = () => {
    const age = (document.getElementById("profil")?.textContent.match(/(\d+) ans/) || [])[1];
    const infos = [
      "jb@caignec",
      "----------",
      "OS : CIEL Linux (Bac Pro)",
      "Hôte : Lycée Likès, Quimper",
      "Uptime : " + (age ? age + " ans" : "inconnu"),
      "Shell : jbsh",
      "Paquets : " + Object.keys(FICHIERS).length + " (ls)",
    ];
    const bloc = document.createElement("span");
    bloc.className = "ascii";
    infos.forEach((info, i) => {
      const logo = document.createElement("span");
      logo.className = "logo-ascii";
      logo.textContent = (LOGO[i] || "").padEnd(LOGO[0].length + 4);
      bloc.append(logo, info + "\n");
    });
    return bloc;
  };

  const AIDE = [
    "Commandes disponibles :",
    "  help            affiche cette aide",
    "  whoami          qui est derrière ce portfolio ?",
    "  ls              liste les fichiers",
    "  cat <fichier>   affiche le contenu d'un fichier",
    "  fastfetch       informations sur le système",
    "  clear           efface l'écran",
    "  shutdown        ferme le terminal (poweroff, exit... marchent aussi)",
  ].join("\n");

  const FERMETURE = ["shutdown", "poweroff", "halt", "reboot", "exit", "logout"];
  const COMMANDES = ["help", "whoami", "ls", "cat", "fastfetch", "clear", "su", "sudo", ...FERMETURE];

  let voile, corps, sortie, saisie;
  let focusPrecedent = null;
  const historique = [];
  let position = 0;

  const ecrire = (contenu, classe) => {
    const ligne = document.createElement("div");
    if (classe) ligne.className = classe;
    ligne.append(contenu);
    sortie.append(ligne);
    corps.scrollTop = corps.scrollHeight;
  };

  const fermer = () => {
    saisie.blur();
    voile.hidden = true;
    if (focusPrecedent && focusPrecedent.focus) focusPrecedent.focus();
  };

  // Recopie la ligne tapée derrière l'invite, comme un vrai terminal
  const recopier = (ligne) => {
    const invite = document.createElement("span");
    invite.className = "terminal-invite";
    invite.textContent = INVITE;
    const echo = document.createDocumentFragment();
    echo.append(invite, " " + ligne);
    ecrire(echo);
  };

  const executer = (ligne) => {
    recopier(ligne);

    const [commande, ...args] = ligne.trim().split(/\s+/);
    if (!commande) return;

    if (commande === "help") {
      ecrire(AIDE);
    } else if (commande === "whoami") {
      ecrire("Jean-Baptiste Caignec");
    } else if (commande === "ls") {
      const liste = document.createElement("span");
      liste.className = "fichier";
      liste.textContent = Object.keys(FICHIERS).join("  ");
      ecrire(liste);
    } else if (commande === "cat") {
      if (!args.length) ecrire("cat : opérande manquant", "erreur-cmd");
      args.forEach((nom) => {
        const fichier = FICHIERS[nom] ? nom : FICHIERS[nom + ".txt"] ? nom + ".txt" : null;
        if (fichier) ecrire(lireSection(FICHIERS[fichier]));
        else ecrire("cat: " + nom + ": Aucun fichier ou dossier de ce nom", "erreur-cmd");
      });
    } else if (commande === "fastfetch" || commande === "neofetch") {
      ecrire(fastfetch());
    } else if (commande === "clear") {
      sortie.textContent = "";
    } else if (commande === "su" || commande === "sudo") {
      ecrire("Vous n'êtes pas dans le groupe wheel. Cet incident sera signalé.", "erreur-cmd");
    } else if (FERMETURE.includes(commande)) {
      ecrire("Arrêt du système...");
      saisie.disabled = true;
      setTimeout(fermer, mouvementReduit ? 0 : 600);
    } else {
      ecrire("bash: " + commande + " : commande introuvable", "erreur-cmd");
    }
  };

  // Complétion avec Tab : commandes en premier mot, fichiers ensuite
  const completer = () => {
    const mots = saisie.value.split(" ");
    const dernier = mots[mots.length - 1];
    const choix = mots.length === 1 ? COMMANDES : Object.keys(FICHIERS);
    const trouves = choix.filter((c) => c.startsWith(dernier));
    if (trouves.length === 1) {
      mots[mots.length - 1] = trouves[0];
      saisie.value = mots.join(" ") + (mots.length === 1 ? " " : "");
    } else if (trouves.length > 1 && dernier) {
      recopier(saisie.value);
      ecrire(trouves.join("  "));
    }
  };

  const construire = () => {
    voile = document.createElement("div");
    voile.className = "terminal-voile";
    voile.hidden = true;

    const terminal = document.createElement("div");
    terminal.className = "terminal";
    terminal.setAttribute("role", "dialog");
    terminal.setAttribute("aria-modal", "true");
    terminal.setAttribute("aria-label", "Terminal");

    const barre = document.createElement("div");
    barre.className = "terminal-barre";
    const titre = document.createElement("em");
    titre.textContent = "jb@caignec : ~";
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "terminal-fermer";
    bouton.setAttribute("aria-label", "Fermer le terminal");
    bouton.textContent = "×";
    bouton.addEventListener("click", fermer);
    barre.append(document.createElement("span"), document.createElement("span"), document.createElement("span"), titre, bouton);

    corps = document.createElement("div");
    corps.className = "terminal-corps";
    sortie = document.createElement("div");
    sortie.className = "terminal-sortie";
    sortie.setAttribute("aria-live", "polite");

    const ligne = document.createElement("label");
    ligne.className = "terminal-ligne";
    const invite = document.createElement("span");
    invite.className = "terminal-invite";
    invite.textContent = INVITE;
    saisie = document.createElement("input");
    saisie.type = "text";
    saisie.autocomplete = "off";
    saisie.spellcheck = false;
    saisie.setAttribute("autocapitalize", "off");
    saisie.setAttribute("aria-label", "Commande");
    ligne.append(invite, saisie);

    corps.append(sortie, ligne);
    terminal.append(barre, corps);
    voile.append(terminal);
    document.body.append(voile);

    saisie.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const valeur = saisie.value;
        if (valeur.trim()) historique.push(valeur);
        position = historique.length;
        saisie.value = "";
        executer(valeur);
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        position = Math.max(0, Math.min(historique.length, position + (e.key === "ArrowUp" ? -1 : 1)));
        saisie.value = historique[position] || "";
      } else if (e.key === "Tab") {
        e.preventDefault();
        completer();
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        sortie.textContent = "";
      }
    });

    voile.addEventListener("keydown", (e) => {
      if (e.key === "Escape") fermer();
    });
    voile.addEventListener("click", (e) => {
      if (e.target === voile) fermer();
    });
    corps.addEventListener("click", () => {
      if (!String(window.getSelection())) saisie.focus();
    });
  };

  const ouvrir = () => {
    if (!voile) construire();
    focusPrecedent = document.activeElement;
    sortie.textContent = "";
    ecrire("Bienvenue sur le terminal de Jean-Baptiste. Tapez help pour voir les commandes.");
    saisie.disabled = false;
    saisie.value = "";
    position = historique.length;
    voile.hidden = false;
    saisie.focus();
  };

  document.addEventListener("keydown", (e) => {
    // AltGr compte comme Ctrl+Alt sous Windows : seul Ctrl (ou Cmd) annule.
    if (e.defaultPrevented || e.metaKey || (e.ctrlKey && !e.altKey)) return;
    const touche = ["7", "è", "`"].includes(e.key) || (e.key === "Dead" && e.code === "Digit7");
    if (!touche || (voile && !voile.hidden)) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    e.preventDefault();
    ouvrir();
  });
})();
