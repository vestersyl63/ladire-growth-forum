// Unique human-friendly references for orders/payments/bookings etc.

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function randomToken(len: number): string {
  let out = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

export function generateVoteReference(): string {
  // LADIRE-VOTE-2026-XXXXXX
  return `LADIRE-VOTE-2026-${randomToken(6)}`;
}

export function generateBookingReference(): string {
  return `LADIRE-BOOK-${randomToken(6)}`;
}

export function generateRegistrationReference(): string {
  return `LADIRE-REG-${randomToken(6)}`;
}

export function generateVacationBookingReference(): string {
  return `LADIRE-VAC-${randomToken(6)}`;
}

export function generateMemberReference(): string {
  return `LADIRE-MEM-${randomToken(6)}`;
}

export function generateUploadName(ext: string): string {
  return `${randomToken(24).toLowerCase()}${ext ? `.${ext}` : ""}`;
}
