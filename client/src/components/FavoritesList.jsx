export default function FavoritesList({ routes, onSelect, onDelete }) {
  if (routes.length === 0) {
    return <p>Aucun itinéraire sauvegardé</p>;
  }

  return (
    <ul className="favorites-list">
      {routes.map(route => (
        <li key={route.id}>
          <button className="route-name" onClick={() => onSelect(route)}>
            {route.nom}
          </button>
          <span>{route.distance?.toFixed(1)} km · {route.duree} min</span>
          <button aria-label="Supprimer" onClick={() => onDelete(route.id)}>✕</button>
        </li>
      ))}
    </ul>
  );
}
