const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust in production
  },
});

// Store rooms data in memory
const rooms = {};

const generateSeed = () => Math.floor(Math.random() * 1000000);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Matchmaking or creating a room
  socket.on("create_room", ({ bet, playerHandle }) => {
    const roomId = Math.random().toString(36).substring(2, 8);
    rooms[roomId] = {
      id: roomId,
      bet,
      players: {
        [socket.id]: { handle: playerHandle, ready: true, score: 0, currentRoundScore: null }
      },
      playerIds: [socket.id],
      status: 'waiting',
      round: 1,
      maxRounds: 3
    };
    socket.join(roomId);
    socket.emit("room_created", { roomId, bet });
    console.log(`Room ${roomId} created by ${socket.id}`);
  });

  socket.on("join_room", ({ roomId, playerHandle }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }
    if (room.playerIds.length >= 2) {
      socket.emit("error", { message: "Room is full" });
      return;
    }

    room.players[socket.id] = { handle: playerHandle, ready: true, score: 0, currentRoundScore: null };
    room.playerIds.push(socket.id);
    socket.join(roomId);
    room.status = 'active';

    console.log(`${socket.id} joined room ${roomId}`);

    const opponentId = room.playerIds[0];
    const opponentHandle = room.players[opponentId].handle;

    socket.emit("room_joined", { roomId, bet: room.bet, opponentHandle });
    socket.to(roomId).emit("opponent_joined", { opponentHandle: playerHandle });
  });

  socket.on("start_battle", ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.status === 'active') {
      const seed = generateSeed();
      room.currentSeed = seed;
      io.to(roomId).emit("battle_start", { seed, round: room.round });
      console.log(`Battle started in room ${roomId}, round ${room.round}`);
    }
  });

  socket.on("round_result", ({ roomId, accuracy, hits }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.players[socket.id].currentRoundScore = accuracy;

    // Check if both players submitted
    const p1 = room.playerIds[0];
    const p2 = room.playerIds[1];
    
    if (room.players[p1].currentRoundScore !== null && room.players[p2].currentRoundScore !== null) {
      // Both submitted, resolve round
      const score1 = room.players[p1].currentRoundScore;
      const score2 = room.players[p2].currentRoundScore;

      let winnerId = null;
      if (score1 > score2) winnerId = p1;
      else if (score2 > score1) winnerId = p2;

      if (winnerId) {
        room.players[winnerId].score += 1;
      }

      io.to(roomId).emit("round_resolved", {
        round: room.round,
        scores: {
          [room.players[p1].handle]: room.players[p1].score,
          [room.players[p2].handle]: room.players[p2].score
        },
        winnerHandle: winnerId ? room.players[winnerId].handle : 'Tie'
      });

      room.players[p1].currentRoundScore = null;
      room.players[p2].currentRoundScore = null;

      if (room.players[p1].score === 2 || room.players[p2].score === 2 || room.round >= room.maxRounds) {
        // Match over
        let matchWinnerId = null;
        if (room.players[p1].score > room.players[p2].score) matchWinnerId = p1;
        else if (room.players[p2].score > room.players[p1].score) matchWinnerId = p2;

        const loserId = matchWinnerId === p1 ? p2 : p1;

        io.to(roomId).emit("match_result", {
          winnerHandle: matchWinnerId ? room.players[matchWinnerId].handle : 'Tie',
          loserHandle: matchWinnerId ? room.players[loserId].handle : 'Tie',
          bet: room.bet
        });
        delete rooms[roomId]; // cleanup
      } else {
        // Next round
        room.round += 1;
        const seed = generateSeed();
        room.currentSeed = seed;
        setTimeout(() => {
          io.to(roomId).emit("battle_start", { seed, round: room.round });
        }, 2000);
      }
    }
  });

  // Relay landmarks to opponent
  socket.on("landmarks", ({ roomId, landmarks }) => {
    socket.to(roomId).emit("opponent_landmarks", landmarks);
  });

  // Hit relay for animations
  socket.on("player_hit", ({ roomId }) => {
    socket.to(roomId).emit("opponent_hit");
  });
  
  socket.on("player_miss", ({ roomId }) => {
    socket.to(roomId).emit("opponent_miss");
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.players[socket.id]) {
        io.to(roomId).emit("opponent_disconnected");
        delete rooms[roomId];
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket.io Server running on port ${PORT}`);
});
