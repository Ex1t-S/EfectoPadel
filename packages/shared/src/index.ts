export const PADEL_CATEGORIES = [
  "1ra",
  "2da",
  "3ra",
  "4ta",
  "5ta",
  "6ta",
  "7ma",
  "8va"
] as const;

export type PadelCategory = (typeof PADEL_CATEGORIES)[number];
export type UserRole = "player" | "admin" | "owner";
export type ReservationStatus = "hold" | "confirmed" | "cancelled" | "expired";
export type PaymentStatus = "pending" | "approved" | "rejected" | "refunded";
export type ChallengeStatus = "pending" | "accepted" | "declined" | "reported" | "confirmed" | "disputed";
export type TournamentStatus = "draft" | "open" | "closed" | "in_progress" | "finished";

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  category: PadelCategory;
  role: UserRole;
  elo: number;
  createdAt: string;
}

export interface Court {
  id: string;
  name: string;
  active: boolean;
  slotMinutes: number;
  priceCents: number;
  depositCents: number;
}

export interface TimeSlot {
  id: string;
  courtId: string;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  depositCents: number;
  available: boolean;
}

export interface Reservation {
  id: string;
  courtId: string;
  userId: string;
  startsAt: string;
  endsAt: string;
  status: ReservationStatus;
  holdExpiresAt: string | null;
  paymentId: string | null;
}

export interface Challenge {
  id: string;
  challengerId: string;
  opponentId: string;
  category: PadelCategory;
  status: ChallengeStatus;
  winnerId: string | null;
  playedAt: string | null;
}

export interface Tournament {
  id: string;
  title: string;
  category: PadelCategory;
  startsAt: string;
  status: TournamentStatus;
  maxTeams: number;
  description: string;
}

export interface ApiEnvelope<T> {
  data: T;
}

export const DEFAULT_ELO = 1000;
export const HOLD_MINUTES = 10;

export function isPadelCategory(value: string): value is PadelCategory {
  return (PADEL_CATEGORIES as readonly string[]).includes(value);
}

export function calculateElo(
  winnerElo: number,
  loserElo: number,
  kFactor = 32
): { winner: number; loser: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

  return {
    winner: Math.round(winnerElo + kFactor * (1 - expectedWinner)),
    loser: Math.round(loserElo + kFactor * (0 - expectedLoser))
  };
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function formatMoney(cents: number, currency = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(cents / 100);
}
