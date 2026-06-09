// ============================================================
// data.js – Kincsvadász játék adatai
// ============================================================
// Ide kerülnek az összes küldetés, átok, kincs és kép adatai.
// Bővítsd szabadon – csak kövesd az objektum struktúrákat.
// ============================================================

// ─── KÜLDETÉSEK ─────────────────────────────────────────────
const missions = [
  {
    id: "mission_001",
    title: "🌲 A bozót próbája",
    description: "Keressetek egy furcsa alakú ágat, és nevezzétek ki közös ereklyének. Mindenki érintse meg és mondjon rá egy mondatot.",
    reward: "3 zseton"
  },
  {
    id: "mission_002",
    title: "🦉 Az éjjeli tanú",
    description: "Állj csendben 60 másodpercig, és számolj meg minden hangot, amit hallasz az erdőből. A végén mondd el hangosan a listát.",
    reward: "2 zseton + 1 extra húzás"
  },
  {
    id: "mission_003",
    title: "🔦 Árnyéktánc",
    description: "Alkossatok csoportos árnyékfigurát egy zseblámpa fényével. Valakinek fotózni kell az árnyékot.",
    reward: "4 zseton"
  },
  {
    id: "mission_004",
    title: "🌙 Holdimádó",
    description: "Keressétek meg az égen a holdat (vagy ha borús, a felhők mögötti fényessége felé mutassatok), és mondjatok egy közös esküt.",
    reward: "2 zseton"
  },
  {
    id: "mission_005",
    title: "🍄 Erdei nyom",
    description: "Találjatok egy olyan nyomot az erdőben (mélyedés, eltört ág, állati kaparás), ami emberi kéz nélkül keletkezett. Dokumentáljátok.",
    reward: "5 zseton"
  },
  {
    id: "mission_006",
    title: "🪵 Titkos kód",
    description: "Írjatok egy titkos üzenetet kővel vagy ággal a talajra. Az üzenet legalább 5 szó legyen, és a csapat egyik tagjára vonatkozzon.",
    reward: "3 zseton"
  },
  {
    id: "mission_007",
    title: "🌿 A leghangosabb csend",
    description: "Mindenki egyszerre suttogja el a nevét, majd pontosan 10 másodpercig senki sem szólal meg. Ha valaki megszólal, elölről kell kezdeni.",
    reward: "2 zseton"
  },
  {
    id: "mission_008",
    title: "⭐ Csillagász",
    description: "Mutassatok rá legalább 3 csillagra és adjatok nekik saját nevet. A nevek maradnak a csoport mitológiájában.",
    reward: "3 zseton + legendás húzás"
  },
  {
    id: "mission_009",
    title: "👑 A Farkas-domb szelleme",
    description: "Valaki a csapatból egyedül megy fel a Farkas-domb csúcsára, hangosan kiáltja a nevét háromszor, majd visszatér és elmond valamit, amit csak ott fent látott vagy érzett. Ha a többiek elhiszik, hogy tényleg fent volt és átélte – a jutalom jár.",
    reward: "100000 zseton"
  }
];

// ─── ÁTKOK ──────────────────────────────────────────────────
const curses = [
  {
    id: "curse_001",
    title: "🤫 A csend átka",
    description: "A csapat következő 3 percben csak suttogva kommunikálhat. Aki hangosan szól, az csapatnak 1 zsetont veszít.",
    unlock: "Az átok feloldódik, ha a csapat közösen kimond egy erdei esküt."
  },
  {
    id: "curse_002",
    title: "🙈 A vakság átka",
    description: "Az átok hordozója a következő küldetés alatt csak 30 másodpercig használhatja a zseblámpáját.",
    unlock: "Feloldás: valaki átadja a saját zseblámpáját önként."
  },
  {
    id: "curse_003",
    title: "🦶 A lassúság átka",
    description: "Az átok hordozója csak feleannyis lépésekben mehet előre, mint mások – tíz lépésenként meg kell állnia.",
    unlock: "Feloldás: a csapat 10 lépés előnyt ad az érintettnek."
  },
  {
    id: "curse_004",
    title: "🔄 A visszafelé átka",
    description: "Az átok hordozója minden mondatát visszafelé kell befejezze – az utolsó szót kell először kimondani.",
    unlock: "Feloldás: ha valaki 30 másodpercig nem neveti el magát."
  },
  {
    id: "curse_005",
    title: "👻 A szellem átka",
    description: "Az átok hordozója nem szólítható nevén – mindenki csak \"a szellem\"-ként hivatkozhat rá a következő 5 percben.",
    unlock: "Feloldás: \"A szellem\" kétszer megijeszti a csapat egyik tagját."
  },
  {
    id: "curse_006",
    title: "🌀 A körök átka",
    description: "A csapat következő döntését (pl. merre mennek) kizárólag körbe-forgással kell meghatározni. Mindenki forog, aki hamarabb áll meg, az dönt.",
    unlock: "Automatikusan feloldódik a döntés után."
  },
  {
    id: "curse_007",
    title: "🐢 A teknős átka",
    description: "Az átok hordozója a következő 5 percben csak lassan, \"teknősmódra\" haladhat – kézzel-lábbal négykézláb.",
    unlock: "Feloldás: valaki átviszi a hátán legalább 5 lépésen."
  }
];

// ─── KINCSEK ────────────────────────────────────────────────
const treasures = [
  {
    id: "treasure_001",
    name: "🪙 Rozsdás zseton",
    effect: "Nincs különleges hatás, de megtaláltad – ez is számít.",
    value: "1 zseton"
  },
  {
    id: "treasure_002",
    name: "💎 Kristályszilánk",
    effect: "Csillog a holdfényben. A csapat büszkén mutogathatja.",
    value: "3 zseton"
  },
  {
    id: "treasure_003",
    name: "🗝️ Titokzatos kulcs",
    effect: "Felold egy véletlenszerű aktív átkot azonnal.",
    value: "3 zseton"
  },
  {
    id: "treasure_004",
    name: "📜 Ősrégi térkép",
    effect: "Következő húzásnál 2 lapot húzhatsz, és te választod melyiket tartod meg.",
    value: "2 zseton"
  },
  {
    id: "treasure_005",
    name: "🌟 Hulló csillag cserepje",
    effect: "Egy kívánságot teljesíthet a játékvezető – ha elég merész.",
    value: "5 zseton"
  },
  {
    id: "treasure_006",
    name: "🍀 Négylevelű lóhere",
    effect: "A következő küldetésed automatikusan teljesítettnek számít.",
    value: "4 zseton"
  },
  {
    id: "treasure_007",
    name: "🧿 Kék szem amulett",
    effect: "Megvéd a következő átok hatásától – az átok kártya visszakerül a pakliба.",
    value: "3 zseton"
  },
  {
    id: "treasure_008",
    name: "🔮 Homályos kristálygömb",
    effect: "Feltehetsz egy igen/nem kérdést a játékvezetőnek, aki köteles őszintén válaszolni.",
    value: "2 zseton"
  }
];

// ─── KARAKTEREK ─────────────────────────────────────────────
const characters = [
  {
    id: "role_felfedező",
    name: "🧭 Felfedező",
    description: "A távolságok nem riasztják, mindig talál új ösvényt.",
    abilities: [
      { id: "a1", name: "Dupla lépés",   description: "Egyszer húzhatsz 2 küldetést egyszerre – kiválasztod melyiket tartod meg." },
      { id: "a2", name: "Rövidített út", description: "Egy aktív küldetésedet automatikusan teljesítettnek nyilváníthatod – jutalom nélkül, de pontszámmal." }
    ]
  },
  {
    id: "role_kereskedő",
    name: "💰 Kereskedő",
    description: "Mindig tud alkudni – számára a zseton a hatalom.",
    abilities: [
      { id: "a1", name: "Kincscsere",  description: "Egy kincset visszaadhatod és helyette húzhatsz egy újat." },
      { id: "a2", name: "Félárú bolt", description: "Egyszer a boltban bármit megvehetsz fél áron (lefelé kerekítve)." }
    ]
  },
  {
    id: "role_harcos",
    name: "⚔️ Harcos",
    description: "Erős és elszánt – az átkok nem félemlítik meg.",
    abilities: [
      { id: "a1", name: "Átokpajzs", description: "Egyszer automatikusan semlegesítheted a következő húzott átkot." },
      { id: "a2", name: "Bosszú",    description: "Minden deaktiválásnál +1 extra zsetont kapsz jutalmul." }
    ]
  },
  {
    id: "role_kém",
    name: "🕵️ Kém",
    description: "Mindenkit megfigyel – tudja, ki kit rejteget.",
    abilities: [
      { id: "a1", name: "Leleplezés",  description: "Egyszer ingyen módosíthatod az imposztorjelölésedet (bolt nélkül)." },
      { id: "a2", name: "Kémjelentés", description: "Ha a játék végén az imposztor-tippjeid legalább 50%-a helyes, +3 bónusz zsetont kapsz." }
    ]
  },
  {
    id: "role_varázsló",
    name: "🔮 Varázsló",
    description: "A véletlent is meg tudja hajlítani akaratával.",
    abilities: [
      { id: "a1", name: "Kártyacsere",    description: "Egyszer bármely húzott kártyádat visszadhatod és újrahúzhatsz." },
      { id: "a2", name: "Szerencsebűbáj", description: "Egyszer húzhatsz 2 képet egyszerre – mindkettőt megtarthatod." }
    ]
  },
  {
    id: "role_csalivetető",
    name: "🃏 Csalivetető",
    description: "Megtéveszt, megzavar – soha nem tudod mit lép következőnek.",
    abilities: [
      { id: "a1", name: "Átokvisszadobás", description: "Egyszer egy aktív átkot visszaadhatsz a paklinak – mintha soha nem húztad volna." },
      { id: "a2", name: "Álca",            description: "Egyszer elrejthetsz egy kincset a táskádban – más játékosok nem láthatják azt az elemet." }
    ]
  }
];

// ─── KÉPEK (FOTÓK) ──────────────────────────────────────────
// Ritkaság szintek: "common" | "rare" | "legendary"
// A képfájlokat tedd a megfelelő mappákba:
//   images/photos/common/common_01.jpg  ...  common_25.jpg
//   images/photos/rare/rare_01.jpg  ...  rare_10.jpg
//   images/photos/legendary/legendary_01.jpg  ...  legendary_05.jpg
const photos = [
  // ── COMMON (közönséges) – 25 db ──
  {
    id: "photo_001",
    name: "Bigfoot árnyéka",
    rarity: "common",
    src: "images/photos/common/common_01.jpg",
    description: "Homályos alak a fák között."
  },
  {
    id: "photo_002",
    name: "Éjjeli bagoly",
    rarity: "common",
    src: "images/photos/common/common_02.jpg",
    description: "Valami figyel a sötétből."
  },
  {
    id: "photo_003",
    name: "Furcsa gomba",
    rarity: "common",
    src: "images/photos/common/common_03.jpg",
    description: "Ez a gomba mintha mozogna."
  },
  {
    id: "photo_004",
    name: "Ismeretlen nyom",
    rarity: "common",
    src: "images/photos/common/common_04.jpg",
    description: "Valami nagy állatot jelezhet."
  },
  {
    id: "photo_005",
    name: "Elhagyott tábortűz",
    rarity: "common",
    src: "images/photos/common/common_05.jpg",
    description: "Ki ülhetett itt korábban?"
  },
  {
    id: "photo_006",
    name: "Törött ág",
    rarity: "common",
    src: "images/photos/common/common_06.jpg",
    description: "Emberi kéz törte, vagy valami más?"
  },
  {
    id: "photo_007",
    name: "Fénylő bogár",
    rarity: "common",
    src: "images/photos/common/common_07.jpg",
    description: "Sötétben is látszik a fénye."
  },
  {
    id: "photo_008",
    name: "Cserlevelű minta",
    rarity: "common",
    src: "images/photos/common/common_08.jpg",
    description: "A természet geometriája."
  },
  {
    id: "photo_009",
    name: "Éjjeli pók",
    rarity: "common",
    src: "images/photos/common/common_09.jpg",
    description: "Hálójában a hold tükröződik."
  },
  {
    id: "photo_010",
    name: "Vizes kő",
    rarity: "common",
    src: "images/photos/common/common_10.jpg",
    description: "A patak kövei simák és hidegek."
  },
  {
    id: "photo_011",
    name: "Fa gyökerei",
    rarity: "common",
    src: "images/photos/common/common_11.jpg",
    description: "A föld alatt rejtett világ."
  },
  {
    id: "photo_012",
    name: "Harmat a fűszálon",
    rarity: "common",
    src: "images/photos/common/common_12.jpg",
    description: "Apró tükrök az éjszakában."
  },
  {
    id: "photo_013",
    name: "Korhadó tuskó",
    rarity: "common",
    src: "images/photos/common/common_13.jpg",
    description: "Élet fakad a halálból."
  },
  {
    id: "photo_014",
    name: "Madárfészek",
    rarity: "common",
    src: "images/photos/common/common_14.jpg",
    description: "Üres, de nemrég lakott volt."
  },
  {
    id: "photo_015",
    name: "Esti köd",
    rarity: "common",
    src: "images/photos/common/common_15.jpg",
    description: "A köd mindent eltakar."
  },
  {
    id: "photo_016",
    name: "Mohás szikla",
    rarity: "common",
    src: "images/photos/common/common_16.jpg",
    description: "Évszázados csend."
  },
  {
    id: "photo_017",
    name: "Kéreg mintázata",
    rarity: "common",
    src: "images/photos/common/common_17.jpg",
    description: "A fa élettörténete."
  },
  {
    id: "photo_018",
    name: "Éjjeli virág",
    rarity: "common",
    src: "images/photos/common/common_18.jpg",
    description: "Csak éjjel nyílik ki."
  },
  {
    id: "photo_019",
    name: "Csikorgó ág",
    rarity: "common",
    src: "images/photos/common/common_19.jpg",
    description: "Hallani a nyikorgást."
  },
  {
    id: "photo_020",
    name: "Mókus odú",
    rarity: "common",
    src: "images/photos/common/common_20.jpg",
    description: "Valaki otthon van."
  },
  {
    id: "photo_021",
    name: "Holdárnyék",
    rarity: "common",
    src: "images/photos/common/common_21.jpg",
    description: "A hold fénye furcsa árnyékokat vet."
  },
  {
    id: "photo_022",
    name: "Zuzmó portréja",
    rarity: "common",
    src: "images/photos/common/common_22.jpg",
    description: "Leglassabb élőlény az erdőben."
  },
  {
    id: "photo_023",
    name: "Éjjeli rovar",
    rarity: "common",
    src: "images/photos/common/common_23.jpg",
    description: "Aprócska lény, hatalmas tekintet."
  },
  {
    id: "photo_024",
    name: "Vízcseppek kőn",
    rarity: "common",
    src: "images/photos/common/common_24.jpg",
    description: "Az eső emlékei."
  },
  {
    id: "photo_025",
    name: "Sötét ösvény",
    rarity: "common",
    src: "images/photos/common/common_25.jpg",
    description: "Hova vezet?"
  },

  // ── RARE (ritka) – 10 db ──
  {
    id: "photo_026",
    name: "Lidércfény",
    rarity: "rare",
    src: "images/photos/rare/rare_01.jpg",
    description: "Kékes fény lebeg a mocsár felett."
  },
  {
    id: "photo_027",
    name: "Fehér szarvas nyoma",
    rarity: "rare",
    src: "images/photos/rare/rare_02.jpg",
    description: "A fehér szarvas látása szerencsét hoz."
  },
  {
    id: "photo_028",
    name: "Rovásos fa",
    rarity: "rare",
    src: "images/photos/rare/rare_03.jpg",
    description: "Ismeretlen jelek a kérgen."
  },
  {
    id: "photo_029",
    name: "Kettős hold",
    rarity: "rare",
    src: "images/photos/rare/rare_04.jpg",
    description: "Vízben tükröződő hold."
  },
  {
    id: "photo_030",
    name: "Tűzsalamandra",
    rarity: "rare",
    src: "images/photos/rare/rare_05.jpg",
    description: "Az erdő titkos őre."
  },
  {
    id: "photo_031",
    name: "Ősfa gyökérhálója",
    rarity: "rare",
    src: "images/photos/rare/rare_06.jpg",
    description: "Kapcsolódó életfonalak a föld alatt."
  },
  {
    id: "photo_032",
    name: "Éjjeli pillangó",
    rarity: "rare",
    src: "images/photos/rare/rare_07.jpg",
    description: "Fekete szárnyakon holdfény."
  },
  {
    id: "photo_033",
    name: "Füstös hajnal",
    rarity: "rare",
    src: "images/photos/rare/rare_08.jpg",
    description: "A hajnal néhány pillanatra vöröset mutat."
  },
  {
    id: "photo_034",
    name: "Kő körök",
    rarity: "rare",
    src: "images/photos/rare/rare_09.jpg",
    description: "Valaki szimmetrikusan rakta le őket."
  },
  {
    id: "photo_035",
    name: "Foszforeszkáló gomba",
    rarity: "rare",
    src: "images/photos/rare/rare_10.jpg",
    description: "Sötétben világít."
  },

  // ── LEGENDARY (legendás) – 5 db ──
  {
    id: "photo_036",
    name: "Az Erdő Szelleme",
    rarity: "legendary",
    src: "images/photos/legendary/legendary_01.jpg",
    description: "Csak egyszer látja meg valaki életében."
  },
  {
    id: "photo_037",
    name: "Időkapú",
    rarity: "legendary",
    src: "images/photos/legendary/legendary_02.jpg",
    description: "A fák közötti fényes résben más világ látszik."
  },
  {
    id: "photo_038",
    name: "Az utolsó tündér",
    rarity: "legendary",
    src: "images/photos/legendary/legendary_03.jpg",
    description: "Évszázadok óta nem látták."
  },
  {
    id: "photo_039",
    name: "Örök fa",
    rarity: "legendary",
    src: "images/photos/legendary/legendary_04.jpg",
    description: "Ez a fa nem öregszik."
  },
  {
    id: "photo_040",
    name: "Éjféli szarvas",
    rarity: "legendary",
    src: "images/photos/legendary/legendary_05.jpg",
    description: "Agancsain csillagok égnek."
  }
];
