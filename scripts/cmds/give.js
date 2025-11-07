// view.js
// Command: /view <url>
// Shows text from a link or sends as file if long
// Author: Helal (Credit Locked)

const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "give",
    aliases: [],
    version: "2.0",
    author: "Helal", // ⚠️ Credit Locked
    countDown: 2,
    role: 0,
    category: "utility",
    shortDescription: "View text from any link",
    longDescription: "Fetches and shows text from a given link. Sends file if text is long.",
    guide: "{pn} <url>\nExample: /view https://pastebin-api.vercel.app/raw/B3KZjs"
  },

  onStart: async function ({ message, args }) {
    // Credit lock check
    if (this.config.author !== "Helal") {
      return message.reply("🚫 This command is credit locked by Helal!");
    }

    if (!args[0]) return message.reply("⚠️ Please provide a link.\nExample: /view https://pastebin-api.vercel.app/raw/B3KZjs");

    const url = args[0];

    if (!/^https?:\/\//.test(url)) {
      return message.reply("❌ Invalid URL! Make sure it starts with http or https.");
    }

    message.reply("⏳ Fetching content...");

    try {
      const res = await axios.get(url, { responseType: "text", timeout: 20000 });
      const text = res.data;

      // If text is small enough, show directly
      if (text.length <= 1800) {
        return message.reply(`📄 Content from:\n${url}\n\n${text}`);
      }

      // Otherwise send as a file
      const filePath = path.join(__dirname, "view_result.txt");
      fs.writeFileSync(filePath, text, "utf8");

      await message.reply({
        body: `📜 Content from:\n${url}\n\n⚠️ The text was too long, so it's sent as a file.`,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath); // delete temp file

    } catch (err) {
      console.error("Error fetching URL:", err.message);
      return message.reply("❌ Failed to fetch content. The link might be invalid or down.");
    }
  }
};
