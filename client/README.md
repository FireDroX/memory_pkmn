# PokeFlip Online Frontend

This is the frontend for PokeFlip Online, built with React. It supports both solo and multiplayer modes with real-time updates using Socket.IO and state management via React Context.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Environment Setup](#environment-setup)
- [Usage](#usage)
- [File Structure](#file-structure)

---

## Features

- **Single-Player Mode**: Play solo with adjustable difficulty settings.
- **Multiplayer Mode**: Real-time online play with other users.
- **Authentication**: Login and registration with user sessions.
- **Game Room Management**: Create, invite, and join game rooms for multiplayer.

---

## Technologies

- **React** for UI components and routing.
- **Socket.IO** for real-time multiplayer communication.

---

## Environment Setup

In development, `socket.js` points to a local backend for testing. Ensure the backend server is running at `http://localhost:5000` or adjust the URL in `client/src/socket.js` as needed:

```javascript
const URL =
  process.env.NODE_ENV === "production" ? undefined : "http://localhost:5000";
export const socket = io(URL, { autoConnect: false });
```

## Usage

**Game Modes**

- **Solo Mode**: Choose a difficulty setting and start the game to match pairs of cards.
- **Multiplayer Mode**: Invite players to a game room and play in real time. Game states sync automatically between players.

**User Authentication**

- **Login/Register**: On the login page, enter a username and password to log in or register.

## File Structure

- `App.jsx`: Main application component with routing logic.
- `components/`: Reusable components like `Navbar`.
- `pages/`: Contains individual pages (`Home`, `Login`, `Profile`, `Memory`).
- `utils/`: Shared utilities and context providers.
- `socket.js`: Initializes and exports the Socket.IO client for real-time features.

## Contributing

1. Fork the repository.
2. Create a new branch (`feature/YourFeature`).
3. Commit changes.
4. Push to the branch.
5. Create a pull request.
