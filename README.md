# Metropolis Youth Network

Rețeaua teatrelor de tineret **independente / private de stat** din Europa — un
proiect al **Teatrului Metropolis**, București.

O aplicație web statică (un singur `index.html`) care documentează teatre de
tineret și pentru tânărul public din Europa, în forme independente: asociații,
fundații, cooperative, companii și case de teatru.

## Funcționalități

- **Director** cu căutare liberă și filtrare pe țară, formă de organizare și sortare.
- **Pe țări** — distribuția geografică, cu click pentru filtrare.
- **Hartă interactivă** (Leaflet + CARTO) cu marcaj pentru fiecare teatru și link către site.
- **Rețele & Resurse** — organizațiile-cadru și programele europene de finanțare.
- **Despre** și **Contact** (proiectemetropolis@gmail.com).
- Logo Teatrul Metropolis → link către [teatrul-metropolis.ro](https://teatrul-metropolis.ro).

## Structură

```
index.html      – aplicația (HTML + CSS + JS, totul inline)
data.js         – baza de date a teatrelor și rețelelor
assets/logo.jpg – logo Teatrul Metropolis
```

## Rulare locală

Fiind un site static, poate fi deschis direct sau servit local:

```bash
python3 -m http.server 8000
# apoi deschide http://localhost:8000
```

## Publicare (Cloudflare Pages)

Proiectul e pregătit pentru **Cloudflare Pages** (direct din acest repo GitHub
sau prin încărcare directă). Nu necesită build — root-ul publicat este rădăcina
repo-ului.

## Date

Datele sunt orientative și în completare. Criteriul de includere: organizare
independentă/privată de stat + misiune centrată pe copii și/sau tineret.
Corectări și adăugiri: **proiectemetropolis@gmail.com**.

---

© Metropolis Youth Network · un proiect Teatrul Metropolis
