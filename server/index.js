require('dotenv').config({ path: '../.env.local' });
const { Server } = require("socket.io");
const http = require("http");
const { Connection, PublicKey, Keypair, Transaction } = require("@solana/web3.js");
const { getAssociatedTokenAddress, createTransferInstruction } = require("@solana/spl-token");
const bs58 = require("bs58");

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200);
    res.end('Monara PvP Socket Server Online');
  }
});
const io = new Server(server, {
  cors: { origin: "*" },
});

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com", "confirmed");

const rooms = {};
const generateSeed = () => Math.floor(Math.random() * 1000000);

async function payoutTokens(winnerPubkeyString, betAmount) {
  try {
    const feeWalletAddress = process.env.NEXT_PUBLIC_FEE_WALLET_ADDRESS;
    const privateKeyString = process.env.FEE_WALLET_PRIVATE_KEY;
    const tokenCa = process.env.NEXT_PUBLIC_TOKEN_CA;

    if (!feeWalletAddress || !privateKeyString || !tokenCa || !winnerPubkeyString) return;

    let secretKey = bs58.default ? bs58.default.decode(privateKeyString) : bs58.decode(privateKeyString);
    const feeWallet = Keypair.fromSecretKey(secretKey);

    const mintPubkey = new PublicKey(tokenCa);
    const winnerPubkey = new PublicKey(winnerPubkeyString);

    const feeAta = await getAssociatedTokenAddress(mintPubkey, feeWallet.publicKey);
    const winnerAta = await getAssociatedTokenAddress(mintPubkey, winnerPubkey);

    const amountToSend = betAmount * 2 * Math.pow(10, 6); // Assuming 6 decimals

    const tx = new Transaction().add(
      createTransferInstruction(feeAta, winnerAta, feeWallet.publicKey, amountToSend)
    );

    const signature = await connection.sendTransaction(tx, [feeWallet]);
    console.log(`[Escrow] Successfully paid out ${betAmount * 2} MONARA to ${winnerPubkeyString}. TX: ${signature}`);
  } catch (err) {
    console.error(`[Escrow] Payout failed:`, err);
  }
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("create_room", ({ bet, playerHandle, signature }) => {
    console.log(`[Fee TX] Host ${playerHandle} paid fee: ${signature}`);
    const roomId = Math.random().toString(36).substring(2, 8);
    rooms[roomId] = {
      id: roomId,
      bet,
      players: {
        [socket.id]: { handle: playerHandle, ready: false, score: 0, currentRoundScore: null, txSignature: signature, pubkey: null } // We don't have pubkey yet if not provided
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

  socket.on("get_room_info", (roomId, callback) => {
    const room = rooms[roomId];
    if (room) {
      callback({ bet: room.bet });
    } else {
      callback({ error: "Room not found" });
    }
  });

  socket.on("join_room", ({ roomId, playerHandle, signature, pubkey }) => {
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
    room.players[socket.id] = { handle: playerHandle, ready: false, score: 0, currentRoundScore: null, txSignature: signature, pubkey };
    room.playerIds.push(socket.id);
    socket.join(roomId);
    room.status = 'active';

    console.log(`${socket.id} joined room ${roomId}`);

    const opponentId = room.playerIds[0];
    const opponentHandle = room.players[opponentId].handle;

    socket.emit("room_joined", { roomId, bet: room.bet, opponentHandle });
    socket.to(roomId).emit("opponent_joined", { opponentHandle: playerHandle });
  });

  socket.on("player_ready", ({ roomId, heroId }) => {
    const room = rooms[roomId];
    if (room && room.players[socket.id]) {
      room.players[socket.id].ready = true;
      room.players[socket.id].heroId = heroId || 'demon_samurai';
      console.log(`[Ready] ${room.players[socket.id].handle} is ready in room ${roomId} with ${room.players[socket.id].heroId}`);
      
      // Notify opponent
      socket.to(roomId).emit("player_ready_status", { 
        handle: room.players[socket.id].handle,
        heroId: room.players[socket.id].heroId
      });
    
    // Check if all players are ready
      if (room.playerIds.length === 2 && room.playerIds.every(id => room.players[id].ready)) {
        if (room.status === 'active') {
          console.log(`[Start] Both players ready in room ${roomId}. Starting countdown!`);
          
          io.to(roomId).emit("countdown_start");
          
          setTimeout(() => {
            const seed = generateSeed();
            room.currentSeed = seed;
            io.to(roomId).emit("battle_start", { seed, round: room.round });
          }, 3000);
        }
      }
    }
  });

  socket.on("player_unready", ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.players[socket.id]) {
      room.players[socket.id].ready = false;
      console.log(`[Unready] ${room.players[socket.id].handle} is NOT ready in room ${roomId}`);
      
      socket.to(roomId).emit("player_unready_status", { 
        handle: room.players[socket.id].handle 
      });
    }
  });

  socket.on("start_battle", ({ roomId }) => {
    // Deprecated: start_battle is now handled automatically by player_ready
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

    const checkRoundResolution = (room) => {
      const p1 = room.playerIds[0];
      const p2 = room.playerIds[1];
      if (room.players[p1].currentRoundScore !== null && room.players[p2].currentRoundScore !== null) {
        if (room.roundTimeout) {
          clearTimeout(room.roundTimeout);
          room.roundTimeout = null;
        }

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
          if (matchWinnerId && room.players[matchWinnerId].pubkey) {
            payoutTokens(room.players[matchWinnerId].pubkey, room.bet);
          } else {
             console.log(`[Escrow] Tie or missing pubkey. No payout.`);
          }

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
    };
    
    checkRoundResolution(room);
    
    if (room.players[p1].currentRoundScore === null || room.players[p2].currentRoundScore === null) {
      // One player submitted, start a 15-second timeout for the other player
      if (!room.roundTimeout) {
        room.roundTimeout = setTimeout(() => {
          console.log(`[Timeout] Player did not submit score in room ${roomId}. Forfeiting.`);
          const activePlayerId = room.players[p1].currentRoundScore !== null ? p1 : p2;
          const inactivePlayerId = activePlayerId === p1 ? p2 : p1;
          
          room.players[inactivePlayerId].currentRoundScore = 0; // Force 0 score for the inactive player
          // Re-evaluate round resolution now that we've forced a score
          checkRoundResolution(room);
        }, 15000);
      }
    }
  });

  socket.on("landmarks", ({ roomId, landmarks }) => {
    socket.to(roomId).emit("opponent_landmarks", landmarks);
  });

  socket.on("client_ping", (timestamp) => {
    socket.emit("server_pong", timestamp);
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

        if (room.playerIds.length === 1) {
          // Only creator was in the room, refund the bet
          const creatorPubkey = room.players[socket.id].pubkey;
          if (creatorPubkey) {
             console.log(`[Escrow] Creator disconnected. Refunding ${room.bet} MONARA to ${creatorPubkey}`);
             payoutTokens(creatorPubkey, room.bet / 2); // payoutTokens multiplies by 2, so pass bet/2 to refund 1x bet
          }
        } else {
          // Two players were in the room. The one who didn't disconnect wins the pot.
          const remainingPlayerId = room.playerIds.find(id => id !== socket.id);
          if (remainingPlayerId) {
            const winnerPubkey = room.players[remainingPlayerId].pubkey;
            if (winnerPubkey) {
               console.log(`[Escrow] Match ${roomId} disconnected mid-way. Payout ${room.bet * 2} MONARA to remaining player ${winnerPubkey}`);
               payoutTokens(winnerPubkey, room.bet);
            }
          }
        }
        
        if (room.roundTimeout) clearTimeout(room.roundTimeout);
        delete rooms[roomId];
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io Server running on port ${PORT}`);
});
