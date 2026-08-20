import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("le chat online est rendu uniquement pour un joueur de la room", async () => {
  const [online, roomChat] = await Promise.all([
    readFile("client/src/pages/Memory/Online/Online.jsx", "utf8"),
    readFile("client/src/components/RoomChat/RoomChat.jsx", "utf8"),
  ]);

  assert.match(online, /const isParticipant = room\?\.players\?\.some/);
  assert.match(online, /isParticipant && \(\s*<RoomChat/s);
  assert.match(roomChat, /socket\.emit\("send-room-message"/);
  assert.match(roomChat, /socket\.on\("room-message"/);
  assert.match(roomChat, /aria-live="polite"/);
  assert.match(roomChat, /maxLength=\{280\}/);
  assert.doesNotMatch(roomChat, /initialMessages\s*=\s*\[\]/);
});

test("le joueur peut reduire le chat en un bouton flottant au-dessus du jeu", async () => {
  const [online, onlineStyles, roomChat, roomChatStyles] = await Promise.all([
    readFile("client/src/pages/Memory/Online/Online.jsx", "utf8"),
    readFile("client/src/pages/Memory/Online/Online.css", "utf8"),
    readFile("client/src/components/RoomChat/RoomChat.jsx", "utf8"),
    readFile("client/src/components/RoomChat/RoomChat.css", "utf8"),
  ]);

  assert.match(online, /<div className="online-container">[\s\S]*<RoomChat/);
  assert.match(roomChat, /const \[isOpen, setIsOpen\] = useState\(false\)/);
  assert.match(roomChat, /aria-expanded=\{isOpen\}/);
  assert.match(roomChat, /className="room-chat__toggle"/);
  assert.match(roomChatStyles, /\.room-chat\s*\{[^}]*position:\s*absolute/s);
  assert.match(
    roomChatStyles,
    /\.room-chat\s*\{[^}]*right:\s*18px;[^}]*bottom:\s*18px;/s,
  );
  assert.match(roomChatStyles, /\.room-chat\.is-collapsed/);
  assert.doesNotMatch(
    onlineStyles,
    /\.online-container\s*\{[^}]*position:\s*relative;/s,
  );
});

test("un nouveau message recu pendant la fermeture affiche un badge jusqu'a l'ouverture", async () => {
  const [roomChat, roomChatStyles, frenchLocale] = await Promise.all([
    readFile("client/src/components/RoomChat/RoomChat.jsx", "utf8"),
    readFile("client/src/components/RoomChat/RoomChat.css", "utf8"),
    readFile("client/src/locales/fr.json", "utf8"),
  ]);

  assert.match(roomChat, /const \[unreadCount, setUnreadCount\] = useState\(0\)/);
  assert.match(roomChat, /message\.author !== currentUser && !isOpen/);
  assert.match(roomChat, /setUnreadCount\(0\)/);
  assert.match(roomChat, /className="room-chat__badge"/);
  assert.match(roomChatStyles, /\.room-chat__badge/);
  assert.match(roomChatStyles, /\.room-chat\.has-unread \.room-chat__toggle/);
  assert.match(frenchLocale, /"chatUnread_one"/);
  assert.match(frenchLocale, /"chatUnread_other"/);
});

test("ouvrir le chat affiche directement les derniers messages", async () => {
  const roomChat = await readFile(
    "client/src/components/RoomChat/RoomChat.jsx",
    "utf8",
  );

  assert.match(
    roomChat,
    /if \(isOpen && messageList\) messageList\.scrollTop = messageList\.scrollHeight;/,
  );
  assert.match(roomChat, /}, \[isOpen, messages\]\);/);
});
