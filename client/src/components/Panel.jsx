import { useState } from 'react';

const ACTIVITIES = [
  { id: 'marche', label: 'Marche', emoji: '🚶' },
  { id: 'course', label: 'Course', emoji: '🏃' },
  { id: 'velo', label: 'Vélo', emoji: '🚴' }
];
const DURATIONS = [15, 30, 45, 60];
const DEFAULT_SPEEDS = { marche: 5, course: 10, velo: 20 };

export default function Panel({ onGenerate, onSave, onShowFavorites, isLoggedIn, loading, error, route }) {
  const [activite, setActivite] = useState('course');
  const [duree, setDuree] = useState(30);
  const [vitesse, setVitesse] = useState(10);

  function handleActivityChange(id) {
    setActivite(id);
    setVitesse(DEFAULT_SPEEDS[id]);
  }

  return (
    <div className="panel">
      <div className="activity-selector">
        {ACTIVITIES.map(({ id, label, emoji }) => (
          <button
            key={id}
            onClick={() => handleActivityChange(id)}
            className={activite === id ? 'active' : ''}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      <div className="duration-selector">
        {DURATIONS.map(d => (
          <label key={d}>
            <input
              type="radio"
              name="duree"
              value={d}
              checked={duree === d}
              onChange={() => setDuree(d)}
            />
            {d} min
          </label>
        ))}
      </div>

      <div className="speed-input">
        <label>
          Vitesse
          <input
            type="number"
            value={vitesse}
            min={2}
            max={50}
            onChange={e => setVitesse(Number(e.target.value))}
          />
          km/h
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      {route && (
        <p className="route-info">
          {route.distanceKm?.toFixed(1)} km · {Math.round(route.durationMin)} min · +{route.elevationGainM}m
        </p>
      )}

      <button onClick={() => onGenerate({ activite, duree, vitesse })} disabled={loading}>
        {loading ? 'Génération...' : 'Générer'}
      </button>

      {route && isLoggedIn && (
        <button onClick={onSave}>♥ Sauvegarder</button>
      )}

      <button onClick={onShowFavorites}>Favoris</button>
    </div>
  );
}
