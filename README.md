# Metropolis Youth Network

Platformă **internă** a Teatrului Metropolis pentru rețeaua teatrelor de tineret
**independente / private de stat** din Europa.

Colegii intră cu **numele** (fără cont, fără parolă) și pot consulta, **adăuga,
edita și șterge** teatre. Toate modificările apar la fila **Activitate**.

## Funcționalități
- Login pe nume (platformă internă).
- Catalog de teatre cu căutare, filtre pe țară și regiune, sortare.
- Fișă detaliată per teatru: fondatori, sală, producții de referință, programe, descriere.
- Adăugare / editare / ștergere, cu stocare partajată (Cloudflare KV).
- Filă **Pe țări**, **Hartă** interactivă (Leaflet), **Rețele & Resurse**, **Activitate**.
- Logo Teatrul Metropolis → link către teatrul-metropolis.ro.

## Arhitectură (Cloudflare Pages — advanced mode)
```
index.html        – aplicația (HTML + CSS + JS)
assets/logo.jpg   – logo Teatrul Metropolis
_worker.js        – Worker: servește fișierele + API JSON pe KV
```
- `_worker.js` servește asset-urile statice (`env.ASSETS`) și expune `/api/*`.
- Stocare: **KV**, binding `MYN_KV`. Fără binding, aplicația rulează în „mod local”
  (modificările se salvează doar în browserul curent).
- API: `GET /api/bootstrap`, `GET/POST /api/theatres`, `PUT/DELETE /api/theatres/:id`, `GET /api/activity`.

## Configurare KV
1. Workers & Pages → KV → creează un namespace (ex. `metropolis-youth-network`).
2. Proiect Pages → Settings → Bindings → KV namespace, variabilă `MYN_KV`.
3. Redeploy.

---
© Metropolis Youth Network · platformă internă Teatrul Metropolis
