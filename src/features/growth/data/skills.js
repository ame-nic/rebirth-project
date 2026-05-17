import { C } from "../../../shared/design/tokens.js";

export const SKILL_LEVELS = {
  1: { label: "Principiante", color: C.txtMute, desc: "Concetti base, ho letto la documentazione." },
  2: { label: "Base",         color: C.B,       desc: "Uso in contesti guidati, ho fatto tutorial." },
  3: { label: "Intermedio",   color: C.gold,    desc: "Uso autonomo in progetti reali." },
  4: { label: "Avanzato",     color: C.C,       desc: "Design e architettura, posso fare mentoring." },
  5: { label: "Esperto",      color: C.sport,   desc: "Deep expertise, contribuisco alla comunità." },
};

export const SKILL_CATEGORIES = {
  technical:    { label: "Tecnico",       order: 0 },
  ai:           { label: "AI",            order: 1 },
  architecture: { label: "Architettura",  order: 2 },
  management:   { label: "Management",    order: 3 },
  language:     { label: "Lingue",        order: 4 },
  domain:       { label: "Dominio",       order: 5 },
  soft:         { label: "Soft skill",    order: 6 },
};

export const BOOK_STATUS = {
  reading:      { label: "In lettura",       color: C.A },
  read:         { label: "Letti",            color: C.C },
  want_to_read: { label: "Da leggere",       color: C.B },
  abandoned:    { label: "Abbandonati",      color: C.txtMute },
};

export const BOOK_STATUS_ORDER = ["reading", "want_to_read", "read", "abandoned"];

export const COURSE_STATUS = {
  in_progress: { label: "In corso",    color: C.A },
  planned:     { label: "In programma", color: C.B },
  completed:   { label: "Completato",  color: C.C },
  paused:      { label: "In pausa",    color: C.txtMute },
};

export const COURSE_STATUS_ORDER = ["in_progress", "planned", "completed", "paused"];

export const COURSE_TYPE_LABEL = {
  corso:           "Corso",
  certificazione:  "Certificazione",
  conferenza:      "Conferenza",
  workshop:        "Workshop",
};
