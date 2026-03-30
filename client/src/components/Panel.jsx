import { useState } from 'react';

const ACTIVITIES = [
  { id: 'marche', label: 'Marche', emoji: '🚶' },
  { id: 'course', label: 'Course', emoji: '🏃' },
  { id: 'velo',   label: 'Vélo',   emoji: '🚴' },
];

const DEFAULT_SPEEDS = { marche: 5, course: 10, velo: 20 };

export default function Panel({ onGenerate, onSave, onShowFavorites, isLoggedIn, loading, error, route }) {
  const [activite, setActivite] = useState('course');
  const [duree,    setDuree]    = useState(30);
  const [vitesse,  setVitesse]  = useState(10);

  function handleActivityChange(id) {
    setActivite(id);
    setVitesse(DEFAULT_SPEEDS[id]);
  }

  const distanceCible = ((duree / 60) * vitesse).toFixed(1);

  if (route) {
    return (
      <div className="panel">
        {error && <p className="error">{error}</p>}

        <p className="panel-section-label">Résultat</p>
        <div className="stat-row">
          <div className="stat-box result">
            <span className="stat-val">{route.distanceKm?.toFixed(1)}</span>
            <span className="stat-lbl">km</span>
          </div>
          <div className="stat-box result">
            <span className="stat-val">{Math.round(route.durationMin)}</span>
            <span className="stat-lbl">min</span>
          </div>
          <div className="stat-box result">
            <span className="stat-val">+{route.elevationGainM}</span>
            <span className="stat-lbl">m D+</span>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => onGenerate({ activite, duree, vitesse })}
          disabled={loading}
        >
          {loading ? 'Génération...' : 'Regénérer'}
        </button>

        {isLoggedIn && (
          <button className="btn-secondary" onClick={onSave}>
            ♥ Sauvegarder
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="panel">
      {error && <p className="error">{error}</p>}

      <p className="panel-section-label">Activité</p>
      <div className="activity-pills">
        {ACTIVITIES.map(({ id, label, emoji }) => (
          <button
            key={id}
            className={`activity-pill ${activite === id ? 'active' : ''}`}
            onClick={() => handleActivityChange(id)}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      <p className="panel-section-label">Paramètres</p>
      <div className="stat-row">
        <div className="stat-box">
          <div className="stepper">
            <button
              className="stepper-btn"
              onClick={() => setDuree(d => Math.max(5, d - 5))}
              aria-label="Diminuer durée"
            >−</button>
            <span className="stepper-val">{duree}</span>
            <button
              className="stepper-btn"
              onClick={() => setDuree(d => Math.min(180, d + 5))}
              aria-label="Augmenter durée"
            >+</button>
          </div>
          <span className="stat-lbl">min</span>
        </div>

        <div className="stat-box">
          <div className="stepper">
            <button
              className="stepper-btn"
              onClick={() => setVitesse(v => Math.max(2, v - 1))}
              aria-label="Diminuer vitesse"
            >−</button>
            <span className="stepper-val">{vitesse}</span>
            <button
              className="stepper-btn"
              onClick={() => setVitesse(v => Math.min(50, v + 1))}
              aria-label="Augmenter vitesse"
            >+</button>
          </div>
          <span className="stat-lbl">km/h</span>
        </div>

        <div className="stat-box">
          <span className="stat-val">~{distanceCible}</span>
          <span className="stat-lbl">km cible</span>
        </div>
      </div>

      <button
        className={`btn-primary${loading ? ' loading' : ''}`}
        onClick={() => onGenerate({ activite, duree, vitesse })}
        disabled={loading}
      >
        {loading ? 'Génération...' : 'Générer ma boucle'}
      </button>
    </div>
  );
}
