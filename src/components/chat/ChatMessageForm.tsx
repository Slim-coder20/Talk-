import style from "./ChatMessageForm.module.css";
export const ChatMessageForm = () => {
  return (
    <div>
      <form className={style["conv-send-message"]}>
        <input className={style["conv-input"]} type="text" placeholder="Message..." />
        <button className={style["conv-button"]} type="submit">Envoyer</button>
      </form>
    </div>
  )
}
