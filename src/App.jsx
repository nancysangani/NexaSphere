import NotFound from './pages/NotFound';
import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { stateToUrl, urlToState } from './utils/routing';
import './styles/themes.css';
import './styles/globals.css';
import './styles/animations.css';
import './styles/chatbot.css';
import './styles/components.css';
import './styles/aurora.css';
import './styles/motion.css';

import ParticleBackground from './shared/ParticleBackground';
import GeometricGridBackground from './shared/GeometricGridBackground';
import ScrollProgress from './shared/ScrollProgress';
import Navbar from './shared/Navbar';
import HeroSection from './pages/home/HeroSection';
import ActivitiesSection from './pages/activities/ActivitiesSection';
import EventsSection from './pages/events/EventsSection';
import AboutSection from './pages/about/AboutSection';
import TeamSection from './pages/team/TeamSection';
import Footer from './shared/Footer';
import ActivityDetailPage from './pages/activities/ActivityDetailPage';
import EventDetailPage from './pages/events/EventDetailPage';
import CinematicOpening from './shared/CinematicOpening';
import Chatbot from './shared/Chatbot';
import DashboardPage from './pages/dashboard/DashboardPage';
import GamificationDashboard from './components/gamification/GamificationDashboard';
import RecommendationWidget from './components/recommendation/RecommendationWidget';

import {
  AmbientOrbs,
  SectionDivider,
  useNsReveal,
  useHeroParallax,
  useNavScrollTint,
  useGlobalMouseParallax,
  useMagneticCards,
} from './shared/MotionLayer';

import ActivitiesPage from './pages/activities/ActivitiesPage';
import EventsPage from './pages/events/EventsPage';
import AboutPage from './pages/about/AboutPage';
import TeamPage from './pages/team/TeamPage';
import ContactPage from './pages/contact/ContactPage';
const RecruitmentPage = lazy(() => import('./pages/recruitment/RecruitmentPage'));
const MembershipPage = lazy(() => import('./pages/membership/MembershipPage'));

import { activityPages } from './data/activities/index';
import { events as fallbackEvents } from './data/eventsData';
import Cursor from './components/Cursor';
import Wipe from './components/Wipe';
import PageIn from './components/PageIn';

import { useInteractionEffects } from './hooks/useInteractionEffects';
import { useBackToTop, useActiveTabObserver } from './hooks/useScrollLogic';
import { useThemeManagement, useDynamicEvents } from './hooks/useDataHooks';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useAppActions } from './hooks/useAppActions';

import { NAV_HEIGHTS, SCROLL_TIMEOUT } from './data/config';

const NAV_TABS = [
  'Home',
  'Activities',
  'Events',
  'About',
  'Team',
  'Contact',
  'Dashboard',
  'Gamification',
];

export default function App() {
  const [cinDone, setCinDone] = useState(false);
  
  // Use lazy initialization for state derived from the URL
  const [activeTab, setActiveTab] = useState(() => urlToState(window.location.pathname).activeTab);
  const [page, setPage] = useState(() => urlToState(window.location.pathname).page);
  const [mobile, setMobile] = useState(window.innerWidth <= 768);

  const { theme, toggleTheme } = useThemeManagement();
  const eventsData = useDynamicEvents(fallbackEvents);
  const { wipeOn, wipePh, handleTabChange, performTransition } = useAppNavigation(
    setPage,
    setActiveTab,
    mobile
  );
  const actions = useAppActions(performTransition, setPage, setActiveTab, mobile);

  useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync state changes to browser history
  useEffect(() => {
    const url = stateToUrl(page);
    if (window.location.pathname !== url) {
      window.history.pushState(null, '', url);
    }
  }, [page]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const { page: newPage, activeTab: newTab } = urlToState(window.location.pathname);
      performTransition(() => {
        setPage(newPage);
        setActiveTab(newTab);
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [performTransition]);

  useInteractionEffects(cinDone, page);
  useBackToTop();
  useActiveTabObserver(page, mobile, NAV_TABS, NAV_HEIGHTS, setActiveTab);

  useNsReveal([cinDone, page]);
  useHeroParallax();
  useNavScrollTint();
  useGlobalMouseParallax();
  useMagneticCards();

  const navHeight = mobile ? NAV_HEIGHTS.MOBILE : NAV_HEIGHTS.DESKTOP;
  const currentActivity = page?.activityKey ? activityPages[page.activityKey] : null;

  return (
    <>
      <Chatbot />
      {!cinDone && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: theme === 'light' ? '#FFFFFF' : '#0A0A0A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="skeleton-fallback-spinner"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px dashed rgba(230,57,70,0.35)',
              borderTopColor: '#E63946',
              animation: 'animate-spin 1s linear infinite',
            }}
          />
        </div>
      )}
      {!cinDone && <CinematicOpening theme={theme} onDone={() => setCinDone(true)} />}

      {cinDone && (
        <>
          <ScrollProgress />
          <Cursor />
          <Wipe on={wipeOn} ph={wipePh} />
          <AmbientOrbs theme={theme} />
          <GeometricGridBackground theme={theme} />
          <ParticleBackground theme={theme} />
          <Navbar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onToggleTheme={toggleTheme}
            theme={theme}
          />
        </>
      )}

      <main className="app-main" style={{ paddingTop: navHeight }}>
        <>
          {page?.type === 'section' && (
            <SectionContent page={page} eventsData={eventsData} actions={actions} />
          )}

          {page?.type === 'activity' && currentActivity && (
            <PageIn k={`a-${page.activityKey}`}>
              <ActivityDetailPage
                activity={currentActivity}
                onBack={() =>
                  performTransition(() => setPage({ type: 'section', section: 'Activities' }))
                }
                onSelectEvent={actions.onEvent}
              />
            </PageIn>
          )}

          {page?.type === 'event' && page.event && currentActivity && (
            <PageIn k={`e-${page.event?.id}`}>
              <EventContent
                page={page}
                currentActivity={currentActivity}
                onBack={actions.onBackActivity}
              />
            </PageIn>
          )}

          {page?.type === 'apply' && (
            <PageIn k="pg-apply">
              <Suspense
                fallback={
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '80px 0',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div
                      className="skeleton-fallback-spinner"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '2.5px dashed rgba(230,57,70,0.3)',
                        borderTopColor: '#E63946',
                        animation: 'animate-spin 1s linear infinite',
                      }}
                    />
                  </div>
                }
              >
                <RecruitmentPage onBack={actions.onBackHome} />
              </Suspense>
            </PageIn>
          )}

          {page?.type === 'join' && (
            <PageIn k="pg-join">
              <Suspense
                fallback={
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '80px 0',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div
                      className="skeleton-fallback-spinner"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '2.5px dashed rgba(230,57,70,0.3)',
                        borderTopColor: '#E63946',
                        animation: 'animate-spin 1s linear infinite',
                      }}
                    />
                  </div>
                }
              >
                <MembershipPage onBack={actions.onBackHome} />
              </Suspense>
            </PageIn>
          )}

          {page?.type === 'gamification' && (
            <PageIn k="pg-gamification">
              <GamificationDashboard />
            </PageIn>
          )}

          {!page && cinDone && (
            <PageIn k="main">
              <MainContent
                actions={actions}
                theme={theme}
                handleTabChange={handleTabChange}
                eventsData={eventsData}
              />
            </PageIn>
          )}
        </>
      </main>

      {cinDone && (
        <button id="back-to-top" aria-label="Back to top">
          ▲
        </button>
      )}
    </>
  );
}

function SectionContent({ page, eventsData, actions }) {
  switch (page.section) {
    case 'Activities':
      return (
        <PageIn k="pg-activities">
          <ActivitiesPage onNavigate={actions.onNavigate} onBack={actions.onBackHome} />
        </PageIn>
      );
    case 'Events':
      return (
        <PageIn k="pg-events">
          <EventsPage
            onBack={actions.onBackHome}
            onEventClick={actions.onKSSClick}
            events={eventsData}
          />
        </PageIn>
      );
    case 'About':
      return (
        <PageIn k="pg-about">
          <AboutPage onBack={actions.onBackHome} />
        </PageIn>
      );
    case 'Team':
      return (
        <PageIn k="pg-team">
          <TeamPage onBack={actions.onBackHome} onApply={actions.openApply} />
        </PageIn>
      );
    case 'Contact':
      return (
        <PageIn k="pg-contact">
          <ContactPage onBack={actions.onBackHome} />
        </PageIn>
      );
    case 'Dashboard':
      return (
        <PageIn k="pg-dashboard">
          <DashboardPage onBack={actions.onBackHome} />
        </PageIn>
      );
    default:
      return null;
  }
}

function EventContent({ page, currentActivity, onBack }) {
  const displayEvent = useMemo(() => {
    const hasDetailPage = !!page.event.hasDetailPage;
    if (page.activityKey === 'Insight Session' && hasDetailPage) {
      return currentActivity.conductedEvents?.find((e) => e.id === 'kss-153') || page.event;
    }
    return page.event;
  }, [page.event, page.activityKey, currentActivity.conductedEvents]);

  return (
    <EventDetailPage
      event={displayEvent}
      activityColor={currentActivity.color}
      activityIcon={currentActivity.icon}
      onBack={onBack}
    />
  );
}

function MainContent({ actions, theme, handleTabChange, eventsData }) {
  return (
    <>
      <HeroSection
        onTabChange={handleTabChange}
        onApply={actions.openApply}
        onJoin={actions.openJoin}
        theme={theme}
      />

      {/* AI Recommendation Widget */}
      <div className="container">
        <RecommendationWidget events={eventsData} onEventClick={actions.onKSSClick} />
      </div>

      <SectionDivider />
      <ActivitiesSection onNavigate={actions.onNavigate} />
      <SectionDivider />
      <EventsSection onEventClick={actions.onKSSClick} events={eventsData} />
      <SectionDivider />
      <AboutSection />
      <SectionDivider />
      <TeamSection onApply={actions.openApply} />
      <Footer />
    </>
  );
}
