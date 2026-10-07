/*
 * Metropolis Youth Network — Cloudflare Pages (advanced mode) Worker
 * Serves static assets + a small JSON API backed by KV (binding: MYN_KV).
 *
 * API:
 *   GET    /api/bootstrap        -> { theatres, activity, seeded }
 *   GET    /api/theatres         -> [theatre]
 *   POST   /api/theatres         -> add    { ...theatre, _user }
 *   PUT    /api/theatres/:id     -> update { ...fields, _user }
 *   DELETE /api/theatres/:id     -> remove { _user }
 *   GET    /api/activity         -> [entry]
 *
 * If MYN_KV is not bound, the API still serves the SEED read-only and
 * returns 503 on writes so the client falls back to local storage.
 */

const SEED = [
  /* ===== MAREA BRITANIE & IRLANDA ===== */
  { name:"National Youth Theatre of Great Britain", country:"Marea Britanie", cc:"gb", region:"Vest", city:"Londra", founded:1956,
    form:"Organizație caritabilă (charity)", focus:"Companie națională de tineret, pe bază de audiții", ages:"14–25",
    languages:"Engleză", founders:"Michael Croft", venue:"Workshop & birou Holloway Road; spectacole în teatre din West End",
    notable:["Spectacole anuale în West End","Turnee internaționale","Programe REP company"],
    programs:["Audiții naționale","Cursuri de actorie & tehnic","Burse pentru acces"],
    description:"Prima companie de teatru de tineret din lume. Peste 100.000 de membri de-a lungul timpului — printre ei Helen Mirren, Daniel Craig, Chiwetel Ejiofor. Produce spectacole ambițioase cu distribuții exclusiv tinere.",
    web:"nyt.org.uk" },
  { name:"Chickenshed", country:"Marea Britanie", cc:"gb", region:"Vest", city:"Londra", founded:1974,
    form:"Organizație caritabilă (charity)", focus:"Teatru incluziv — fără audiții, toți sunt primiți", ages:"Toate vârstele",
    languages:"Engleză", founders:"Mary Ward & Jo Collins", venue:"Teatru propriu, Southgate (Londra)",
    notable:["Crăciunul la Chickenshed","Tales from the Shed (pentru cei mici)"],
    programs:["Trupe pentru toate vârstele","BTEC & cursuri acreditate","Rețea de 'Sheds' în toată țara"],
    description:"Model recunoscut internațional de teatru incluziv, unde oameni de toate abilitățile și mediile creează împreună. A inspirat o rețea de organizații-replică.",
    web:"chickenshed.org.uk" },
  { name:"Half Moon Young People's Theatre", country:"Marea Britanie", cc:"gb", region:"Vest", city:"Londra", founded:1990,
    form:"Organizație caritabilă (charity)", focus:"Teatru pentru tânărul public + teatru de tineret", ages:"0–17",
    languages:"Engleză", founders:"—", venue:"Teatru propriu, Tower Hamlets (East London)",
    notable:["Producții de turneu național pentru copii","Noi texte comandate anual"],
    programs:["11 trupe de tineret săptămânale","Program de incluziune & dizabilitate","Arhivă națională de TYA"],
    description:"Singura organizație din Londra dedicată integral participării și producției de teatru pentru copii și adolescenți, cu accent pe comunități subreprezentate din East London.",
    web:"halfmoon.org.uk" },
  { name:"Scottish Youth Theatre", country:"Marea Britanie", cc:"gb", region:"Vest", city:"Glasgow", founded:1976,
    form:"Organizație caritabilă (charity)", focus:"Teatrul național de tineret al Scoției", ages:"3–25",
    languages:"Engleză", founders:"—", venue:"The Old Sheriff Court, Glasgow",
    notable:["Festivalul de vară național","Producții ale companiei naționale"],
    programs:["Cursuri pe tot parcursul anului","Programe de wellbeing prin teatru"],
    description:"Singura companie națională de tineret a Scoției, activă tot anul, cu un amplu festival de vară ce reunește tineri din toată țara.",
    web:"scottishyouththeatre.org" },
  { name:"Contact", country:"Marea Britanie", cc:"gb", region:"Vest", city:"Manchester", founded:1972,
    form:"Organizație caritabilă (charity)", focus:"Teatru condus de tineri (16–30) în toate deciziile", ages:"13–30",
    languages:"Engleză", founders:"—", venue:"Clădire proprie recent renovată (Contact, Manchester)",
    notable:["Contacting the World (festival internațional)","Producții co-create cu tineri"],
    programs:["Tinerii decid programarea & angajările","Future Fires (schimbare socială)"],
    description:"Model european de guvernanță participativă: tinerii sunt implicați în angajări, programare și bugetare. Referință pentru teatrul condus de tineri.",
    web:"contactmcr.com" },
  { name:"Company Three", country:"Marea Britanie", cc:"gb", region:"Vest", city:"Londra", founded:2008,
    form:"Companie independentă", focus:"Teatru creat împreună cu adolescenți despre lumea lor", ages:"11–19",
    languages:"Engleză", founders:"Ned Glasier", venue:"Islington (Londra)",
    notable:["Brainstorm","The Future","When This Is Over"],
    programs:["Metodologie împărtășită gratuit global","Rețea internațională de teatre de tineret"],
    description:"Companie de cercetare care creează spectacole plecând de la viața adolescenților. Metodele lor sunt folosite de teatre de tineret din întreaga lume.",
    web:"companythree.co.uk" },
  { name:"Unicorn Theatre", country:"Marea Britanie", cc:"gb", region:"Vest", city:"Londra", founded:1947,
    form:"Organizație caritabilă (charity)", focus:"Cel mai mare teatru profesionist pentru tânărul public", ages:"0–21",
    languages:"Engleză", founders:"Caryl Jenner", venue:"Clădire proprie lângă Tower Bridge (din 2005)",
    notable:["Repertoriu internațional pentru copii","Coproducții europene"],
    programs:["Spectacole de la 6 luni la adolescenți","Program educațional amplu"],
    description:"Teatru de repertoriu dedicat tânărului public, cu o clădire proprie modernă și o programare curajoasă adresată tuturor vârstelor copilăriei.",
    web:"unicorntheatre.com" },
  { name:"Independent Youth Theatre", country:"Irlanda", cc:"ie", region:"Vest", city:"Dublin", founded:2003,
    form:"Organizație condusă de tineri", focus:"Lucrări noi irlandeze scrise și regizate de tineri", ages:"14–24",
    languages:"Engleză", founders:"—", venue:"The Basement Studio, Clarendon Street (Dublin)",
    notable:["Două festivaluri anuale proprii","Participări la Dublin Fringe"],
    programs:["Guvernanță democratică de către membri","Scriere & regie de către tineri"],
    description:"Platformă pentru tineri de 14–24 ani, condusă democratic de membrii săi, care produce exclusiv texte noi irlandeze create de tineri.",
    web:"" },
  { name:"Youth Theatre Ireland", country:"Irlanda", cc:"ie", region:"Vest", city:"Dublin", founded:1980,
    form:"Organizație-umbrelă națională", focus:"Rețea națională a teatrelor de tineret din Irlanda", ages:"Rețea",
    languages:"Engleză", founders:"—", venue:"Dublin (coordonare națională)",
    notable:["National Festival of Youth Theatres","Programe de formare pentru facilitatori"],
    programs:["Sprijină zeci de teatre locale","Standarde de calitate & formare"],
    description:"Organizația de dezvoltare pentru teatrul de tineret din Irlanda; susține, conectează și formează rețeaua națională de trupe locale.",
    web:"youththeatre.ie" },

  /* ===== GERMANIA, AUSTRIA, ELVEȚIA ===== */
  { name:"GRIPS Theater", country:"Germania", cc:"de", region:"Centru", city:"Berlin", founded:1969,
    form:"Teatru independent (scena liberă)", focus:"Teatru emancipator, realist, pentru copii și tineret", ages:"4–18 / adulți",
    languages:"Germană", founders:"Volker Ludwig", venue:"GRIPS Hansaplatz & GRIPS Podewil (Berlin)",
    notable:["Linie 1 (musical devenit clasic)","Max und Milli","Eins auf die Fresse"],
    programs:["Repertoriu social pentru școli","Turnee internaționale"],
    description:"Cel mai influent teatru emancipator pentru copii și tineret din Europa. 'Linie 1' s-a jucat în zeci de țări. Model pentru teatrul social de tineret pe continent.",
    web:"grips-theater.de" },
  { name:"Theater Strahl", country:"Germania", cc:"de", region:"Centru", city:"Berlin", founded:1987,
    form:"Teatru independent (gGmbH)", focus:"Teatru contemporan pentru adolescenți și tineri adulți", ages:"10–20",
    languages:"Germană", founders:"—", venue:"Theater Strahl Ostkreuz & Schaubude (Berlin)",
    notable:["Klamms Krieg","Spectacole despre identitate & rețele sociale"],
    programs:["Teme sociale actuale","Colaborări cu școli"],
    description:"Unul dintre cele mai importante teatre independente pentru tineret din Berlin, cu un limbaj scenic apropiat de cultura tânără și teme de actualitate.",
    web:"theater-strahl.de" },
  { name:"COMEDIA Theater", country:"Germania", cc:"de", region:"Centru", city:"Köln", founded:1989,
    form:"Teatru independent", focus:"Teatru pentru copii și tineret, clădire proprie", ages:"2–18",
    languages:"Germană", founders:"—", venue:"COMEDIA, Köln (Vringsveedel)",
    notable:["Producții mari de repertoriu pentru copii","Festivaluri proprii"],
    programs:["Școală de teatru pentru copii","Program incluziv"],
    description:"Una dintre cele mai mari case independente de teatru pentru tânărul public din Germania, cu repertoriu propriu și o școală de teatru pentru copii.",
    web:"comedia-koeln.de" },
  { name:"Helios Theater", country:"Germania", cc:"de", region:"Centru", city:"Hamm", founded:1997,
    form:"Teatru independent", focus:"Teatru pentru cei mai mici; teatru de material/obiect", ages:"2+",
    languages:"Germană", founders:"Barbara Kölling & Michael Lurse", venue:"Helios Theater, Hamm",
    notable:["HOLZ (teatru din lemn)","Producții pentru vârste foarte mici"],
    programs:["Festivalul internațional 'Hellwach'","Cercetare în teatrul pentru prima copilărie"],
    description:"Pionier german al teatrului pentru cei mai mici, cu un limbaj puternic vizual și tactil (teatru de material). Organizează festivalul internațional Hellwach.",
    web:"helios-theater.de" },
  { name:"Theater der Jugend", country:"Austria", cc:"at", region:"Centru", city:"Viena", founded:1932,
    form:"Asociație privată (Verein)", focus:"Cea mai mare organizație de teatru de tineret din Europa (după abonați)", ages:"5–19",
    languages:"Germană", founders:"—", venue:"Renaissancetheater & Theater im Zentrum (Viena)",
    notable:["Repertoriu dublu-sală","Zeci de mii de abonați-elevi"],
    programs:["Abonamente școlare","Cluburi de teatru pentru tineri"],
    description:"Cu două săli proprii și zeci de mii de abonați, este considerată cea mai mare organizație de teatru de tineret din Europa după numărul de spectatori.",
    web:"tdj.at" },
  { name:"DSCHUNGEL WIEN", country:"Austria", cc:"at", region:"Centru", city:"Viena", founded:2004,
    form:"Casă de teatru (independentă)", focus:"Casă de teatru pentru tânărul public în MuseumsQuartier", ages:"0–20",
    languages:"Germană", founders:"—", venue:"MuseumsQuartier, Viena",
    notable:["Coproducții cu companii independente","Festivaluri tematice"],
    programs:["Găzduire & coproducție","Program pentru bebeluși"],
    description:"Casă de teatru pentru copii și tineret în inima MuseumsQuartier din Viena, care coproduce și găzduiește cele mai importante companii independente de profil.",
    web:"dschungelwien.at" },
  { name:"Junges Theater Basel", country:"Elveția", cc:"ch", region:"Centru", city:"Basel", founded:1976,
    form:"Teatru independent", focus:"Teatru creat cu și pentru tineri, puternic fizic/coregrafic", ages:"12–22",
    languages:"Germană", founders:"—", venue:"Kaserne Basel & spații proprii",
    notable:["Producții fizice premiate","Invitații la festivaluri internaționale"],
    programs:["Ansambluri de tineri","Colaborări cu regizori de top"],
    description:"Unul dintre cele mai influente teatre de tineret din spațiul germanofon, renumit pentru spectacolele fizice create împreună cu tineri performeri.",
    web:"jungestheaterbasel.ch" },

  /* ===== OLANDA & BELGIA ===== */
  { name:"Maas theater en dans", country:"Olanda", cc:"nl", region:"Vest", city:"Rotterdam", founded:2015,
    form:"Companie independentă (fundație)", focus:"Teatru și dans pentru tânărul public", ages:"2–18",
    languages:"Neerlandeză", founders:"(fuziune Maas & Plezant)", venue:"Rotterdam",
    notable:["Producții de dans pentru copii","Turnee internaționale"],
    programs:["Creații pentru școli","Coproducții europene"],
    description:"Casă de creație din Rotterdam pentru teatru și dans dedicat tânărului public, cu turnee naționale și internaționale.",
    web:"maastd.nl" },
  { name:"De Toneelmakerij", country:"Olanda", cc:"nl", region:"Vest", city:"Amsterdam", founded:2008,
    form:"Companie independentă", focus:"Teatru de text de calitate pentru copii și tineret", ages:"6–18",
    languages:"Neerlandeză", founders:"—", venue:"Amsterdam",
    notable:["Adaptări literare pentru tineri","Texte noi comandate"],
    programs:["Repertoriu pentru școli","Dezvoltare de dramaturgi tineri"],
    description:"Casa de teatru de tineret a Amsterdamului, cu accent pe teatru de text ambițios și pe comanda de piese noi pentru publicul tânăr.",
    web:"detoneelmakerij.nl" },
  { name:"Artemis", country:"Olanda", cc:"nl", region:"Vest", city:"'s-Hertogenbosch", founded:1994,
    form:"Companie independentă", focus:"Teatru-laborator, texte îndrăznețe pentru tineri", ages:"4+",
    languages:"Neerlandeză", founders:"—", venue:"'s-Hertogenbosch",
    notable:["Producții premiate la festivaluri TYA","Texte experimentale"],
    programs:["Makershuis (casă de autori)","Mentorat pentru creatori tineri"],
    description:"Casă de creație (makershuis) cunoscută pentru abordarea de laborator și pentru textele îndrăznețe adresate copiilor și tinerilor.",
    web:"artemis.nl" },
  { name:"BRONKS", country:"Belgia", cc:"be", region:"Vest", city:"Bruxelles", founded:1991,
    form:"Casă de teatru (vzw, independentă)", focus:"Teatru pentru tânărul public, bilingv", ages:"2–18",
    languages:"Neerlandeză / Franceză", founders:"—", venue:"Clădire proprie (din 2009), Bruxelles",
    notable:["Festivalul BRONKS","Coproducții internaționale"],
    programs:["Producție proprie","Festival anual pentru tineri"],
    description:"Casă de teatru pentru copii și tineret din Bruxelles, cu o clădire-reper inaugurată în 2009 și un festival internațional propriu.",
    web:"bronks.be" },
  { name:"HETPALEIS", country:"Belgia", cc:"be", region:"Vest", city:"Anvers", founded:2002,
    form:"Casă de teatru (vzw, independentă)", focus:"Teatru pentru copii și tineret, mare scenă urbană", ages:"2–18",
    languages:"Neerlandeză", founders:"—", venue:"Clădire monumentală, Theaterplein (Anvers)",
    notable:["Producții de mare anvergură","Programe participative urbane"],
    programs:["Creații proprii","Program de implicare a cartierului"],
    description:"Una dintre cele mai mari case de teatru pentru tineri din Flandra, într-o clădire monumentală din centrul Anversului.",
    web:"hetpaleis.be" },
  { name:"KOPERGIETERY", country:"Belgia", cc:"be", region:"Vest", city:"Gent", founded:1978,
    form:"Companie / casă independentă (vzw)", focus:"Teatru, dans și muzică cu și pentru tineri", ages:"3–20",
    languages:"Neerlandeză", founders:"—", venue:"Gent",
    notable:["Spectacole profesioniști + tineri pe scenă","Coproducții internaționale"],
    programs:["Ateliere permanente","Rezidențe de creație"],
    description:"Renumită pentru colaborarea dintre artiști profesioniști și tineri pe scenă, combinând teatru, dans și muzică.",
    web:"kopergietery.be" },
  { name:"fABULEUS", country:"Belgia", cc:"be", region:"Vest", city:"Leuven", founded:1996,
    form:"Companie independentă (vzw)", focus:"Teatru și dans pentru/cu tineri creatori", ages:"12–25",
    languages:"Neerlandeză", founders:"—", venue:"Leuven",
    notable:["Producții de dans pentru tineri","Platformă pentru debutanți"],
    programs:["Sprijin pentru tineri artiști","Coproducții"],
    description:"Platformă pentru tineri artiști la început de drum, care produce teatru și dans contemporan cu și pentru tineri.",
    web:"fabuleus.be" },

  /* ===== ȚĂRILE NORDICE ===== */
  { name:"Unga Klara", country:"Suedia", cc:"se", region:"Nord", city:"Stockholm", founded:1975,
    form:"Companie independentă (scenă națională din 2018)", focus:"Teatru de artă pentru copii, din perspectiva copilului", ages:"0–19",
    languages:"Suedeză", founders:"Suzanne Osten", venue:"Stockholm",
    notable:["Medeas barn","Spectacole pentru bebeluși"],
    programs:["Cercetare artistică cu copii","Turnee naționale"],
    description:"Fondată de Suzanne Osten, pionier mondial al teatrului serios pentru copii, privit din perspectiva copilului. Din 2018 are statut de scenă națională.",
    web:"ungaklara.se" },
  { name:"ung scen/öst", country:"Suedia", cc:"se", region:"Nord", city:"Linköping", founded:2002,
    form:"Companie independentă (regională)", focus:"Teatru contemporan pentru și despre tineri", ages:"13–19",
    languages:"Suedeză", founders:"—", venue:"Linköping / Östergötland",
    notable:["Dramaturgie nouă despre adolescență","Turnee în regiune"],
    programs:["Texte noi comandate","Colaborare cu licee"],
    description:"Companie regională cunoscută pentru dramaturgia nouă, axată pe realitatea adolescenților din Suedia.",
    web:"ungscenost.se" },
  { name:"ZeBU", country:"Danemarca", cc:"dk", region:"Nord", city:"Copenhaga", founded:1977,
    form:"Teatru independent", focus:"Teatru pentru tineri despre teme de actualitate", ages:"13–20",
    languages:"Daneză", founders:"—", venue:"Amager, Copenhaga",
    notable:["Spectacole despre teme sociale","Turnee școlare"],
    programs:["Parteneriate cu școli","Noi texte pentru tineri"],
    description:"Teatru independent din Copenhaga, partener frecvent al școlilor, specializat în spectacole despre temele de actualitate ale tinerilor.",
    web:"zebu.nu" },
  { name:"Batida", country:"Danemarca", cc:"dk", region:"Nord", city:"Copenhaga", founded:1986,
    form:"Teatru independent", focus:"Teatru vizual și fizic pentru tânărul public", ages:"3+",
    languages:"Daneză (aproape fără cuvinte)", founders:"—", venue:"Copenhaga",
    notable:["Spectacole vizuale de turneu","Invitații internaționale"],
    programs:["Turnee globale","Creație fizică & vizuală"],
    description:"Companie daneză de teatru vizual și fizic, cu spectacole aproape fără cuvinte care circulă pe scene din întreaga lume.",
    web:"batida.dk" },
  { name:"Det Andre Teatret", country:"Norvegia", cc:"no", region:"Nord", city:"Oslo", founded:2010,
    form:"Teatru independent", focus:"Improvizație, cu programe puternice pentru tineri", ages:"13+",
    languages:"Norvegiană", founders:"—", venue:"Sagene, Oslo",
    notable:["Spectacole de improvizație","Școala proprie de improv"],
    programs:["Cursuri pentru tineri","Spectacole regulate"],
    description:"Teatru de improvizație din Oslo, cu o școală proprie foarte populară în rândul tinerilor și spectacole regulate.",
    web:"detandreteatret.no" },

  /* ===== EUROPA DE SUD ===== */
  { name:"La Baracca – Testoni Ragazzi", country:"Italia", cc:"it", region:"Sud", city:"Bologna", founded:1976,
    form:"Cooperativă / teatru independent", focus:"Teatru pentru copii, inclusiv 0–3 ani", ages:"0–14",
    languages:"Italiană", founders:"—", venue:"Teatro Testoni Ragazzi, Bologna",
    notable:["Festivalul 'Visioni di futuro'","Spectacole pentru prima copilărie"],
    programs:["Cercetare 0–3 ani","Formare internațională"],
    description:"Lider european al teatrului pentru prima copilărie. Organizează festivalul internațional 'Visioni' și formează artiști din toată lumea.",
    web:"testoniragazzi.it" },
  { name:"Teatro delle Briciole", country:"Italia", cc:"it", region:"Sud", city:"Parma", founded:1976,
    form:"Companie independentă (Solares Fondazione delle Arti)", focus:"Teatru de cercetare pentru tânărul public", ages:"3+",
    languages:"Italiană", founders:"—", venue:"Teatro al Parco, Parma",
    notable:["Spectacole de cercetare premiate","Coproducții europene"],
    programs:["Rezidențe artistice","Program pentru școli"],
    description:"Companie istorică de cercetare pentru tânărul public, rezidentă la Teatro al Parco din Parma.",
    web:"solaresdellearti.it" },
  { name:"Fontemaggiore", country:"Italia", cc:"it", region:"Sud", city:"Perugia", founded:1982,
    form:"Centru de producție teatrală (independent)", focus:"Teatru pentru copii și tineret", ages:"3–18",
    languages:"Italiană", founders:"—", venue:"Perugia (Umbria)",
    notable:["Producții de turneu național","Festivaluri de profil"],
    programs:["Educație teatrală","Producție & distribuție"],
    description:"Centru de producție recunoscut la nivel național în Umbria, dedicat teatrului pentru copii și tineret.",
    web:"fontemaggiore.it" },
  { name:"La Joven", country:"Spania", cc:"es", region:"Sud", city:"Madrid", founded:2012,
    form:"Companie privată independentă", focus:"Teatru de și pentru tineri, cu actori tineri profesioniști", ages:"14–30",
    languages:"Spaniolă", founders:"José Luis Arellano & David R. Peralto", venue:"Sedii proprii, Madrid",
    notable:["Fuenteovejuna","The Spoon River","La Isla"],
    programs:["Program educativ amplu (La Joven Educa)","Companie stabilă de tineri actori"],
    description:"Companie privată din Madrid care creează teatru de calitate cu și pentru tineri, cu o companie stabilă de actori tineri și un program educativ puternic.",
    web:"lajoven.es" },
  { name:"Teatro O Bando", country:"Portugalia", cc:"pt", region:"Sud", city:"Palmela / Lisabona", founded:1974,
    form:"Cooperativă culturală independentă", focus:"Teatru de autor, cu programe pentru tineri și educație", ages:"12+",
    languages:"Portugheză", founders:"—", venue:"Vale dos Barris, Palmela",
    notable:["Spectacole de autor","Reziden­țe & educație"],
    programs:["Program educativ","Rezidențe de creație"],
    description:"Una dintre cele mai vechi structuri independente portugheze de după Revoluția Garoafelor, cu o puternică componentă educativă pentru tineri.",
    web:"obando.pt" },

  /* ===== EUROPA CENTRALĂ & DE EST ===== */
  { name:"Divadlo Minor", country:"Cehia", cc:"cz", region:"Est", city:"Praga", founded:1984,
    form:"Teatru (independent de rețeaua de stat)", focus:"Teatru pentru copii și tineret, păpuși + actori", ages:"3–15",
    languages:"Cehă", founders:"—", venue:"Divadlo Minor, Praga",
    notable:["Repertoriu pentru familii","Spectacole cu păpuși & actori"],
    programs:["Repertoriu de zi pentru școli","Program pentru familii"],
    description:"Scenă centrală pentru tânărul public la Praga, combinând teatrul de păpuși cu teatrul de actori.",
    web:"minor.cz" },
  { name:"Buchty a loutky", country:"Cehia", cc:"cz", region:"Est", city:"Praga", founded:1991,
    form:"Companie independentă", focus:"Teatru de păpuși contemporan, pentru copii și adulți", ages:"4+",
    languages:"Cehă", founders:"—", venue:"Švandovo divadlo & turnee (Praga)",
    notable:["Spectacole de cult de păpuși","Turnee internaționale"],
    programs:["Creație independentă","Turnee"],
    description:"Companie de cult a scenei independente cehe de păpuși, cu un stil ludic apreciat de copii și adulți deopotrivă.",
    web:"buchty.org" },
  { name:"Teatr Baj", country:"Polonia", cc:"pl", region:"Est", city:"Varșovia", founded:1928,
    form:"Teatru pentru copii (profil independent)", focus:"Cel mai vechi teatru de păpuși din Polonia", ages:"2–12",
    languages:"Poloneză", founders:"—", venue:"Praga-Północ, Varșovia",
    notable:["Patrimoniu al teatrului de păpuși","Producții pentru cei mici"],
    programs:["Repertoriu pentru copii","Centru de educație teatrală"],
    description:"Cel mai vechi teatru de păpuși din Polonia și un centru de patrimoniu al teatrului pentru copii.",
    web:"teatrbaj.pl" },
  { name:"Kolibri Színház", country:"Ungaria", cc:"hu", region:"Est", city:"Budapesta", founded:1992,
    form:"Teatru pentru copii și tineret", focus:"Repertoriu pe trei scene, de la bebeluși la adolescenți", ages:"0–18",
    languages:"Maghiară", founders:"—", venue:"Trei scene, Budapesta",
    notable:["Theatre for Babies (pionier regional)","Repertoriu pentru adolescenți"],
    programs:["Program pentru bebeluși","Spectacole pentru licee"],
    description:"Teatru budapestan cu repertoriu pe trei scene, de la spectacole pentru bebeluși (pionier în regiune) la producții pentru adolescenți.",
    web:"kolibriszinhaz.hu" },
  { name:"Mala scena", country:"Croația", cc:"hr", region:"Est", city:"Zagreb", founded:1989,
    form:"Teatru independent", focus:"Teatru pentru copii, tineret și familie", ages:"3+",
    languages:"Croată", founders:"Vitomira Lončar & Ivica Šimić", venue:"Zagreb",
    notable:["Producții pentru familii","Festivaluri de profil"],
    programs:["Școală de teatru","Repertoriu pentru copii"],
    description:"Una dintre cele mai active scene independente croate pentru tineri, cu repertoriu pentru copii și familie și o școală de teatru proprie.",
    web:"mala-scena.hr" }
];

const NETWORKS = [
  { name:"ASSITEJ International", scope:"Global / Europa", focus:"Asociația Internațională a Teatrului pentru Copii și Tineret", web:"assitej-international.org", note:"Rețeaua-cadru mondială; secțiuni naționale în majoritatea țărilor europene." },
  { name:"EDERED", scope:"Europa", focus:"European Drama Encounters / Rencontres Européennes", web:"ederede.org", note:"Întâlniri europene de teatru pentru copii și tineri." },
  { name:"IDEA", scope:"Global / Europa", focus:"International Drama/Theatre and Education Association", web:"ideadrama.org", note:"Rețea pentru educația prin teatru și drama aplicată." },
  { name:"Creative Europe", scope:"Uniunea Europeană", focus:"Program de finanțare pentru cooperare culturală", web:"culture.ec.europa.eu", note:"Sursă majoră de finanțare pentru proiecte transfrontaliere de teatru tânăr." }
];

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

function uid() {
  return "t_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

async function readTheatres(env) {
  if (!env.MYN_KV) return { list: seededList(), persistent: false };
  let raw = await env.MYN_KV.get("theatres");
  if (raw == null) {
    const list = seededList();
    await env.MYN_KV.put("theatres", JSON.stringify(list));
    return { list, persistent: true, seeded: true };
  }
  try { return { list: JSON.parse(raw), persistent: true }; }
  catch { return { list: seededList(), persistent: true }; }
}

function seededList() {
  return SEED.map((t, i) => ({ id: "seed_" + i, builtin: true, ...t }));
}

async function writeTheatres(env, list) {
  if (!env.MYN_KV) return false;
  await env.MYN_KV.put("theatres", JSON.stringify(list));
  return true;
}

async function readActivity(env) {
  if (!env.MYN_KV) return [];
  const raw = await env.MYN_KV.get("activity");
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function logActivity(env, entry) {
  if (!env.MYN_KV) return;
  const list = await readActivity(env);
  list.unshift({ ...entry, at: new Date().toISOString() });
  await env.MYN_KV.put("activity", JSON.stringify(list.slice(0, 300)));
}

async function handleApi(request, env, url) {
  const path = url.pathname.replace(/^\/api/, "");
  const method = request.method.toUpperCase();

  if (path === "/bootstrap" && method === "GET") {
    const { list, persistent } = await readTheatres(env);
    const activity = await readActivity(env);
    return json({ theatres: list, networks: NETWORKS, activity, persistent });
  }

  if (path === "/theatres" && method === "GET") {
    const { list } = await readTheatres(env);
    return json(list);
  }

  if (path === "/theatres" && method === "POST") {
    if (!env.MYN_KV) return json({ error: "no_storage" }, 503);
    const body = await request.json().catch(() => ({}));
    const user = (body._user || "necunoscut").toString().slice(0, 60);
    if (!body.name || !body.country || !body.city) return json({ error: "missing_fields" }, 400);
    const { list } = await readTheatres(env);
    const item = {
      id: uid(), builtin: false, name: body.name, country: body.country, cc: (body.cc || "").toLowerCase().slice(0, 2),
      region: body.region || "", city: body.city, founded: body.founded ? parseInt(body.founded, 10) || null : null,
      form: body.form || "", focus: body.focus || "", ages: body.ages || "", languages: body.languages || "",
      founders: body.founders || "", venue: body.venue || "", notable: Array.isArray(body.notable) ? body.notable : [],
      programs: Array.isArray(body.programs) ? body.programs : [], description: body.description || "",
      web: (body.web || "").replace(/^https?:\/\//, ""), addedBy: user
    };
    list.push(item);
    await writeTheatres(env, list);
    await logActivity(env, { action: "add", user, name: item.name, id: item.id });
    return json(item, 201);
  }

  const mId = path.match(/^\/theatres\/([^/]+)$/);
  if (mId && method === "PUT") {
    if (!env.MYN_KV) return json({ error: "no_storage" }, 503);
    const id = mId[1];
    const body = await request.json().catch(() => ({}));
    const user = (body._user || "necunoscut").toString().slice(0, 60);
    const { list } = await readTheatres(env);
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) return json({ error: "not_found" }, 404);
    const allowed = ["name","country","cc","region","city","founded","form","focus","ages","languages","founders","venue","notable","programs","description","web"];
    for (const k of allowed) if (k in body) list[idx][k] = body[k];
    list[idx].editedBy = user;
    await writeTheatres(env, list);
    await logActivity(env, { action: "edit", user, name: list[idx].name, id });
    return json(list[idx]);
  }

  if (mId && method === "DELETE") {
    if (!env.MYN_KV) return json({ error: "no_storage" }, 503);
    const id = mId[1];
    const body = await request.json().catch(() => ({}));
    const user = (body._user || "necunoscut").toString().slice(0, 60);
    const { list } = await readTheatres(env);
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) return json({ error: "not_found" }, 404);
    const [removed] = list.splice(idx, 1);
    await writeTheatres(env, list);
    await logActivity(env, { action: "delete", user, name: removed.name, id });
    return json({ ok: true });
  }

  if (path === "/activity" && method === "GET") {
    return json(await readActivity(env));
  }

  return json({ error: "not_found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try { return await handleApi(request, env, url); }
      catch (e) { return json({ error: "server_error", detail: String(e) }, 500); }
    }
    return env.ASSETS.fetch(request);
  }
};
