const axios = require("axios");
const fs = require('fs');

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/cyber-ullash/cyber-ullash/refs/heads/main/UllashApi.json");
  return base.data.api;
};

module.exports = {
  config: {
    name: "ytdl",
    version: "1.3.0",
    credits: "sifu", 
    countDown: 5,
    hasPermssion: 0,
    description: "Download video, audio, and info from YouTube",
    category: "media",
    commandCategory: "media",
    usePrefix: true,
    prefix: true,
  },

  onStart: async ({ api, args, event }) => {
    const { threadID, messageID, senderID, messageReply } = event;

    let action = args[0] ? args[0].toLowerCase() : null;
    const possibleActions = ['-v', 'video', 'mp4', '-a', 'audio', 'mp3', '-i', 'info'];

    if (!possibleActions.includes(action)) action = null; // no action given
    else args.shift(); // remove action from args

    // Get the link: either from args or from replied message
    let input = args.join(" ");

    if (!input && messageReply && messageReply.body) {
      input = messageReply.body; // get replied message text
    }

    if (!input) return api.sendMessage('❌ Please provide a keyword or YouTube link.', threadID, messageID);

    const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    const urlYtb = checkurl.test(input);

    if (urlYtb) {
      action = action || '-v'; // default to video if no action
      const format = ['-v', 'video', 'mp4'].includes(action) ? 'mp4' : 'mp3';
      const videoID = input.match(checkurl)[1];

      // Notify start
      await api.sendMessage(`🎀\n\n Starting download..!`, threadID, messageID);

      try {
        const path = `ytb_${format}_${videoID}.${format}`;
        const { data: { title, downloadLink, quality } } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${videoID}&format=${format}&quality=3`);

        await api.sendMessage({
          body: `======================\n• Title: ${title}\n\n• Quality: ${quality}\n\n🥱 Download complete! \n======================`,
          attachment: await downloadFile(downloadLink, path)
        }, threadID, () => fs.unlinkSync(path), messageID);

      } catch (err) {
        console.error(err);
        return api.sendMessage(`🚫 Failed to download video: ${input}`, threadID, messageID);
      }
      return;
    }

    // If not a link, treat as keyword search
    if (!input) return api.sendMessage('❌ Please provide a search keyword.', threadID, messageID);

    try {
      const searchResult = (await axios.get(`${await baseApiUrl()}/ytFullSearch?songName=${encodeURIComponent(input)}`)).data.slice(0, 6);
      if (!searchResult.length) return api.sendMessage(`⭕ No results for keyword: ${input}`, threadID, messageID);

      let msg = "";
      const thumbnails = [];
      let i = 1;

      for (const info of searchResult) {
        thumbnails.push(streamImage(info.thumbnail, `thumbnail_${i}.jpg`));
        msg += `${i++}. ${info.title}\nTime: ${info.time}\nChannel: ${info.channel.name}\n\n`;
      }

      api.sendMessage({
        body: msg + "👉 Reply with a number to select.",
        attachment: await Promise.all(thumbnails)
      }, threadID, (err, info) => {
        if (err) return console.error(err);
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          result: searchResult,
          action
        });
      }, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ An error occurred while searching: " + err.message, threadID, messageID);
    }
  }
};

async function downloadFile(url, pathName) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(pathName, Buffer.from(res.data));
  return fs.createReadStream(pathName);
}

async function streamImage(url, pathName) {
  const response = await axios.get(url, { responseType: "stream" });
  response.data.path = pathName;
  return response.data;
  }
