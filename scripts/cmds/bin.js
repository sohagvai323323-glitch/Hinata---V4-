// bin.js
// Command: /bin <filename or text>
// Uploads a file or text to paste.rs and returns the paste link.
// Author: Helal (CREDIT LOCK)

const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "bin",
    aliases: ["paste", "uploadbin"],
    version: "2.0",
    author: "Helal", // CREDIT LOCK
    countDown: 3,
    role: 0,
    category: "utility",
    shortDescription: "Upload text or bot command file to pastebin",
    guide: "{pn} <filename or text>\nExample:\n/bin view.js\n/bin Hello world!"
  },

  onStart: async function ({ api, event, args, message }) {
    const threadID = event.threadID;
    const messageID = event.messageID;

    // 🔒 Credit Lock (only Helal's credit allowed)
    const LOCKED_AUTHOR = "Helal";
    const myAuthor = this.config.author;
    if (myAuthor !== LOCKED_AUTHOR) {
      return api.sendMessage(
        "❌ Credit lock active! You cannot change the author name.",
        threadID,
        messageID
      );
    }

    if (!args[0]) {
      return api.sendMessage("⚠️ Usage: /bin <filename or text>\nExample:\n/bin view.js\n/bin Hello world!", threadID, messageID);
    }

    const input = args.join(" ").trim();
    const filePath = path.join(__dirname, input);
    let content;

    try {
      if (fs.existsSync(filePath)) {
        // 📁 If it's a file, read it
        const stats = fs.statSync(filePath);
        if (stats.size > 256 * 1024) {
          return api.sendMessage("⚠️ File too large. Max size is 256 KB.", threadID, messageID);
        }

        content = fs.readFileSync(filePath, "utf8");
        if (!content.trim()) return api.sendMessage("⚠️ File is empty.", threadID, messageID);
      } else {
        // ✍️ If not a file, treat as text
        content = input;
      }

      await api.sendMessage("⏳ Uploading to paste service...", threadID, messageID);

      const res = await axios.post("https://paste.rs", content, {
        headers: { "Content-Type": "text/plain" },
        timeout: 20000
      });

      const pasteUrl = typeof res.data === "string" ? res.data.trim() : null;
      if (!pasteUrl || !pasteUrl.startsWith("http")) {
        return api.sendMessage("❌ Failed to get paste link.", threadID, messageID);
      }

      return api.sendMessage(
        `✅ Uploaded Successfully!\n📄 ${
          fs.existsSync(filePath) ? "File" : "Text"
        }: ${input}\n🔗 Link: ${pasteUrl}`,
        threadID,
        messageID
      );
    } catch (err) {
      console.error("bin.js error:", err);
      return api.sendMessage("❌ Upload failed! Try again later.", threadID, messageID);
    }
  }
};
