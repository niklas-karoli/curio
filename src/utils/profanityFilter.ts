// Eine einfache Liste von Begriffen, die blockiert werden sollen.
// Diese Liste kann später einfach erweitert werden.
const blacklist = [
  "arsch",
  "arschloch",
  "ficker",
  "hure",
  "hurensohn",
  "miststück",
  "nazi",
  "hitler",
  "wichser",
  "schlampe",
  "penis",
  "vagina",
  "fotze",
  "idiot",
  "depp"
];

export const isProfane = (name: string): boolean => {
  const normalized = name.toLowerCase().trim();
  return blacklist.some(badWord => normalized.includes(badWord));
};
