import { randomInt } from "node:crypto";
const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function newPetCode() {
  return "M-" + Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join("");
}
