const fs = require("fs");

module.exports = {
  config: {
    name: "help2",
    aliases: ["helpall"],
    version: "1.6",
    author: "Helal",
    role: 0,
    category: "system", // ✅ FIXED: Missing category added
    shortDescription: "Show full command list or details of specific command",
  },

  onStart: async function ({ api, event, args }) {
    const commands = global.GoatBot?.commands || new Map();

    // ==========================
    // 📌 If user used /help <cmd>
    // ==========================
    if (args[0]) {
      const cmdName = args[0].toLowerCase();

      const cmd = [...commands.values()].find(
        c =>
          c.config?.name?.toLowerCase() === cmdName ||
          (c.config?.aliases || [])
            .map(a => a.toLowerCase())
            .includes(cmdName)
      );

      if (!cmd) {
        return api.sendMessage(`❌ Command "${cmdName}" not found!`, event.threadID, event.messageID);
      }

      const info =
        `┍━━━━━━━━━━━━━━━━◊\n` +
        `┋ [✦ ᴄᴏᴍᴍᴀɴᴅ ɪɴꜰᴏ ✦]\n` +
        `┕━━━━━━━━━━━━━━◊\n` +
        `┋ 🧩 ɴᴀᴍᴇ: ${cmd.config.name}\n` +
        `┋ 🏷️ ᴀʟɪᴀꜱ: ${cmd.config.aliases?.join(", ") || "None"}\n` +
        `┋ 📦 ᴠᴇʀꜱɪᴏɴ: ${cmd.config.version || "1.0"}\n` +
        `┋ 👑 ᴀᴜᴛʜᴏʀ: ${cmd.config.author || "Unknown"}\n` +
        `┋ 🧠 ᴅᴇꜱᴄʀɪᴘᴛɪᴏɴ: ${cmd.config.shortDescription || "No description"}\n` +
        `┋ 🔑 ᴘʀᴇꜰɪx: /\n` +
        `┕━━━━━━━━━━━━━━━━━━◊`;

      return api.sendMessage(info, event.threadID, event.messageID);
    }

    // ==========================
    // 📌 Animated Loading Screen
    // ==========================
    const sent = await api.sendMessage("⏳ Loading command list...", event.threadID);

    const frames = [
      "[░░░░░░░░░░] ⚪ 0%",
      "[██░░░░░░░░] 🟠 25%",
      "[████░░░░░░] 🟡 50%",
      "[██████░░░░] 🔴 75%"
    ];

    for (const frame of frames) {
      await sleep(700);
      await api.editMessage(frame, sent.messageID);
    }

    await sleep(500);

    // ==========================
    // 📌 Sort commands by category
    // ==========================
    const categories = {};

    for (const [name, cmd] of commands.entries()) {
      const cat = cmd.config?.category?.toUpperCase() || "🎲 OTHER";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
    }

    // ==========================
    // 📌 Build menu text
    // ==========================
    let output =
      "┍━━━━━━━━━━━━━━━━◊\n" +
      "┋ [✦ 𝙲𝚊𝚝 𝙱𝚘𝚝 𝙼𝚎𝚗𝚞 ✦]\n" +
      "┕━━━━━━━━━━━━━━◊\n";

    for (const [cat, cmds] of Object.entries(categories)) {
      const chunks = chunkArray(cmds, 6);

      chunks.forEach((box, idx) => {
        output += `┍━━━[ ${cat}${chunks.length > 1 ? ` ${idx + 1}` : ""} ]\n`;

        for (let i = 0; i < box.length; i += 2) {
          const c1 = box[i] ? `〄 ${convertFont(box[i])}` : "";
          const c2 = box[i + 1] ? `   〄 ${convertFont(box[i + 1])}` : "";
          output += `┋${c1}${c2}\n`;
        }

        output += "┕━━━━━━━━━━━━◊\n";
      });
    }

    output +=
      "\n┍━━━━━━━━━━━━━━━◊\n" +
      ` [📌] Total Commands: ${commands.size}\n` +
      ` [🔑] Prefix: /\n` +
      ` [👑] Owner: 𝙷𝚎𝚕𝚊𝚕\n` +
      "┕━━━━━━━━━━━━━━━━━━◊";

    // Final output
    await api.editMessage(output, sent.messageID);
  },
};

// ==========================
// 📌 Helper Functions
// ==========================

function chunkArray(arr, size) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

function convertFont(text) {
  const normal = "abcdefghijklmnopqrstuvwxyz";
  const fancy = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ";
  return text
    .split("")
    .map(ch => {
      const idx = normal.indexOf(ch.toLowerCase());
      return idx !== -1 ? fancy[idx] : ch;
    })
    .join("");
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}