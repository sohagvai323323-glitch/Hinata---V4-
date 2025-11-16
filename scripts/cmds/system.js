// system.js
// Hinata Ultimate: 20 Neon Boxes + 15 Beehive Circles System Panel
// Requires: npm i canvas
const { createCanvas, loadImage } = require("canvas");
const os = require("os");
const fs = require("fs");
const path = require("path");
const child = require("child_process");

module.exports = {
  config: {
    name: "system",
    version: "1.2",
    author: "Helal",
    role: 0,
    category: "system",
    shortDescription: "Hinata premium neon system panel (20 boxes + 15 circles)"
  },

  onStart: async function ({ api, event }) {
    const threadID = event.threadID;
    try {
      // ---------- backgrounds ----------
      const backgrounds = [
        "https://i.imgur.com/o7Rvn0h.jpeg",
        "https://i.imgur.com/Vth8be8.jpeg",
        "https://i.imgur.com/2jYkLHM.jpeg",
        "https://i.imgur.com/FMfKIXA.jpeg",
        "https://i.imgur.com/AsMCdhU.jpeg",
        "https://i.imgur.com/fhrq2b1.jpeg"
      ];
      const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

      // ---------- safe helpers ----------
      const safe = (fn, def = "N/A") => {
        try { const v = fn(); return (v === undefined || v === null) ? def : v; } catch { return def; }
      };
      function execSafe(cmd) {
        try { return child.execSync(cmd, { encoding: "utf8", stdio: ["pipe","pipe","ignore"] }).toString().trim(); }
        catch { return null; }
      }
      function formatBytes(b) {
        if (b === null || b === undefined || isNaN(Number(b))) return "N/A";
        const units = ["B","KB","MB","GB","TB"];
        let i = 0; let n = Number(b);
        while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
        return `${n.toFixed(2)} ${units[i]}`;
      }
      function formatTime(s) {
        s = Math.floor(Number(s) || 0);
        const d = Math.floor(s / 86400); s %= 86400;
        const h = Math.floor(s / 3600); s %= 3600;
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${d}d ${h}h ${m}m ${sec}s`;
      }

      // quick CPU% sampler
      async function getCpuPercent() {
        try {
          const start = os.cpus();
          await new Promise(r => setTimeout(r, 120));
          const end = os.cpus();
          let idleDiff = 0, totalDiff = 0;
          for (let i = 0; i < start.length; i++) {
            const s = start[i].times, e = end[i].times;
            const sTotal = s.user + s.nice + s.sys + s.irq + s.idle;
            const eTotal = e.user + e.nice + e.sys + e.irq + e.idle;
            idleDiff += e.idle - s.idle;
            totalDiff += eTotal - sTotal;
          }
          const percent = totalDiff ? Math.max(0, Math.min(100, Math.round(100 - (idleDiff / totalDiff * 100)))) : 0;
          return percent;
        } catch { return "N/A"; }
      }

      function getBattery() {
        try {
          const p = "/sys/class/power_supply";
          if (fs.existsSync(p)) {
            for (const it of fs.readdirSync(p)) {
              const base = path.join(p, it);
              const tfile = path.join(base, "type");
              if (fs.existsSync(tfile) && fs.readFileSync(tfile, "utf8").toLowerCase().includes("battery")) {
                const cap = fs.existsSync(path.join(base, "capacity")) ? fs.readFileSync(path.join(base, "capacity"), "utf8").trim() : "N/A";
                const stat = fs.existsSync(path.join(base, "status")) ? fs.readFileSync(path.join(base, "status"), "utf8").trim() : "N/A";
                return { percent: cap, status: stat };
              }
            }
          }
          const up = execSafe("upower -i $(upower -e | grep BAT | head -n 1) 2>/dev/null");
          if (up) {
            let perc = null, st = null;
            up.split("\n").forEach(l => {
              if (l.includes("percentage:")) perc = l.split(":")[1].trim();
              if (l.includes("state:")) st = l.split(":")[1].trim();
            });
            if (perc) return { percent: perc.replace("%",""), status: st || "N/A" };
          }
          const pm = execSafe("pmset -g batt 2>/dev/null");
          if (pm) {
            const m = pm.match(/(\d+)%/);
            const st = pm.includes("discharging") ? "Discharging" : (pm.includes("charging") ? "Charging" : "N/A");
            if (m) return { percent: m[1], status: st };
          }
        } catch {}
        return { percent: "N/A", status: "N/A" };
      }

      function getDiskInfo() {
        try {
          const out = execSafe("df -B1 / | tail -1");
          if (out) {
            const parts = out.split(/\s+/);
            const total = Number(parts[1]), used = Number(parts[2]), avail = Number(parts[3]), usep = parts[4] || "N/A";
            return { total, used, avail, usep };
          }
        } catch {}
        return { total: null, used: null, avail: null, usep: "N/A" };
      }

      // ---------- gather ----------
      const cpuPercent = await getCpuPercent();
      const battery = getBattery();
      const disk = getDiskInfo();
      const hostname = safe(() => os.hostname(), "N/A");
      const platform = `${safe(() => os.platform(), "N/A")} ${safe(() => os.release(), "")}`.trim();
      const arch = safe(() => os.arch(), "N/A");
      const nodeV = safe(() => process.version, "N/A");
      const cmdsCount = (global.GoatBot && global.GoatBot.commands) ? String(global.GoatBot.commands.size) : "N/A";
      const totalMem = safe(() => os.totalmem(), 0);
      const freeMem = safe(() => os.freemem(), 0);
      const usedMem = (totalMem && freeMem) ? (totalMem - freeMem) : 0;
      const cpus = safe(() => os.cpus(), []);
      const cpuModel = cpus.length ? cpus[0].model : "N/A";
      const cpuCores = cpus.length || 1;
      const load1 = safe(() => (os.loadavg ? os.loadavg()[0] : "N/A"), "N/A");
      const procUptime = formatTime(process.uptime());
      const sysUptime = formatTime(os.uptime());
      const timeNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

      // quick ping measure (naive)
      const pingStart = Date.now();
      await new Promise(r => setTimeout(r, 20));
      const ping = Date.now() - pingStart;

      // ---------- canvas ----------
      const bg = await loadImage(bgUrl).catch(() => null);
      const W = 1280;
      const H = 720;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      // draw bg
      if (bg) ctx.drawImage(bg, 0, 0, W, H);
      else { ctx.fillStyle = "#071024"; ctx.fillRect(0, 0, W, H); }

      // overlay
      ctx.fillStyle = "rgba(0,0,0,0.44)";
      ctx.fillRect(0, 0, W, H);

      // ---------- drawing helpers ----------
      function roundRect(ctx, x, y, w, h, r) {
        if (w < 2*r) r = w/2;
        if (h < 2*r) r = h/2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      }

      function wrapText(ctx, text, maxW) {
        const words = String(text).split(" ");
        const lines = [];
        let cur = "";
        for (const w of words) {
          const test = cur ? (cur + " " + w) : w;
          if (ctx.measureText(test).width > maxW) {
            if (cur) lines.push(cur);
            cur = w;
          } else cur = test;
        }
        if (cur) lines.push(cur);
        return lines;
      }

      function fitFontToWidth(ctx, text, maxW, start = 18, fontFace = "sans-serif") {
        let size = start;
        ctx.font = `${size}px ${fontFace}`;
        while (ctx.measureText(text).width > maxW && size > 8) {
          size--;
          ctx.font = `${size}px ${fontFace}`;
        }
        return ctx.font;
      }

      function gradientFor(i) {
        const palettes = [
          ["#ff5ca8","#ffd36a"],
          ["#7e74ff","#2ef5ff"],
          ["#ff9a6b","#7ee6a3"],
          ["#3ad0ff","#ff6ec7"],
          ["#76e1ff","#ff83e6"],
          ["#cfa8ff","#66d0ff"],
          ["#ff6e6e","#ffd36a"],
          ["#52f2ff","#b78cff"],
          ["#ff7fb8","#ffd07a"]
        ];
        return palettes[i % palettes.length];
      }

      // outer neon border
      (function drawOuterBorder(){
        const g = ctx.createLinearGradient(0,0,W,H);
        g.addColorStop(0,"#ff5ca8");
        g.addColorStop(0.25,"#7e74ff");
        g.addColorStop(0.5,"#2ef5ff");
        g.addColorStop(0.75,"#7ee6a3");
        g.addColorStop(1,"#ffd36a");
        ctx.save();
        ctx.lineWidth = Math.max(6, Math.round(Math.min(W,H)/150));
        ctx.strokeStyle = g;
        ctx.shadowColor = "#2ef5ff";
        ctx.shadowBlur = 30;
        roundRect(ctx, 12, 12, W-24, H-24, 28);
        ctx.stroke();
        ctx.restore();
      })();

      // title
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px sans-serif";
      ctx.shadowColor = "#9ff7ff";
      ctx.shadowBlur = 12;
      ctx.fillText("HINATA • SYSTEM PANEL", Math.round(W*0.05), Math.round(H*0.06));
      ctx.shadowBlur = 0;

      // ---------- layout: left 20 boxes (grid), right beehive 15 circles ----------
      const marginX = Math.round(W * 0.05);
      const marginTop = Math.round(H * 0.10);
      const rightPanelW = Math.round(Math.min(W * 0.36, 460));
      const leftAreaW = W - marginX*2 - rightPanelW - 30;

      // left: 20 boxes (we do 5 rows x 4 cols grid to fit)
      const leftCols = 4;
      const leftRows = 5;
      const gap = Math.round(12);
      const boxW = Math.floor((leftAreaW - (leftCols - 1) * gap) / leftCols);
      const boxH = Math.round(Math.min(84, (H - marginTop - 90 - (leftRows - 1)*gap) / leftRows));
      const leftStartX = marginX;
      const leftStartY = marginTop;

      // Prepare 20 infos (short forms where possible)
      const infos = [
        ["Bot UPT", procUptime],
        ["Sys UPT", sysUptime],
        ["Host", hostname],
        ["Platform", platform],
        ["Arch", arch],
        ["Node", nodeV],
        ["CPU", cpuModel.slice(0, 32)],
        ["Cores", String(cpuCores)],
        ["CPU Load", String(load1)],
        ["CPU %", (typeof cpuPercent === "number") ? cpuPercent + "%" : cpuPercent],
        ["RAM Total", formatBytes(totalMem)],
        ["RAM Used", formatBytes(usedMem)],
        ["RAM Free", formatBytes(freeMem)],
        ["RAM %", totalMem ? Math.round((usedMem/totalMem)*100) + "%" : "N/A"],
        ["Disk Total", disk.total ? formatBytes(disk.total) : "N/A"],
        ["Disk Used", disk.used ? formatBytes(disk.used) : "N/A"],
        ["Disk %", disk.usep || "N/A"],
        ["Battery", `${battery.percent}% (${battery.status})`],
        ["Ping", `${ping} ms`],
        ["Cmds", cmdsCount]
      ];

      // draw left boxes
      for (let i = 0; i < 20; i++) {
        const col = i % leftCols;
        const row = Math.floor(i / leftCols);
        const x = leftStartX + col * (boxW + gap);
        const y = leftStartY + row * (boxH + gap);
        const pal = gradientFor(i);

        // panel bg
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.52)";
        roundRect(ctx, x, y, boxW, boxH, 12);
        ctx.fill();
        ctx.restore();

        // neon stroke gradient
        const g = ctx.createLinearGradient(x, y, x + boxW, y + boxH);
        g.addColorStop(0, pal[0]);
        g.addColorStop(1, pal[1]);
        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = g;
        ctx.shadowColor = pal[0];
        ctx.shadowBlur = 14;
        roundRect(ctx, x, y, boxW, boxH, 12);
        ctx.stroke();
        ctx.restore();

        // small dot
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = pal[0];
        ctx.shadowColor = pal[0];
        ctx.shadowBlur = 10;
        ctx.arc(x + 14, y + 16, 7, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();

        // label
        ctx.fillStyle = pal[0];
        ctx.font = fitFontToWidth(ctx, infos[i][0], boxW - 44, 16, "sans-serif");
        ctx.fillText(infos[i][0], x + 36, y + 26);

        // value - fit and wrap (max 2 lines)
        const val = String(infos[i][1]);
        ctx.font = fitFontToWidth(ctx, val, boxW - 36, 14, "sans-serif");
        const lines = wrapText(ctx, val, boxW - 36);
        ctx.fillStyle = "#ffffff";
        for (let li = 0; li < Math.min(lines.length, 2); li++) {
          ctx.fillText(lines[li], x + 18, y + 48 + li * 18);
        }
      }

      // ---------- right panel: beehive circles (15 circles) ----------
      // We'll arrange 15 circles in beehive-ish clusters:
      // center big + 6 around (ring1) + 8 outer (ring2) = 15 (1+6+8)
      const rightX = W - marginX - rightPanelW;
      const centerX = rightX + Math.round(rightPanelW / 2);
      const centerY = Math.round(H * 0.48);

      const bigR = Math.round(Math.min(110, rightPanelW * 0.26));
      const ring1R = Math.round(Math.min(46, bigR * 0.44));
      const ring2R = Math.round(Math.min(36, bigR * 0.32));

      // metrics for circles (choose 15 items)
      const circleMetrics = [
        {label: "UPTIME", value: procUptime, percent: 100},
        {label: "CPU%", value: (typeof cpuPercent === "number") ? cpuPercent + "%" : cpuPercent, percent: (typeof cpuPercent === "number") ? cpuPercent : 100},
        {label: "RAM%", value: totalMem ? Math.round((usedMem/totalMem)*100) + "%" : "N/A", percent: totalMem ? Math.round((usedMem/totalMem)*100) : 0},
        {label: "Disk%", value: (disk.usep || "N/A"), percent: disk.usep && disk.usep !== "N/A" ? parseInt(String(disk.usep).replace("%","")) : 0},
        {label: "Ping", value: ping + "ms", percent: Math.min(100, Math.round((ping/1000)*100))},
        {label: "Battery", value: (battery.percent + "%"), percent: battery.percent && battery.percent !== "N/A" ? Number(String(battery.percent).replace("%","")) : 0},
        {label: "Load1", value: String(load1), percent: 0},
        {label: "Cores", value: String(cpuCores), percent: 0},
        {label: "Node", value: nodeV, percent: 0},
        {label: "OS", value: platform, percent: 0},
        {label: "Host", value: hostname, percent: 0},
        {label: "TotCmds", value: cmdsCount, percent: 0},
        {label: "Time", value: timeNow, percent: 0},
        {label: "Arch", value: arch, percent: 0},
        {label: "PublicIP", value: "N/A", percent: 0}
      ];

      // draw center big (index 0)
      (function drawCenter() {
        const c = circleMetrics[0];
        // base
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, bigR + 6, 0, Math.PI*2);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fill();
        ctx.restore();

        // neon arc (full or percent)
        const g = ctx.createLinearGradient(centerX - bigR, centerY - bigR, centerX + bigR, centerY + bigR);
        g.addColorStop(0, "#ff6b6b");
        g.addColorStop(1, "#ffcf6b");

        ctx.save();
        ctx.lineWidth = Math.max(8, Math.round(bigR / 12));
        ctx.strokeStyle = g;
        ctx.shadowColor = "#ff6b6b";
        ctx.shadowBlur = 26;
        ctx.beginPath();
        const p = (typeof c.percent === "number") ? Math.max(0, Math.min(100, c.percent)) : 100;
        ctx.arc(centerX, centerY, bigR, -Math.PI/2, -Math.PI/2 + (Math.PI*2)*(p/100));
        ctx.stroke();
        ctx.restore();

        // text
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = fitFontToWidth(ctx, String(c.value), bigR * 1.4, 26, "sans-serif");
        ctx.fillText(String(c.value), centerX, centerY - 8);
        ctx.font = fitFontToWidth(ctx, c.label, bigR * 1.4, 14, "sans-serif");
        ctx.fillStyle = "#ffd7d7";
        ctx.fillText(c.label, centerX, centerY + Math.round(bigR / 1.6));
      })();

      // positions for ring1 (6 around center)
      const ring1 = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * (Math.PI * 2);
        const rx = centerX + Math.round(Math.cos(angle) * (bigR + ring1R + 8));
        const ry = centerY + Math.round(Math.sin(angle) * (bigR + ring1R + 8));
        ring1.push({x: rx, y: ry});
      }
      // positions for ring2 (8 around, larger radius)
      const ring2 = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * (Math.PI * 2);
        const rx = centerX + Math.round(Math.cos(angle) * (bigR + ring1R * 2 + ring2R + 18));
        const ry = centerY + Math.round(Math.sin(angle) * (bigR + ring1R * 2 + ring2R + 18));
        ring2.push({x: rx, y: ry});
      }

      // draw ring1 (metrics 1..6)
      for (let i = 0; i < 6; i++) {
        const idx = 1 + i;
        const pos = ring1[i];
        const m = circleMetrics[idx] || {label: "N/A", value: "N/A", percent: 0};
        const pal = gradientFor(i+8);
        // base
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ring1R + 4, 0, Math.PI*2);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fill();
        ctx.restore();

        // ring
        ctx.save();
        ctx.lineWidth = Math.max(4, Math.round(ring1R/6));
        ctx.strokeStyle = pal[0];
        ctx.shadowColor = pal[0];
        ctx.shadowBlur = 14;
        ctx.beginPath();
        const p = (typeof m.percent === "number") ? Math.max(0, Math.min(100, m.percent)) : 100;
        ctx.arc(pos.x, pos.y, ring1R, -Math.PI/2, -Math.PI/2 + (Math.PI*2)*(p/100));
        ctx.stroke();
        ctx.restore();

        // text
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = fitFontToWidth(ctx, String(m.value), ring1R * 1.4, 12, "sans-serif");
        ctx.fillText(String(m.value), pos.x, pos.y - 4);
        ctx.font = fitFontToWidth(ctx, m.label, ring1R * 1.4, 10, "sans-serif");
        ctx.fillStyle = "#cfeffe";
        ctx.fillText(m.label, pos.x, pos.y + Math.round(ring1R / 1.6));
      }

      // draw ring2 (metrics 7..14 -> indices 7..14)
      for (let i = 0; i < 8; i++) {
        const idx = 7 + i;
        const pos = ring2[i];
        const m = circleMetrics[idx] || {label: "N/A", value: "N/A", percent: 0};
        const pal = gradientFor(i+2);
        // base
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ring2R + 3, 0, Math.PI*2);
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fill();
        ctx.restore();

        // ring
        ctx.save();
        ctx.lineWidth = Math.max(3, Math.round(ring2R/6));
        ctx.strokeStyle = pal[0];
        ctx.shadowColor = pal[0];
        ctx.shadowBlur = 12;
        ctx.beginPath();
        const p = (typeof m.percent === "number") ? Math.max(0, Math.min(100, m.percent)) : 100;
        ctx.arc(pos.x, pos.y, ring2R, -Math.PI/2, -Math.PI/2 + (Math.PI*2)*(p/100));
        ctx.stroke();
        ctx.restore();

        // text
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = fitFontToWidth(ctx, String(m.value), ring2R * 1.6, 11, "sans-serif");
        ctx.fillText(String(m.value), pos.x, pos.y - 4);
        ctx.font = fitFontToWidth(ctx, m.label, ring2R * 1.6, 9, "sans-serif");
        ctx.fillStyle = "#cfeffe";
        ctx.fillText(m.label, pos.x, pos.y + Math.round(ring2R / 1.8));
      }

      // footer small
      ctx.textAlign = "left";
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#dff8ff";
      ctx.fillText(`Generated by HINATA • ${timeNow}`, marginX, H - 18);

      // ---------- write and send ----------
      const out = path.join(process.cwd(), `hinata_system_${Date.now()}.png`);
      fs.writeFileSync(out, canvas.toBuffer("image/png"));

      await new Promise((res) => {
        api.sendMessage({ attachment: fs.createReadStream(out) }, threadID, () => {
          try { fs.unlinkSync(out); } catch (e) {}
          res();
        });
      });

    } catch (err) {
      console.error("system panel error:", err);
      try { await api.sendMessage("❌ Panel generation failed.", event.threadID); } catch (e) {}
    }
  }
};