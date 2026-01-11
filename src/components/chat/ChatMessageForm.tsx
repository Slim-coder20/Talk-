import { useChatStore } from "../../store/chatStore";
import { supabase } from "../../supabaseClient";
import style from "./ChatMessageForm.module.css";
import { useForm } from "react-hook-form";

// Interface définissant la structure des données du formulaire de message
interface MessageFormDaata {
  message: string;
}

export const ChatMessageForm = () => {
  // Utilisation de react-hook-form pour gérer le formulaire et sa validation
  const {
    register, // Fonction pour enregistrer les champs du formulaire
    handleSubmit, // Fonction pour gérer la soumission du formulaire
    formState: { errors }, // État des erreurs de validation du formulaire
    reset, // Fonction pour réinitialiser le formulaire après soumission
  } = useForm<MessageFormDaata>();

  // Récupération de la salle de chat actuelle et de l'utilisateur depuis le store Zustand
  const { currentRoom, user } = useChatStore();

  // Fonction asynchrone exécutée lors de la soumission du formulaire
  const onSubmit = async (data: MessageFormDaata) => {
    // Si aucune salle n'est sélectionnée, on ne fait rien
    if (!currentRoom) return;

    // Insertion du nouveau message dans la table messages de Supabase
    const { error } = await supabase.from("messages").insert([
      {
        content: data.message, // Contenu du message saisi par l'utilisateur
        user_id: user?.id, // ID de l'utilisateur qui envoie le message
        email: user?.email, // Email de l'utilisateur qui envoie le message
        room_id: currentRoom.id, // ID de la salle de chat où le message est envoyé
      },
    ]);

    // Gestion des erreurs d'insertion
    if (error) {
      console.error("Erreur lors de l'envoie du message: ", error.message);
    } else {
      // Si l'insertion réussit, on réinitialise le formulaire pour permettre un nouveau message
      // Note: Pas besoin d'invalider le cache React Query car Supabase Realtime
      // dans ChatMessage.tsx ajoute automatiquement le nouveau message au cache en temps réel
      reset();
    }
  };

  return (
    <div>
      {/* Formulaire de saisie et d'envoi de message */}
      <form
        className={style["conv-send-message"]}
        onSubmit={handleSubmit(onSubmit)} // handleSubmit valide le formulaire avant d'appeler onSubmit
      >
        {/* Champ de saisie du message avec validation */}
        <input
          className={style["conv-input"]}
          type="text"
          placeholder={
            // Affiche le message d'erreur comme placeholder si une erreur existe
            errors.message ? errors.message.message : "Entrer votre message ..."
          }
          {...register("message", { required: "Entrer votre message" })} // Enregistrement du champ avec validation requise
        />

        {/* Bouton d'envoi du message */}
        <button className={style["conv-button"]} type="submit">
          Envoyer
        </button>
      </form>
    </div>
  );
};
