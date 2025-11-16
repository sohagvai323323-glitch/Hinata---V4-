// upt.js
// Requires: npm i canvas
const { createCanvas, loadImage } = require("canvas");
const os = require("os");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "upt4",
    version: "1.0",
    author: "Helal",
    role: 0,
    category: "system",
    shortDescription: "Hinata smooth neon status panel (Imgur bg)"
  },

  onStart: async function ({ api, event }) {
    try {
      const threadID = event.threadID;

      // ---- System info ----
      const botUptimeSec = Math.floor(process.uptime());
      const sysUptimeSec = Math.floor(os.uptime());
      const formatTime = (s) => {
        const d = Math.floor(s / 86400);
        s %= 86400;
        const h = Math.floor(s / 3600);
        s %= 3600;
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${d}d ${h}h ${m}m ${sec}s`;
      };

      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      const cpuModelFull = (os.cpus() && os.cpus()[0]) ? os.cpus()[0].model : "Unknown CPU";
      const cpuCores = os.cpus() ? os.cpus().length : 1;
      const loadAvg = (os.loadavg && os.loadavg()[0]) ? os.loadavg()[0].toFixed(2) : "0.00";
      const platform = "GitHub Server"; // as requested to show GitHub
      const arch = os.arch();
      const nodev = process.version;

      // naive ping (no message)
      const pingStart = Date.now();
      await new Promise((r) => setTimeout(r, 40));
      const ping = Date.now() - pingStart;

      // ---- Canvas setup ----
      const W = 1280;
      const H = 720;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      // ---- Load background image (Imgur) ----
      const bgUrl = "https://i.imgur.com/NVgDeiZ.jpeg";
      let bg;
      try {
        bg = await loadImage(bgUrl);
      } catch (err) {
        // fallback: solid dark bg if image fails
        ctx.fillStyle = "#071024";
        ctx.fillRect(0, 0, W, H);
      }
      if (bg) ctx.drawImage(bg, 0, 0, W, H);

      // subtle dark overlay for contrast
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, W, H);

      // neon outer rounded border
      ctx.save();
      ctx.strokeStyle = "#2ef5ff";
      ctx.lineWidth = 6;
      ctx.shadowColor = "#2ef5ff";
      ctx.shadowBlur = 35;
      roundRect(ctx, 18, 18, W - 36, H - 36, 22);
      ctx.stroke();
      ctx.restore();

      // Title
      ctx.font = "bold 42px 'Segoe UI', sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "#8af9ff";
      ctx.shadowColor = "#8af9ff";
      ctx.shadowBlur = 18;
      ctx.fillText("HINATA • SYSTEM STATUS", 60, 76);
      ctx.shadowBlur = 0;

      // left column boxes (3 rows x 2 small each -> 6) + 4 right circular = total 10
      // We'll draw 6 rectangular neon boxes on left, 4 circle gauges on right

      // helper: format bytes
      const formatBytes = (b) => {
        const units = ["B","KB","MB","GB","TB"];
        let i = 0;
        while (b >= 1024 && i < units.length-1) { b /= 1024; i++; }
        return `${b.toFixed(2)} ${units[i]}`;
      };

      // helper: neon rectangle box
      function neonRect(x,y,w,h, color, title, value) {
        // background panel
        ctx.save();
        ctx.fillStyle = "rgba(6,10,16,0.55)";
        roundRect(ctx, x, y, w, h, 12);
        ctx.fill();

        // neon stroke
        ctx.lineWidth = 4;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        roundRect(ctx, x, y, w, h, 12);
        ctx.stroke();
        ctx.restore();

        // title
        ctx.font = "600 22px 'Segoe UI', sans-serif";
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fillText(title, x + 20, y + 34);

        // value
        ctx.shadowBlur = 0;
        ctx.font = "700 28px 'Segoe UI', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(value, x + 20, y + 68);
      }

      // helper: circle gauge
      function neonCircle(cx, cy, r, color, label, value, percent) {
        // base circle bg
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fill();
        ctx.restore();

        // outer neon ring
        ctx.save();
        ctx.lineWidth = 6;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + (Math.PI*2)*(percent/100));
        ctx.stroke();
        ctx.restore();

        // inner text
        ctx.font = "700 20px 'Segoe UI', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(value, cx, cy - 4);

        ctx.font = "400 14px 'Segoe UI', sans-serif";
        ctx.fillStyle = "#cfeffe";
        ctx.fillText(label, cx, cy + 22);
      }

      // positions for left boxes (3 rows of two columns)
      const leftX = 60;
      const boxW = 520;
      const boxH = 90;
      let leftY = 120;
      const gapY = 18;

      // 6 boxes: we'll use: Bot Uptime, System Uptime, RAM Used, RAM Total, CPU Model, CPU Load
      neonRect(leftX, leftY, boxW, boxH, "#6fe9ff", "Bot Uptime", formatTime(botUptimeSec));
      leftY += boxH + gapY;
      neonRect(leftX, leftY, boxW, boxH, "#ff83e6", "System Uptime", formatTime(sysUptimeSec));
      leftY += boxH + gapY;
      neonRect(leftX, leftY, boxW, boxH, "#c9a7ff", "RAM Used", `${formatBytes(usedMem)}`);
      leftY += boxH + gapY;
      neonRect(leftX, leftY, boxW, boxH, "#7ee6a3", "RAM Total", `${formatBytes(totalMem)}`);
      leftY += boxH + gapY;
      neonRect(leftX, leftY, boxW, boxH, "#ffd36a", "CPU Model", cpuModelFull.slice(0, 36));
      leftY += boxH + gapY;
      neonRect(leftX, leftY, boxW, boxH, "#66d0ff", "CPU Load (1m)", `${loadAvg}`);

      // right side circle gauges (2 cols x 2 rows)
      const rightStartX = W - 420;
      const rightStartY = 150;
      const spacingX = 200;
      const spacingY = 180;
      const r = 58;

      // values for circle gauges
      const cpuPercent = Math.min(100, Math.round((parseFloat(loadAvg) / (cpuCores || 1)) * 50)); // approximate
      const ramPercent = Math.min(100, Math.round((usedMem / totalMem) * 100));
      const diskPercent = 75; // unknown real disk -> placeholder (you can remove or replace)
      const cores = cpuCores;

      neonCircle(rightStartX, rightStartY, r, "#ff5ca8", "CPU %", `${cpuPercent}%`, cpuPercent);
      neonCircle(rightStartX + spacingX, rightStartY, r, "#8a7bff", "RAM %", `${ramPercent}%`, ramPercent);
      neonCircle(rightStartX, rightStartY + spacingY, r, "#3ad0ff", "Ping", `${ping}ms`, Math.min(100, Math.round((ping/1000)*100)));
      neonCircle(rightStartX + spacingX, rightStartY + spacingY, r, "#7af57f", "Cores", `${cores}`, 100);

      // small footer infos
      ctx.textAlign = "left";
      ctx.font = "16px 'Segoe UI', sans-serif";
      ctx.fillStyle = "#cfeffe";
      ctx.fillText(`Platform: ${platform}`, 60, H - 40);
      ctx.fillText(`Node: ${nodev} • Arch: ${arch}`, 300, H - 40);

      // timestamp at top-right
      ctx.textAlign = "right";
      ctx.font = "16px 'Segoe UI', sans-serif";
      ctx.fillStyle = "#d8f7ff";
      ctx.fillText(new Date().toLocaleString(), W - 60, 46);

      // write final PNG and send
      const outPath = path.join(process.cwd(), `hinata_neon_${Date.now()}.png`);
      fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

      await new Promise((res) => {
        api.sendMessage(
          { attachment: fs.createReadStream(outPath) },
          threadID,
          () => {
            try { fs.unlinkSync(outPath); } catch(e){}
            res();
          }
        );
      });

    } catch (err) {
      console.log("Neon panel error:", err);
      // only send error message if absolutely needed
      try { await api.sendMessage("❌ Panel generation failed.", event.threadID); } catch(e){}
    }
  }
};

// small helper: rounded rect path
function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}