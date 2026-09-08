import "../index.css";
import styles from "../styles/RoomList.module.css";
import logo from "../../public/discuter.png";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useChatStore } from "../store/chatStore";
import { supabase } from "../supabaseClient";

// Interface d'un profil utilisateur (table "profiles", miroir public de auth.users)
interface Profile {
  id: string;
  email: string;
}

// Fonction asynchrone pour récupérer tous les autres utilisateurs (avec qui démarrer une conversation)
async function fetchProfiles(currentUserId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email")
    .neq("id", currentUserId) // On exclut son propre profil de la liste
    .order("email", { ascending: true });

  if (error) throw Error(error.message);
  return data as Profile[];
}

export const Messages = () => {
  const navigate = useNavigate();
  const { user } = useChatStore();

  // Utilisation de React Query pour gérer le chargement et le cache de la liste des utilisateurs
  const {
    data: profiles,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["profiles", user?.id],
    queryFn: () => fetchProfiles(user!.id),
    // La requête ne s'exécute que si un utilisateur est connecté
    enabled: !!user?.id,
  });

  // Démarre (ou rejoint si elle existe déjà) une conversation privée avec l'utilisateur sélectionné
  const handleStartConversation = async (profile: Profile) => {
    // Appel de la fonction Postgres "start_direct_conversation" via RPC
    // Elle crée la conversation + les deux participants de façon atomique côté serveur
    const { data: conversationId, error } = await supabase.rpc(
      "start_direct_conversation",
      { other_user_id: profile.id }
    );

    if (error) {
      console.error(
        "Erreur lors de la création de la conversation: ",
        error.message
      );
      return;
    }

    // Mise à jour du store Zustand avec la conversation comme discussion active
    useChatStore.getState().setCurrentChat({
      type: "conversation",
      id: conversationId as number,
      name: profile.email,
    });
    // Navigation vers la page principale (conversation)
    navigate("/");
  };

  // Affichage d'un message de chargement pendant la récupération des données
  if (isLoading)
    return <p className="loader-text">Chargement des utilisateurs ...</p>;
  // Affichage d'un message d'erreur en cas de problème de récupération
  if (error)
    return (
      <p className="loader-text">
        Erreur de chargement des utilisateurs: {error.message}
      </p>
    );

  return (
    <div className={styles["room-list-container"]}>
      {/* En-tête de la page avec logo et titre */}
      <div className={styles["room-list-header"]}>
        <div className={styles["room-list-title-left"]}>
          <img src={logo} alt="logo" />
          <h2>Messages privés</h2>
        </div>
      </div>
      {/* Contenu principal : liste des utilisateurs avec qui discuter */}
      <div className={styles["room-list-content"]}>
        <ul className={styles["room-list-items"]}>
          {profiles?.map((profile: Profile) => {
            return (
              <li key={profile.id} className={styles["room-list-item"]}>
                <button
                  className={styles["room-list-link"]}
                  onClick={() => handleStartConversation(profile)}
                >
                  {profile.email}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
