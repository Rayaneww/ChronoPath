import { useState } from 'react';
import Map from './components/Map';
import Panel from './components/Panel';
import AuthModal from './components/AuthModal';
import FavoritesList from './components/FavoritesList';
import useGeolocation from './hooks/useGeolocation';
import useAuth from './hooks/useAuth';
import { generateRoute, getSavedRoutes, saveRoute, deleteRoute } from './api/routes';
import './App.css';

export default function App() {
  const { position, error: geoError } = useGeolocation();
  const { user, login, register, logout } = useAuth();

  const [route, setRoute] = useState(null);
  const [routeParams, setRouteParams] = useState(null); // pour sauvegarder avec la bonne activite/duree
  const [loading, setLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState([]);

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
      duree: routeParams.duree,
      distance: route.distanceKm,
      denivele: route.elevationGainM,
      geojson: route.geojson
    });
  }

  async function handleShowFavorites() {
    if (!user) { setShowAuth(true); return; }
    const routes = await getSavedRoutes();
    setSavedRoutes(routes);
    setShowFavorites(true);
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
      geojson: savedRoute.geojson,
      distanceKm: savedRoute.distance,
      durationMin: savedRoute.duree,
      elevationGainM: savedRoute.denivele
    });
    setShowFavorites(false);
  }

  return (
    <div className="app">
      <header>
        <h1>ChronoPath</h1>
        <div className="header-right">
          {geoError && <span className="geo-warning">{geoError}</span>}
          {user ? (
            <button onClick={logout}>{user.email} · Déconnexion</button>
          ) : (
            <button onClick={() => setShowAuth(true)}>Connexion</button>
          )}
        </div>
      </header>

      <main>
        <Panel
          onGenerate={handleGenerate}
          onSave={handleSave}
          onShowFavorites={handleShowFavorites}
          isLoggedIn={!!user}
          loading={loading}
          error={routeError}
          route={route}
        />
        <div className="map-container">
          <Map position={position} route={route} />
        </div>
      </main>

      {showFavorites && (
        <div className="modal-overlay" onClick={() => setShowFavorites(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Mes favoris</h2>
            <FavoritesList
              routes={savedRoutes}
              onSelect={handleSelectFavorite}
              onDelete={handleDeleteRoute}
            />
            <button onClick={() => setShowFavorites(false)}>Fermer</button>
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}
    </div>
  );
}
