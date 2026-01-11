import { useChatStore } from "../../store/chatStore";
import { supabase } from "../../supabaseClient";
import style from "./ChatMessage.module.css";
import "../../index.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// Interface définissant la structure d'un message
interface Message {
  id: number;
  content: string;
  user_id: string;
  email: string;
  created_at: string;
  room_id: number;
}

// Fonction asynchrone pour récupérer les messages d'une salle de chat depuis Supabase
async function fetchMessages(roomId: number): Promise<Message[]> {
  // Récupération des messages filtrés par room_id et triés par date de création
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  // Si une erreur survient, on la propage
  if (error) throw Error(error.message);
  return data as Message[];
}

export const ChatMessage = () => {
  // Récupération de la salle de chat actuelle depuis le store Zustand
  const { currentRoom, user } = useChatStore();
  const queryClient = useQueryClient();
  // Utilisation de React Query pour gérer le chargement et le cache des messages
  const {
    data: messages,
    error,
    isLoading,
  } = useQuery<Message[], Error>({
    // Clé de requête basée sur l'ID de la salle actuelle
    queryKey: ["messages", currentRoom?.id],
    // Fonction de récupération des messages (retourne un tableau vide si pas de salle)
    queryFn: () =>
      currentRoom?.id === null
        ? Promise.resolve([])
        : fetchMessages(currentRoom!.id),
    // La requête ne s'exécute que si une salle est sélectionnée
    enabled: currentRoom?.id !== null,
  });

  // useEffect pour écouter les nouveaux messages en temps réel depuis Supabase Realtime
  useEffect(() => {
    // Si aucune salle n'est sélectionnée, on ne fait rien
    if (!currentRoom?.id) return;

    // Création d'un canal Supabase Realtime pour écouter les changements de la base de données
    // Le nom du canal doit être unique pour éviter les conflits avec d'autres abonnements
    const channel = supabase.channel("messages-channel");

    // Configuration d'un écouteur d'événements sur les changements PostgreSQL
    channel
      .on(
        "postgres_changes", // Type d'événement : changements dans la base de données PostgreSQL
        {
          event: "INSERT", // On écoute uniquement les événements d'insertion (nouveaux messages)
          schema: "public", // Le schéma de la base de données où se trouve la table
          table: "messages", // La table à surveiller pour les nouveaux messages
        },
        // Fonction callback exécutée à chaque fois qu'un nouveau message est inséré
        (payload) => {
          // Récupération du nouveau message depuis les données de l'événement
          const newMessage = payload.new as Message;

          // Vérification que le nouveau message appartient bien à la salle actuellement affichée
          // Cela évite d'ajouter des messages d'autres salles dans la liste
          if (newMessage.room_id === currentRoom.id) {
            // Mise à jour du cache React Query avec le nouveau message
            // Cette fonction met à jour les données en cache sans refaire une requête HTTP
            queryClient.setQueryData<Message[]>(
              ["messages", currentRoom?.id], // Clé de la requête à mettre à jour
              // Fonction qui reçoit les anciens messages et retourne les nouveaux messages mis à jour
              (oldMessages) =>
                // Si des messages existent déjà, on ajoute le nouveau message à la fin
                // Sinon, on crée un tableau avec le nouveau message uniquement
                oldMessages ? [...oldMessages, newMessage] : [newMessage]
            );
          }
        }
      )
      // Souscription au canal pour activer l'écoute en temps réel
      // Cette méthode établit la connexion WebSocket avec Supabase
      .subscribe((status) => {
        // Log du statut de la souscription pour le débogage
        // Les statuts possibles : "SUBSCRIBED", "TIMED_OUT", "CLOSED", "CHANNEL_ERROR"
        console.log("Sub status:", status);
      });

    // Fonction de nettoyage exécutée quand le composant est démonté ou quand currentRoom?.id change
    // Cela permet de se désabonner du canal pour éviter les fuites mémoire et les connexions inutiles
    return () => {
      // Désabonnement du canal Supabase
      supabase.removeChannel(channel);
    };
  }, [currentRoom?.id, queryClient]); // Dépendances : le useEffect se réexécute si currentRoom?.id ou queryClient change

  // Affichage d'un message de chargement pendant la récupération des données
  if (isLoading)
    return <p className="loader-text">Chargement des messages ...</p>;
  // Affichage d'un message d'erreur en cas de problème de récupération
  if (error)
    return (
      <p className="loader-text">
        Erreur de chargement des messages: {error.message}
      </p>
    );
  console.log(messages);

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Affichage de la liste des messages
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {messages?.map((msg: Message) => {
        const isOwnMessage = msg.user_id === user?.id;
        const baseClass = style["conv-message-item"];
        const modifierClass = isOwnMessage
          ? style["conv-message-item--right"]
          : style["conv-message-item--left"];
        return (
          <div key={msg.id} className={`${baseClass} ${modifierClass}`}>
            <div className={style["conv-message-value"]}>{msg.content}</div>
            <div className={style["conv-message-details"]}>
              <span>{formatDate(msg.created_at)}</span>
              <span>•</span>
              <span>{msg.email}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
