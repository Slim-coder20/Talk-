import { useChatStore } from "../../store/chatStore";
import { supabase } from "../../supabaseClient";
import style from "./ChatMessageForm.module.css";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

interface MessageFormDaata {
  message: string;
}

export const ChatMessageForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MessageFormDaata>();

  const { currentRoom, user } = useChatStore();
  const queryClient = useQueryClient();

  const onSubmit = async (data: MessageFormDaata) => {
    if (!currentRoom) return;
    const { error } = await supabase.from("messages").insert([
      {
        content: data.message,
        user_id: user?.id,
        email: user?.email,
        room_id: currentRoom.id,
      },
    ]);
    if (error) {
      console.error("Erreur lors de l'envoie du message: ", error.message);
    } else {
      reset();
      // Invalidation du cache React Query pour rafraîchir la liste des messages
      queryClient.invalidateQueries({ queryKey: ["messages", currentRoom.id] });
    }
  };
  return (
    <div>
      <form
        className={style["conv-send-message"]}
        onSubmit={handleSubmit(onSubmit)}
      >
        <input
          className={style["conv-input"]}
          type="text"
          placeholder={
            errors.message ? errors.message.message : "Entrer votre message ..."
          }
          {...register("message", { required: "Entrer votre message" })}
        />

        <button className={style["conv-button"]} type="submit">
          Envoyer
        </button>
      </form>
    </div>
  );
};
