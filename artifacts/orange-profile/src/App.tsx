import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import NotFound from '@/pages/not-found';
import {
  Check,
  ChevronDown,
  ExternalLink,
  FastForward,
  GripHorizontal,
  Pause,
  Play,
  Rewind,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  FaDiscord,
  FaGithub,
  FaTiktok,
  FaYoutube,
} from 'react-icons/fa6';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const PROFILE = {
  username: 'CocoX.wtf',
};

type MusicTrack = {
  id: string;
  title: string;
  subtitle: string;
  source: string;
  cover: string;
};

const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'misery',
    title: 'Misery',
    subtitle: 'PUPSIES · MISERY',
    source: `${import.meta.env.BASE_URL}audio/misery.mp3`,
    cover: `${import.meta.env.BASE_URL}images/misery-cover.png`,
  },
  {
    id: 'all-i-want-for-christmas',
    title: 'All I Want for Christmas Is You',
    subtitle: 'MARIAH CAREY · CHRISTMAS',
    source: `${import.meta.env.BASE_URL}audio/all-i-want-for-christmas.mp3`,
    cover: `${import.meta.env.BASE_URL}images/all-i-want-for-christmas.jpg`,
  },
];

const VIDEO_SOURCE = `${import.meta.env.BASE_URL}video/cocox-clip.mp4`;
const PROFILE_AVATAR = `${import.meta.env.BASE_URL}images/profile-cocox.png`;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function useDraggable() {
  const panelRef = useRef<HTMLElement | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    pointerX: number;
    pointerY: number;
    offsetX: number;
    offsetY: number;
    bounds: { left: number; top: number; right: number; bottom: number };
  } | null>(null);
  const panelRefCallback = useCallback((node: HTMLElement | null) => {
    panelRef.current = node;
    if (!node) return;
    node.style.setProperty('--drag-x', `${offsetRef.current.x}px`);
    node.style.setProperty('--drag-y', `${offsetRef.current.y}px`);
  }, []);

  const applyPosition = (x: number, y: number) => {
    offsetRef.current = { x, y };
    panelRef.current?.style.setProperty('--drag-x', `${x}px`);
    panelRef.current?.style.setProperty('--drag-y', `${y}px`);
  };

  const finishDrag = (event?: ReactPointerEvent<HTMLButtonElement>) => {
    const panel = panelRef.current;
    const drag = dragRef.current;
    panel?.classList.remove('is-dragging');
    if (
      event &&
      drag?.pointerId === event.pointerId &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  };

  const dragHandleProps = {
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!event.isPrimary || event.button !== 0 || !panelRef.current) return;
      event.preventDefault();
      const bounds = panelRef.current.getBoundingClientRect();
      dragRef.current = {
        pointerId: event.pointerId,
        pointerX: event.clientX,
        pointerY: event.clientY,
        offsetX: offsetRef.current.x,
        offsetY: offsetRef.current.y,
        bounds: {
          left: bounds.left - offsetRef.current.x,
          top: bounds.top - offsetRef.current.y,
          right: bounds.right - offsetRef.current.x,
          bottom: bounds.bottom - offsetRef.current.y,
        },
      };
      panelRef.current.classList.add('is-dragging');
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const padding = 20;
      const nextX = drag.offsetX + event.clientX - drag.pointerX;
      const nextY = drag.offsetY + event.clientY - drag.pointerY;
      const minX = padding - drag.bounds.left;
      const maxX = window.innerWidth - padding - drag.bounds.right;
      const minY = padding - drag.bounds.top;
      const maxY = window.innerHeight - padding - drag.bounds.bottom;
      applyPosition(
        Math.min(Math.max(nextX, minX), Math.max(minX, maxX)),
        Math.min(Math.max(nextY, minY), Math.max(minY, maxY)),
      );
    },
    onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => finishDrag(event),
    onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => finishDrag(event),
    onLostPointerCapture: () => finishDrag(),
    onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      const step = event.shiftKey ? 32 : 16;
      let dx = 0;
      let dy = 0;
      if (event.key === 'ArrowLeft') dx = -step;
      else if (event.key === 'ArrowRight') dx = step;
      else if (event.key === 'ArrowUp') dy = -step;
      else if (event.key === 'ArrowDown') dy = step;
      else return;

      event.preventDefault();
      const panel = panelRef.current;
      if (!panel) return;
      const bounds = panel.getBoundingClientRect();
      const baseLeft = bounds.left - offsetRef.current.x;
      const baseTop = bounds.top - offsetRef.current.y;
      const baseRight = bounds.right - offsetRef.current.x;
      const baseBottom = bounds.bottom - offsetRef.current.y;
      const minX = 20 - baseLeft;
      const maxX = window.innerWidth - 20 - baseRight;
      const minY = 20 - baseTop;
      const maxY = window.innerHeight - 20 - baseBottom;
      applyPosition(
        Math.min(Math.max(offsetRef.current.x + dx, minX), Math.max(minX, maxX)),
        Math.min(Math.max(offsetRef.current.y + dy, minY), Math.max(minY, maxY)),
      );
    },
  };

  return { panelRef: panelRefCallback, dragHandleProps };
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
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.72);
  const [playing, setPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(MUSIC_TRACKS[0]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioMessage, setAudioMessage] = useState('');
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoMessage, setVideoMessage] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoCloseRef = useRef<HTMLButtonElement>(null);
  const resumeMusicAfterVideoRef = useRef(false);
  const profileCardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const musicDrag = useDraggable();
  const socialDrag = useDraggable();
  const aboutDrag = useDraggable();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = muted;
    audio.volume = volume;
    void audio.play().then(() => {
      setPlaying(true);
      setAudioMessage('');
    }).catch(() => {
      setAudioMessage('Your browser blocked audio autoplay. Tap Play to start the music.');
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
        toast({
          title: 'Music resumed',
          description: currentTrack.title,
          duration: 2800,
        });
      } catch {
        setAudioMessage('Playback was blocked. Tap Play to try again.');
        setPlaying(false);
        toast({
          title: 'Music could not start',
          description: 'Tap Play again to retry.',
          variant: 'destructive',
          duration: 4200,
        });
      }
    } else {
      audio.pause();
      setPlaying(false);
      toast({
        title: 'Music paused',
        description: currentTrack.title,
        duration: 2400,
      });
    }
  };

  const handleProfilePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));

    card.style.setProperty('--tilt-x', `${((x - 0.5) * 10).toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${((0.5 - y) * 8).toFixed(2)}deg`);
    card.style.setProperty('--glow-x', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--glow-y', `${(y * 100).toFixed(1)}%`);
    card.classList.add('is-tilting');
  };

  const resetProfileTilt = () => {
    const card = profileCardRef.current;
    if (!card) return;
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
    card.classList.remove('is-tilting');
  };

  const seekBy = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  };

  const selectTrack = async (track: MusicTrack) => {
    const audio = audioRef.current;
    setSelectorOpen(false);
    if (!audio) return;

    setCurrentTrack(track);
    audio.currentTime = 0;
    setCurrentTime(0);
    setDuration(0);
    setAudioMessage('');
    audio.pause();
    audio.src = track.source;
    audio.load();
    try {
      await audio.play();
      setPlaying(true);
      toast({
        title: 'Now playing',
        description: `${track.title} · ${track.subtitle.split(' · ')[0]}`,
        duration: 3600,
      });
    } catch {
      setPlaying(false);
      setAudioMessage('Playback was blocked. Tap Play to try again.');
      toast({
        title: 'Track could not start',
        description: 'Tap Play to try again.',
        variant: 'destructive',
        duration: 4200,
      });
    }
  };

  const closeVideo = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setVideoOpen(false);
    setVideoMessage('');
    if (resumeMusicAfterVideoRef.current && audioRef.current) {
      void audioRef.current.play().then(() => {
        setPlaying(true);
        setAudioMessage('');
        toast({
          title: 'Music resumed',
          description: currentTrack.title,
          duration: 2800,
        });
      }).catch(() => {
        setPlaying(false);
        setAudioMessage('Playback was blocked. Tap Play to resume the music.');
        toast({
          title: 'Music could not resume',
          description: 'Tap Play to restart the track.',
          variant: 'destructive',
          duration: 4200,
        });
      });
    }
    resumeMusicAfterVideoRef.current = false;
  };

  useEffect(() => {
    if (videoOpen) videoCloseRef.current?.focus();
  }, [videoOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditing =
        target instanceof HTMLElement &&
        (target.isContentEditable || target.matches('input, textarea, select'));

      if (
        event.ctrlKey &&
        event.shiftKey &&
        !event.altKey &&
        (event.code === 'Period' || event.key === '>' || event.key === '.') &&
        !isEditing
      ) {
        event.preventDefault();
        const video = videoRef.current;
        if (!video) return;
        const audio = audioRef.current;
        if (!videoOpen) resumeMusicAfterVideoRef.current = Boolean(audio && !audio.paused);
        audio?.pause();
        video.currentTime = 0;
        setVideoMessage('');
        setVideoOpen(true);
        void video.play().then(() => {
          toast({
            title: 'Video playing',
            description: 'Press Esc or use the close button to exit.',
            duration: 3600,
          });
        }).catch(() => {
          setVideoMessage('Press Play in the video controls to start playback.');
          toast({
            title: 'Video playback blocked',
            description: 'Press Play in the video controls to start.',
            variant: 'destructive',
            duration: 4200,
          });
        });
        return;
      }

      if (event.key === 'Escape' && videoOpen) closeVideo();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [videoOpen]);

  return (
    <main className="profile-stage" aria-label="Orange Profile">
      <div
        ref={profileCardRef}
        className="profile-card"
        aria-label={`Discord profile: ${PROFILE.username}`}
        onPointerMove={handleProfilePointerMove}
        onPointerLeave={resetProfileTilt}
      >
        <img className="profile-avatar" src={PROFILE_AVATAR} alt={`${PROFILE.username} profile picture`} />
        <span className="profile-name">{PROFILE.username}</span>
      </div>

      <section
        ref={musicDrag.panelRef}
        className={`player-card${playing ? ' is-playing' : ''}`}
        aria-label={`Music player: ${currentTrack.title}`}
      >
        <audio
          ref={audioRef}
          src={currentTrack.source}
          preload="auto"
          autoPlay
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onDurationChange={(event) => setDuration(event.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
          onPlay={() => {
            setPlaying(true);
            setAudioMessage('');
          }}
          onPause={() => setPlaying(false)}
        />
        <div className="mini-window-bar player-window-bar">
          <span className="window-label">MUSIC PLAYER</span>
          <button
            type="button"
            className="drag-handle"
            aria-label="Move music player; use arrow keys to move"
            title="Drag or use arrow keys to move"
            {...musicDrag.dragHandleProps}
          >
            <GripHorizontal size={15} aria-hidden="true" />
          </button>
        </div>
        <div className="player-row">
          <button
            className="track-select"
            aria-label="Open music selector"
            aria-expanded={selectorOpen}
            aria-controls="track-selector"
            onClick={() => setSelectorOpen((open) => !open)}
          >
            <img className="mini-art" src={currentTrack.cover} alt="" />
            <span className="track-label">
              <span className="track-title">{currentTrack.title}</span>
              <span className="track-subtitle">{currentTrack.subtitle}</span>
            </span>
            <ChevronDown className="selector-chevron" size={14} aria-hidden="true" />
          </button>
          <div className="transport-controls" aria-label="Playback controls">
            <button className="player-button" aria-label="Rewind 10 seconds" onClick={() => seekBy(-10)}>
              <Rewind size={15} />
            </button>
            <button className="play-button" aria-label={playing ? 'Pause music' : 'Play music'} onClick={() => void togglePlayback()}>
              {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
            </button>
            <button className="player-button" aria-label="Forward 10 seconds" onClick={() => seekBy(10)}>
              <FastForward size={15} />
            </button>
          </div>
          <div className="volume-wrap">
            <button className="player-button" aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted((value) => !value)}>
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
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
        <div className="player-extras">
          <span>{formatTime(currentTime)}</span>
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
              const progress = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
              audioRef.current.currentTime = progress * duration;
            }}
            onKeyDown={(event) => {
              if (!audioRef.current) return;
              if (event.key === 'ArrowRight') audioRef.current.currentTime = Math.min(duration, currentTime + 5);
              if (event.key === 'ArrowLeft') audioRef.current.currentTime = Math.max(0, currentTime - 5);
            }}
          >
            <div className="progress-fill" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
        {audioMessage && <p className="player-hint" role="status">{audioMessage}</p>}
        {selectorOpen && (
          <div className="track-selector" id="track-selector" aria-label="Music selector">
            <div className="selector-heading">
              <span>Music library</span>
              <span>{MUSIC_TRACKS.length} TRACKS</span>
            </div>
            {MUSIC_TRACKS.map((track) => {
              const isCurrent = track.id === currentTrack.id;
              return (
                <button
                  key={track.id}
                  className="selector-track"
                  aria-pressed={isCurrent}
                  aria-label={`Play ${track.title} by ${track.subtitle.split(' · ')[0]}`}
                  onClick={() => void selectTrack(track)}
                >
                  <img src={track.cover} alt="" />
                  <span className="selector-track-copy">
                    <span className="track-title">{track.title}</span>
                    <span className="track-subtitle">{track.subtitle}</span>
                  </span>
                  <span className={`selector-track-state${isCurrent ? ' is-current' : ''}`}>
                    {isCurrent && playing
                      ? <span className="playing-bars" aria-label="Now playing"><i /><i /><i /></span>
                      : isCurrent
                        ? <Check size={15} />
                        : <Play size={14} />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <nav ref={socialDrag.panelRef} className="actions" aria-label="Social links and profile actions">
        <div className="mini-window-bar social-window-bar">
          <span className="window-label">SOCIAL LINKS</span>
          <button
            type="button"
            className="drag-handle"
            aria-label="Move social links; use arrow keys to move"
            title="Drag or use arrow keys to move"
            {...socialDrag.dragHandleProps}
          >
            <GripHorizontal size={15} aria-hidden="true" />
          </button>
        </div>
        <div className="social-icons" aria-label="Social profiles">
          <a
            className="social-icon"
            href="https://discord.com/users/1153432454980448381"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord profile for wsp_hey_areuok_yes"
            title="Discord · wsp_hey_areuok_yes"
          >
            <FaDiscord aria-hidden="true" />
          </a>
          <a
            className="social-icon"
            href="https://m.youtube.com/@CocoX.W_tf?ra=m"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube channel CocoX.W_tf"
            title="YouTube · @CocoX.W_tf"
          >
            <FaYoutube aria-hidden="true" />
          </a>
          <a
            className="social-icon"
            href="https://www.tiktok.com/@cocox.wtf"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok profile @cocox.wtf"
            title="TikTok · @cocox.wtf"
          >
            <FaTiktok aria-hidden="true" />
          </a>
          <a
            className="social-icon"
            href="https://github.com/cococatnice-star"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile cococatnice-star"
            title="GitHub · cococatnice-star"
          >
            <FaGithub aria-hidden="true" />
          </a>
        </div>
        <div className="action-links">
          <button className="action-button" onClick={() => setAboutOpen(true)}>
            <UserRound size={12} strokeWidth={1.8} /> About Me
          </button>
          <a className="action-button" href="https://cocox.wtf" target="_blank" rel="noreferrer">
            <ExternalLink size={12} strokeWidth={1.8} /> Main Website
          </a>
        </div>
        <div className="video-shortcut-hint" aria-label="Keyboard shortcut to play the video">
          <span>PLAY VIDEO</span>
          <kbd>CTRL</kbd><b>+</b><kbd>SHIFT</kbd><b>+</b><kbd>.</kbd>
        </div>
      </nav>

      {aboutOpen && (
        <div className="about-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setAboutOpen(false);
        }}>
          <section
            ref={aboutDrag.panelRef}
            className="about-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
          >
            <div className="mini-window-bar about-window-bar">
              <div className="about-kicker">A little about me</div>
              <div className="window-controls">
                <button
                  type="button"
                  className="drag-handle"
                  aria-label="Move About Me panel; use arrow keys to move"
                  title="Drag or use arrow keys to move"
                  {...aboutDrag.dragHandleProps}
                >
                  <GripHorizontal size={15} aria-hidden="true" />
                </button>
                <button ref={closeRef} className="close-about" aria-label="Close About Me" onClick={() => setAboutOpen(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <h1 id="about-title">Hey, I’m {PROFILE.username}.</h1>
            <p>I’ve been coding for about two years. I know how to code Roblox and Unity scripts, and how to make games.</p>
            <p>I like making devices and coding programs and apps. I also make exploits for Roblox.</p>
            <div className="about-foot">ALWAYS BUILDING SOMETHING NEW</div>
          </section>
        </div>
      )}
      <div
        className={`video-backdrop${videoOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal={videoOpen}
        aria-label="CocoX video player"
        aria-hidden={!videoOpen}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) closeVideo();
        }}
      >
        <section className="video-window">
          <div className="video-window-header">
            <div className="video-window-title">
              <span className="window-label">COCOX VIDEO</span>
              <span className="video-window-shortcut">CTRL + SHIFT + .</span>
            </div>
            <button
              ref={videoCloseRef}
              type="button"
              className="close-video"
              aria-label="Close video"
              onClick={closeVideo}
            >
              <X size={16} />
            </button>
          </div>
          <video
            ref={videoRef}
            className="profile-video"
            src={VIDEO_SOURCE}
            controls
            playsInline
            preload="none"
            onError={() => setVideoMessage('The video could not be loaded.')}
          />
          {videoMessage && <p className="video-message" role="status">{videoMessage}</p>}
        </section>
      </div>
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
