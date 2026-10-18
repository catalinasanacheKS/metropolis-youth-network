# Metropolis Youth Network

Instrument intern al Teatrului Metropolis — catalogul rețelei europene de teatru tânăr.

- Frontend static (SPA, hash-routing): `index.html` + `assets/`
- Backend: `_worker.js` (Cloudflare Pages advanced worker) pe baza D1 `DB`
- Hartă: Leaflet servit local din `assets/vendor` (fără CDN)
- `seed-theatres.json`: folosit doar pentru a popula o bază D1 goală (în producție baza are deja datele)

## Publicare (Cloudflare Pages — proiect „metropolis-youth-network", direct upload)
Legătura D1 (`DB`) e deja configurată pe proiect, iar datele sunt în D1.
Publică noua versiune cu wrangler (păstrează URL-ul metropolis-youth-network.pages.dev):

    npx wrangler pages deploy . --project-name metropolis-youth-network

Rollback oricând: Cloudflare → Pages → Deployments → versiunea veche → Rollback.
