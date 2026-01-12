import "../index.css";
import styles from "../styles/RoomList.module.css";
import logo from "../../public/discuter.png";
import { useQuery } from "@tanstack/react-query";
import { useChatStore, type Room } from "../store/chatStore";
import { supabase } from "../supabaseClient";
import { Link } from "react-router";

// Fonction asynchrone pour récupérer la liste de tous les salons depuis Supabase
async function fetchRooms(): Promise<Room[]> {
  // Récupération de tous les salons triés par date de création (du plus ancien au plus récent)
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .order("created_at", { ascending: true });

  // Si une erreur survient lors de la récupération, on la propage
  if (error) throw Error(error.message);
  return data as Room[];
}

export const RoomList = () => {
  // Utilisation de React Query pour gérer le chargement et le cache de la liste des salons
  const {
    data: rooms, // Liste des salons récupérés depuis Supabase
    error, // Erreur éventuelle lors de la récupération
    isLoading, // État de chargement de la requête
  } = useQuery({
    queryKey: ["rooms"], // Clé de requête pour identifier cette requête dans le cache
    queryFn: fetchRooms, // Fonction de récupération des salons
  });

  // Fonction pour rejoindre un salon sélectionné
  // Met à jour le store Zustand avec le salon sélectionné comme salle actuelle
  const handleJoinRoom = (room: Room) => {
    // Utilisation de getState() pour accéder aux actions du store en dehors d'un composant
    useChatStore.getState().setCurrentRoom(room);
  };

  // Affichage d'un message de chargement pendant la récupération des données
  if (isLoading)
    return <p className="loader-text">Chargement des salons ...</p>;
  // Affichage d'un message d'erreur en cas de problème de récupération
  if (error)
    return (
      <p className="loader-text">
        Erreur de chargement des salons: {error.message}
      </p>
    );

  return (
    <div className={styles["room-list-container"]}>
      {/* En-tête de la page avec logo et titre */}
      <div className={styles["room-list-header"]}>
        <div className={styles["room-list-title-left"]}>
          <img src={logo} alt="logo" />
          <h2>Les salons</h2>
        </div>
      </div>
      {/* Contenu principal : liste des salons disponibles */}
      <div className={styles["room-list-content"]}>
        <ul className={styles["room-list-items"]}>
          {/* Parcours de la liste des salons pour afficher chaque salon */}
          {rooms?.map((room: Room) => {
            return (
              <li key={room.id} className={styles["room-list-item"]}>
                {/* Lien vers la page principale avec gestion du clic pour rejoindre le salon */}
                <Link
                  to={"/"}
                  className={styles["room-list-link"]}
                  onClick={() => handleJoinRoom(room)}
                >
                  {room.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
