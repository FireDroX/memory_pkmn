import { useEffect, useRef, useState } from "react";
import { FaComments, FaPaperPlane, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { socket } from "../../socket";
import "./RoomChat.css";

const MAX_VISIBLE_MESSAGES = 100;

const formatMessageTime = (value, locale) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const RoomChat = ({ roomId, currentUser, initialMessages }) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState(
    Array.isArray(initialMessages) ? initialMessages : [],
  );
  const [draft, setDraft] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesRef = useRef(null);
  const knownMessageIdsRef = useRef(
    new Set(
      Array.isArray(initialMessages)
        ? initialMessages.map((message) => message.id)
        : [],
    ),
  );

  useEffect(() => {
    if (Array.isArray(initialMessages)) {
      setMessages(initialMessages);
      knownMessageIdsRef.current = new Set(
        initialMessages.map((message) => message.id),
      );
    }
  }, [initialMessages, roomId]);

  useEffect(() => {
    const handleMessage = (message) => {
      if (!message?.id || knownMessageIdsRef.current.has(message.id)) return;
      knownMessageIdsRef.current.add(message.id);

      setMessages((currentMessages) => {
        return [...currentMessages, message].slice(-MAX_VISIBLE_MESSAGES);
      });

      if (message.author !== currentUser && !isOpen) {
        setUnreadCount((currentCount) => Math.min(currentCount + 1, 99));
      }
    };

    socket.on("room-message", handleMessage);
    return () => socket.off("room-message", handleMessage);
  }, [currentUser, isOpen, roomId]);

  useEffect(() => {
    const messageList = messagesRef.current;
    if (isOpen && messageList) messageList.scrollTop = messageList.scrollHeight;
  }, [isOpen, messages]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    socket.emit("send-room-message", { room: roomId, text });
    setDraft("");
  };

  const handleToggle = () => {
    if (!isOpen) setUnreadCount(0);
    setIsOpen((currentValue) => !currentValue);
  };

  const toggleLabel = isOpen
    ? t("online.chatClose")
    : unreadCount > 0
      ? `${t("online.chatOpen")}. ${t("online.chatUnread", { count: unreadCount })}`
      : t("online.chatOpen");

  return (
    <section
      className={`room-chat ${isOpen ? "is-open" : "is-collapsed"} ${unreadCount > 0 ? "has-unread" : ""}`}
      aria-labelledby="room-chat-title"
    >
      <button
        className="room-chat__toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls="room-chat-panel"
        aria-label={toggleLabel}
        onClick={handleToggle}
      >
        {isOpen ? <FaTimes aria-hidden="true" /> : <FaComments aria-hidden="true" />}
        {!isOpen && unreadCount > 0 && (
          <span
            className="room-chat__badge"
            role="status"
            aria-live="polite"
            aria-label={t("online.chatUnread", { count: unreadCount })}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <div className="room-chat__panel" id="room-chat-panel" hidden={!isOpen}>
        <header className="room-chat__header">
          <span aria-hidden="true">
            <FaComments />
          </span>
          <div>
            <h2 id="room-chat-title">{t("online.chatTitle")}</h2>
            <p>{t("online.chatDescription")}</p>
          </div>
        </header>

        <div
          className="room-chat__messages"
          ref={messagesRef}
          role="log"
          aria-live="polite"
          aria-label={t("online.chatTitle")}
        >
          {messages.length === 0 ? (
            <p className="room-chat__empty">{t("online.chatEmpty")}</p>
          ) : (
            <ol>
              {messages.map((message) => {
                const time = formatMessageTime(
                  message.createdAt,
                  i18n.resolvedLanguage,
                );

                return (
                  <li
                    className={
                      message.author === currentUser ? "is-current-user" : ""
                    }
                    key={message.id}
                  >
                    <div>
                      <strong>{message.author}</strong>
                      {time && <time dateTime={message.createdAt}>{time}</time>}
                    </div>
                    <p>{message.text}</p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <form className="room-chat__form" onSubmit={handleSubmit}>
          <label htmlFor="room-chat-message">{t("online.chatLabel")}</label>
          <div>
            <input
              id="room-chat-message"
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("online.chatPlaceholder")}
              maxLength={280}
              autoComplete="off"
            />
            <button type="submit" disabled={!draft.trim()}>
              <FaPaperPlane aria-hidden="true" />
              {t("online.chatSend")}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default RoomChat;
