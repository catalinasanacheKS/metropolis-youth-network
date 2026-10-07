/*
 * Metropolis Youth Network — baza de date a teatrelor
 * Teatre de tineret / pentru tânărul public din Europa, în forme
 * independente / private de stat (asociații, fundații, companii,
 * ONG-uri, case de teatru independente).
 *
 * Câmpuri:
 *   name     – denumirea teatrului / companiei
 *   country  – țara
 *   cc       – cod ISO țară (pentru steag / filtrare)
 *   city     – orașul
 *   founded  – anul înființării (număr, sau null dacă necunoscut)
 *   form     – forma juridică / de organizare
 *   focus    – profilul artistic
 *   ages     – publicul-țintă (vârste)
 *   web      – site oficial (fără https:// — se adaugă la render)
 *   note     – detaliu relevant
 */
window.MYN_DATA = [
  /* ===================== MAREA BRITANIE & IRLANDA ===================== */
  {
    name: "National Youth Theatre of Great Britain",
    country: "Marea Britanie", cc: "gb", city: "Londra", founded: 1956,
    form: "Organizație caritabilă (charity)",
    focus: "Companie națională de tineret, pe bază de audiții",
    ages: "14–25",
    web: "nyt.org.uk",
    note: "Prima companie de tineret din lume; peste 100.000 de membri de-a lungul timpului, incluzând nume precum Helen Mirren și Daniel Craig."
  },
  {
    name: "Chickenshed",
    country: "Marea Britanie", cc: "gb", city: "Londra", founded: 1974,
    form: "Organizație caritabilă (charity)",
    focus: "Teatru incluziv — fără audiții, toți sunt primiți",
    ages: "Toate vârstele",
    web: "chickenshed.org.uk",
    note: "Model de teatru incluziv recunoscut internațional; filiale și rețea de replici în toată țara."
  },
  {
    name: "Half Moon Young People's Theatre",
    country: "Marea Britanie", cc: "gb", city: "Londra", founded: 1990,
    form: "Organizație caritabilă (charity)",
    focus: "Teatru pentru tânărul public + teatru de tineret",
    ages: "0–17",
    web: "halfmoon.org.uk",
    note: "Singura organizație de teatru de tineret din Londra dedicată participării și producției pentru copii și adolescenți."
  },
  {
    name: "Scottish Youth Theatre",
    country: "Marea Britanie", cc: "gb", city: "Glasgow", founded: 1976,
    form: "Organizație caritabilă (charity)",
    focus: "Teatrul național de tineret al Scoției",
    ages: "3–25",
    web: "scottishyouththeatre.org",
    note: "Singura companie națională de tineret a Scoției, activă pe tot parcursul anului."
  },
  {
    name: "Contact",
    country: "Marea Britanie", cc: "gb", city: "Manchester", founded: 1972,
    form: "Organizație caritabilă (charity)",
    focus: "Teatru condus de tineri (16–30) în toate deciziile",
    ages: "13–30",
    web: "contactmcr.com",
    note: "Tinerii sunt implicați în angajări, programare și bugetare — model de guvernanță participativă."
  },
  {
    name: "Company Three",
    country: "Marea Britanie", cc: "gb", city: "Londra", founded: 2008,
    form: "Companie independentă",
    focus: "Teatru creat împreună cu adolescenți despre lumea lor",
    ages: "11–19",
    web: "companythree.co.uk",
    note: "Metodologie împărtășită gratuit cu teatre de tineret din întreaga lume."
  },
  {
    name: "Unicorn Theatre",
    country: "Marea Britanie", cc: "gb", city: "Londra", founded: 1947,
    form: "Organizație caritabilă (charity)",
    focus: "Cel mai mare teatru profesionist dedicat tânărului public",
    ages: "0–21",
    web: "unicorntheatre.com",
    note: "Clădire proprie lângă Tower Bridge; repertoriu internațional pentru copii."
  },
  {
    name: "Independent Youth Theatre",
    country: "Irlanda", cc: "ie", city: "Dublin", founded: 2003,
    form: "Organizație condusă de tineri",
    focus: "Lucrări noi irlandeze scrise și regizate de tineri",
    ages: "14–24",
    web: "",
    note: "Guvernanță democratică de către membrii tineri; două festivaluri anuale proprii."
  },
  {
    name: "Youth Theatre Ireland",
    country: "Irlanda", cc: "ie", city: "Dublin", founded: 1980,
    form: "Organizație-umbrelă națională",
    focus: "Rețea națională a teatrelor de tineret din Irlanda",
    ages: "N/A (rețea)",
    web: "youththeatre.ie",
    note: "Sprijină zeci de teatre de tineret locale din întreaga Irlandă."
  },

  /* ===================== GERMANIA, AUSTRIA, ELVEȚIA ===================== */
  {
    name: "GRIPS Theater",
    country: "Germania", cc: "de", city: "Berlin", founded: 1969,
    form: "Teatru independent (scena liberă)",
    focus: "Teatru emancipator, realist, pentru copii și tineret",
    ages: "4–18 / adulți",
    web: "grips-theater.de",
    note: "„Linie 1” a devenit un clasic internațional; model pentru teatrul social de tineret în toată Europa."
  },
  {
    name: "Theater Strahl",
    country: "Germania", cc: "de", city: "Berlin", founded: 1987,
    form: "Teatru independent (gGmbH)",
    focus: "Teatru contemporan pentru adolescenți și tineri adulți",
    ages: "10–20",
    web: "theater-strahl.de",
    note: "Teme sociale actuale, limbaj scenic apropiat de cultura tânără."
  },
  {
    name: "COMEDIA Theater",
    country: "Germania", cc: "de", city: "Köln", founded: 1989,
    form: "Teatru independent",
    focus: "Teatru pentru copii și tineret, clădire proprie",
    ages: "2–18",
    web: "comedia-koeln.de",
    note: "Unul dintre cele mai mari teatre independente pentru tânărul public din Germania."
  },
  {
    name: "Helios Theater",
    country: "Germania", cc: "de", city: "Hamm", founded: 1997,
    form: "Teatru independent",
    focus: "Teatru pentru cei mai mici, teatru de obiect/material",
    ages: "2+",
    web: "helios-theater.de",
    note: "Organizator al festivalului internațional „Hellwach”."
  },
  {
    name: "Theater der Jugend",
    country: "Austria", cc: "at", city: "Viena", founded: 1932,
    form: "Asociație privată (Verein)",
    focus: "Cea mai mare organizație de teatru de tineret din Europa (după abonați)",
    ages: "5–19",
    web: "tdj.at",
    note: "Gestionează două săli proprii (Renaissancetheater, Theater im Zentrum); zeci de mii de abonați."
  },
  {
    name: "DSCHUNGEL WIEN",
    country: "Austria", cc: "at", city: "Viena", founded: 2004,
    form: "Casă de teatru (independentă)",
    focus: "Casă de teatru pentru tânărul public în MuseumsQuartier",
    ages: "0–20",
    web: "dschungelwien.at",
    note: "Coproducții și găzduiri ale celor mai importante companii independente de profil."
  },
  {
    name: "Junges Theater Basel",
    country: "Elveția", cc: "ch", city: "Basel", founded: 1976,
    form: "Teatru independent",
    focus: "Teatru creat cu și pentru tineri, puternic fizic/coregrafic",
    ages: "12–22",
    web: "jungestheaterbasel.ch",
    note: "Unul dintre cele mai influente teatre de tineret din spațiul germanofon."
  },

  /* ===================== OLANDA & BELGIA ===================== */
  {
    name: "Maas theater en dans",
    country: "Olanda", cc: "nl", city: "Rotterdam", founded: 2015,
    form: "Companie independentă (fundație)",
    focus: "Teatru și dans pentru tânărul public",
    ages: "2–18",
    web: "maastd.nl",
    note: "Rezultat al fuziunii Maas & Plezant; turnee naționale și internaționale."
  },
  {
    name: "De Toneelmakerij",
    country: "Olanda", cc: "nl", city: "Amsterdam", founded: 2008,
    form: "Companie independentă",
    focus: "Teatru de text de calitate pentru copii și tineret",
    ages: "6–18",
    web: "detoneelmakerij.nl",
    note: "Casa de teatru de tineret a Amsterdamului."
  },
  {
    name: "Artemis",
    country: "Olanda", cc: "nl", city: "'s-Hertogenbosch", founded: 1994,
    form: "Companie independentă",
    focus: "Teatru-laborator, texte îndrăznețe pentru tineri",
    ages: "4+",
    web: "artemis.nl",
    note: "Casă de creație (makershuis) pentru autori tineri de teatru."
  },
  {
    name: "BRONKS",
    country: "Belgia", cc: "be", city: "Bruxelles", founded: 1991,
    form: "Casă de teatru (independentă, vzw)",
    focus: "Teatru pentru tânărul public, bilingv (NL/FR)",
    ages: "2–18",
    web: "bronks.be",
    note: "Clădire-reper din 2009; producții și festival propriu."
  },
  {
    name: "HETPALEIS",
    country: "Belgia", cc: "be", city: "Anvers", founded: 2002,
    form: "Casă de teatru (independentă, vzw)",
    focus: "Teatru pentru copii și tineret, mare scenă urbană",
    ages: "2–18",
    web: "hetpaleis.be",
    note: "Una dintre cele mai mari case de teatru pentru tineri din Flandra."
  },
  {
    name: "KOPERGIETERY",
    country: "Belgia", cc: "be", city: "Gent", founded: 1978,
    form: "Companie / casă independentă (vzw)",
    focus: "Teatru, dans și muzică cu și pentru tineri",
    ages: "3–20",
    web: "kopergietery.be",
    note: "Renumită pentru colaborarea profesioniști–tineri pe scenă."
  },
  {
    name: "fABULEUS",
    country: "Belgia", cc: "be", city: "Leuven", founded: 1996,
    form: "Companie independentă (vzw)",
    focus: "Teatru și dans pentru/cu tineri creatori",
    ages: "12–25",
    web: "fabuleus.be",
    note: "Platformă pentru tineri artiști la început de drum."
  },

  /* ===================== ȚĂRILE NORDICE ===================== */
  {
    name: "Unga Klara",
    country: "Suedia", cc: "se", city: "Stockholm", founded: 1975,
    form: "Companie independentă (scenă națională din 2018)",
    focus: "Teatru de artă pentru copii, din perspectiva copilului",
    ages: "0–19",
    web: "ungaklara.se",
    note: "Fondată de Suzanne Osten; pionier mondial al teatrului serios pentru copii."
  },
  {
    name: "ung scen/öst",
    country: "Suedia", cc: "se", city: "Linköping", founded: 2002,
    form: "Companie independentă (regională)",
    focus: "Teatru contemporan pentru și despre tineri",
    ages: "13–19",
    web: "ungscenost.se",
    note: "Dramaturgie nouă axată pe realitatea adolescenților."
  },
  {
    name: "ZeBU",
    country: "Danemarca", cc: "dk", city: "Copenhaga", founded: 1977,
    form: "Teatru independent",
    focus: "Teatru pentru tineri despre teme de actualitate",
    ages: "13–20",
    web: "zebu.nu",
    note: "Partener frecvent al școlilor din regiunea capitalei."
  },
  {
    name: "Batida",
    country: "Danemarca", cc: "dk", city: "Copenhaga", founded: 1986,
    form: "Teatru independent",
    focus: "Teatru vizual și fizic pentru tânărul public",
    ages: "3+",
    web: "batida.dk",
    note: "Turnee internaționale cu spectacole aproape fără cuvinte."
  },
  {
    name: "Det Andre Teatret",
    country: "Norvegia", cc: "no", city: "Oslo", founded: 2010,
    form: "Teatru independent",
    focus: "Teatru de improvizație, cu programe puternice pentru tineri",
    ages: "13+",
    web: "detandreteatret.no",
    note: "Școală proprie de improvizație foarte populară în rândul tinerilor."
  },

  /* ===================== EUROPA DE SUD ===================== */
  {
    name: "La Baracca – Testoni Ragazzi",
    country: "Italia", cc: "it", city: "Bologna", founded: 1976,
    form: "Cooperativă / teatru independent",
    focus: "Teatru pentru copii, inclusiv pentru vârste foarte mici (0–3)",
    ages: "0–14",
    web: "testoniragazzi.it",
    note: "Lider european al teatrului pentru prima copilărie; festivalul „Visioni”."
  },
  {
    name: "Teatro delle Briciole",
    country: "Italia", cc: "it", city: "Parma", founded: 1976,
    form: "Companie independentă (Solares Fondazione delle Arti)",
    focus: "Teatru de cercetare pentru tânărul public",
    ages: "3+",
    web: "solaresdellearti.it",
    note: "Rezidentă la Teatro al Parco din Parma."
  },
  {
    name: "Fontemaggiore",
    country: "Italia", cc: "it", city: "Perugia", founded: 1982,
    form: "Centru de producție teatrală (independent)",
    focus: "Teatru pentru copii și tineret",
    ages: "3–18",
    web: "fontemaggiore.it",
    note: "Centru de producție recunoscut la nivel național în Umbria."
  },
  {
    name: "La Joven",
    country: "Spania", cc: "es", city: "Madrid", founded: 2012,
    form: "Companie privată independentă",
    focus: "Teatru de și pentru tineri, cu actori tineri profesioniști",
    ages: "14–30",
    web: "lajoven.es",
    note: "Program educativ amplu; sală proprie (Teatro Conde Duque / sedii proprii)."
  },
  {
    name: "Teatro O Bando",
    country: "Portugalia", cc: "pt", city: "Palmela / Lisabona", founded: 1974,
    form: "Cooperativă culturală independentă",
    focus: "Teatru de autor, cu programe pentru tineri și educație",
    ages: "12+",
    web: "obando.pt",
    note: "Una dintre cele mai vechi structuri independente din Portugalia post-revoluție."
  },

  /* ===================== EUROPA CENTRALĂ & DE EST ===================== */
  {
    name: "Divadlo Minor",
    country: "Cehia", cc: "cz", city: "Praga", founded: 1984,
    form: "Teatru (independent de rețeaua de stat)",
    focus: "Teatru pentru copii și tineret, păpuși + actori",
    ages: "3–15",
    web: "minor.cz",
    note: "Scenă centrală pentru tânărul public la Praga."
  },
  {
    name: "Buchty a loutky",
    country: "Cehia", cc: "cz", city: "Praga", founded: 1991,
    form: "Companie independentă",
    focus: "Teatru de păpuși contemporan, pentru copii și adulți",
    ages: "4+",
    web: "buchty.org",
    note: "Companie de cult a scenei independente cehe de păpuși."
  },
  {
    name: "Teatr Baj",
    country: "Polonia", cc: "pl", city: "Varșovia", founded: 1928,
    form: "Teatru pentru copii (independent ca profil)",
    focus: "Cel mai vechi teatru de păpuși din Polonia",
    ages: "2–12",
    web: "teatrbaj.pl",
    note: "Centru de patrimoniu al teatrului pentru copii din Polonia."
  },
  {
    name: "Kolibri Színház",
    country: "Ungaria", cc: "hu", city: "Budapesta", founded: 1992,
    form: "Teatru pentru copii și tineret",
    focus: "Repertoriu pe trei scene, de la bebeluși la adolescenți",
    ages: "0–18",
    web: "kolibriszinhaz.hu",
    note: "Program „Theatre for Babies” pionier în regiune."
  },
  {
    name: "Mala scena",
    country: "Croația", cc: "hr", city: "Zagreb", founded: 1989,
    form: "Teatru independent",
    focus: "Teatru pentru copii, tineret și familie",
    ages: "3+",
    web: "mala-scena.hr",
    note: "Una dintre cele mai active scene independente croate pentru tineri."
  },

  /* ===================== ROMÂNIA (independente / ONG) ===================== */
  {
    name: "Replika – Centru de Teatru Educațional",
    country: "România", cc: "ro", city: "București", founded: 2015,
    form: "ONG / teatru independent",
    focus: "Teatru educațional și social pentru adolescenți și tineri",
    ages: "14+",
    web: "replika.ro",
    note: "Spectacole pe teme sociale, documentare și ateliere pentru liceeni."
  },
  {
    name: "Ideo Ideis",
    country: "România", cc: "ro", city: "Alexandria", founded: 2006,
    form: "Asociație / festival național",
    focus: "Festival național de teatru tânăr + ateliere",
    ages: "15–19",
    web: "ideoideis.ro",
    note: "Cel mai cunoscut program de teatru pentru adolescenți din România."
  },
  {
    name: "Create.Act.Enjoy",
    country: "România", cc: "ro", city: "Cluj-Napoca", founded: 2011,
    form: "Asociație culturală independentă",
    focus: "Teatru contemporan, educație teatrală, proiecte europene",
    ages: "12+",
    web: "createactenjoy.ro",
    note: "Activă în proiecte Erasmus+ și rețele europene de teatru tânăr."
  }
];

/*
 * Rețele, federații și resurse europene de profil.
 */
window.MYN_NETWORKS = [
  {
    name: "ASSITEJ International",
    scope: "Global / Europa",
    focus: "Asociația Internațională a Teatrului pentru Copii și Tineret",
    web: "assitej-international.org",
    note: "Rețeaua-cadru mondială; secțiuni naționale în majoritatea țărilor europene."
  },
  {
    name: "EDERED",
    scope: "Europa",
    focus: "European Drama Encounters / Rencontres Européennes",
    web: "ederede.org",
    note: "Întâlniri europene de teatru pentru copii și tineri."
  },
  {
    name: "IDEA",
    scope: "Global / Europa",
    focus: "International Drama/Theatre and Education Association",
    web: "ideadrama.org",
    note: "Rețea pentru educația prin teatru și drama aplicată."
  },
  {
    name: "EACEA / Creative Europe",
    scope: "Uniunea Europeană",
    focus: "Program de finanțare pentru cooperare culturală",
    web: "culture.ec.europa.eu",
    note: "Sursă majoră de finanțare pentru proiecte transfrontaliere de teatru tânăr."
  }
];
