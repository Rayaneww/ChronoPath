import { useState } from 'react';
import Map from './components/Map';
import Panel from './components/Panel';
import AuthModal from './components/AuthModal';
import FavoritesList from './components/FavoritesList';
import FloatingCard from './components/FloatingCard';
import TabBar from './components/TabBar';
import useGeolocation from './hooks/useGeolocation';
import useAuth from './hooks/useAuth';
import { generateRoute, getSavedRoutes, saveRoute, deleteRoute } from './api/routes';
import './App.css';

export default function App() {
  const { position, error: geoError } = useGeolocation();
  const { user, login, register, logout } = useAuth();

  const [route,        setRoute]        = useState(null);
  const [routeParams,  setRouteParams]  = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [routeError,   setRouteError]   = useState(null);
  const [showAuth,     setShowAuth]     = useState(false);
  const [savedRoutes,  setSavedRoutes]  = useState([]);
  const [activeTab,    setActiveTab]    = useState('map');
  const [showFavSheet, setShowFavSheet] = useState(false);

  async function handleGenerate(params) {
    if (!position) return;
    setLoading(true);
    setRouteError(null);
    try {
      const result = await generateRoute({ ...params, lat: position.lat, lng: position.lng });
      setRoute(result);
      setRouteParams(params);
    } catch (err) {
      setRouteError(err.response?.data?.error || "Impossible de générer l'itinéraire");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!route || !routeParams) return;
    await saveRoute({
      activite: routeParams.activite,
      duree:    routeParams.duree,
      distance: route.distanceKm,
      denivele: route.elevationGainM,
      geojson:  route.geojson,
    });
  }

  async function handleShowFavorites() {
    if (!user) { setShowAuth(true); return; }
    const routes = await getSavedRoutes();
    setSavedRoutes(routes);
    setShowFavSheet(true);
  }

  async function handleTabChange(tab) {
    setActiveTab(tab);
    if (tab === 'favorites') {
      if (!user) { setShowAuth(true); setActiveTab('map'); return; }
      const routes = await getSavedRoutes();
      setSavedRoutes(routes);
      setShowFavSheet(true);
    } else if (tab === 'profile') {
      if (!user) { setShowAuth(true); setActiveTab('map'); }
    }
  }

  async function handleAuth(mode, email, password) {
    if (mode === 'login') await login(email, password);
    else await register(email, password);
  }

  async function handleDeleteRoute(id) {
    await deleteRoute(id);
    setSavedRoutes(prev => prev.filter(r => r.id !== id));
  }

  function handleSelectFavorite(savedRoute) {
    setRoute({
      geojson:        savedRoute.geojson,
      distanceKm:     savedRoute.distance,
      durationMin:    savedRoute.duree,
      elevationGainM: savedRoute.denivele,
    });
    setShowFavSheet(false);
    setActiveTab('map');
  }

  return (
    <div className="app">

      {/* Desktop top bar */}
      <div className="desktop-topbar">
        <span className="topbar-logo">
          <span aria-hidden="true">🌿</span>
          <span>ChronoPath</span>
        </span>
        {geoError && <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>{geoError}</span>}
        <button className="topbar-btn ghost" onClick={handleShowFavorites}>♥ Favoris</button>
        {user ? (
          <button className="topbar-btn ghost" onClick={logout}>{user.email} · Déco</button>
        ) : (
          <button className="topbar-btn primary" onClick={() => setShowAuth(true)}>Connexion</button>
        )}
      </div>

      {/* Fullscreen map */}
      <div className="map-wrapper">
        <Map position={position} route={route} />
      </div>

      {/* Mobile logo pill (over map) */}
      <div className="logo-pill" aria-label="ChronoPath">
        <span>🌿</span>
      </div>

      {/* Mobile: floating card / Desktop: sidebar */}
      <div className="sidebar">
        <FloatingCard>
          <Panel
            onGenerate={handleGenerate}
            onSave={handleSave}
            onShowFavorites={handleShowFavorites}
            isLoggedIn={!!user}
            loading={loading}
            error={routeError}
            route={route}
          />
        </FloatingCard>
      </div>

      {/* Mobile tab bar */}
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} user={user} />

      {/* Favorites bottom sheet */}
      {showFavSheet && (
        <div className="bottom-sheet-overlay" onClick={() => setShowFavSheet(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />
            <p className="bottom-sheet-title">Mes boucles</p>
            <FavoritesList
              routes={savedRoutes}
              onSelect={handleSelectFavorite}
              onDelete={handleDeleteRoute}
            />
          </div>
        </div>
      )}

      {/* Auth modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}

    </div>
  );
}
