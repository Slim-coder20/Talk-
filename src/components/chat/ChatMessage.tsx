import { useChatStore, type ChatTarget } from "../../store/chatStore";
import { supabase } from "../../supabaseClient";
import style from "./ChatMessage.module.css";
import "../../index.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// Interface définissant la structure d'un message
// room_id et conversation_id sont mutuellement exclusifs (contrainte en base) :
// un message appartient soit à un salon public, soit à une conversation privée
interface Message {
  id: number;
  content: string;
  user_id: string;
  email: string;
  created_at: string;
  room_id: number | null;
  conversation_id: number | null;
  attachment_url: string | null;
  attachment_type: "image" | "video" | null;
}

// Fonction asynchrone pour récupérer les messages d'un salon OU d'une conversation privée depuis Supabase
async function fetchMessages(target: ChatTarget): Promise<Message[]> {
  // On filtre sur la bonne colonne selon le type de discussion
  const column = target.type === "room" ? "room_id" : "conversation_id";

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq(column, target.id)
    .order("created_at", { ascending: true });

  // Si une erreur survient, on la propage
  if (error) throw Error(error.message);
  return data as Message[];
}

export const ChatMessage = () => {
  // Récupération de la discussion active (salon ou conversation privée) depuis le store Zustand
  const { currentChat, user } = useChatStore();
  const queryClient = useQueryClient();
  // Utilisation de React Query pour gérer le chargement et le cache des messages
  const {
    data: messages,
    error,
    isLoading,
  } = useQuery<Message[], Error>({
    // Clé de requête basée sur le type et l'ID de la discussion active
    queryKey: ["messages", currentChat?.type, currentChat?.id],
    // Fonction de récupération des messages (retourne un tableau vide si aucune discussion active)
    queryFn: () => (currentChat ? fetchMessages(currentChat) : Promise.resolve([])),
    // La requête ne s'exécute que si une discussion est active
    enabled: currentChat !== null,
  });

  // useEffect pour écouter les nouveaux messages en temps réel depuis Supabase Realtime
  useEffect(() => {
    // Si aucune discussion n'est active, on ne fait rien
    if (!currentChat) return;

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

          // Vérification que le nouveau message appartient bien à la discussion actuellement affichée
          // (comparaison sur room_id pour un salon, conversation_id pour une conversation privée)
          const belongsToCurrentChat =
            currentChat.type === "room"
              ? newMessage.room_id === currentChat.id
              : newMessage.conversation_id === currentChat.id;

          if (belongsToCurrentChat) {
            // Mise à jour du cache React Query avec le nouveau message
            // Cette fonction met à jour les données en cache sans refaire une requête HTTP
            queryClient.setQueryData<Message[]>(
              ["messages", currentChat.type, currentChat.id], // Clé de la requête à mettre à jour
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

    // Fonction de nettoyage exécutée quand le composant est démonté ou quand la discussion active change
    // Cela permet de se désabonner du canal pour éviter les fuites mémoire et les connexions inutiles
    return () => {
      // Désabonnement du canal Supabase
      supabase.removeChannel(channel);
    };
  }, [currentChat?.type, currentChat?.id, queryClient]); // Dépendances : le useEffect se réexécute si le type ou l'ID de la discussion change

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
            {msg.attachment_url && msg.attachment_type === "image" && (
              <img
                src={msg.attachment_url}
                alt="Pièce jointe"
                className={style["conv-message-attachment"]}
              />
            )}
            {msg.attachment_url && msg.attachment_type === "video" && (
              <video
                src={msg.attachment_url}
                controls
                className={style["conv-message-attachment"]}
              />
            )}
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
