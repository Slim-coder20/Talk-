import { useChatStore } from "../../store/chatStore";
import { supabase } from "../../supabaseClient";
import style from "./ChatMessageForm.module.css";
import { useForm } from "react-hook-form";

// Interface définissant la structure des données du formulaire de message
interface MessageFormDaata {
  message: string;
  file: FileList;
}

export const ChatMessageForm = () => {
  // Utilisation de react-hook-form pour gérer le formulaire et sa validation
  const {
    register, // Fonction pour enregistrer les champs du formulaire
    handleSubmit, // Fonction pour gérer la soumission du formulaire
    formState: { errors }, // État des erreurs de validation du formulaire
    reset, // Fonction pour réinitialiser le formulaire après soumission
  } = useForm<MessageFormDaata>();

  // Récupération de la discussion active (salon ou conversation privée) et de l'utilisateur depuis le store Zustand
  const { currentChat, user } = useChatStore();

  // Fonction asynchrone exécutée lors de la soumission du formulaire
  const onSubmit = async (data: MessageFormDaata) => {
    // Si aucune discussion n'est active ou pas d'utilisateur connecté, on ne fait rien
    if (!currentChat || !user) return;

    // Récupération du fichier éventuellement sélectionné (FileList -> premier fichier)
    const file = data.file?.[0];

    let attachmentUrl: string | null = null;
    let attachmentType: "image" | "video" | null = null;

    if (file) {
      // Chemin unique dans le bucket pour éviter d'écraser un fichier existant
      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      // Upload du fichier vers le bucket Storage "chat-media"
      const { error: uploadError } = await supabase.storage
        .from("chat-media")
        .upload(filePath, file);

      if (uploadError) {
        console.error(
          "Erreur lors de l'upload du fichier: ",
          uploadError.message
        );
        return; // On n'envoie pas de message si l'upload a échoué
      }

      // Récupération de l'URL publique du fichier uploadé (pas de requête réseau, le bucket est public)
      const { data: publicUrlData } = supabase.storage
        .from("chat-media")
        .getPublicUrl(filePath);

      attachmentUrl = publicUrlData.publicUrl;
      attachmentType = file.type.startsWith("video/") ? "video" : "image";
    }

    // On renseigne room_id OU conversation_id selon le type de discussion active
    // (l'autre colonne reste absente du payload, donc NULL en base, conformément à la contrainte)
    const targetColumn =
      currentChat.type === "room"
        ? { room_id: currentChat.id }
        : { conversation_id: currentChat.id };

    // Insertion du nouveau message dans la table messages de Supabase
    const { error } = await supabase.from("messages").insert([
      {
        content: data.message, // Contenu du message saisi par l'utilisateur
        user_id: user.id, // ID de l'utilisateur qui envoie le message
        email: user.email, // Email de l'utilisateur qui envoie le message
        ...targetColumn, // room_id ou conversation_id selon le contexte
        attachment_url: attachmentUrl, // URL du fichier joint, ou null si aucun
        attachment_type: attachmentType, // "image" | "video" | null
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
        <input
          className={style["conv-file-input"]}
          type="file"
          accept="image/*,video/*"
          {...register("file")}
        />

        {/* Bouton d'envoi du message */}
        <button className={style["conv-button"]} type="submit">
          Envoyer
        </button>
      </form>
    </div>
  );
};
