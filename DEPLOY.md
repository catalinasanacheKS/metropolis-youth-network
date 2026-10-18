# Metropolis Youth Network — versiunea nouă (Cloudflare Pages, direct upload)

Proiect: metropolis-youth-network (metropolis-youth-network.pages.dev), fără Git.
Acest folder = versiunea NOUĂ gata de publicat. Backend: _worker.js + KV (MYN_KV).
Datele (cele 62 de teatre) se auto-populează la prima accesare, din seed-theatres.json.

## Publicare din dashboard (fără CLI)
1. Workers & Pages → KV: folosește depozitul existent "metropolis-youth-network"
   (sau creează unul nou). Reține-i numele.
2. Pages → proiectul metropolis-youth-network → Settings → Bindings → Add →
   KV namespace: Variable name = MYN_KV, Namespace = cel de la pasul 1. Save.
   (Lasă binding-ul D1 existent "DB" așa cum e — nu-l șterge.)
3. Pages → proiect → Create deployment → urcă acest folder (cu index.html și _worker.js
   în rădăcină). Publică pe branch-ul de producție (main).
4. Deschide https://metropolis-youth-network.pages.dev/#/director — la prima
   încărcare apar cele 62 de teatre (worker-ul populează KV automat).

Rollback: Pages → Deployments → versiunea veche → Rollback. Baza D1 veche rămâne neatinsă.

## Publicare cu wrangler (alternativ)
  wrangler kv namespace create MYN_KV           # dacă vrei unul nou
  # pune id-ul în wrangler.toml la [[kv_namespaces]]
  wrangler pages deploy . --project-name metropolis-youth-network
