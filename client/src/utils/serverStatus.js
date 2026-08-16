const statusKeys = new Map([
  ["Joueur introuvable.", "status.playerNotFound"],
  ["Chargement des defis impossible.", "status.challengesLoad"],
  ["Defi invalide.", "status.invalidChallenge"],
  ["Ce defi n'est pas encore termine.", "status.challengeIncomplete"],
  ["Recompense deja recuperee.", "status.rewardAlreadyClaimed"],
  ["Recompense impossible a recuperer.", "status.rewardError"],
  ["Configuration de partie invalide.", "status.invalidGame"],
  ["Un des joueurs selectionnes est introuvable.", "status.selectedPlayerNotFound"],
  ["Tu as deja cree une partie.", "status.roomAlreadyCreated"],
  ["Creation du salon impossible.", "status.roomCreationError"],
  ["Creation du duel impossible.", "status.friendDuelError"],
  ["Chargement des amis impossible.", "status.friendsLoad"],
  ["Tu ne peux pas t'ajouter toi-meme.", "status.cannotAddSelf"],
  ["Ce joueur est deja ton ami.", "status.alreadyFriend"],
  ["Demande deja envoyee.", "status.requestAlreadySent"],
  ["Envoi de la demande impossible.", "status.requestError"],
  ["Demande d'ami introuvable.", "status.requestNotFound"],
  ["Acceptation impossible.", "status.acceptError"],
  ["Relation introuvable.", "status.relationshipNotFound"],
  ["Relation supprimee.", "status.relationshipDeleted"],
  ["Suppression impossible.", "status.deleteError"],
  ["Chargement du profil impossible.", "status.profileLoad"],
  ["Identifiant ou mot de passe incorrect.", "status.invalidCredentials"],
  ["Compte desactive.", "status.accountDisabled"],
  ["Connexion impossible.", "status.loginError"],
  ["Choisis un pseudo alphanumerique et un mot de passe.", "status.registerInvalid"],
  ["Ce pseudo est deja utilise.", "status.usernameTaken"],
  ["Compte cree. Tu peux maintenant te connecter.", "status.accountCreated"],
  ["Creation du compte impossible.", "status.accountCreationError"],
  ["Seul l'hote peut supprimer ce salon.", "status.hostOnlyDelete"],
  ["Selection de couleur invalide.", "status.invalidColor"],
  ["Mise a jour du profil impossible.", "status.profileUpdate"],
  ["Acces administrateur requis.", "status.adminRequired"],
  ["Verification du role impossible.", "status.adminRoleCheck"],
  ["Chargement de l'administration impossible.", "status.adminLoad"],
  ["Role utilisateur invalide.", "status.adminInvalidRole"],
  ["Le dernier administrateur doit conserver son role.", "status.adminLastRole"],
  ["Mise a jour du role impossible.", "status.adminRoleUpdate"],
  ["Statut utilisateur invalide.", "status.adminInvalidStatus"],
  ["Tu ne peux pas desactiver ton propre compte.", "status.adminSelfDisable"],
  ["Mise a jour du statut impossible.", "status.adminStatusUpdate"],
]);

const statusPatterns = [
  {
    pattern: /^Recompense recuperee : \+(\d+) XP\.$/,
    key: "status.rewardClaimed",
    values: (match) => ({ xp: match[1] }),
  },
  {
    pattern: /^Salon (ROOM-\d+) cree\. Les invitations sont pretes !$/,
    key: "status.roomCreated",
    values: (match) => ({ roomID: match[1] }),
  },
  {
    pattern: /^Salon (ROOM-\d+) supprime\.$/,
    key: "status.roomDeleted",
    values: (match) => ({ roomID: match[1] }),
  },
  {
    pattern: /^(.+) fait maintenant partie de tes amis\.$/,
    key: "status.nowFriends",
    values: (match) => ({ name: match[1] }),
  },
  {
    pattern: /^Demande envoyee a (.+)\.$/,
    key: "status.requestSent",
    values: (match) => ({ name: match[1] }),
  },
];

export const translateServerStatus = (status, translate) => {
  if (!status) return "";
  const key = statusKeys.get(status);
  if (key) return translate(key);

  for (const entry of statusPatterns) {
    const match = status.match(entry.pattern);
    if (match) return translate(entry.key, entry.values(match));
  }

  return status;
};

export const localizedStatus = (key, values = {}) => ({ key, values });

export const translateStatus = (status, translate) => {
  if (status && typeof status === "object") {
    return translate(status.key, status.values);
  }
  return translateServerStatus(status, translate);
};
