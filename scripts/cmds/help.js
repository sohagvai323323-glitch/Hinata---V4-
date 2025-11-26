const fs = require("fs-extra");
const path = require("path");
const https = require("https");
const { commands } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    aliases: ["menu"],
    version: "4.0",
    author: "Helal",
    countDown: 10,
    role: 0,
    category: "system",
    shortDescription: { en: "Show all bot commands with categories + video" },
  },

  onStart: async function ({ message }) {
    const videoURL = "https://i.imgur.com/M6nDXZW.mp4";
    const cacheDir = path.join(__dirname, "cache");
    const videoPath = path.join(cacheDir, "help_video.mp4");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    if (!fs.existsSync(videoPath)) await downloadFile(videoURL, videoPath);

    const emojiMap = {
      TEXT: "✨『 TEXT 』",
      TOOLS: "🧰『 TOOLS 』",
      UTILITY: "🧩『 UTILITY 』",
      WIKI: "📚『 WIKI 』",
      GAME: "🎮『 GAME 』",
      SYSTEM: "⚙️『 SYSTEM 』",
      INFO: "📘『 INFO 』",
      IMAGE: "🖼️『 IMAGE 』",
      OWNER: "👑『 OWNER 』",
      OTHER: "📦『 OTHER 』",
      ADMIN: "🛠️『 ADMIN 』",
      MUSIC: "🎵『 MUSIC 』",
      AI: "🤖『 AI 』",
      "AI-IMAGE": "🧠『 AI-IMAGE 』",
      YOUTUBE: "📺『 YOUTUBE 』",
      GOOGLE: "🌍『 GOOGLE 』",
      ECONOMY: "💰『 ECONOMY 』",
      SOCIAL: "💬『 SOCIAL 』",
      WEATHER: "🌦️『 WEATHER 』",
      ISLAMIC: "🕌『 ISLAMIC 』",
      CONFIG: "⚙️『 CONFIG 』",
      CONTACT: "☎️『 CONTACTS 』",
      IDEA: "💡『 IDEA 』",
      CHAT: "💭『 CHAT 』",
      FUN: "🎉『 FUN 』",
      MEDIA: "🖥️『 MEDIA 』",
      VIDEO: "🎬『 VIDEO 』",
      SECURITY: "🔒『 SECURITY 』",
      SERVER: "🖧『 SERVER 』",
      EDUCATION: "🎓『 EDUCATION 』",
      ROLEPLAY: "🎭『 ROLEPLAY 』",
      STICKER: "🏷️『 STICKER 』",
      MEME: "😂『 MEME 』",
      LOVE: "💖『 LOVE 』",
      MODERATION: "🚨『 MODERATION 』",
      RANK: "📈『 RANK 』",
      ANIME: "🌸『 ANIME 』",
      BOT: "🤖『 BOT 』",
      SUPPORT: "🧩『 SUPPORT 』",
      NSFW: "🚫『 NSFW 』",
      DEVELOPER: "💻『 DEVELOPER 』",
      DATABASE: "🗃️『 DATABASE 』"
    };

    const categories = {};
    for (const [name, value] of commands) {
      const cat = value.config.category?.toUpperCase() || "OTHER";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
    }

    let msg = "🌺 ⌬⌬ 🎀𝙷𝚒𝚗𝚊𝚝𝚊𓆩♡𓆪🎀 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬 ⌬⌬ 🌺\n________________________\n\n";

    for (const cat in emojiMap) {
      if (categories[cat]) {
        msg += `${emojiMap[cat]}\n`;
        msg += categories[cat].map(cmd => `🎀 ${cmd}`).join("\n");
        msg += "\n________________________\n\n";
      }
    }

    msg += "🤖 🎀𝙷𝚒𝚗𝚊𝚝𝚊🎀 is always ready to help you!\n";

    return message.reply({
      body: msg,
      attachment: fs.createReadStream(videoPath)
    });
  }
};

// helper for caching video
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", reject);
  });
        }