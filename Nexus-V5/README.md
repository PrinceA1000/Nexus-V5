# Crown Nexus: Browser

![Crown Nexus Logo](https://raw.githubusercontent.com/crownnexus/crown-nexus/main/logo.png) 

*A futuristic, independent, unblocked web browser with built-in proxy and offline support.*

**Website:** https://crownnexus.github.io/Crown-Nexus-V5/

---

## ⚡ Features

- **Truly Independent:** Each tab opens as a separate, standalone window (just like a real desktop browser).
- **Built-in Proxy:** Toggle on/off multiple proxy endpoints to bypass censorship and geo-restrictions.
- **Offline Ready:** Service worker caching ensures the browser works offline.
- **Tab Management:** Full history back/forward, tab switching, and window control.
- **Theater Mode:** Immersive fullscreen experience (F11).
- **Advanced Cloaking:** Cloaking button to open the current URL in a new, obfuscated window.
- **Bookmarks & History:** Persistent local storage for your favorite sites and navigation history.

## 🛠️ Deployment

These files are designed to be served from a simple web server (like GitHub Pages, Vercel, or Netlify). No back-end is required! Just upload the `index.html`, `sw.js`, and `manifest.json` to your hosting provider.

## 🔧 Customization

You can easily edit the proxy list in `sw.js` and `index.html` to add your own proxy endpoints. The color scheme is stored in CSS variables within `index.html` for easy customization.

**Made with ❤️ for the open web.**