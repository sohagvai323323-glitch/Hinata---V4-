// time.js
// Shows current time in English, Bangla & Hijri (Arabic + Bangla)
// Author: Helal (Credit Locked)

const fetch = require("node-fetch");

module.exports = {
  config: {
    name: "time",
    aliases: ["clock"],
    version: "4.1",
    author: "Helal", // 🔒 Must remain "Helal"
    countDown: 3,
    role: 0,
    category: "utility",
    shortDescription: { en: "Show current time in English, Bangla & Hijri (Arabic + Bangla)" },
  },

  onStart: async function ({ message }) {
    // 🔒 Credit Lock System
    const LOCKED_AUTHOR = "Helal";
    const myAuthor = module.exports?.config?.author || this?.config?.author || null;
    if (myAuthor !== LOCKED_AUTHOR) {
      return message.reply(
        "❌ This command is credit-locked and cannot run because its author credit was modified."
      );
    }

    try {
      const now = new Date();

      // 🕓 English time
      const enTime = now.toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      // 🇧🇩 Bangla time
      const bnTime = now.toLocaleString("bn-BD", {
        timeZone: "Asia/Dhaka",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      // 🕌 Fetch Hijri date
      const res = await fetch(
        `https://api.aladhan.com/v1/gToH?date=${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`
      );
      const data = await res.json();
      const hijri = data.data.hijri;

      // Arabic Hijri format
      const arHijri = `${hijri.weekday.ar}، ${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`;

      // Bangla Hijri month mapping
      const hijriBnMap = {
        "محرم": "মুহাররম",
        "صفر": "সফর",
        "ربيع الأول": "রবিউল আউয়াল",
        "ربيع الآخر": "রবিউস সানি",
        "جمادى الأولى": "জামাদিউল আউয়াল",
        "جمادى الآخرة": "জামাদিউস সানি",
        "رجب": "রজব",
        "شعبان": "শা’বান",
        "رمضان": "রমজান",
        "شوال": "শাওয়াল",
        "ذو القعدة": "জিলক্বদ",
        "ذو الحجة": "জিলহজ",
      };

      const banglaHijriMonth = hijriBnMap[hijri.month.ar] || hijri.month.ar;
      const weekdayMap = {
        Friday: "শুক্রবার",
        Saturday: "শনিবার",
        Sunday: "রবিবার",
        Monday: "সোমবার",
        Tuesday: "মঙ্গলবার",
        Wednesday: "বুধবার",
        Thursday: "বৃহস্পতিবার",
      };

      const banglaHijri = `${weekdayMap[hijri.weekday.en] || hijri.weekday.en}, ${hijri.day} ${banglaHijriMonth} ${hijri.year} হিজরি`;

      const msg = `🕓 *CURRENT TIME (MULTI-LANGUAGE)*

🌎 English:
${enTime}

🇧🇩 বাংলা:
${bnTime}

🕌 العربية (Hijri):
${arHijri}

📘 বাংলা হিজরি:
${banglaHijri}

✨ Timezones:
🇧🇩 Asia/Dhaka | 🕋 Makkah, Saudi Arabia`;

      message.reply(msg);
    } catch (err) {
      console.error(err);
      message.reply("⚠️ Couldn't fetch Hijri or local time right now.");
    }
  },
};