import { C } from "../../shared/design/tokens.js";

/* Exercise variants — same primary muscle group as the parent, comparable
   volume/difficulty, home-gym friendly (barbell + dumbbells + flat bench).
   Defined as module-level constants so Session D can reuse Session A/B/C
   variants by reference without duplication. */

// Session A — Push
const SQUAT_VARIANTS = [
  { id: "squat_v1", name: "Goblet Squat con Manubrio", muscle: "Quadricipiti, Glutei",
    sets: 4, reps: "10–12", kg: 28, unit: "kg",
    tip: "Manubrio tenuto verticale al petto. Ottimo per imparare la profondità corretta." },
  { id: "squat_v2", name: "Squat con Manubri", muscle: "Quadricipiti, Glutei",
    sets: 4, reps: "10–12", kg: 22, unit: "kg/br",
    tip: "Manubri ai lati. Utile se il bilanciere è scomodo sulla schiena." },
  { id: "squat_v3", name: "Bulgarian Split Squat con Manubri", muscle: "Quadricipiti, Glutei",
    sets: 3, reps: "10–12", kg: 14, unit: "kg/br",
    tip: "Piede posteriore sulla panca. Maggiore focus unilaterale. Il più impegnativo dei tre." },
];

const BENCH_VARIANTS = [
  { id: "bench_v1", name: "Panca Piana con Manubri", muscle: "Petto, Tricipiti",
    sets: 4, reps: "10–12", kg: 22, unit: "kg/br",
    tip: "Range of motion più ampio del bilanciere. Stacca i manubri dalla coscia per portarli in posizione." },
  { id: "bench_v2", name: "Panca Inclinata con Manubri", muscle: "Petto Alto, Spalle",
    sets: 4, reps: "10–12", kg: 18, unit: "kg/br",
    tip: "Inclinazione 30–45°. Enfatizza il petto superiore e il deltoide anteriore." },
  { id: "bench_v3", name: "Dips tra due sedie / panca", muscle: "Petto Basso, Tricipiti",
    sets: 4, reps: "max", kg: 0, unit: "bw",
    tip: "Busto leggermente inclinato in avanti per coinvolgere il petto. Vai in profondità con controllo." },
];

const OHP_VARIANTS = [
  { id: "ohp_v1", name: "Overhead Press con Manubri", muscle: "Deltoide, Tricipiti",
    sets: 3, reps: "10–12", kg: 18, unit: "kg/br",
    tip: "Più range of motion del bilanciere. Porta i manubri all'altezza delle orecchie prima di spingere." },
  { id: "ohp_v2", name: "Arnold Press", muscle: "Deltoide (tutti i capi)",
    sets: 3, reps: "10–12", kg: 14, unit: "kg/br",
    tip: "Inizia con i palmi verso di te, ruota verso l'esterno durante la spinta. Copre tutti e tre i capi del deltoide." },
  { id: "ohp_v3", name: "Push Press con Bilanciere", muscle: "Deltoide, Tricipiti, Gambe",
    sets: 3, reps: "6–8", kg: 50, unit: "kg",
    tip: "Leggera flessione delle ginocchia, poi estendi esplosivamente mentre spingi. Permette carichi più alti dell'OHP strict." },
];

const LATERAL_VARIANTS = [
  { id: "lateral_v1", name: "Alzate Laterali seduto", muscle: "Deltoide Laterale",
    sets: 3, reps: "12–15", kg: 8, unit: "kg/br",
    tip: "Seduto sulla panca rimuove il momentum del busto. Più isolamento, peso leggermente inferiore." },
  { id: "lateral_v2", name: "Upright Row con Manubri", muscle: "Deltoide, Trapezio",
    sets: 3, reps: "12–15", kg: 16, unit: "kg",
    tip: "Tira i manubri verso il mento mantenendoli vicini al corpo. Gomiti sempre sopra i polsi." },
];

const FRENCH_VARIANTS = [
  { id: "french_v1", name: "Tricep Kickback con Manubri", muscle: "Tricipiti",
    sets: 3, reps: "12–15", kg: 10, unit: "kg/br",
    tip: "Busto parallelo al suolo, braccio superiore fisso. Estendi completamente il gomito in cima." },
  { id: "french_v2", name: "Skull Crusher con Bilanciere", muscle: "Tricipiti",
    sets: 3, reps: "10–12", kg: 30, unit: "kg",
    tip: "Bilanciere verso la fronte, gomiti fermi. Più carico possibile rispetto ai manubri." },
  { id: "french_v3", name: "Diamond Push-up", muscle: "Tricipiti, Petto",
    sets: 3, reps: "max", kg: 0, unit: "bw",
    tip: "Mani a triangolo sotto il petto. Se troppo facile, piedi su una sedia." },
];

// Session B — Pull
const DEADLIFT_VARIANTS = [
  { id: "deadlift_v1", name: "Stacco Rumeno con Bilanciere", muscle: "Ischio-femorali, Glutei",
    sets: 4, reps: "8–10", kg: 60, unit: "kg",
    tip: "Enfatizza la catena posteriore. Spingi i fianchi indietro, senti lo stretch nei femorali." },
  { id: "deadlift_v2", name: "Stacco Sumo con Bilanciere", muscle: "Glutei, Quadricipiti, Adduttori",
    sets: 4, reps: "5–6", kg: 80, unit: "kg",
    tip: "Piedi larghi, punte fuori. Postura più verticale, maggiore coinvolgimento dei glutei." },
  { id: "deadlift_v3", name: "Stacco con Manubri", muscle: "Catena Posteriore",
    sets: 4, reps: "8–10", kg: 30, unit: "kg/br",
    tip: "Utile se il bilanciere non è disponibile o per variare il pattern di movimento." },
];

const BENTROW_VARIANTS = [
  { id: "bentrow_v1", name: "Rematore con Manubri (bilaterale)", muscle: "Dorsali, Romboidi",
    sets: 4, reps: "10–12", kg: 22, unit: "kg/br",
    tip: "Entrambi i manubri contemporaneamente, busto a 45°. Tira verso l'ombelico." },
  { id: "bentrow_v2", name: "Rematore con Bilanciere (presa supinata)", muscle: "Dorsali, Bicipiti",
    sets: 4, reps: "8–10", kg: 55, unit: "kg",
    tip: "Presa con palmi verso l'alto. Coinvolge di più i bicipiti rispetto alla presa prona." },
  { id: "bentrow_v3", name: "Chest-Supported Row con Manubri", muscle: "Dorsali, Romboidi",
    sets: 4, reps: "10–12", kg: 18, unit: "kg/br",
    tip: "Petto sulla panca inclinata a 45°. Elimina il momentum del busto, massimo isolamento del dorsale." },
];

const DBROW_VARIANTS = [
  { id: "dbrow_v1", name: "Rematore Supinato con Manubrio", muscle: "Gran Dorsale, Bicipiti",
    sets: 3, reps: "10–12", kg: 20, unit: "kg/br",
    tip: "Presa con palmo verso l'alto. Enfatizza il bicipite in aggiunta al gran dorsale." },
  { id: "dbrow_v2", name: "Pullover con Manubrio", muscle: "Gran Dorsale, Dentato",
    sets: 3, reps: "12–15", kg: 18, unit: "kg",
    tip: "Sdraiato sulla panca. Porta il manubrio ad arco sopra la testa e abbassa dietro. Ottimo per allungare il dorsale." },
];

const BARCURL_VARIANTS = [
  { id: "barcurl_v1", name: "Curl con Manubri alternati", muscle: "Bicipiti",
    sets: 3, reps: "10–12", kg: 14, unit: "kg/br",
    tip: "Alterna le braccia. Permette supinazione completa del polso durante il movimento." },
  { id: "barcurl_v2", name: "Curl Inclinato con Manubri", muscle: "Bicipiti",
    sets: 3, reps: "10–12", kg: 10, unit: "kg/br",
    tip: "Panca inclinata a 60°. Stretch massimo del bicipite. Più difficile a parità di peso." },
  { id: "barcurl_v3", name: "Curl Zottman", muscle: "Bicipiti, Brachioradiale",
    sets: 3, reps: "10–12", kg: 12, unit: "kg/br",
    tip: "Salita con presa supinata, discesa con presa pronata. Allena sia i bicipiti che i brachioradiali." },
];

const PLANK_VARIANTS = [
  { id: "plank_v1", name: "Dead Bug", muscle: "Core Profondo, Trasverso",
    sets: 3, reps: "10 per lato", kg: 0, unit: "bw",
    tip: "Schiena lombare incollata al suolo durante tutto il movimento. Lento e controllato." },
  { id: "plank_v2", name: "Hollow Hold", muscle: "Core, Addominali",
    sets: 3, reps: "30–45 sec", kg: 0, unit: "bw",
    tip: "Schiena a terra, arti sollevati. Più difficile del plank standard se eseguito correttamente." },
  { id: "plank_v3", name: "Plank con estensione alternata", muscle: "Core, Stabilizzatori",
    sets: 3, reps: "10 per lato", kg: 0, unit: "bw",
    tip: "Dall'appoggio sul plank, estendi braccio e gamba opposti simultaneamente. Mantieni i fianchi stabili." },
];

// Session C — Legs + Full Body
const RDL_VARIANTS = [
  { id: "rdl_v1", name: "Stacco Rumeno con Manubri", muscle: "Ischio-femorali, Glutei",
    sets: 3, reps: "10–12", kg: 22, unit: "kg/br",
    tip: "Identico al bilanciere ma con manubri. Più range of motion, utile per variare." },
  { id: "rdl_v2", name: "Good Morning con Bilanciere", muscle: "Ischio-femorali, Erettori",
    sets: 3, reps: "10–12", kg: 40, unit: "kg",
    tip: "Bilanciere sulla schiena, inclinati in avanti mantenendo le ginocchia leggermente flesse. Ottimo per gli erettori spinali." },
  { id: "rdl_v3", name: "Single-Leg RDL con Manubrio", muscle: "Ischio-femorali, Glutei, Equilibrio",
    sets: 3, reps: "10 per lato", kg: 16, unit: "kg",
    tip: "Un manubrio nella mano opposta alla gamba di supporto. Allena anche la stabilità dell'anca." },
];

const BSS_VARIANTS = [
  { id: "bss_v1", name: "Affondi con Manubri (camminando)", muscle: "Quadricipiti, Glutei",
    sets: 3, reps: "12 per lato", kg: 14, unit: "kg/br",
    tip: "Passo lungo in avanti, ginocchio posteriore sfiora il suolo. Busto eretto." },
  { id: "bss_v2", name: "Step-up su panca con Manubri", muscle: "Quadricipiti, Glutei",
    sets: 3, reps: "10–12 per lato", kg: 14, unit: "kg/br",
    tip: "Sali sulla panca con il piede intero. Spingi dal tallone. Evita di spingere col piede a terra." },
  { id: "bss_v3", name: "Sissy Squat (corpo libero)", muscle: "Quadricipiti (isolamento)",
    sets: 3, reps: "10–15", kg: 0, unit: "bw",
    tip: "Talloni sollevati, inclina il corpo indietro mentre scendi. Lavora il quadricipite in modo unico." },
];

const DBBENCH_VARIANTS = [
  { id: "dbbench_v1", name: "Panca Piana con Bilanciere", muscle: "Petto, Tricipiti",
    sets: 3, reps: "8–10", kg: 60, unit: "kg",
    tip: "Torna al bilanciere per massimizzare il carico. Riscaldamento con 2 serie leggere." },
  { id: "dbbench_v2", name: "Panca Inclinata con Manubri", muscle: "Petto Alto, Deltoide Ant.",
    sets: 3, reps: "10–12", kg: 18, unit: "kg/br",
    tip: "Panca a 30–45°. Coinvolge maggiormente il petto superiore." },
  { id: "dbbench_v3", name: "Flyes con Manubri", muscle: "Petto (focus stretch)",
    sets: 3, reps: "12–15", kg: 12, unit: "kg/br",
    tip: "Arco ampio, gomiti leggermente flessi. Senti lo stretch al petto nella fase di discesa." },
];

const SUPROW_VARIANTS = [
  { id: "suprow_v1", name: "Rematore con Bilanciere (presa supinata)", muscle: "Dorsali, Bicipiti",
    sets: 3, reps: "8–10", kg: 55, unit: "kg",
    tip: "Più carico possibile rispetto ai manubri. Busto a 45°, tira verso l'ombelico." },
  { id: "suprow_v2", name: "Pullover con Manubrio", muscle: "Gran Dorsale, Serratus",
    sets: 3, reps: "12–15", kg: 18, unit: "kg",
    tip: "Sdraiato sulla panca, ampio arco di movimento. Allunga il dorsale sotto carico." },
];

const HAMMER_VARIANTS = [
  { id: "hammer_v1", name: "Curl a Martello alternato", muscle: "Bicipiti, Brachioradiale",
    sets: 3, reps: "12 per lato", kg: 14, unit: "kg/br",
    tip: "Stessa esecuzione ma alternando le braccia. Permette più concentrazione su ogni braccio." },
  { id: "hammer_v2", name: "Curl Zottman", muscle: "Bicipiti, Brachioradiale",
    sets: 3, reps: "10–12", kg: 12, unit: "kg/br",
    tip: "Salita supinata, discesa pronata. Allena sia i bicipiti che i brachioradiali in un solo esercizio." },
  { id: "hammer_v3", name: "Curl con Bilanciere (presa stretta)", muscle: "Bicipiti",
    sets: 3, reps: "10–12", kg: 28, unit: "kg",
    tip: "Presa a larghezza spalle. Più carico totale rispetto ai manubri." },
];

const CALF_VARIANTS = [
  { id: "calf_v1", name: "Calf Raise su gradino (mono)", muscle: "Gastrocnemio, Soleo",
    sets: 4, reps: "15–20 per lato", kg: 0, unit: "bw",
    tip: "Un piede solo su un gradino. ROM completo scendendo sotto il livello del gradino. Più intenso del bilaterale." },
  { id: "calf_v2", name: "Seated Calf Raise (manubrio su coscia)", muscle: "Soleo (focus)",
    sets: 4, reps: "15–20", kg: 20, unit: "kg",
    tip: "Seduto con manubrio sulla coscia. Ginocchio a 90° colpisce il soleo, spesso trascurato." },
];

export const SESSIONS = [
  {
    id: "A", day: "LUN", dayN: 1, title: "Push", sub: "Petto · Spalle · Tricipiti", color: C.A,
    exercises: [
      { id: "squat",    name: "Squat con Bilanciere",      muscle: "Quadricipiti, Glutei",  sets: 4, reps: "8–10",  kg: 70, unit: "kg",    variants: SQUAT_VARIANTS },
      { id: "bench",    name: "Panca Piana Bilanciere",    muscle: "Petto, Tricipiti",       sets: 4, reps: "8–10",  kg: 60, unit: "kg",    variants: BENCH_VARIANTS },
      { id: "ohp",      name: "Overhead Press Bilanciere", muscle: "Deltoide, Tricipiti",    sets: 3, reps: "8–10",  kg: 40, unit: "kg",    variants: OHP_VARIANTS },
      { id: "lateral",  name: "Alzate Laterali Manubri",   muscle: "Deltoide Laterale",      sets: 3, reps: "12–15", kg: 10, unit: "kg/br", variants: LATERAL_VARIANTS },
      { id: "french",   name: "French Press Manubri",      muscle: "Tricipiti",              sets: 3, reps: "10–12", kg: 12, unit: "kg/br", variants: FRENCH_VARIANTS },
    ],
  },
  {
    id: "B", day: "MER", dayN: 3, title: "Pull", sub: "Schiena · Bicipiti · Core", color: C.B,
    exercises: [
      { id: "deadlift", name: "Stacco con Bilanciere",     muscle: "Catena Posteriore",      sets: 4, reps: "5–6",   kg: 80, unit: "kg",    variants: DEADLIFT_VARIANTS },
      { id: "bentrow",  name: "Rematore con Bilanciere",   muscle: "Dorsali, Romboidi",      sets: 4, reps: "8–10",  kg: 60, unit: "kg",    variants: BENTROW_VARIANTS },
      { id: "dbrow",    name: "Rematore con Manubrio",     muscle: "Gran Dorsale",           sets: 3, reps: "10–12", kg: 22, unit: "kg/br", variants: DBROW_VARIANTS },
      { id: "barcurl",  name: "Curl con Bilanciere",       muscle: "Bicipiti",               sets: 3, reps: "10–12", kg: 30, unit: "kg",    variants: BARCURL_VARIANTS },
      { id: "plank",    name: "Plank",                     muscle: "Core, Trasverso",        sets: 3, reps: "50 sec", kg: 0, unit: "bw",    variants: PLANK_VARIANTS },
    ],
  },
  {
    id: "C", day: "VEN", dayN: 5, title: "Gambe + Full Body", sub: "Gambe · Glutei · Braccia", color: C.C,
    exercises: [
      { id: "rdl",     name: "Stacco Rumeno Bilanciere",   muscle: "Ischio-femorali",        sets: 3, reps: "10",    kg: 60, unit: "kg",    variants: RDL_VARIANTS },
      { id: "bss",     name: "Bulgarian Split Squat",      muscle: "Quadricipiti, Glutei",   sets: 3, reps: "10–12", kg: 14, unit: "kg/br", variants: BSS_VARIANTS },
      { id: "dbbench", name: "Panca con Manubri",          muscle: "Petto, Tricipiti",       sets: 3, reps: "10–12", kg: 22, unit: "kg/br", variants: DBBENCH_VARIANTS },
      { id: "suprow",  name: "Rematore Supinato",          muscle: "Dorsali, Bicipiti",      sets: 3, reps: "10–12", kg: 20, unit: "kg/br", variants: SUPROW_VARIANTS },
      { id: "hammer",  name: "Curl a Martello",            muscle: "Bicipiti, Brachiorad.",  sets: 3, reps: "12",    kg: 14, unit: "kg/br", variants: HAMMER_VARIANTS },
      { id: "calf",    name: "Calf Raise",                 muscle: "Polpacci",               sets: 4, reps: "15–20", kg: 20, unit: "kg",    variants: CALF_VARIANTS },
    ],
  },
  {
    id: "D", day: "SAB", dayN: 6, title: "Full Body", sub: "Sessione opzionale sabato", color: C.D,
    exercises: [
      { id: "sq2",  name: "Squat con Bilanciere",          muscle: "Quadricipiti, Glutei",   sets: 3, reps: "8–10",  kg: 72, unit: "kg",    variants: SQUAT_VARIANTS },
      { id: "bp2",  name: "Panca con Manubri",             muscle: "Petto, Tricipiti",       sets: 3, reps: "10–12", kg: 22, unit: "kg/br", variants: DBBENCH_VARIANTS },
      { id: "br2",  name: "Rematore Bilanciere",           muscle: "Dorsali",                sets: 3, reps: "10",    kg: 62, unit: "kg",    variants: BENTROW_VARIANTS },
      { id: "ohp2", name: "Overhead Press Manubri",        muscle: "Deltoide",               sets: 3, reps: "10–12", kg: 18, unit: "kg/br", variants: OHP_VARIANTS },
      { id: "curl2",name: "Curl con Manubri",              muscle: "Bicipiti",               sets: 3, reps: "12",    kg: 14, unit: "kg/br", variants: BARCURL_VARIANTS },
    ],
  },
];

export function getTodaySession() {
  const dow = new Date().getDay();
  return SESSIONS.find((s) => s.dayN === dow) || null;
}
