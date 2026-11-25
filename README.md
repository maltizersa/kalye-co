# NFC Digital Business Card + Google Reviews

A simple, mobile-first digital business card for startups and small businesses.
The NFC card (or a QR code) opens the business card page. A second view collects Google reviews.
**Each client's content and branding live in `index.json`.** You don't need to edit the HTML, CSS or JS for a new client.

| URL | What it shows | Use it for |
|---|---|---|
| `https://yourdomain.com/` | Business card | NFC business card, email signature, social bio link |
| `https://yourdomain.com/#reviews` | Google Reviews page | NFC table stand or counter stand, receipts, QR flyers |

## Files

```
index.html   Page layout (Bootstrap 5 + Bootstrap Icons)
index.css    Styles; colors come from CSS variables
index.js     Loads index.json, applies the theme, renders both views
index.json   ← Client data (edit this per client)
```

## Running locally

The page loads `index.json` with `fetch()`, and browsers block that when you open the file directly with `file://`. Use a local server instead:

- Windows: double-click **`start.bat`**. It runs `server.js` and opens the browser. Only Node.js is needed.
- or: `node server.js` and open `http://localhost:5173`
- or VS Code: install **Live Server**, right-click `index.html` and choose **Open with Live Server**
- or: `npx serve .`

`server.js` and `start.bat` are only for local preview. You don't need to upload them to the web host.

## Layout

- **Phones (< 576px):** single-column card that fills the screen. This is what people see after tapping the NFC card.
- **Tablets (576–991px):** the same card, centered on a branded background.
- **Desktop (≥ 992px):** two columns. The profile card sits on the left and stays in view while scrolling (when the screen is tall enough). The content grid is on the right, and the navigation moves to the top.

## Setting up a new client (5 minutes)

1. Copy the project folder, e.g. `clients/kalye-kape/`.
2. Edit `index.json`: profile, contact, socials, services, hours, and the colors under `theme`.
3. Put the client's Google **Place ID** in `reviews.googlePlaceId`.
   Find it with the [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id).
   If the client already has a short review link from their Google Business Profile (`g.page/r/.../review`), paste it into `reviews.writeReviewUrl` instead.
4. Deploy the folder to a static host (Netlify, Vercel, GitHub Pages, or cPanel hosting).
5. Set `settings.publicUrl` to the live URL so the QR codes point to the real domain.
6. Write the URL to the NFC tag with the free **NFC Tools** app (Write → Add a record → URL).

## `index.json` reference

| Key | Notes |
|---|---|
| `settings.publicUrl` | Live URL used for QR codes and sharing. If empty, the current page URL is used. |
| `settings.timezone` | Used for the "Open now" badge. Example: `Asia/Manila`. |
| `settings.quickActions` | Up to 4 of: `call`, `sms`, `email`, `messenger`, `whatsapp`, `viber`, `map`, `website` |
| `settings.poweredBy` | Your brand in the footer. Every card you sell also advertises your service. |
| `theme.mode` | `light` or `dark` |
| `theme.primary` / `accent` | Brand colors. Text on top of these switches between white and black automatically for contrast. |
| `theme.background` / `surface` / `text` / `muted` | Page background, card background, main text, secondary text |
| `theme.font` | Any [Google Font](https://fonts.google.com) name. If the font lacks some weights, set `theme.fontWeights`, e.g. `"400;700"`. |
| `profile.avatar` / `logo` / `cover` | Image paths or URLs (e.g. `"assets/avatar.jpg"`). If left empty, initials and a brand gradient are shown. |
| `links[].icon`, `services[].icon` | Any [Bootstrap Icons](https://icons.getbootstrap.com) name without the `bi-` prefix |
| `socials[].platform` | `facebook`, `instagram`, `tiktok`, `youtube`, `linkedin`, `x`, `threads`, `pinterest`, `telegram`, `whatsapp`, `messenger`, `github`, `shopee`, `lazada`, `website` |
| `hours.schedule` | `days` uses `mon`–`sun`; times use 24-hour `HH:MM`. Days not listed show as "Closed". |
| `reviews.rating` / `totalReviews` / `breakdown` / `featured` | Entered by hand in this version (see Roadmap) |

Any section with no data (no services, no hours, etc.) is hidden automatically.

### Example: dark, premium theme

```json
"theme": {
  "mode": "dark",
  "primary": "#C9A227",
  "accent": "#E8C766",
  "background": "#0E1116",
  "surface": "#171B22",
  "text": "#F2F2F0",
  "muted": "#9AA0A6",
  "font": "Plus Jakarta Sans",
  "radius": 22
}
```

## Google review policy

Every star on the review page opens the same Google review form. **Do not** send unhappy customers to a private form while sending happy ones to Google ("review gating"). Google's policies forbid it, and the client's listing can be penalized.

## Roadmap (upsell ideas)

- **Live Google rating** from the Places API, via a small serverless function so the API key stays hidden
- **Multi-client mode**: one deployment, `/?c=client-slug` loads `clients/client-slug.json`
- **Lead capture** ("Exchange contact" form → Google Sheets or email)
- **Tap analytics** (views, saves, review clicks) per client
- **Admin panel** so clients can update their own JSON
- **Contact photo** embedded in the downloaded vCard
"# kalye-co" 
