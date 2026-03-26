import type { ReactNode } from 'react';

export type Screen = 'navigation' | 'boarding' | 'timeline' | 'waiting' | 'transfer';

export interface QuickStat {
  label: string;
  value: string;
  subvalue?: string;
}

export interface PoiItem {
  id: string;
  category: 'coffee' | 'restroom' | 'shopping' | 'charging' | 'assistance';
  name: string;
  distanceLabel: string;
}

export interface NavigationData {
  hubName: string;
  destinationGate: string;
  transferSummary: string;
  timeLeftLabel: string;
  distanceLabel: string;
  boardingStartsIn: string;
  turnInstruction: string;
  floorHint: string;
  mapImageUrl: string;
  assistanceLabel: string;
  pois: PoiItem[];
}

export interface BoardingData {
  urgencyLabel: string;
  title: string;
  subtitle: string;
  fromCode: string;
  toCode: string;
  gate: string;
  gateHint: string;
  seat: string;
  seatHint: string;
  passengerName: string;
  group: string;
  qrPayload: string;
  qrHint: string;
  craftName: string;
  craftDescription: string;
  craftImageUrl: string;
  walletLabel: string;
}

export interface TimelineStep {
  id: string;
  title: string;
  time: string;
  description: string;
  icon: 'arrival' | 'navigation' | 'checkin' | 'boarding';
  status?: string;
  progress?: number;
  active?: boolean;
  done?: boolean;
}

export interface TimelineData {
  hubName: string;
  journeyStatus: string;
  efficiency: QuickStat;
  latency: QuickStat;
  transitTime: QuickStat;
  currentPositionTitle: string;
  currentPositionImageUrl: string;
  mapCtaLabel: string;
  steps: TimelineStep[];
}

export interface LoungeService {
  id: string;
  type: 'coffee' | 'rest' | 'wifi' | 'concierge';
  title: string;
  description: string;
  tag: string;
  ctaLabel?: string;
  etaLabel?: string;
  imageUrl?: string;
}

export interface LiveUpdate {
  id: string;
  type: 'flight' | 'priority';
  title: string;
  description: string;
  timeLabel: string;
}

export interface WaitingData {
  flightCode: string;
  destination: string;
  countdownLabel: string;
  queuePosition: string;
  priorityLabel: string;
  progressPercent: number;
  statusMessage: string;
  craftImageUrl: string;
  tailNumber: string;
  terminalLocation: string;
  terminalEta: string;
  loungeServices: LoungeService[];
  liveUpdates: LiveUpdate[];
}

export interface AlternativeFlight {
  code: string;
  price: string;
  departure: string;
  arrival: string;
  destination: string;
}

export interface RecommendedFlight {
  code: string;
  departureIn: string;
  destination: string;
}

export interface TransferData {
  hubName: string;
  arrivedFrom: string;
  backgroundImageUrl: string;
  transferTime: string;
  departureGate: string;
  departureLevel: string;
  recommendedFlight: RecommendedFlight;
  passengerName: string;
  seat: string;
  boardingStatus: string;
  alternatives: AlternativeFlight[];
}

export interface AppData {
  profileImageUrl: string;
  activeAlertMinutes: string;
  navigation: NavigationData;
  boarding: BoardingData;
  timeline: TimelineData;
  waiting: WaitingData;
  transfer: TransferData;
}

export interface AppDataResponse {
  journey: AppData;
  source: 'supabase' | 'fallback';
}

export interface ApiErrorResponse {
  error: string;
}

export type IconNode = ReactNode;
