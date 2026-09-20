# charlieevert.github.io

Personal site for Ralph Charles Evert IV (Charlie Evert) — applied AI leadership.
Static, no build step, no framework, no dependencies. GitHub Pages serves the root of `main`.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The entire site — markup and inline styles. |
| `assets/site.js` | Scroll reveals, count-up stats, scroll-spy nav, photo lightbox, right-click-to-copy email. |
| `assets/arc-film.js` | `<arc-film>` — the animated career film in the executive summary. Canvas, six chapters, scrubbable. |
| `assets/jump-game.js` | `<jump-game>` — a 30-second first-person parachute landing, with an in-game win message and job-offer link. |
| `images/` | Eight photos: beach, jump, dress uniform, Infantry School graduation, NASA, Wall Street, Julie and the dogs, newsletter cover. |
| `Charlie-Evert-Resume.pdf` | Linked from the Résumé button. Replace the file, keep the name. |
| `favicon.svg`, `robots.txt`, `sitemap.xml` | Icon and indexing. |

Nothing else is required. The previous HTML5 UP template (`assets/css`, `assets/js`, `assets/sass`,
`assets/webfonts`, `LICENSE.txt`, `README.txt`, and the old `images/*.png` + `images/bg.jpg`)
is unused by this build and can be deleted.

## Page order

Hero → 00 Executive summary (stats, how-to-read guide, animated film) → 01 Origin (St. Thomas,
Fort Benning) → 02 The turn (Saint Joseph's, J&J) → 03 Scale (Deloitte) → 04 Now (PwC) →
05 The pattern → 06 Receipts (patent, papers, SAGE cases, books, awards, certifications) →
07 In public (newsletter, PromptHub) → 08 Off the clock → 09 The prize (game) → 10 Contact.

The AI concierge sits in the top bar beside the wordmark and in the hero. No popup.

## Common edits

**Concierge number** — search `6506293610`; three places, each with visible text beside it.

**Résumé** — drop the new PDF in as `Charlie-Evert-Resume.pdf`.

**Photos** — replace in place under `images/`. Each sits `object-fit: cover` inside a fixed
aspect box, so any reasonably centered crop works.

**The film** — the `SCENES` array at the top of `assets/arc-film.js` holds each chapter's
duration, tag, title, subtitle, optional counter, and the `key` naming the scene drawn beneath
the trace. Add a chapter by adding an entry and a matching draw method.

**The game** — `assets/jump-game.js`. `DURATION` sets the flight time and `RADIUS` the landing tolerance; landing on target
reveals the mailto that asks for a job offer.

**Analytics** — Google tag `G-ZRR3DZ2JKE` in `<head>`, carried over from the previous site.

## Design system

Taken from the résumé: navy `#16305E`, link blue `#1A56B0`, ink `#181B22`, body `#4A5161`,
hairline `#D7DBE2`, tint `#EFF3F9`. Archivo for UI and headings, Source Serif 4 for narrative
paragraphs, IBM Plex Mono for labels and readouts. Intrinsically responsive — `flex-wrap` with
basis widths and `clamp()` type, no media queries.

## Deploy

Commit to `main`. Pages picks it up; there is nothing to build.

## Portfolio assistant and mobile navigation

The chat is currently dormant pending Cloudflare deployment: its script and custom element are not loaded by the page. `assets/navigation.js` independently provides the mobile menu. `assets/concierge.js` retains the chat widget for the future hosted API integration. `assets/experience.json` is the curated public knowledge base; update it when resume facts change. Source links point to the matching site sections. No personal conversation history, private client identities, or credentials belong in that file.

The assistant retrieves relevant facts locally, then uses Apache-2.0 SmolLM2-360M-Instruct through Transformers.js 3.8.1 in a Web Worker. The model revision is pinned in `assets/chat-worker.js`; quantized WASM inference supports CPU execution without WebGPU. The first question downloads roughly 400 MB from Hugging Face plus the runtime from jsDelivr. Browser caching reduces later downloads where available. Nothing downloads until a visitor asks a question. Inference is local; prompts are not sent to an inference service. There is no API key or backend. Slow/unsupported devices retain the labeled source notes and direct contact links. Stop, close, clear, and a timeout terminate pending inference. A response check falls back to exact source wording when key budget qualifiers or amounts are dropped. These small-model answers remain fallible and should be checked against the displayed sources.

`assets/concierge.css` controls the mobile menu, header offsets, and relocation of the decorative altitude indicator to keep it away from the chat launcher. The game and its navigation breadcrumb remain intact.
