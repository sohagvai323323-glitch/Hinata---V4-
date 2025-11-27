const games = {};
const wins = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function renderBoard(board){
  return board.map(c=> c===null?'⬜':c==='X'?'❌':'🟢')
              .reduce((acc,c,i)=> acc + (i%3===2 ? c+'\n': c), '');
}

function checkWin(board){
  for(let w of wins){
    if(board[w[0]] && board[w[0]]===board[w[1]] && board[w[1]]===board[w[2]]){
      return w;
    }
  }
  return null;
}

module.exports = {
  config:{
    name:"mtttt",
    category:"game",
    shortDescription:"Multi-player Tic Tac Toe",
    guide:"/mtttt @user ❌ or 🟢 (optional)"
  },

  onStart: async function({message,event,args,api}){
    if(args.length===0) return message.reply("❌ Please mention a player.");

    const mentionID = Object.keys(event.mentions)[0];
    const senderID = event.senderID;

    // fetch user info
    const info = await api.getUserInfo([senderID, mentionID]);
    const player1Name = info[senderID]?.name || "Player1";
    const player2Name = info[mentionID]?.name || "Player2";

    // choose symbols
    let userSymbol = args[1]==='❌'?'X':args[1]==='🟢'?'O':'X'; 
    let mentionSymbol = userSymbol==='X'?'O':'X';

    const gameKey = [senderID,mentionID].sort().join("_");
    if(games[gameKey]) return message.reply("❗ Game already active!");

    const board = Array(9).fill(null);
    games[gameKey] = {
      board,
      players:[senderID,mentionID],
      names:{ [senderID]:player1Name, [mentionID]:player2Name },
      symbols: { [senderID]:userSymbol, [mentionID]:mentionSymbol },
      turn: senderID,
      lastMsg:null
    };

    const turnSymbol = userSymbol==='X'?'❌':'🟢';
    const msg = await message.reply(
      `${player1Name} ${userSymbol==='X'?'❌':'🟢'} vs ${player2Name} ${mentionSymbol==='X'?'❌':'🟢'}\n` +
      `Turn: ${player1Name} ${turnSymbol}\n\n` +
      renderBoard(board)
    );
    games[gameKey].lastMsg = msg.messageID;
  },

  onChat: async function({message,event,api}){
    const player = event.senderID;
    const gameKey = Object.keys(games).find(k=> k.includes(player));
    if(!gameKey) return; // not in game
    const game = games[gameKey];

    if(game.turn!==player) return; // not player's turn
    const choice = parseInt(event.body);
    if(!choice||choice<1||choice>9) return;

    if(game.board[choice-1]!==null){
      return message.reply("❌ Cell already taken!");
    }

    game.board[choice-1] = game.symbols[player];

    const winCombo = checkWin(game.board);
    if(winCombo){
      await message.unsend(game.lastMsg).catch(()=>{});
      const winnerName = game.names[player];
      const winnerSymbol = game.symbols[player]==='X'?'❌':'🟢';
      delete games[gameKey];
      return message.reply(`${renderBoard(game.board)}\n🏆 ${winnerName} ${winnerSymbol} wins!`);
    }

    if(game.board.every(c=>c!==null)){
      await message.unsend(game.lastMsg).catch(()=>{});
      delete games[gameKey];
      return message.reply(`${renderBoard(game.board)}\n💀 Draw!`);
    }

    // Switch turn
    game.turn = game.players.find(p=>p!==player);
    const turnName = game.names[game.turn];
    const turnSymbol = game.symbols[game.turn]==='X'?'❌':'🟢';

    await message.unsend(game.lastMsg).catch(()=>{});
    const msg = await message.reply(
      `Turn: ${turnName} ${turnSymbol}\n\n${renderBoard(game.board)}`
    );
    game.lastMsg = msg.messageID;
  }
};