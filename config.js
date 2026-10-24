// Réglages de connexion à Supabase, à remplir une seule fois.
// Ces deux valeurs sont publiques par nature : la protection des données vient
// des règles d'accès créées par supabase/setup.sql et des comptes prénom + code.
window.GITE_CONFIG = {
  url: 'COLLE_ICI_L_URL_DU_PROJET',   // exemple : https://abcdefghijkl.supabase.co
  key: 'COLLE_ICI_LA_CLE_PUBLIQUE'    // la clé « anon public » ou « publishable »
};
