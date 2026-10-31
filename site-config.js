/* ==========================================================================
   SK1.0 website — SETTINGS FILE  (yahi ek file edit karni hai)
   --------------------------------------------------------------------------
   Is file mein koi secret / token / client secret KABHI mat likhna.
   Sirf public cheezen (client ID, links) yahan jaati hain.
   Jo cheez khaali ("") hai, website us jagah "not set yet" dikhati hai —
   koi nakli (fake) value kabhi nahi dikhai jaati.
   ========================================================================== */
window.SK_CONFIG = {
  botName: "SK1.0",
  tagline: "All-in-one Discord bot for moderation, security, economy, tickets and more.",

  /* Discord Developer Portal -> aapki app -> General Information -> Application ID.
     Neeche wali value bot ke record se li gayi hai. Ek baar Portal mein match kar lena. */
  clientId: "1523177627534229614",

  /* Bot invite permissions (number). Default = jo permissions bot ke features ko chahiye
     (Administrator nahi). Isse badalna ho to Developer Portal -> OAuth2 -> URL Generator use karo. */
  invitePermissions: "1109041474807",

  /* Agar aapke paas bana-banaya invite link hai to yahan daalo; tab upar wale do setting ignore honge. */
  inviteUrlOverride: "https://discord.com/oauth2/authorize?client_id=1523177627534229614&permissions=8&integration_type=0&scope=bot",

  /* Support server ka invite link, jaise "https://discord.gg/xxxxxxx". Khaali = button "not set yet" dikhayega. */
  supportServerUrl: "https://discord.gg/EQzG8HQS4N",

  /* Privacy / Terms / Contact ke liye. Khaali chhodo to pages par "not set yet" likha aayega. */
  contactEmail: "ansubb51@gmail.com",
  controllerName: "sk_rakesh",       // bot chalane wale ka naam (individual ya team)
  lastUpdated: "29/10/2026",          // jaise "2026-10-29" — privacy/terms page par dikhega

  /* Social links (khaali = footer mein nahi dikhenge) */
  social: { youtube: "https://youtube.com/@sk_rakesh7gamer?si=f8k-f6hr2y7k0rGA", instagram: "", github: "https://github.com/ansubb51-hue", x: "", website: "" },

  /* Premium / Donate: sirf tab section dikhega jab aap yahan sach mein plans/links bharoge.
     Example:
       premium: {
         title: "Support SK1.0",
         intro: "Optional — bot free hi rahega.",
         plans: [ { name: "Supporter", price: "₹99 / month", benefits: ["Role in support server"], url: "https://..." } ]
       }
     null = section poori tarah hidden. */
  premium: null,

  /* Live stats ki file (publish_stats.py banata hai). Ya kisi API ka full https URL bhi de sakte ho.
     File nahi hai / unreachable = site "Not connected" dikhati hai. */
  statsUrl: "data/stats.json",

  /* Itne minute se purani report ko "stale" maana jaata hai (offline nahi — bas "report purani hai"). */
  statsStaleMinutes: 30,

  /* Bot avatar ki image (optional). assets/avatar.png daalo ya full URL. Khaali = SVG logo. */
  avatarUrl: ""
};
