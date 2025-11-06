// inactive.js
// 🧹 Kick Inactive Group Members — by Helal (Credit Locked 🔒)

module.exports = {
  config: {
    name: "inactive",
    aliases: ["kickinactive"],
    version: "2.1",
    author: "Helal",
    countDown: 10,
    role: 1, // admin only
    category: "admin",
    shortDescription: { en: "Kick inactive members (count-based)" },
    longDescription: { en: "Kick the last <count> inactive members from the group (admins only)." },
    guide: { en: "{pn} <count>\nExample: /inactive 10" }
  },

  onStart: async function ({ api, event, args, message }) {
    try {
      // 🔒 Credit Lock
      if (this.config.author !== "Helal") {
        return message.reply("🚫 This command is credit-locked. Author modification detected!");
      }

      const threadID = event.threadID;
      const senderID = event.senderID;
      const count = parseInt(args[0]);

      if (isNaN(count) || count <= 0)
        return message.reply("⚠️ Please provide a valid number.\nExample: /inactive 10");

      const threadInfo = await api.getThreadInfo(threadID);
      if (!threadInfo.isGroup)
        return message.reply("⚠️ This command only works inside a group.");

      const adminIDs = threadInfo.adminIDs.map(a => a.id);
      if (!adminIDs.includes(senderID))
        return message.reply("🚫 Only group admins can use this command.");

      message.reply(`🔍 Checking ${count} least active members...`);

      // Filter out admins, bot, and owner
      const normalMembers = threadInfo.userInfo.filter(
        u =>
          !adminIDs.includes(u.id) &&
          !u.isMessengerUserOwner &&
          u.id != api.getCurrentUserID()
      );

      // Sort by message count ascending (least active first)
      const sorted = normalMembers.sort(
        (a, b) => (a.messageCount || 0) - (b.messageCount || 0)
      );

      const toKick = sorted.slice(0, count);
      if (toKick.length === 0)
        return message.reply("✅ No inactive members found!");

      message.reply(`⚠️ Removing ${toKick.length} inactive members...`);

      let success = 0, failed = 0;

      for (const member of toKick) {
        try {
          await api.removeUserFromGroup(member.id, threadID);
          success++;
          await new Promise(res => setTimeout(res, 1000)); // Delay 1s
        } catch (e) {
          failed++;
          console.log(`❌ Failed to remove ${member.id}: ${e.message}`);
        }
      }

      message.reply(`✅ Successfully removed ${success} inactive members.\n❌ Failed: ${failed}`);
    } catch (err) {
      console.error(err);
      message.reply("⚠️ Something went wrong while processing inactive members.");
    }
  }
};