import style from "../styles/ChatRoom.module.css";
import logo from "../../public/discuter.png";
import { useChatStore } from "../store/chatStore";
import { ChatMessage } from "../components/chat/ChatMessage";
import { ChatMessageForm } from "../components/chat/ChatMessageForm";

export const ChatRoom = () => {
  const { user, currentChat } = useChatStore();

  // On créé une condition si aucune discussion n'est active, on demande de rejoindre un salon ou de démarrer une conversation //
  if (currentChat === null) {
    return (
      <div className={style.conv}>
        <h2>Veuillez rejoindre un salon ou démarrer une conversation</h2>
      </div>
    );
  }
  return (
    <div className={style.conv}>
      <div className={style["conv-title"]}>
        <div className={style["conv-title-left"]}>
          <img src={logo} alt="logo" />
          <h2>
            {currentChat.name} - {user?.email}
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
