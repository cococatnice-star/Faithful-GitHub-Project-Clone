import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ExternalLink,
  Pause,
  Play,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const PROFILE = {
  username: 'CocoX.wtf',
};

const MUSIC_SOURCE = `${import.meta.env.BASE_URL}audio/misery.mp3`;
const MUSIC_COVER = `${import.meta.env.BASE_URL}images/misery-cover.png`;
const PROFILE_AVATAR = `${import.meta.env.BASE_URL}images/profile-cocox.png`;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    document.body.classList.add('has-custom-cursor');
    const moveCursor = (event: PointerEvent) => {
      const position = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      if (dotRef.current) {
        dotRef.current.style.transform = position;
        dotRef.current.classList.add('is-visible');
      }
      if (ringRef.current) {
        ringRef.current.style.transform = position;
        ringRef.current.classList.add('is-visible');
        const target = event.target;
        ringRef.current.classList.toggle(
          'is-interactive',
          target instanceof Element && Boolean(target.closest('a, button, input, [role="slider"]')),
        );
      }
    };
    const hideCursor = () => {
      dotRef.current?.classList.remove('is-visible');
      ringRef.current?.classList.remove('is-visible');
    };

    window.addEventListener('pointermove', moveCursor, { passive: true });
    window.addEventListener('blur', hideCursor);
    return () => {
      window.removeEventListener('pointermove', moveCursor);
      window.removeEventListener('blur', hideCursor);
      document.body.classList.remove('has-custom-cursor');
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="custom-cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="custom-cursor-dot" aria-hidden="true" />
    </>
  );
}

function Home() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.72);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioMessage, setAudioMessage] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    void audio.play().then(() => {
      setPlaying(true);
      setAudioMessage('');
    }).catch(() => {
      setAudioMessage('Tap play to start the music.');
    });
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
      audioRef.current.volume = volume;
    }
  }, [muted, volume]);

  useEffect(() => {
    if (!aboutOpen) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAboutOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aboutOpen]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
        setAudioMessage('');
      } catch {
        setAudioMessage('Tap play to start the music.');
        setPlaying(false);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  return (
    <main className="profile-stage" aria-label="Orange Profile">
      <div className="profile-card" aria-label={`Discord profile: ${PROFILE.username}`}>
        <img className="profile-avatar" src={PROFILE_AVATAR} alt={`${PROFILE.username} profile picture`} />
        <span className="profile-name">{PROFILE.username}</span>
      </div>

      <section className="player-card" aria-label="Misery music player">
        <audio
          ref={audioRef}
          src={MUSIC_SOURCE}
          preload="auto"
          autoPlay
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onDurationChange={(event) => setDuration(event.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        <div className="player-row">
          <div className="track-info">
            <img className="mini-art" src={MUSIC_COVER} alt="Misery cover art" />
            <div className="track-label">
              <span className="track-title">Misery</span>
              <span className="track-subtitle">PUPSIES · MISERY</span>
            </div>
          </div>
          <button className="player-button play-button" aria-label={playing ? 'Pause music' : 'Play music'} onClick={() => void togglePlayback()}>
            {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          </button>
          <div className="volume-wrap">
            <button className="player-button" aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted((value) => !value)}>
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <input
              aria-label="Volume"
              className="volume-range"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(Number(event.currentTarget.value))}
            />
          </div>
        </div>
        <div
          className="progress-line"
          role="slider"
          aria-label="Track position"
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={currentTime}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          tabIndex={0}
          onClick={(event) => {
            if (!audioRef.current || !duration) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            audioRef.current.currentTime = ((event.clientX - bounds.left) / bounds.width) * duration;
          }}
          onKeyDown={(event) => {
            if (!audioRef.current) return;
            if (event.key === 'ArrowRight') audioRef.current.currentTime = Math.min(duration, currentTime + 5);
            if (event.key === 'ArrowLeft') audioRef.current.currentTime = Math.max(0, currentTime - 5);
          }}
        >
          <div className="progress-fill" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
        </div>
        <div className="player-extras">
          <span className="track-subtitle">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        {audioMessage && <p className="player-hint" role="status">{audioMessage}</p>}
      </section>

      <nav className="actions" aria-label="Profile links">
        <button className="action-button" onClick={() => setAboutOpen(true)}>
          <UserRound size={12} strokeWidth={1.8} /> About Me
        </button>
        <a className="action-button" href="https://cocox.wtf" target="_blank" rel="noreferrer">
          <ExternalLink size={12} strokeWidth={1.8} /> Main Website
        </a>
      </nav>

      {aboutOpen && (
        <div className="about-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setAboutOpen(false);
        }}>
          <section className="about-panel" role="dialog" aria-modal="true" aria-labelledby="about-title">
            <button ref={closeRef} className="close-about" aria-label="Close About Me" onClick={() => setAboutOpen(false)}>
              <X size={16} />
            </button>
            <div className="about-kicker">A little about me</div>
            <h1 id="about-title">Hey, I’m {PROFILE.username}.</h1>
            <p>I’ve been coding for about two years. I know how to code Roblox and Unity scripts, and how to make games.</p>
            <p>I like making devices and coding programs and apps. I also make exploits for Roblox.</p>
            <div className="about-foot">ALWAYS BUILDING SOMETHING NEW</div>
          </section>
        </div>
      )}
      <CursorFollower />
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
