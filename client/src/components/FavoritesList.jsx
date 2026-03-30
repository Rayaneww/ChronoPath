const ACTIVITY_ICONS = { course: '🏃', marche: '🚶', velo: '🚴' };

export default function FavoritesList({ routes, onSelect, onDelete }) {
  if (routes.length === 0) {
    return (
      <div className="favorites-empty">
        <span className="favorites-empty-icon">🗺️</span>
        Aucun itinéraire sauvegardé
      </div>
    );
  }

  return (
    <ul className="favorites-list">
      {routes.map(route => (
        <li key={route.id} className="fav-item">
          <span className="fav-icon">{ACTIVITY_ICONS[route.activite] || '🏃'}</span>
          <button className="fav-info" onClick={() => onSelect(route)}>
            <span className="fav-name">{route.nom}</span>
            <span className="fav-meta">{route.distance?.toFixed(1)} km · {route.duree} min</span>
          </button>
          <button
            className="fav-delete"
            aria-label="Supprimer"
            onClick={() => onDelete(route.id)}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
