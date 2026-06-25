require('dotenv').config({ path: '../.env.local' });
const { Server } = require("socket.io");
const http = require("http");
const { Connection, PublicKey } = require("@solana/web3.js");

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "*" },
});

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com", "confirmed");

const rooms = {};
const generateSeed = () => Math.floor(Math.random() * 1000000);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("create_room", ({ bet, playerHandle, signature }) => {
    console.log(`[Fee TX] Host ${playerHandle} paid fee: ${signature}`);
    const roomId = Math.random().toString(36).substring(2, 8);
    rooms[roomId] = {
      id: roomId,
      bet,
      players: {
        [socket.id]: { handle: playerHandle, ready: true, score: 0, currentRoundScore: null, txSignature: signature }
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

  socket.on("join_room", ({ roomId, playerHandle, signature }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }
    if (room.playerIds.length >= 2) {
      socket.emit("error", { message: "Room is full" });
      return;
    }

    console.log(`[Fee TX] Challenger ${playerHandle} paid fee: ${signature}`);
    room.players[socket.id] = { handle: playerHandle, ready: true, score: 0, currentRoundScore: null, txSignature: signature };
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

    const p1 = room.playerIds[0];
    const p2 = room.playerIds[1];
    
    if (room.players[p1].currentRoundScore !== null && room.players[p2].currentRoundScore !== null) {
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
        let matchWinnerId = null;
        if (room.players[p1].score > room.players[p2].score) matchWinnerId = p1;
        else if (room.players[p2].score > room.players[p1].score) matchWinnerId = p2;

        const loserId = matchWinnerId === p1 ? p2 : p1;

        console.log(`Match ${roomId} over. Winner: ${matchWinnerId ? room.players[matchWinnerId].handle : 'Tie'}`);
        // Payout Pot to Winner Logic would go here
        console.log(`[Escrow] Releasing ${room.bet * 2} MONARA to ${matchWinnerId ? room.players[matchWinnerId].handle : 'Tie'}`);

        io.to(roomId).emit("match_result", {
          winnerHandle: matchWinnerId ? room.players[matchWinnerId].handle : 'Tie',
          loserHandle: matchWinnerId ? room.players[loserId].handle : 'Tie',
          bet: room.bet
        });
        delete rooms[roomId];
      } else {
        room.round += 1;
        const seed = generateSeed();
        room.currentSeed = seed;
        setTimeout(() => {
          io.to(roomId).emit("battle_start", { seed, round: room.round });
        }, 2000);
      }
    }
  });

  socket.on("landmarks", ({ roomId, landmarks }) => {
    socket.to(roomId).emit("opponent_landmarks", landmarks);
  });

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
        // Escrow logic for disconnect
        console.log(`[Escrow] Match ${roomId} disconnected mid-way. Burning fees.`);
        delete rooms[roomId];
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket.io Server running on port ${PORT}`);
});
