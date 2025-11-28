const fs = require("fs");
const { downloadVideo } = require("sagor-video-downloader");

module.exports = {
    config: {
        name: "dl",
        version: "1.2",
        author: "Helal",
        countDown: 5,
        role: 0,
        shortDescription: "Download videos via link",
        category: "media",
        usages: "/dl <link or reply to message with link>"
    },

    onStart: async function({ api, event, args, message }) {
        const threadID = event.threadID;
        const messageID = event.messageID;

        let link = args[0]; // /dl <link>
        
        // যদি reply thake link ta extract koro
        if (!link && event.messageReply) {
            link = event.messageReply.body;
        }

        if (!link) {
            return api.sendMessage("❌ Please provide a link or reply to a message containing link.", threadID, messageID);
        }

        // multiple links support
        const linkMatches = link.match(/(https?:\/\/[^\s]+)/g);
        if (!linkMatches || linkMatches.length === 0) {
            return api.sendMessage("❌ No valid link found!", threadID, messageID);
        }

        const uniqueLinks = [...new Set(linkMatches)];

        api.setMessageReaction("⏳", messageID, () => {}, true);

        let successCount = 0;
        let failCount = 0;

        for (const url of uniqueLinks) {
            try {
                const loadingMsg = await api.sendMessage(`⏳ Downloading your video, please wait...`, threadID);

                const { title, filePath } = await downloadVideo(url);
                if (!filePath || !fs.existsSync(filePath)) throw new Error("Failed to download");

                const stats = fs.statSync(filePath);
                const fileSizeInMB = stats.size / (1024 * 1024);

                if (fileSizeInMB > 25) {
                    api.unsendMessage(loadingMsg.messageID);
                    api.sendMessage(`❌ Video too large (${fileSizeInMB.toFixed(1)} MB) \n🔗 ${url}`, threadID);
                    fs.unlinkSync(filePath);
                    failCount++;
                    continue;
                }

                await api.sendMessage(
                    { body: `🎬 *${title || "ভিডিও"}*`, attachment: fs.createReadStream(filePath) },
                    threadID,
                    () => fs.unlinkSync(filePath)
                );

                api.unsendMessage(loadingMsg.messageID);
                successCount++;

            } catch (err) {
                failCount++;
                api.sendMessage(`❌ Download failed: ${err.message || "Unknown error"}\n🔗 ${url.substring(0,50)}...`, threadID);
            }
        }

        const finalReaction = successCount > 0 && failCount === 0 ? "✅" :
                              successCount > 0 ? "⚠️" : "❌";
        api.setMessageReaction(finalReaction, messageID, () => {}, true);

        if (uniqueLinks.length > 1) {
            setTimeout(() => {
                api.sendMessage(`📊 Summary: ✅ ${successCount} Success | ❌ ${failCount} Fail`, threadID);
            }, 2000);
        }
    }
};