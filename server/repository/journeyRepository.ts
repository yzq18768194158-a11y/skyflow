import type { AppData, AlternativeFlight } from '../../shared/app-data';
import { defaultJourney, defaultJourneySlug } from '../data/defaultJourney.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type SupabaseJourneyRecord = {
  user_id: string;
  slug: string;
  data: AppData;
};

function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

async function supabaseRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase environment variables are missing.');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${message}`);
  }

  return (await response.json()) as T;
}

export async function getJourney(userId: string) {
  if (!hasSupabaseConfig()) {
    return { journey: defaultJourney, source: 'fallback' as const };
  }

  const rows = await supabaseRequest<SupabaseJourneyRecord[]>(
    `journeys?user_id=eq.${userId}&slug=eq.${defaultJourneySlug}&select=user_id,slug,data`,
  );

  if (!rows.length) {
    await supabaseRequest<SupabaseJourneyRecord[]>('journeys', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify([{ user_id: userId, slug: defaultJourneySlug, data: defaultJourney }]),
    });

    return { journey: defaultJourney, source: 'supabase' as const };
  }

  return { journey: rows[0].data, source: 'supabase' as const };
}

function mapAlternativeToRecommendation(flight: AlternativeFlight) {
  return {
    code: flight.code,
    departureIn: `Departs at ${flight.departure}`,
    destination: flight.destination,
  };
}

export async function selectRecommendedFlight(userId: string, code: string) {
  const current = await getJourney(userId);
  const selected = current.journey.transfer.alternatives.find((flight) => flight.code === code);

  if (!selected) {
    throw new Error(`Flight ${code} was not found.`);
  }

  const updatedJourney: AppData = {
    ...current.journey,
    transfer: {
      ...current.journey.transfer,
      recommendedFlight: mapAlternativeToRecommendation(selected),
      boardingStatus: `Switched to ${selected.code}`,
    },
    boarding: {
      ...current.journey.boarding,
      subtitle: `Flight ${selected.code} to ${selected.destination} selected`,
    },
  };

  if (!hasSupabaseConfig()) {
    return { journey: updatedJourney, source: 'fallback' as const };
  }

  const rows = await supabaseRequest<SupabaseJourneyRecord[]>(
    `journeys?user_id=eq.${userId}&slug=eq.${defaultJourneySlug}&select=user_id,slug,data`,
    {
      method: 'PATCH',
      body: JSON.stringify({ data: updatedJourney }),
    },
  );

  return {
    journey: rows[0]?.data ?? updatedJourney,
    source: 'supabase' as const,
  };
}
