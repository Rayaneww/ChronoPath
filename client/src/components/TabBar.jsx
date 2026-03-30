const TABS = [
  { id: 'map',       label: 'Carte',   icon: '🗺️' },
  { id: 'favorites', label: 'Favoris', icon: '♥' },
  { id: 'profile',   label: 'Profil',  icon: '👤' },
];

export default function TabBar({ activeTab, onTabChange, user }) {
  return (
    <nav className="tab-bar" role="navigation">
      {TABS.map(({ id, label, icon }) => (
        <button
          key={id}
          className={`tab-bar-item ${activeTab === id ? 'active' : ''}`}
          onClick={() => onTabChange(id)}
          aria-label={label}
        >
          <span className="tab-icon" aria-hidden="true">{icon}</span>
          <span>{label}</span>
          <span className="tab-bar-dot" />
        </button>
      ))}
    </nav>
  );
}
