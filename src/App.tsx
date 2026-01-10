import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import Auth from "./components/Auth";
import { useChatStore } from "./store/chatStore";
import { supabase } from "./supabaseClient";
import { useEffect } from "react";
import { Dashboard } from "./components/Dashboard";

/**
 * Composant principal de l'application
 * Gère l'authentification et l'affichage conditionnel des composants
 */
function App() {
  // Récupération de l'utilisateur actuel et de la fonction pour le modifier depuis le store Zustand
  // user: contient les informations de l'utilisateur connecté (id, email) ou null si non connecté
  // setUser: fonction pour mettre à jour l'état de l'utilisateur dans le store
  const { user, setUser } = useChatStore();

  /**
   * useEffect hook qui s'exécute une seule fois au montage du composant
   * Gère la synchronisation de l'état d'authentification avec Supabase
   */
  useEffect(() => {
    /**
     * Vérification de la session existante au chargement de l'application
     * Récupère la session actuelle si l'utilisateur était déjà connecté
     */
    supabase.auth.getSession().then((response) => {
      // Extraction de la session depuis la réponse
      const session = response.data.session;
      // Mise à jour du store avec les informations de l'utilisateur de la session
      // Utilisation de l'opérateur ?. (optional chaining) et || pour gérer les valeurs nulles
      setUser({
        id: session?.user.id || "",
        email: session?.user.email || "",
      });
    });

    /**
     * Écoute des changements d'état d'authentification en temps réel
     * Cette fonction se déclenche à chaque fois que l'état d'authentification change :
     * - Connexion réussie
     * - Déconnexion
     * - Expiration de session
     * - Rafraîchissement du token
     */
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Si une session existe (utilisateur connecté)
      if (session?.user) {
        // Mise à jour du store avec les nouvelles informations de l'utilisateur
        setUser({
          id: session.user.id || "",
          email: session.user.email || "",
        });
      } else {
        // Si aucune session (utilisateur déconnecté), réinitialiser l'état à null
        setUser(null);
      }
    });

    // Récupération de l'objet subscription pour pouvoir le désabonner lors du démontage
    const subscription = data.subscription;

    /**
     * Fonction de nettoyage exécutée lors du démontage du composant
     * Permet d'éviter les fuites mémoire en se désabonnant de l'écoute des changements d'authentification
     */
    return () => subscription.unsubscribe();
  }, []); // Tableau de dépendances vide : s'exécute uniquement au montage du composant

  /**
   * Condition de rendu : vérification de l'état d'authentification
   * Si l'utilisateur n'est pas connecté, afficher le composant d'authentification
   */
  if (!user) {
    // Affichage du formulaire de connexion/inscription
    return <Auth />;
  }

  return <Dashboard />

  /**
   * Si l'utilisateur est connecté, afficher l'interface principale de l'application
   * Actuellement, seul le conteneur de notifications est affiché
   * (l'interface de chat sera ajoutée plus tard)
   */
  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

// Export du composant App comme export par défaut
export default App;
