# PokeFlip Online Backend

This backend handles user authentication, game room creation, and multiplayer communication using Express, Socket.IO, and Supabase. It supports both solo and multiplayer modes with real-time interactions.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Environment Setup](#environment-setup)
- [Running the Server](#running-the-server)

---

## Features

- **User Authentication**: Secure login and registration with password hashing.
- **Game Room Management**: Create, join, and delete game rooms for online multiplayer.
- **Real-time Communication**: Synchronize game state between players using Socket.IO.
- **Supabase Integration**: Store user and game data.

---

## Technologies

- **Express** for the server framework.
- **Socket.IO** for real-time bidirectional event-based communication.
- **Supabase** for database storage.
- **Bcrypt** for password hashing.

---

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```plaintext
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the Server

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm run start
```

By default, the server runs on http://localhost:5000 (or your local ip adress).

## Contributing

1. Fork the repository.
2. Create a new branch (`feature/YourFeature`).
3. Commit changes.
4. Push to the branch.
5. Create a pull request.
