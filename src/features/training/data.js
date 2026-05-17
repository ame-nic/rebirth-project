import { C } from "../../shared/design/tokens.js";

export const SESSIONS = [
  {
    id: "A", day: "LUN", dayN: 1, title: "Push", sub: "Petto · Spalle · Tricipiti", color: C.A,
    exercises: [
      { id: "squat",    name: "Squat con Bilanciere",      muscle: "Quadricipiti, Glutei",  sets: 4, reps: "8–10",  kg: 70, unit: "kg" },
      { id: "bench",    name: "Panca Piana Bilanciere",    muscle: "Petto, Tricipiti",       sets: 4, reps: "8–10",  kg: 60, unit: "kg" },
      { id: "ohp",      name: "Overhead Press Bilanciere", muscle: "Deltoide, Tricipiti",    sets: 3, reps: "8–10",  kg: 40, unit: "kg" },
      { id: "lateral",  name: "Alzate Laterali Manubri",   muscle: "Deltoide Laterale",      sets: 3, reps: "12–15", kg: 10, unit: "kg/br" },
      { id: "french",   name: "French Press Manubri",      muscle: "Tricipiti",              sets: 3, reps: "10–12", kg: 12, unit: "kg/br" },
    ],
  },
  {
    id: "B", day: "MER", dayN: 3, title: "Pull", sub: "Schiena · Bicipiti · Core", color: C.B,
    exercises: [
      { id: "deadlift", name: "Stacco con Bilanciere",     muscle: "Catena Posteriore",      sets: 4, reps: "5–6",   kg: 80, unit: "kg" },
      { id: "bentrow",  name: "Rematore con Bilanciere",   muscle: "Dorsali, Romboidi",      sets: 4, reps: "8–10",  kg: 60, unit: "kg" },
      { id: "dbrow",    name: "Rematore con Manubrio",     muscle: "Gran Dorsale",           sets: 3, reps: "10–12", kg: 22, unit: "kg/br" },
      { id: "barcurl",  name: "Curl con Bilanciere",       muscle: "Bicipiti",               sets: 3, reps: "10–12", kg: 30, unit: "kg" },
      { id: "plank",    name: "Plank",                     muscle: "Core, Trasverso",        sets: 3, reps: "50 sec", kg: 0, unit: "bw" },
    ],
  },
  {
    id: "C", day: "VEN", dayN: 5, title: "Gambe + Full Body", sub: "Gambe · Glutei · Braccia", color: C.C,
    exercises: [
      { id: "rdl",     name: "Stacco Rumeno Bilanciere",   muscle: "Ischio-femorali",        sets: 3, reps: "10",    kg: 60, unit: "kg" },
      { id: "bss",     name: "Bulgarian Split Squat",      muscle: "Quadricipiti, Glutei",   sets: 3, reps: "10–12", kg: 14, unit: "kg/br" },
      { id: "dbbench", name: "Panca con Manubri",          muscle: "Petto, Tricipiti",       sets: 3, reps: "10–12", kg: 22, unit: "kg/br" },
      { id: "suprow",  name: "Rematore Supinato",          muscle: "Dorsali, Bicipiti",      sets: 3, reps: "10–12", kg: 20, unit: "kg/br" },
      { id: "hammer",  name: "Curl a Martello",            muscle: "Bicipiti, Brachiorad.",  sets: 3, reps: "12",    kg: 14, unit: "kg/br" },
      { id: "calf",    name: "Calf Raise",                 muscle: "Polpacci",               sets: 4, reps: "15–20", kg: 20, unit: "kg" },
    ],
  },
  {
    id: "D", day: "SAB", dayN: 6, title: "Full Body", sub: "Sessione opzionale sabato", color: C.D,
    exercises: [
      { id: "sq2",  name: "Squat con Bilanciere",          muscle: "Quadricipiti, Glutei",   sets: 3, reps: "8–10",  kg: 72, unit: "kg" },
      { id: "bp2",  name: "Panca con Manubri",             muscle: "Petto, Tricipiti",       sets: 3, reps: "10–12", kg: 22, unit: "kg/br" },
      { id: "br2",  name: "Rematore Bilanciere",           muscle: "Dorsali",                sets: 3, reps: "10",    kg: 62, unit: "kg" },
      { id: "ohp2", name: "Overhead Press Manubri",        muscle: "Deltoide",               sets: 3, reps: "10–12", kg: 18, unit: "kg/br" },
      { id: "curl2",name: "Curl con Manubri",              muscle: "Bicipiti",               sets: 3, reps: "12",    kg: 14, unit: "kg/br" },
    ],
  },
];

export function getTodaySession() {
  const dow = new Date().getDay();
  return SESSIONS.find((s) => s.dayN === dow) || null;
}
