import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bed,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coffee,
  Compass,
  CornerUpLeft,
  DoorOpen,
  ExternalLink,
  Footprints,
  Hourglass,
  Layers,
  MapPin,
  MessageSquare,
  Moon,
  Plane,
  PlaneTakeoff,
  LogOut,
  ShoppingBag,
  Ticket,
  Timer,
  TrainFront,
  TrendingUp,
  User,
  Waves,
  Wifi,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  AlternativeFlight,
  AppData,
  AppDataResponse,
  LiveUpdate,
  LoungeService,
  PoiItem,
  Screen,
  TimelineStep,
} from '../shared/app-data';
import { supabase } from './lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('navigation');
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [journey, setJourney] = useState<AppData | null>(null);
  const [source, setSource] = useState<'supabase' | 'fallback'>('fallback');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingFlight, setUpdatingFlight] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      setLoading(false);
      return;
    }

    void supabase.auth.getSession().then(({ data, error: authError }) => {
      if (authError) {
        setError(authError.message);
      }
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setCurrentScreen('navigation');
      setError(null);
      if (!nextSession) {
        setJourney(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!session) {
      setJourney(null);
      setLoading(false);
      return;
    }

    void loadJourney(session.access_token);
  }, [authLoading, session?.access_token]);

  async function loadJourney(accessToken: string) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/journey`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = (await response.json()) as AppDataResponse | { error: string };

      if (!response.ok || !('journey' in payload)) {
        throw new Error('error' in payload ? payload.error : 'Failed to load journey data.');
      }

      setJourney(payload.journey);
      setSource(payload.source);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unexpected request error.');
    } finally {
      setLoading(false);
    }
  }

  async function selectFlight(code: string) {
    if (!session) {
      setError('Please sign in again.');
      return;
    }

    setUpdatingFlight(code);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/journey/select-flight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code }),
      });
      const payload = (await response.json()) as AppDataResponse | { error: string };

      if (!response.ok || !('journey' in payload)) {
        throw new Error('error' in payload ? payload.error : 'Failed to update flight.');
      }

      setJourney(payload.journey);
      setSource(payload.source);
      setCurrentScreen('boarding');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unexpected request error.');
    } finally {
      setUpdatingFlight(null);
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    }
  }

  if (!supabase) {
    return (
      <StatusScreen
        title="Supabase Auth not configured"
        message="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local env file before using login."
      />
    );
  }

  if (authLoading) {
    return <StatusScreen title="Checking session" message="Connecting to Supabase Auth..." />;
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (loading) {
    return <StatusScreen title="Loading SkyFlow" message="Fetching your private journey from the app server..." />;
  }

  if (error && !journey) {
    return <StatusScreen title="Unable to load data" message={error} onRetry={loadJourney} />;
  }

  if (!journey) {
    return <StatusScreen title="No journey found" message="The app server did not return a valid record." onRetry={loadJourney} />;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden">
      <header className="fixed top-0 w-full max-w-md z-50 px-6 py-4 bg-surface/80 backdrop-blur-xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          {currentScreen === 'boarding' ? (
            <button
              onClick={() => setCurrentScreen('navigation')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest shadow-sm"
            >
              <ArrowLeft className="text-primary w-5 h-5" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden">
              <img
                src={journey.profileImageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div>
            <h1 className="text-primary font-black tracking-tighter text-2xl font-headline">
              {currentScreen === 'boarding' ? 'Boarding Pass' : 'SkyFlow'}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
              {session.user.email ?? 'Signed in'} • {source}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {currentScreen === 'boarding' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-error-container rounded-full">
              <Timer className="text-error w-4 h-4" />
              <span className="text-error font-bold text-sm tracking-tighter">{journey.activeAlertMinutes}</span>
            </div>
          ) : null}
          <button
            onClick={() => void handleSignOut()}
            className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-32 px-6 overflow-y-auto">
        {error ? (
          <div className="mb-4 rounded-2xl bg-error-container px-4 py-3 text-sm text-error shadow-sm">
            {error}
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          {currentScreen === 'navigation' && <NavigationScreen key="nav" data={journey.navigation} />}
          {currentScreen === 'boarding' && <BoardingPassScreen key="board" data={journey.boarding} />}
          {currentScreen === 'timeline' && <TimelineScreen key="time" data={journey.timeline} />}
          {currentScreen === 'waiting' && <WaitingScreen key="wait" data={journey.waiting} />}
          {currentScreen === 'transfer' && (
            <TransferScreen
              key="trans"
              data={journey.transfer}
              updatingFlight={updatingFlight}
              onBoardNow={() => setCurrentScreen('boarding')}
              onSelectFlight={selectFlight}
            />
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[96%] max-w-[460px] rounded-full px-1 py-3 z-50 bg-white/70 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,102,137,0.1)]">
        <div className="grid grid-cols-5 items-center">
          <NavItem
            active={currentScreen === 'transfer'}
            onClick={() => setCurrentScreen('transfer')}
            icon={<PlaneTakeoff className="w-6 h-6" />}
            label="Transfer"
          />
          <NavItem
            active={currentScreen === 'navigation'}
            onClick={() => setCurrentScreen('navigation')}
            icon={<Compass className="w-6 h-6" />}
            label="Navigation"
          />
          <NavItem
            active={currentScreen === 'boarding'}
            onClick={() => setCurrentScreen('boarding')}
            icon={<Ticket className="w-6 h-6" />}
            label="Boarding"
          />
          <NavItem
            active={currentScreen === 'waiting'}
            onClick={() => setCurrentScreen('waiting')}
            icon={<Hourglass className="w-6 h-6" />}
            label="Wait"
          />
          <NavItem
            active={currentScreen === 'timeline'}
            onClick={() => setCurrentScreen('timeline')}
            icon={<Waves className="w-6 h-6" />}
            label="Flow"
          />
        </div>
      </nav>
    </div>
  );
}

function StatusScreen({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="max-w-sm w-full bg-white rounded-[32px] p-8 text-center shadow-xl space-y-4">
        <h1 className="text-3xl font-black tracking-tight text-primary">{title}</h1>
        <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>
        {onRetry ? (
          <button
            onClick={onRetry}
            className="w-full rounded-full bg-primary py-3 text-white font-bold shadow-lg"
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      return;
    }

    setPending(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          throw signUpError;
        }

        setMessage(
          data.session
            ? 'Account created and signed in.'
            : 'Account created. If email confirmation is enabled, check your inbox before signing in.',
        );
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#d7eef7_0%,#f6fafd_45%,#eef5f8_100%)] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[36px] shadow-[0_30px_80px_rgba(0,102,137,0.14)] p-8 space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-container/20 text-primary text-[10px] font-black tracking-[0.2em] uppercase">
            Supabase Auth
          </div>
          <h1 className="text-4xl font-black tracking-tight text-on-surface font-headline">Sign in to SkyFlow</h1>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Your journey data is now private per account. Use email and password to sign in or create an account.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-full bg-surface-container-low p-1">
          <button
            onClick={() => setMode('sign-in')}
            className={`rounded-full py-2 text-sm font-bold ${mode === 'sign-in' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('sign-up')}
            className={`rounded-full py-2 text-sm font-bold ${mode === 'sign-up' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
          >
            Sign Up
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl bg-surface-container-low px-4 py-3 outline-none border border-transparent focus:border-primary"
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl bg-surface-container-low px-4 py-3 outline-none border border-transparent focus:border-primary"
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </label>

          {error ? <div className="rounded-2xl bg-error-container px-4 py-3 text-sm text-error">{error}</div> : null}
          {message ? <div className="rounded-2xl bg-primary-container/20 px-4 py-3 text-sm text-primary">{message}</div> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-gradient-to-br from-primary to-primary-container py-3 text-white font-bold shadow-lg disabled:opacity-70"
          >
            {pending ? 'Please wait...' : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 ${
        active
          ? 'bg-gradient-to-br from-primary to-primary-container text-white rounded-full px-3 py-3 scale-105 -translate-y-2 shadow-[0_10px_25px_rgba(0,102,137,0.3)]'
          : 'text-on-surface-variant/60 p-2 hover:text-primary hover:opacity-100'
      }`}
    >
      {icon}
      <span className="text-[9px] font-bold uppercase mt-1">{label}</span>
    </button>
  );
}

function NavigationScreen({ data }: { data: AppData['navigation'] }) {
  const [timeValue, timeUnit] = data.timeLeftLabel.split(' ');
  const [distanceValue, distanceUnit] = data.distanceLabel.split(' ');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="bg-white rounded-[40px] p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-4 right-8">
          <div className="bg-[#F0F4F8] rounded-full px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3182CE]"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A6076]">Live HUD Tracking</span>
          </div>
        </div>

        <div className="space-y-4 pt-6">
          <h2 className="text-[44px] font-extrabold leading-[1.1] tracking-tight text-black max-w-[300px]">{data.hubName}</h2>
          <p className="text-xl text-[#718096] font-medium">
            Transfer to <span className="text-[#3182CE] font-bold">{data.destinationGate}</span>
          </p>
        </div>

        <div className="mt-16 flex items-center">
          <div className="flex gap-8">
            <div>
              <span className="text-[13px] font-bold uppercase tracking-widest text-[#A0AEC0] block mb-2">Time Left</span>
              <div className="flex flex-col">
                <span className="text-4xl font-bold text-black">{timeValue}</span>
                <span className="text-4xl font-bold text-black">{timeUnit}</span>
              </div>
            </div>
            <div>
              <span className="text-[13px] font-bold uppercase tracking-widest text-[#A0AEC0] block mb-2">Distance</span>
              <div className="flex flex-col">
                <span className="text-4xl font-bold text-black">{distanceValue}</span>
                <span className="text-4xl font-bold text-black">{distanceUnit}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#D1E9FF] text-[#2C5282] pl-6 pr-8 py-6 rounded-l-full flex items-center gap-4 absolute -right-4 bottom-8">
            <Plane className="w-6 h-6 rotate-45" />
            <div className="flex flex-col font-bold text-xs leading-tight">
              <span>Boarding</span>
              <span>starts in</span>
              <span>{data.boardingStartsIn}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-b from-[#3E7B9D] to-[#63A4C7] rounded-[40px] p-12 text-white flex flex-col items-center justify-center text-center shadow-lg">
        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-8">
          <CornerUpLeft className="w-12 h-12" strokeWidth={3} />
        </div>
        <h3 className="text-3xl font-bold mb-3">{data.turnInstruction}</h3>
        <p className="text-white/80 text-lg max-w-[280px]">{data.floorHint}</p>
      </div>

      <div className="h-[400px] bg-surface-container-low rounded-xl overflow-hidden relative perspective-container">
        <img src={data.mapImageUrl} alt="Map" className="w-full h-full object-cover opacity-40 grayscale" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-full h-full absolute inset-0 map-tilt" viewBox="0 0 800 600">
            <path
              className="hud-line"
              d="M100 500 L300 400 L500 450 L700 200"
              stroke="url(#gradient-path)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="gradient-path" x1="100" y1="500" x2="700" y2="200" gradientUnits="userSpaceOnUse">
                <stop stopColor="#006689" />
                <stop offset="1" stopColor="#34A8DA" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="500" r="12" fill="#006689">
              <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="700" cy="200" r="8" fill="#34A8DA" />
          </svg>
          <div className="absolute bottom-[20%] left-[15%] glass-effect bg-white/70 px-3 py-1.5 rounded-full border border-white/20 shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Current Position</span>
          </div>
          <div className="absolute top-[30%] right-[20%] glass-effect bg-white/70 px-3 py-1.5 rounded-full border border-white/20 shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest">{data.destinationGate}</span>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          <button className="bg-white rounded-full p-3 shadow-md text-on-surface-variant hover:text-primary transition-colors">
            <Layers className="w-5 h-5" />
          </button>
          <button className="bg-white rounded-full p-3 shadow-md text-on-surface-variant hover:text-primary transition-colors">
            <Compass className="w-5 h-5" />
          </button>
          <button className="bg-primary text-white rounded-full px-6 py-3 shadow-md font-bold flex items-center gap-2 text-sm hover:opacity-90 transition-all">
            <Accessibility className="w-4 h-4" />
            {data.assistanceLabel}
          </button>
        </div>
      </div>

      <section>
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 px-2">On your way</h4>
        <div className="grid grid-cols-2 gap-4">
          {data.pois.map((poi) => (
            <POIItem key={poi.id} item={poi} />
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function POIItem({ item }: { item: PoiItem }) {
  const icon = getPoiIcon(item.category);

  return (
    <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4 group hover:bg-white transition-all cursor-pointer">
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm group-hover:scale-110 duration-200">
        {icon}
      </div>
      <div>
        <span className="block text-sm font-bold">{item.name}</span>
        <span className="text-[10px] text-on-surface-variant">{item.distanceLabel}</span>
      </div>
    </div>
  );
}

function BoardingPassScreen({ data }: { data: AppData['boarding'] }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qrPayload)}`;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
      <section className="relative overflow-hidden rounded-xl p-8 bg-gradient-to-br from-primary to-primary-container text-white shadow-xl">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-4">
            {data.urgencyLabel}
          </div>
          <h2 className="text-4xl font-extrabold tracking-tighter mb-1 font-headline">{data.title}</h2>
          <p className="text-white/80 text-sm font-medium">{data.subtitle}</p>
          <div className="mt-8 flex items-center justify-between w-full">
            <div className="text-left">
              <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70">From</span>
              <span className="text-2xl font-black">{data.fromCode}</span>
            </div>
            <div className="flex-1 flex flex-col items-center px-4">
              <div className="w-full h-[2px] bg-white/30 relative">
                <PlaneTakeoff className="absolute left-1/2 -translate-x-1/2 -top-3 text-white w-6 h-6" />
              </div>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70">To</span>
              <span className="text-2xl font-black">{data.toCode}</span>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <InfoCard label="Gate" value={data.gate} hint={data.gateHint} />
        <InfoCard label="Seat" value={data.seat} hint={data.seatHint} />
      </div>

      <section className="bg-surface-container-lowest rounded-xl p-8 flex flex-col items-center shadow-sm relative border border-outline-variant/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-surface-container-high rounded-b-full"></div>
        <div className="mb-8 w-full">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-[10px] font-black text-outline uppercase tracking-[0.15em]">Passenger</p>
              <p className="text-lg font-bold text-on-surface">{data.passengerName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-outline uppercase tracking-[0.15em]">Group</p>
              <p className="text-lg font-bold text-primary">{data.group}</p>
            </div>
          </div>
          <div className="w-full border-t border-dashed border-outline-variant/30 my-6"></div>
        </div>
        <div className="relative group">
          <div className="w-48 h-48 bg-white p-4 rounded-xl shadow-inner border border-outline-variant/20 flex items-center justify-center overflow-hidden">
            <img src={qrUrl} alt="Boarding QR Code" className="w-full h-full opacity-90" referrerPolicy="no-referrer" />
          </div>
          <div className="absolute -top-3 -right-3 bg-primary text-white p-2 rounded-full shadow-lg">
            <BadgeCheck className="w-5 h-5" />
          </div>
        </div>
        <p className="mt-8 text-sm text-outline font-medium text-center max-w-[200px]">{data.qrHint}</p>
      </section>

      <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-4 group">
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
          <img src={data.craftImageUrl} alt={data.craftName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div>
          <h4 className="font-bold text-on-surface text-sm">{data.craftName}</h4>
          <p className="text-[10px] text-on-surface-variant">{data.craftDescription}</p>
        </div>
        <ChevronRight className="ml-auto text-outline w-5 h-5" />
      </div>

      <div className="fixed bottom-6 left-0 w-full px-6 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-full font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform">
            <Ticket className="w-5 h-5" />
            {data.walletLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function InfoCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
      <span className="block text-[10px] font-black text-outline uppercase tracking-[0.15em] mb-2">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-on-surface">{value}</span>
        <span className="text-[10px] font-bold text-primary">{hint}</span>
      </div>
    </div>
  );
}

function TimelineScreen({ data }: { data: AppData['timeline'] }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight font-headline">{data.hubName}</h1>
        <p className="text-on-surface-variant font-medium">
          Journey Status: <span className="text-primary font-bold">{data.journeyStatus}</span>
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <SummaryCard main={data.efficiency} accent />
        <SummaryCard main={data.latency} />
        <SummaryCard main={data.transitTime} filled />
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-extrabold tracking-tight">Journey Timeline</h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-3 py-1 bg-primary-container/30 rounded-full">Live Tracking</span>
        </div>
        <div className="relative space-y-0">
          <div className="absolute left-5 top-4 bottom-4 w-1 bg-surface-container-high rounded-full"></div>
          <div className="absolute left-5 top-4 h-[40%] w-1 bg-gradient-to-b from-primary to-primary-container rounded-full z-10"></div>
          {data.steps.map((step) => (
            <TimelineItem key={step.id} step={step} />
          ))}
        </div>
      </section>

      <section className="bg-surface-container rounded-xl overflow-hidden relative h-40 group">
        <img
          src={data.currentPositionImageUrl}
          alt={data.currentPositionTitle}
          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 to-transparent"></div>
        <div className="absolute bottom-4 left-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Current Position</span>
          </div>
          <h4 className="text-xl font-bold">{data.currentPositionTitle}</h4>
        </div>
        <button className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 hover:bg-white/30 transition-colors">
          {data.mapCtaLabel} <ExternalLink className="w-3 h-3" />
        </button>
      </section>
    </motion.div>
  );
}

function SummaryCard({
  main,
  accent,
  filled,
}: {
  main: AppData['timeline']['efficiency'];
  accent?: boolean;
  filled?: boolean;
}) {
  if (accent) {
    return (
      <div className="col-span-2 bg-surface-container-lowest p-6 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
        <div className="relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{main.label}</span>
          <div className="text-4xl font-extrabold text-primary mt-1">{main.value}</div>
        </div>
        <div className="flex items-center gap-2 text-primary font-bold z-10 text-xs">
          <TrendingUp className="w-4 h-4" />
          <span>{main.subvalue}</span>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-container/20 rounded-full blur-2xl"></div>
      </div>
    );
  }

  if (filled) {
    return (
      <div className="bg-primary-container p-6 rounded-xl flex flex-col justify-between h-36 text-on-primary-container">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{main.label}</span>
        <div>
          <div className="text-2xl font-extrabold">{main.value}</div>
          <span className="text-[10px] font-semibold opacity-80">{main.subvalue}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low p-6 rounded-xl flex flex-col justify-between h-36">
      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{main.label}</span>
      <div>
        <div className="text-2xl font-extrabold">{main.value}</div>
        <span className="text-[10px] font-semibold text-on-surface-variant">{main.subvalue}</span>
      </div>
    </div>
  );
}

function TimelineItem({ step }: { step: TimelineStep }) {
  return (
    <div className="relative flex gap-6 pb-10">
      <div
        className={`relative z-20 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ${
          step.active ? 'bg-gradient-to-br from-primary to-primary-container scale-110' : 'bg-surface-container-high text-outline'
        }`}
      >
        {getTimelineIcon(step.icon)}
      </div>
      <div className={`flex-1 pt-0.5 ${!step.active ? 'opacity-60' : ''}`}>
        <div className="flex justify-between items-start">
          <h3 className={`text-base font-bold ${step.active ? 'text-primary' : 'text-on-surface'}`}>{step.title}</h3>
          <span className="text-[10px] font-bold text-on-surface-variant">{step.time}</span>
        </div>
        <p className="text-on-surface-variant text-xs mt-1 leading-relaxed">{step.description}</p>
        {step.status ? (
          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-[8px] font-bold uppercase text-on-surface-variant tracking-wider">
            Status: {step.status}
          </div>
        ) : null}
        {typeof step.progress === 'number' ? (
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${step.progress}%` }}></div>
            </div>
            <span className="text-[10px] font-black text-primary">{step.progress}%</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WaitingScreen({ data }: { data: AppData['waiting'] }) {
  const [minutes] = data.countdownLabel.split(':');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-secondary-container/30 w-fit rounded-full">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          <span className="text-on-secondary-container text-[10px] font-bold tracking-widest uppercase">
            {data.flightCode} • {data.destination}
          </span>
        </div>
        <div className="space-y-0">
          <h2 className="text-6xl font-black tracking-tight text-on-surface leading-[0.9] font-headline">Boarding in</h2>
          <h2 className="text-7xl font-black tracking-tight text-primary italic leading-[0.9] font-headline">{data.countdownLabel}</h2>
        </div>

        <div className="bg-surface-container-lowest rounded-[40px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-outline-variant/10">
          <div className="flex flex-col items-center text-center gap-10">
            <div className="relative flex items-center justify-center">
              <svg className="w-56 h-56 transform -rotate-90">
                <circle className="text-surface-container-high/50" cx="112" cy="112" fill="transparent" r="104" stroke="currentColor" strokeWidth="6"></circle>
                <circle
                  className="text-primary"
                  cx="112"
                  cy="112"
                  fill="transparent"
                  r="104"
                  stroke="currentColor"
                  strokeDasharray="653"
                  strokeDashoffset={653 - (653 * data.progressPercent) / 100}
                  strokeLinecap="round"
                  strokeWidth="10"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-black text-on-surface">{minutes}</span>
                <span className="text-xs font-bold text-outline tracking-widest uppercase mt-1">Minutes</span>
              </div>
            </div>

            <div className="w-full space-y-8">
              <div className="flex justify-between items-start px-2">
                <div className="text-left">
                  <p className="text-outline text-[10px] font-bold uppercase tracking-widest mb-2">Queue Position</p>
                  <p className="text-4xl font-black text-on-surface">{data.queuePosition}</p>
                </div>
                <div className="text-right">
                  <p className="text-outline text-[10px] font-bold uppercase tracking-widest mb-2">Priority</p>
                  <p className="text-2xl font-black text-tertiary">{data.priorityLabel}</p>
                </div>
              </div>

              <div className="h-2.5 w-full bg-surface-container-high/50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full" style={{ width: `${data.progressPercent}%` }}></div>
              </div>

              <p className="text-sm text-on-surface-variant/80 font-medium leading-relaxed max-w-xs mx-auto">{data.statusMessage}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative rounded-lg overflow-visible group">
        <div className="absolute top-0 right-0 w-[110%] h-full bg-surface-container-low rounded-lg -z-10 transform translate-x-4"></div>
        <img
          src={data.craftImageUrl}
          alt="eVTOL Craft"
          className="w-full h-auto object-cover rounded-lg shadow-2xl transform transition-transform duration-500 group-hover:scale-[1.02]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-6 left-12 glass-effect p-4 rounded-xl shadow-lg border-l-4 border-primary">
          <p className="text-[10px] font-black tracking-tighter text-outline uppercase mb-1">Tail Number</p>
          <p className="font-bold text-on-surface">{data.tailNumber}</p>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold tracking-tight">Lounge Services</h3>
          <button className="text-primary text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
            Explore All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {data.loungeServices.map((service) => (
            <LoungeServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-2xl font-bold tracking-tight px-2">Terminal Map</h3>
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/10 relative overflow-hidden h-48">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary-container/20"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <MapPin className="text-primary w-8 h-8 mb-2" />
            <p className="text-sm font-bold">You are at {data.terminalLocation}</p>
            <p className="text-[10px] text-on-surface-variant">{data.terminalEta}</p>
          </div>
          <button className="absolute bottom-4 right-4 bg-primary text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">Full Map</button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-2xl font-bold tracking-tight px-2">Live Updates</h3>
        <div className="space-y-3">
          {data.liveUpdates.map((update) => (
            <LiveUpdateCard key={update.id} update={update} />
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function LoungeServiceCard({ service }: { service: LoungeService }) {
  if (service.type === 'coffee' && service.imageUrl) {
    return (
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm group cursor-pointer relative aspect-[4/5] md:aspect-auto md:h-96">
        <img src={service.imageUrl} alt={service.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
          <div className="space-y-2">
            <Coffee className="text-white w-6 h-6 mb-2" />
            <h4 className="text-xl font-bold text-white">{service.title}</h4>
            <p className="text-white/90 text-sm font-medium">{service.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-primary-container font-bold text-xs tracking-widest uppercase">{service.tag}</span>
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full uppercase tracking-tighter font-bold">{service.etaLabel}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (service.type === 'rest') {
    return (
      <div className="bg-primary text-white rounded-xl p-8 relative overflow-hidden group cursor-pointer">
        <div className="relative z-10 flex flex-col h-full justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bed className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary-container">{service.tag}</span>
            </div>
            <h4 className="text-3xl font-extrabold tracking-tight">{service.title}</h4>
            <p className="text-white/80 mt-2 max-w-xs text-sm">{service.description}</p>
          </div>
          <button className="bg-white text-primary px-6 py-2 rounded-full font-bold w-fit hover:shadow-xl active:scale-95 transition-all">{service.ctaLabel}</button>
        </div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary-container rounded-full opacity-20 group-hover:scale-125 transition-transform duration-700"></div>
        <Moon className="absolute right-8 top-8 w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform duration-500" />
      </div>
    );
  }

  if (service.type === 'wifi') {
    return (
      <div className="bg-surface-container-low rounded-xl p-6 flex flex-col justify-between border-l-4 border-tertiary-container group cursor-pointer">
        <div>
          <Wifi className="text-tertiary w-8 h-8 mb-4" />
          <h4 className="text-lg font-bold text-on-surface">{service.title}</h4>
          <p className="text-xs text-on-surface-variant mt-2">{service.description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-tertiary mt-4 uppercase tracking-widest">
          {service.tag} <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary-container text-on-secondary-container rounded-xl p-6 flex items-center gap-6 group cursor-pointer">
      <div className="flex-1">
        <h4 className="text-xl font-bold">{service.title}</h4>
        <p className="text-on-secondary-container/70 text-sm mt-1">{service.description}</p>
      </div>
      <div className="bg-white p-4 rounded-full text-secondary shadow-md group-hover:rotate-12 transition-transform">
        <MessageSquare className="w-6 h-6" />
      </div>
    </div>
  );
}

function LiveUpdateCard({ update }: { update: LiveUpdate }) {
  const isFlight = update.type === 'flight';

  return (
    <div className={`bg-surface-container-low p-4 rounded-xl flex items-center gap-4 border-l-4 ${isFlight ? 'border-primary' : 'border-tertiary'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isFlight ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'}`}>
        {isFlight ? <Plane className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold">{update.title}</p>
        <p className="text-[10px] text-on-surface-variant">{update.description}</p>
      </div>
      <span className={`text-[10px] font-bold ${isFlight ? 'text-primary' : 'text-on-surface-variant'}`}>{update.timeLabel}</span>
    </div>
  );
}

function TransferScreen({
  data,
  onBoardNow,
  onSelectFlight,
  updatingFlight,
}: {
  data: AppData['transfer'];
  onBoardNow: () => void;
  onSelectFlight: (code: string) => Promise<void>;
  updatingFlight: string | null;
}) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
      <header className="space-y-1">
        <p className="text-primary font-bold tracking-widest uppercase text-[10px]">Current Hub</p>
        <h1 className="text-3xl font-extrabold tracking-tight font-headline">{data.hubName}</h1>
        <div className="flex items-center gap-2 text-on-surface-variant text-xs font-medium">
          <TrainFront className="text-primary w-4 h-4" />
          <span>{data.arrivedFrom}</span>
        </div>
      </header>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden relative min-h-[240px] flex flex-col">
        <img src={data.backgroundImageUrl} alt={data.hubName} className="absolute inset-0 w-full h-full object-cover opacity-20" referrerPolicy="no-referrer" />
        <div className="relative z-10 p-6 mt-auto space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary-container/30">
              <Footprints className="text-primary w-5 h-5" />
            </div>
            <div>
              <p className="text-on-surface-variant text-[10px] font-semibold">Transfer Time</p>
              <p className="text-lg font-bold">{data.transferTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <DoorOpen className="text-white w-5 h-5" />
            </div>
            <div>
              <p className="text-on-surface-variant text-[10px] font-semibold">eVTOL Departure</p>
              <p className="text-lg font-bold">
                {data.departureGate} <span className="text-xs font-medium text-primary ml-1">({data.departureLevel})</span>
              </p>
            </div>
          </div>
          <div className="bg-primary p-4 rounded-xl text-white shadow-lg">
            <p className="text-[8px] font-bold uppercase tracking-widest opacity-80 mb-1">Recommended Flight</p>
            <p className="text-base font-bold">
              {data.recommendedFlight.code} to {data.recommendedFlight.destination}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3" />
              <span className="text-xs font-semibold">{data.recommendedFlight.departureIn}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low p-5 rounded-xl space-y-4 border border-outline-variant/10">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Boarding Status</p>
            <h3 className="text-lg font-extrabold text-on-surface mt-0.5">{data.boardingStatus}</h3>
          </div>
          <div className="bg-primary/10 text-primary p-2 rounded-full">
            <PlaneTakeoff className="w-5 h-5" />
          </div>
        </div>
        <div className="py-3 border-y border-outline-variant/20 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant">Passenger</span>
            <span className="font-bold">{data.passengerName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant">Seat</span>
            <span className="font-bold">{data.seat}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onBoardNow}
            className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-3 rounded-full font-bold text-sm shadow-md active:scale-95 transition-all"
          >
            Board Now
          </button>
          <button className="w-full text-primary bg-secondary-container py-3 rounded-full font-bold text-sm active:scale-95 transition-all">
            Change Flight
          </button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-extrabold tracking-tight">Alternative Connections</h2>
          <button className="text-primary font-bold text-[10px] bg-primary/10 px-3 py-1 rounded-full">View All</button>
        </div>
        <div className="space-y-4">
          {data.alternatives.map((flight) => (
            <AlternativeFlightCard key={flight.code} flight={flight} onSelectFlight={onSelectFlight} updatingFlight={updatingFlight} />
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function AlternativeFlightCard({
  flight,
  onSelectFlight,
  updatingFlight,
}: {
  flight: AlternativeFlight;
  onSelectFlight: (code: string) => Promise<void>;
  updatingFlight: string | null;
}) {
  const isBusy = updatingFlight === flight.code;

  return (
    <button
      onClick={() => void onSelectFlight(flight.code)}
      disabled={Boolean(updatingFlight)}
      className="w-full text-left bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 hover:border-primary-container/40 transition-all cursor-pointer group shadow-sm disabled:opacity-70"
    >
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-extrabold text-on-primary-container px-2 py-1 bg-primary-container rounded-full tracking-wider">{flight.code}</span>
        <div className="text-right">
          <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Price</p>
          <p className="text-base font-extrabold text-primary">{flight.price}</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">Departure</p>
            <p className="text-xl font-black">{flight.departure}</p>
          </div>
          <div className="flex-1 px-4 mb-2">
            <div className="h-[1px] bg-outline-variant/30 w-full relative">
              <Plane className="absolute left-1/2 -top-2 -translate-x-1/2 text-primary w-4 h-4" />
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">Arrival</p>
            <p className="text-xl font-black">{flight.arrival}</p>
          </div>
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="font-extrabold text-sm">{flight.destination}</span>
          <span className="flex items-center gap-2 text-primary text-xs font-bold">
            {isBusy ? 'Switching...' : 'Select flight'}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </button>
  );
}

function getPoiIcon(category: PoiItem['category']) {
  switch (category) {
    case 'coffee':
      return <Coffee className="w-5 h-5" />;
    case 'restroom':
      return <User className="w-5 h-5" />;
    case 'shopping':
      return <ShoppingBag className="w-5 h-5" />;
    case 'charging':
      return <Zap className="w-5 h-5" />;
    default:
      return <Accessibility className="w-5 h-5" />;
  }
}

function getTimelineIcon(icon: TimelineStep['icon']) {
  switch (icon) {
    case 'arrival':
      return <CheckCircle2 className="w-5 h-5" />;
    case 'navigation':
      return <Compass className="w-5 h-5" />;
    case 'checkin':
      return <Ticket className="w-5 h-5" />;
    case 'boarding':
      return <PlaneTakeoff className="w-5 h-5" />;
    default:
      return <Clock className="w-5 h-5" />;
  }
}
