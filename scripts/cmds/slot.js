module.exports = {
  config: {
    name: "slot",
    aliases: ["spin", "fruit"],
    version: "5.0",
    author: "Helal",
    countDown: 10,
    role: 0,
    shortDescription: "Play a fruit slot game 🎰",
    longDescription: "Try your luck! Each spin costs 15৳. Match fruits to win rewards!",
    category: "game",
    guide: "{p}slot"
  },

  onStart: async function ({ api, event, usersData, message }) {
    const senderID = event.senderID;
    const bet = 15; // Auto bet 15৳

    // Get user balance
    const userData = await usersData.get(senderID);
    const currentBalance = Number(userData.money) || 0;

    if (currentBalance < bet)
      return message.reply(`💰 Not enough balance! You have only ${currentBalance}৳.`);

    // Deduct 15৳ for spin
    await usersData.set(senderID, { money: currentBalance - bet });

    // Fruit emojis 🍓🍇🍋🥭🍏
    const fruits = ["🍓", "🍇", "🍋", "🥭", "🍏"];
    const getRandom = () => [
      fruits[Math.floor(Math.random() * fruits.length)],
      fruits[Math.floor(Math.random() * fruits.length)],
      fruits[Math.floor(Math.random() * fruits.length)]
    ];

    // Initial spin message
    let current = getRandom();
    const spinMsg = await message.reply(`\n[ ${current.join(" | ")} ]`);

    // Animation - 3 steps only
    for (let i = 0; i < 2; i++) {
      await new Promise(r => setTimeout(r, 1000));
      current = getRandom();
      await api.editMessage(`\n[ ${current.join(" | ")} ]`, spinMsg.messageID);
    }

    // Final spin result
    await new Promise(r => setTimeout(r, 1000));
    const final = getRandom();

    let win = 0;
    let resultText = "";

    // Win conditions
    if (final[0] === final[1] && final[1] === final[2]) {
      win = 100;
      resultText = `🎲 JACKPOT! 3× ${final[0]} → You won ${win}৳!`;
    } else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) {
      win = 30;
      resultText = `🙂 Nice! 2 fruits matched → You won ${win}৳!`;
    } else {
      resultText = `🐥 No match... You lost ${bet}৳.`;
    }

    // Update user balance
    const newBalance = currentBalance - bet + win;
    await usersData.set(senderID, { money: newBalance });

    // Final UI
    const ui = `
╭────────🎰────────╮
│  𝙁𝙍𝙐𝙄𝙏 𝙎𝙇𝙊𝙏 𝙈𝘼𝘾𝙃𝙄𝙉𝙀       │
╰────────🎰────────╯

🥏 Final Spin → [ ${final.join(" | ")} ]

${resultText}

💵 Bet: ${bet}৳
💰 Balance: ${newBalance}৳
━━━━━━━━━━━━━━━━━━━
`;

    await api.editMessage(ui, spinMsg.messageID);
  }
};