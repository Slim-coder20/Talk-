import style from "../styles/ChatRoom.module.css";
import logo from "../../public/discuter.png";
import { useChatStore } from "../store/chatStore";
import { ChatMessage } from "../components/chat/ChatMessage";
import { ChatMessageForm } from "../components/chat/ChatMessageForm";

export const ChatRoom = () => {
  const { user, currentRoom } = useChatStore();

  // On créé une condition si le salon est null, on affiche un message qui demande de rejoindre u salon ou de créer un salon//
  if (currentRoom === null) {
    return (
      <div className={style.conv}>
        <h2>Veuillez rejoindre un salon ou créer un salon</h2>
      </div>
    );
  }
  return (
    <div className={style.conv}>
      <div className={style["conv-title"]}>
        <div className={style["conv-title-left"]}>
          <img src={logo} alt="logo" />
          <h2>
            {currentRoom.name} - {user?.email}
          </h2>
        </div>
      </div>
      <div className={style["conv-timeline"]}>
        <ChatMessage />
      </div>
      <div className={style["conv-set-message"]}>
        <ChatMessageForm />
      </div>
    </div>
  );
};
