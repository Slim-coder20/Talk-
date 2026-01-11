import style from "./ChatMessage.module.css";

export const ChatMessage = () => {
  return (
    <div className={style["conv-message"]}>
      <div className={style["conv-message-item"]}>
        <div className={style["conv-message-details"]}>
          <p className={style["conv-message-value"]}>Message...</p>
        </div>
      </div>
    </div>
  )
}
