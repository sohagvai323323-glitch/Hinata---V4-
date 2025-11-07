const axios = require("axios");

module.exports = {
  config: {
    name: "openai",
    version: "3.0.4",
    author: "Rx Abdullah (Fixed by Helal)",
    countDown: 3,
    role: 0,
    shortDescription: "ChatGPT-3.5 powered by Rx",
    longDescription: "Chat with OpenAI-powered GPT using Rx API",
    category: "AI",
    guide: "{pn} <your question>\n\nExample:\n{pn} Who is the Prime Minister of Bangladesh?"
  },

  onStart: async function ({ api, event, args }) {
    const question = args.join(" ") || event.messageReply?.body;
    if (!question) return api.sendMessage("❌ Please provide a question or reply with text.", event.threadID);

    await processQuestion(api, event, question);
  },

  onChat: async function ({ api, event }) {
    if (!event.messageReply || !activeAIReplies.has(event.messageReply.messageID)) return;
    const question = event.body;
    if (!question) return;

    await processQuestion(api, event, question);
  }
};

let activeAIReplies = new Set();

async function getBaseApiUrl() {
  try {
    const res = await axios.get("https://raw.githubusercontent.com/rummmmna21/rx-api/refs/heads/main/baseApiUrl.json");
    if (!res.data.gpt) throw new Error("GPT API URL not found in GitHub content");
    return res.data.gpt.trim().replace(/\/+$/, "");
  } catch (e) {
    console.error("❌ Could not load API base from GitHub:", e.message);
    throw new Error("❌ API base URL not found on GitHub");
  }
}

async function showTypingFor(api, threadID, ms) {
  try {
    await api.sendTypingIndicatorV2(true, threadID);
    await new Promise(r => setTimeout(r, ms));
    await api.sendTypingIndicatorV2(false, threadID);
  } catch (err) {
    console.log("⚠️ Typing indicator error:", err.message);
  }
}

async function getAIReply(baseUrl, question, imageUrl) {
  let apiUrl = `${baseUrl}/mrx/gpt.php?ask=${encodeURIComponent(question)}`;
  if (imageUrl) apiUrl += `&img=${encodeURIComponent(imageUrl)}`;
  const res = await axios.get(apiUrl);
  return typeof res.data === "object" ? res.data.answer || JSON.stringify(res.data) : res.data || "⚠️ No response from API.";
}

async function processQuestion(api, event, question) {
  const baseUrl = await getBaseApiUrl();
  let imageUrl = event.messageReply?.attachments?.[0]?.type === "photo" ? event.messageReply.attachments[0].url : null;

  const typingPromise = showTypingFor(api, event.threadID, 4000);
  const replyPromise = getAIReply(baseUrl, question, imageUrl);

  await typingPromise;

  try {
    const reply = await replyPromise;
    const sentMsg = await api.sendMessage(reply, event.threadID);
    activeAIReplies.add(sentMsg.messageID);
  } catch (err) {
    console.error(err);
    await api.sendMessage("❌ Error contacting AI server.", event.threadID);
  }
                          }
