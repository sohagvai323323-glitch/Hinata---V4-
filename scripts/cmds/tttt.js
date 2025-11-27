// tttt.js – Fully functional offline Tic Tac Toe
// Author: Helal
const games = {};

const wins = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function renderBoard(board){
  const symbols = board.map(c=> c===null?'⬜': c==='X'?'❌':'🟢');
  return `${symbols[0]} ${symbols[1]} ${symbols[2]}\n${symbols[3]} ${symbols[4]} ${symbols[5]}\n${symbols[6]} ${symbols[7]} ${symbols[8]}`;
}

function checkWin(board){
  for(let w of wins){
    if(board[w[0]] && board[w[0]]===board[w[1]] && board[w[1]]===board[w[2]]){
      return w;
    }
  }
  return null;
}

function botMove(board, level, bot, user){
  let free = board.map((v,i)=>v===null?i:null).filter(v=>v!==null);
  if(level==="easy") return free[Math.floor(Math.random()*free.length)];
  if(level==="normal"){
    for(let f of free){
      let temp = [...board]; temp[f]=user;
      if(checkWin(temp)) return f;
    }
    return free[Math.floor(Math.random()*free.length)];
  }
  if(level==="hard"){
    for(let f of free){ let temp=[...board]; temp[f]=bot; if(checkWin(temp)) return f; }
    for(let f of free){ let temp=[...board]; temp[f]=user; if(checkWin(temp)) return f; }
    return free[Math.floor(Math.random()*free.length)];
  }
}

module.exports = {
  config:{
    name:"tttt",
    category:"game",
    shortDescription:"Offline Tic Tac Toe",
    guide:"/tttt <easy|normal|hard> <X|O>"
  },

  onStart: async function({message,event,args}){
    if(games[event.senderID]) return message.reply("❗ You already have an active game!");
    
    let level = (args[0]||"easy").toLowerCase();
    if(!["easy","normal","hard"].includes(level)) return message.reply("❌ Level: easy|normal|hard");
    
    let userSym = (args[1]||"X").toUpperCase();
    if(!["X","O"].includes(userSym)) return message.reply("❌ Choose symbol X or O");

    let botSym = userSym==="X"?"O":"X";
    let board = Array(9).fill(null);
    games[event.senderID] = {board, user:userSym, bot:botSym, level, lastMsg:null};

    let msg = await message.reply(`🎮 Tic Tac Toe Started!\nYou: ${userSym==='X'?'❌':'🟢'}\nBot: ${botSym==='X'?'❌':'🟢'}\nLevel: ${level}\nReply 1-9 to place your symbol.\n\n${renderBoard(board)}`);
    games[event.senderID].lastMsg = msg.messageID;
  },

  onChat: async function({message,event}){
    let game = games[event.senderID];
    if(!game) return; // only active player can reply

    let choice = parseInt(event.body);
    if(!choice || choice<1 || choice>9) return;
    if(game.board[choice-1]!==null){
      await message.reply("❌ Cell already taken!");
      return;
    }

    // user move
    game.board[choice-1] = game.user;
    let winCombo = checkWin(game.board);
    if(winCombo){
      await message.unsend(game.lastMsg).catch(()=>{});
      delete games[event.senderID];
      return message.reply(`${renderBoard(game.board)}\n🏆 You Win!`);
    }

    // bot move
    if(game.board.every(c=>c!==null)){
      await message.unsend(game.lastMsg).catch(()=>{});
      delete games[event.senderID];
      return message.reply(`${renderBoard(game.board)}\n💀 Draw!`);
    }

    let botSlot = botMove(game.board, game.level, game.bot, game.user);
    game.board[botSlot] = game.bot;

    winCombo = checkWin(game.board);
    if(winCombo){
      await message.unsend(game.lastMsg).catch(()=>{});
      delete games[event.senderID];
      return message.reply(`${renderBoard(game.board)}\n💀 Bot Wins!`);
    }

    if(game.board.every(c=>c!==null)){
      await message.unsend(game.lastMsg).catch(()=>{});
      delete games[event.senderID];
      return message.reply(`${renderBoard(game.board)}\n💀 Draw!`);
    }

    // continue game
    await message.unsend(game.lastMsg).catch(()=>{});
    let msg = await message.reply(renderBoard(game.board));
    game.lastMsg = msg.messageID;
  }
};