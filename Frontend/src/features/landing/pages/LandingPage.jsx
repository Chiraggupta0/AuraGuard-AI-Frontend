import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  AudioLines,
  Check,
  ChevronDown,
  CircleAlert,
  Eye,
  Menu,
  Mic,
  MoreHorizontal,
  ScanFace,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import ROUTES from '@/constants/routes.constants';
import useAuth from '@/hooks/useAuth';
import '../landing.css';

// Ported from the supplied AuraGuard landing page design (Next.js/page.tsx),
// unchanged visually — only internal navigation targets were wired to this
// app's existing routes (react-router `Link` instead of Next.js `<a href>`,
// and the two "Create a meeting" CTAs now route to the existing
// authenticated create-room flow when already signed in). See
// src/features/landing/landing.css for the ported styles.

const features = [
  { icon: ScanFace, title: 'Video Intelligence', text: 'YOLOv8n-based detection for people and phone usage.' },
  { icon: AudioLines, title: 'Audio Monitoring', text: 'faster-whisper transcription with rule-based moderation.' },
  { icon: Sparkles, title: 'Real-Time Protection', text: 'Instant violation detection, participant warnings, and host alerts.' },
  { icon: ShieldCheck, title: 'Host-Controlled Enforcement', text: 'Review violations and choose to dismiss, mute, or remove.' },
];

const steps = [
  ['01', 'Join meeting', 'Start a protected room with your team.'],
  ['02', 'AI monitors', 'Video and audio signals are checked in real time.'],
  ['03', 'Violation detected', 'Clear alerts surface suspicious activity.'],
  ['04', 'Host decides', 'You stay in control of every response.'],
];

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-3" aria-label="AuraGuard AI home">
      <span className="logo-mark">
        <ShieldCheck size={19} strokeWidth={2.4} />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-[-0.02em] text-slate-950">AuraGuard AI</span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
          Meeting safety layer
        </span>
      </span>
    </a>
  );
}

function MeetingVisual() {
  return (
    <div className="meeting-stage" aria-label="Animated preview of AuraGuard monitoring a video meeting">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="meeting-window">
        <div className="meeting-topbar">
          <div className="flex items-center gap-2">
            <span className="live-dot" /> <span className="text-[11px] font-semibold text-slate-600">Team sync</span>
            <span className="text-[10px] text-slate-400">/ 04 participants</span>
          </div>
          <MoreHorizontal size={16} className="text-slate-400" />
        </div>
        <div className="meeting-grid">
          {[
            ['M', 'Maya', 'from-blue-500 to-indigo-500'],
            ['A', 'Alex', 'from-cyan-400 to-blue-500'],
            ['J', 'Jordan', 'from-violet-400 to-fuchsia-500'],
            ['S', 'Sam', 'from-amber-300 to-orange-400'],
          ].map(([initial, name, color], i) => (
            <div key={name} className="participant-tile">
              <div className={`participant-avatar bg-gradient-to-br ${color}`}>{initial}</div>
              <div className="participant-name">
                <span>{name}</span>
                <span className="flex items-center gap-1 text-white/60">
                  <Mic size={9} /> {i === 1 ? 'Muted' : 'Live'}
                </span>
              </div>
              {i === 1 && (
                <span className="tile-scan">
                  <ScanFace size={12} />
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="meeting-controls">
          <span className="control-pill">
            <Mic size={13} />
          </span>
          <span className="control-pill">
            <Video size={13} />
          </span>
          <span className="control-pill control-end">End</span>
          <span className="control-pill ml-auto">
            <MoreHorizontal size={14} />
          </span>
        </div>
      </div>
      <div className="monitor-card">
        <div className="monitor-heading">
          <span className="monitor-icon">
            <Eye size={15} />
          </span>
          <div>
            <p>Safety Monitor</p>
            <span>Watching in real time</span>
          </div>
          <span className="monitor-status">Active</span>
        </div>
        <div className="scan-line" />
        <div className="monitor-event">
          <span className="event-icon">
            <Smartphone size={14} />
          </span>
          <div>
            <p>Phone detected</p>
            <span>Alex · just now</span>
          </div>
          <span className="event-dot" />
        </div>
        <div className="monitor-actions">
          <button type="button">Dismiss</button>
          <button type="button" className="action-primary">
            Review alert <ArrowRight size={12} />
          </button>
        </div>
      </div>
      <div className="floating-chip chip-top">
        <span className="check-circle">
          <Check size={10} />
        </span>{' '}
        Meeting protected
      </div>
      <div className="floating-chip chip-bottom">
        <CircleAlert size={13} className="text-blue-500" /> Host alert ready
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  // Signed-in visitors go straight into the existing create-room flow;
  // everyone else goes through the existing login flow first (existing
  // auth system, untouched — see LoginPage.jsx).
  const primaryCtaTarget = isAuthenticated ? ROUTES.createRoom : ROUTES.login;

  // Smooth scrolling for the navbar/section anchor links, scoped to only
  // while this page is mounted — toggled on <html> (the element that
  // actually owns scroll-behavior) rather than added globally, so it never
  // affects any other route.
  useEffect(() => {
    document.documentElement.classList.add('landing-smooth-scroll');
    return () => document.documentElement.classList.remove('landing-smooth-scroll');
  }, []);

  return (
    <main id="top" className="landing-root overflow-hidden bg-white text-slate-900">
      <header className="site-header">
        <div className="site-nav">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#safety">Safety</a>
            <a href="#about">About</a>
          </nav>
          <div className="hidden items-center gap-5 md:flex">
            <Link to={ROUTES.login} className="nav-login">
              Log in
            </Link>
            <Link to={ROUTES.login} className="nav-cta">
              Get started <ArrowRight size={14} />
            </Link>
          </div>
          <button
            className="menu-button md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <div className="mobile-menu md:hidden">
            <a href="#features" onClick={() => setMenuOpen(false)}>
              Features
            </a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
              How it works
            </a>
            <a href="#safety" onClick={() => setMenuOpen(false)}>
              Safety
            </a>
            <a href="#about" onClick={() => setMenuOpen(false)}>
              About
            </a>
            <Link to={ROUTES.login} className="nav-cta justify-center" onClick={() => setMenuOpen(false)}>
              Get started <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </header>

      <section className="hero-wrap">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" /> Real-time meeting safety
            </div>
            <h1>
              Meet. Connect.
              <br />
              <span>Stay protected.</span>
            </h1>
            <p className="hero-description">
              AuraGuard AI adds an intelligent safety layer to real-time video meetings, helping detect suspicious
              video and audio activity while giving hosts control over how violations are handled.
            </p>
            <div className="hero-actions">
              <Link to={primaryCtaTarget} className="button-primary" >
                Create a meeting <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="button-secondary">
                See how it works <ChevronDown size={15} />
              </a>
            </div>
            <div className="trust-line">
              <span>AI-powered monitoring</span>
              <i /> <span>Host-controlled enforcement</span>
              <i /> <span>Real-time alerts</span>
            </div>
          </div>
          <MeetingVisual />
        </div>
      </section>

      <section id="features" className="section section-features">
        <div className="section-heading">
          <div>
            <p className="section-kicker">What AuraGuard does</p>
            <h2>
              Safety built into
              <br />
              <span>every meeting.</span>
            </h2>
          </div>
          <p>From video monitoring to speech analysis, AuraGuard turns raw signals into actionable safety events.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="feature-card" key={title}>
              <span className="feature-icon">
                <Icon size={20} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="feature-arrow">
                <ArrowRight size={15} />
              </span>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="section process-section">
        <div className="section-heading centered">
          <p className="section-kicker">How it works</p>
          <h2>
            A quieter kind of <span>confidence.</span>
          </h2>
          <p>Simple for participants. Powerful for hosts. Safety that works in the background.</p>
        </div>
        <div className="steps-grid">
          {steps.map(([number, title, text], i) => (
            <div className="step" key={number}>
              <div className="step-number">{number}</div>
              <div className="step-line">{i < 3 && <span />}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="safety" className="section safety-section">
        <div className="safety-panel">
          <div className="safety-intro">
            <p className="section-kicker">Built for the moments that matter</p>
            <h2>
              One meeting.
              <br />
              <span>Multiple layers of protection.</span>
            </h2>
            <p>
              Signals are checked across video, audio, and realtime activity to give your host team a clearer
              picture of what is happening.
            </p>
            <a href="#about" className="text-link">
              Explore the safety layer <ArrowRight size={15} />
            </a>
          </div>
          <div className="layer-stack">
            <div className="layer-card layer-video">
              <span className="layer-icon">
                <Video size={18} />
              </span>
              <div>
                <span className="layer-label">Video</span>
                <h3>See what needs attention.</h3>
                <p>Phone detection · Camera visibility · Explicit-content detection</p>
              </div>
              <span className="layer-check">
                <Check size={13} />
              </span>
            </div>
            <div className="layer-card layer-audio">
              <span className="layer-icon">
                <AudioLines size={18} />
              </span>
              <div>
                <span className="layer-label">Audio</span>
                <h3>Hear the important signals.</h3>
                <p>Speech transcription · Keyword detection · Severity classification</p>
              </div>
              <span className="layer-check">
                <Check size={13} />
              </span>
            </div>
            <div className="layer-card layer-realtime">
              <span className="layer-icon">
                <Sparkles size={18} />
              </span>
              <div>
                <span className="layer-label">Realtime</span>
                <h3>Respond while it matters.</h3>
                <p>Participant warning · Host notification · Violation persistence</p>
              </div>
              <span className="layer-check">
                <Check size={13} />
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="section control-section">
        <div className="control-copy">
          <p className="section-kicker">Host control, by design</p>
          <h2>
            AI detects.
            <br />
            <span>You decide.</span>
          </h2>
          <p>AuraGuard surfaces the signal and puts the next step in your hands. It never automatically removes a participant.</p>
          <div className="control-list">
            <span>
              <Check size={13} /> Review every alert
            </span>
            <span>
              <Check size={13} /> Choose the response
            </span>
            <span>
              <Check size={13} /> Keep your meeting moving
            </span>
          </div>
        </div>
        <div className="alert-preview">
          <div className="alert-head">
            <div>
              <span className="alert-label">
                <CircleAlert size={13} /> Violation detected
              </span>
              <p>Host safety inbox</p>
            </div>
            <span className="alert-time">2 alerts</span>
          </div>
          <div className="violation">
            <div className="violation-avatar">A</div>
            <div className="violation-info">
              <strong>
                Alex <span>· Phone usage</span>
              </strong>
              <small>Detected just now · Medium severity</small>
            </div>
            <div className="severity medium">Medium</div>
          </div>
          <div className="violation-actions">
            <button type="button">Dismiss</button>
            <button type="button">Mute</button>
            <button type="button" className="remove">
              Remove
            </button>
          </div>
          <div className="alert-divider" />
          <div className="violation muted-row">
            <div className="violation-avatar dark">A</div>
            <div className="violation-info">
              <strong>
                Alex <span>· Threat detected</span>
              </strong>
              <small>Detected 1m ago · High severity</small>
            </div>
            <div className="severity high">High</div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-orb" />
        <p className="section-kicker">Make space for better conversations</p>
        <h2>
          Make every meeting
          <br />
          <span>a safer meeting.</span>
        </h2>
        <p>Start a protected meeting with AuraGuard AI.</p>
        <Link to={primaryCtaTarget} className="button-light">
          Create a meeting <ArrowRight size={16} />
        </Link>
      </section>

      <footer>
        <div className="footer-top">
          <Logo />
          <p>
            A thoughtful safety layer for
            <br />
            real-time communication.
          </p>
          <div className="footer-links">
            <div>
              <strong>Product</strong>
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a href="#safety">Safety</a>
              <a href="#about">Reports</a>
            </div>
            <div>
              <strong>Company</strong>
              <a href="#about">About</a>
              <a href="mailto:hello@auraguard.ai">Contact</a>
            </div>
            <div>
              <strong>Account</strong>
              <Link to={ROUTES.login}>Login</Link>
              <Link to={ROUTES.login}>Get started</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 AuraGuard AI</span>
          <span>Meeting safety layer</span>
        </div>
      </footer>
    </main>
  );
}
