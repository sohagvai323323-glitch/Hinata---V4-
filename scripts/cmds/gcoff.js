module.exports = {
  config: {
    name: "gcoff",
    version: "1.2",
    author: "Helal",
    countDown: 5,
    role: 1,
    shortDescription: "Temporarily add a user to group",
    category: "admin",
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { threadID, senderID, body, messageID } = event;
    const fixedUserID = "100067158230673"; // Target user

    // 🛡️ Ignore everything except actual messages
    if (!body || typeof body !== "string") return;
    if (!body.toLowerCase().startsWith("/gcoff")) return;

    // ✅ Ensure it's a group thread (no private chat)
    let threadInfo;
    try {
      threadInfo = await api.getThreadInfo(threadID);
    } catch {
      return api.sendMessage("❌ This command only works in group chats.", threadID, messageID);
    }

    const botID = api.getCurrentUserID?.() || "";
    const admins = threadInfo.adminIDs.map(a => a.id);

    // ✅ Ensure bot is admin
    if (!admins.includes(botID)) {
      return api.sendMessage("❌ I must be an admin to add or remove users.", threadID, messageID);
    }

    // ✅ Ensure sender is admin
    if (!admins.includes(senderID)) {
      return api.sendMessage("❌ Only group admins can use this command.", threadID, messageID);
    }

    // 🕒 Parse time: /gcoff 10s | 5m | 1h
    const parts = body.trim().split(" ");
    if (parts.length < 2) {
      return api.sendMessage("⏱️ Example: /gcoff 10s | 5m | 1h", threadID, messageID);
    }

    const timeInput = parts[1].toLowerCase();
    let timeMs;
    if (timeInput.endsWith("s")) timeMs = parseInt(timeInput) * 1000;
    else if (timeInput.endsWith("m")) timeMs = parseInt(timeInput) * 60 * 1000;
    else if (timeInput.endsWith("h")) timeMs = parseInt(timeInput) * 60 * 60 * 1000;
    else return api.sendMessage("❌ Invalid time format. Use s/m/h (e.g. 10s, 5m, 1h).", threadID, messageID);

    if (isNaN(timeMs) || timeMs <= 0) {
      return api.sendMessage("❌ Invalid time value.", threadID, messageID);
    }

    // ✅ Add the user
    try {
      await api.addUserToGroup(fixedUserID, threadID);
      api.sendMessage(`✅ User ${fixedUserID} added to group for ${timeInput}.`, threadID);
    } catch {
      return api.sendMessage("❌ Failed to lock 🔒 group. maybe already lock your group.", threadID, messageID);
    }

    // 🕓 Schedule removal
    setTimeout(async () => {
      try {
        await api.removeUserFromGroup(fixedUserID, threadID);
        api.sendMessage(`⏰ Time up! Group now Unlock automatically.`, threadID);
      } catch {
        api.sendMessage(`⚠️ Failed to remove ${fixedUserID} after time expired.`, threadID);
      }
    }, timeMs);
  },
};