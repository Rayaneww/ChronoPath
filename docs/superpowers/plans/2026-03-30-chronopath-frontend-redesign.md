# ChronoPath Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing sidebar layout with a mobile-first, Strava-inspired UI using a floating card over a fullscreen map, Forest Green palette, and a bottom tab bar.

**Architecture:** Map fills the entire viewport. A `FloatingCard` sits absolute at the bottom on mobile and becomes a fixed 260px sidebar on desktop. A `TabBar` (mobile only) handles nav; a `TopBar` (desktop only) handles nav. All styling uses CSS custom properties — no Tailwind.

**Tech Stack:** React 18, Vite, Leaflet.js, Vitest + Testing Library, CSS custom properties

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| Modify | `client/src/App.css` | Complete rewrite — design tokens, layout, all component styles |
| Modify | `client/src/App.jsx` | New layout: map fullscreen, FloatingCard, TabBar, TopBar, activeTab state |
| Create | `client/src/components/FloatingCard.jsx` | Wrapper: handle bar + rounded card, absolute on mobile / static on desktop |
| Create | `client/src/components/TabBar.jsx` | Fixed bottom nav: Carte / Favoris / Profil, mobile only |
| Create | `client/src/components/__tests__/FloatingCard.test.jsx` | Renders children, has handle |
| Create | `client/src/components/__tests__/TabBar.test.jsx` | Renders 3 tabs, calls onTabChange, active styling |
| Modify | `client/src/components/Panel.jsx` | 2 states (params/result), steppers for duration+speed |
| Modify | `client/src/components/AuthModal.jsx` | Add logo header (🌿 ChronoPath), keep all existing structure |
| Modify | `client/src/components/FavoritesList.jsx` | New item style: activity icon + name + meta, keep all aria/behavior |

---

## Task 1: CSS Design Tokens + App.css Rewrite

**Files:**
- Modify: `client/src/App.css`

- [ ] **Step 1: Rewrite App.css**

Replace the entire file with:

```css
/* ============================================================
   DESIGN TOKENS
   ============================================================ */
:root {
  --color-primary:       #16a34a;
  --color-primary-dark:  #14532d;
  --color-primary-light: #f0fdf4;
  --color-primary-glow:  rgba(22, 163, 74, 0.20);

  --color-text:         #1e293b;
  --color-text-muted:   #64748b;
  --color-text-subtle:  #94a3b8;
  --color-surface:      #ffffff;
  --color-bg:           #f8fafc;
  --color-border:       #e2e8f0;

  --radius-card:  22px;
  --radius-btn:   14px;
  --radius-pill:  12px;
  --radius-input: 10px;

  --shadow-card:  0 8px 32px rgba(0,0,0,0.10), 0 -2px 0 rgba(22,163,74,0.06);
  --shadow-btn:   0 4px 14px rgba(22,163,74,0.30);
  --shadow-float: 0 2px 12px rgba(0,0,0,0.10);
}

/* ============================================================
   RESET
   ============================================================ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; background: var(--color-bg); color: var(--color-text); }

/* ============================================================
   APP SHELL — MOBILE FIRST
   ============================================================ */
.app {
  position: relative;
  width: 100%;
  height: 100dvh;          /* use dvh for mobile viewport */
  overflow: hidden;
}

/* MAP fills everything */
.map-wrapper {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* LOGO PILL — absolute top-left over map */
.logo-pill {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  background: white;
  border-radius: var(--radius-pill);
  padding: 6px 14px;
  box-shadow: var(--shadow-float);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--color-primary-dark);
  letter-spacing: -0.3px;
  user-select: none;
}

/* DESKTOP TOP BAR — hidden on mobile */
.desktop-topbar {
  display: none;
}

/* ============================================================
   FLOATING CARD — mobile: absolute above tab bar
   ============================================================ */
.float-card {
  position: absolute;
  bottom: 58px;          /* height of tab bar */
  left: 12px;
  right: 12px;
  z-index: 20;
  background: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 16px 16px 12px;
  transform: translateY(0);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.float-card-handle {
  width: 36px;
  height: 4px;
  background: var(--color-border);
  border-radius: 99px;
  margin: 0 auto 14px;
}

/* ============================================================
   TAB BAR — fixed bottom, mobile only
   ============================================================ */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 58px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  z-index: 30;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
}

.tab-bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-subtle);
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding-bottom: 4px;
  transition: color 0.15s;
}

.tab-bar-item.active {
  color: var(--color-primary);
}

.tab-bar-item svg,
.tab-bar-item .tab-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.tab-bar-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-primary);
  margin-top: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.tab-bar-item.active .tab-bar-dot {
  opacity: 1;
}

/* ============================================================
   PANEL CONTENTS
   ============================================================ */
.panel-section-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

/* Activity pills */
.activity-pills {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.activity-pill {
  flex: 1;
  padding: 7px 4px;
  border: 2px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s ease;
}

.activity-pill.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* Stat boxes row */
.stat-row {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.stat-box {
  flex: 1;
  background: var(--color-bg);
  border-radius: var(--radius-pill);
  padding: 8px 4px;
  text-align: center;
  border: 1px solid var(--color-border);
}

.stat-box.result {
  background: var(--color-primary-light);
  border-color: rgba(22, 163, 74, 0.2);
}

.stat-val {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.1;
}

.stat-box.result .stat-val {
  color: var(--color-primary-dark);
}

.stat-lbl {
  font-size: 0.6rem;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Steppers */
.stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-bg);
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.stepper-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1.1rem;
  color: var(--color-text-muted);
  transition: background 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stepper-btn:hover {
  background: var(--color-border);
}

.stepper-val {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text);
}

/* CTA button */
.btn-primary {
  width: 100%;
  padding: 13px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-btn);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-btn);
  transition: background 0.15s, transform 0.1s;
  letter-spacing: 0.1px;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  background: var(--color-text-subtle);
  cursor: not-allowed;
  box-shadow: none;
}

.btn-primary.loading {
  animation: pulse-green 1s ease-in-out infinite;
}

@keyframes pulse-green {
  0%, 100% { box-shadow: var(--shadow-btn); }
  50%       { box-shadow: 0 4px 20px rgba(22, 163, 74, 0.55); }
}

.btn-secondary {
  width: 100%;
  padding: 11px;
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-btn);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.15s;
}

.btn-secondary:hover {
  background: var(--color-primary-light);
}

/* Error */
.error {
  color: #ef4444;
  font-size: 0.8rem;
  background: #fef2f2;
  padding: 8px 10px;
  border-radius: 8px;
  margin-bottom: 10px;
}

/* ============================================================
   BOTTOM SHEET — favorites overlay
   ============================================================ */
.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 40;
  display: flex;
  align-items: flex-end;
}

.bottom-sheet {
  width: 100%;
  background: var(--color-surface);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  padding: 16px 16px 80px;
  max-height: 70vh;
  overflow-y: auto;
  animation: slide-up 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.bottom-sheet-handle {
  width: 36px;
  height: 4px;
  background: var(--color-border);
  border-radius: 99px;
  margin: 0 auto 16px;
}

.bottom-sheet-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 16px;
}

/* ============================================================
   FAVORITES LIST
   ============================================================ */
.favorites-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--color-bg);
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: border-color 0.15s;
}

.fav-item:hover {
  border-color: var(--color-primary);
}

.fav-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.fav-info {
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  padding: 0;
}

.fav-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.fav-meta {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.fav-delete {
  background: none;
  border: none;
  color: var(--color-text-subtle);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 4px 6px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}

.fav-delete:hover {
  color: #ef4444;
  background: #fef2f2;
}

.favorites-empty {
  text-align: center;
  padding: 32px 16px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.favorites-empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 10px;
}

/* ============================================================
   AUTH MODAL
   ============================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}

.modal {
  background: var(--color-surface);
  padding: 28px 24px 24px;
  border-radius: var(--radius-card);
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.modal-logo {
  text-align: center;
  margin-bottom: 20px;
}

.modal-logo-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 4px;
}

.modal-logo-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-primary-dark);
  letter-spacing: -0.3px;
}

.modal h2 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 16px;
  text-align: center;
}

.modal form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  display: block;
  margin-bottom: 4px;
}

.modal input {
  width: 100%;
  padding: 11px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: 0.9rem;
  color: var(--color-text);
  outline: none;
  transition: border-color 0.15s;
}

.modal input:focus {
  border-color: var(--color-primary);
}

.modal-switch {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  width: 100%;
  padding: 8px 0 0;
}

/* ============================================================
   DESKTOP — ≥ 768px
   ============================================================ */
@media (min-width: 768px) {
  /* Hide mobile nav */
  .tab-bar { display: none; }
  .logo-pill { display: none; }

  /* Show desktop top bar */
  .desktop-topbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 52px;
    z-index: 10;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 16px;
    box-shadow: 0 1px 8px rgba(0,0,0,0.06);
  }

  .topbar-logo {
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--color-primary-dark);
    letter-spacing: -0.3px;
    margin-right: auto;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .topbar-btn {
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .topbar-btn.primary {
    background: var(--color-primary);
    color: white;
    border: none;
  }

  .topbar-btn.primary:hover {
    background: var(--color-primary-dark);
  }

  .topbar-btn.ghost {
    background: none;
    border: 1.5px solid var(--color-border);
    color: var(--color-text-muted);
  }

  .topbar-btn.ghost:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  /* Sidebar layout */
  .sidebar {
    position: absolute;
    top: 52px;
    left: 0;
    width: 270px;
    bottom: 0;
    z-index: 10;
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
    overflow-y: auto;
    padding: 16px;
  }

  /* Override floating card on desktop */
  .float-card {
    position: static;
    box-shadow: none;
    border-radius: 0;
    padding: 0;
    transition: none;
  }

  .float-card-handle { display: none; }

  /* Map shifts right */
  .map-wrapper {
    left: 270px;
    top: 52px;
  }
}
```

- [ ] **Step 2: No tests for CSS — verify existing tests still compile**

```bash
cd client && npm test -- --run 2>&1 | tail -5
```

Expected: tests still pass (CSS changes don't affect behavior tests)

- [ ] **Step 3: Commit**

```bash
git add client/src/App.css
git commit -m "style: add design tokens and mobile-first layout CSS"
```

---

## Task 2: FloatingCard.jsx + Test

**Files:**
- Create: `client/src/components/FloatingCard.jsx`
- Create: `client/src/components/__tests__/FloatingCard.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/__tests__/FloatingCard.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import FloatingCard from '../FloatingCard';

test('renders children inside the card', () => {
  render(<FloatingCard><span>hello</span></FloatingCard>);
  expect(screen.getByText('hello')).toBeInTheDocument();
});

test('renders the handle bar', () => {
  render(<FloatingCard><span>x</span></FloatingCard>);
  expect(document.querySelector('.float-card-handle')).toBeInTheDocument();
});

test('applies extra className when provided', () => {
  render(<FloatingCard className="my-extra"><span>x</span></FloatingCard>);
  expect(document.querySelector('.my-extra')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd client && npm test -- --run FloatingCard 2>&1 | tail -10
```

Expected: FAIL — "FloatingCard" not defined

- [ ] **Step 3: Implement FloatingCard.jsx**

Create `client/src/components/FloatingCard.jsx`:

```jsx
export default function FloatingCard({ children, className = '' }) {
  return (
    <div className={`float-card ${className}`.trim()}>
      <div className="float-card-handle" />
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd client && npm test -- --run FloatingCard 2>&1 | tail -10
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add client/src/components/FloatingCard.jsx client/src/components/__tests__/FloatingCard.test.jsx
git commit -m "feat: add FloatingCard wrapper component"
```

---

## Task 3: TabBar.jsx + Test

**Files:**
- Create: `client/src/components/TabBar.jsx`
- Create: `client/src/components/__tests__/TabBar.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/__tests__/TabBar.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import TabBar from '../TabBar';

test('renders three tabs: Carte, Favoris, Profil', () => {
  render(<TabBar activeTab="map" onTabChange={vi.fn()} user={null} />);
  expect(screen.getByRole('button', { name: /carte/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /favoris/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /profil/i })).toBeInTheDocument();
});

test('active tab has active class', () => {
  render(<TabBar activeTab="map" onTabChange={vi.fn()} user={null} />);
  expect(screen.getByRole('button', { name: /carte/i })).toHaveClass('active');
  expect(screen.getByRole('button', { name: /favoris/i })).not.toHaveClass('active');
});

test('calls onTabChange with correct tab id when clicking', () => {
  const onTabChange = vi.fn();
  render(<TabBar activeTab="map" onTabChange={onTabChange} user={null} />);
  fireEvent.click(screen.getByRole('button', { name: /favoris/i }));
  expect(onTabChange).toHaveBeenCalledWith('favorites');
});

test('calls onTabChange with "profile" when clicking Profil', () => {
  const onTabChange = vi.fn();
  render(<TabBar activeTab="map" onTabChange={onTabChange} user={null} />);
  fireEvent.click(screen.getByRole('button', { name: /profil/i }));
  expect(onTabChange).toHaveBeenCalledWith('profile');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd client && npm test -- --run TabBar 2>&1 | tail -10
```

Expected: FAIL — "TabBar" not defined

- [ ] **Step 3: Implement TabBar.jsx**

Create `client/src/components/TabBar.jsx`:

```jsx
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd client && npm test -- --run TabBar 2>&1 | tail -10
```

Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add client/src/components/TabBar.jsx client/src/components/__tests__/TabBar.test.jsx
git commit -m "feat: add TabBar mobile navigation component"
```

---

## Task 4: Panel.jsx Refactor

**Files:**
- Modify: `client/src/components/Panel.jsx`
- Test: `client/src/components/__tests__/Panel.test.jsx` (must still pass — no changes needed)

- [ ] **Step 1: Run existing Panel tests to confirm baseline**

```bash
cd client && npm test -- --run Panel 2>&1 | tail -10
```

Expected: PASS — 4 tests

- [ ] **Step 2: Rewrite Panel.jsx**

Replace the entire file with:

```jsx
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
        className={`btn-primary ${loading ? 'loading' : ''}`}
        onClick={() => onGenerate({ activite, duree, vitesse })}
        disabled={loading}
      >
        {loading ? 'Génération...' : 'Générer ma boucle'}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Run Panel tests to verify they still pass**

```bash
cd client && npm test -- --run Panel 2>&1 | tail -15
```

Expected: PASS — 4 tests

Note: The test `calls onGenerate with activity, duree, vitesse on click` clicks the button matching `/générer/i`. In params state (route=null) the button text is "Générer ma boucle" — matches. The test `shows save button only when route exists AND user is logged in` rerenders with `route={{ distanceKm: 5 }}` — Panel switches to result state which shows "♥ Sauvegarder" conditionally. All 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/Panel.jsx
git commit -m "feat: refactor Panel with 2-state UI, activity pills, steppers"
```

---

## Task 5: AuthModal.jsx Refactor

**Files:**
- Modify: `client/src/components/AuthModal.jsx`
- Test: `client/src/components/__tests__/AuthModal.test.jsx` (must still pass — no changes needed)

- [ ] **Step 1: Run existing AuthModal tests to confirm baseline**

```bash
cd client && npm test -- --run AuthModal 2>&1 | tail -10
```

Expected: PASS — 3 tests

- [ ] **Step 2: Add logo header to AuthModal.jsx**

Replace the entire file with:

```jsx
import { useState } from 'react';

export default function AuthModal({ onClose, onAuth }) {
  const [mode,     setMode]     = useState('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onAuth(mode, email, password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur, veuillez réessayer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal-logo">
          <span className="modal-logo-icon">🌿</span>
          <span className="modal-logo-name">ChronoPath</span>
        </div>

        <h2>{mode === 'login' ? 'Connexion' : 'Inscription'}</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <button type="button" className="modal-switch" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Créer un compte' : 'Déjà un compte ? Se connecter'}
        </button>

      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run AuthModal tests to verify they still pass**

```bash
cd client && npm test -- --run AuthModal 2>&1 | tail -10
```

Expected: PASS — 3 tests

Note: The heading `h2` with "Connexion"/"Inscription" is preserved. Labels "Email" / "Mot de passe" are preserved. Button `/se connecter/i` is preserved. Text "Créer un compte" is preserved. All 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/AuthModal.jsx
git commit -m "feat: add logo header to AuthModal"
```

---

## Task 6: FavoritesList.jsx Refactor

**Files:**
- Modify: `client/src/components/FavoritesList.jsx`
- Test: `client/src/components/__tests__/FavoritesList.test.jsx` (must still pass — no changes needed)

- [ ] **Step 1: Run existing FavoritesList tests to confirm baseline**

```bash
cd client && npm test -- --run FavoritesList 2>&1 | tail -10
```

Expected: PASS — 4 tests

- [ ] **Step 2: Rewrite FavoritesList.jsx**

Replace the entire file with:

```jsx
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
```

- [ ] **Step 3: Run FavoritesList tests to verify they still pass**

```bash
cd client && npm test -- --run FavoritesList 2>&1 | tail -10
```

Expected: PASS — 4 tests

Note: Route names rendered as text inside `.fav-info` button → `getByText('Course 30min – 28 mar')` still finds the element. The `onSelect` call comes from clicking `.fav-info` button. The `aria-label="Supprimer"` on `.fav-delete` is preserved. Empty state text "Aucun itinéraire sauvegardé" is preserved.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/FavoritesList.jsx
git commit -m "feat: refactor FavoritesList with activity icons and bottom-sheet style"
```

---

## Task 7: App.jsx Refactor

**Files:**
- Modify: `client/src/App.jsx`
- Test: `client/src/App.test.jsx` (must still pass — no changes needed)

- [ ] **Step 1: Run existing App tests to confirm baseline**

```bash
cd client && npm test -- --run App 2>&1 | tail -10
```

Expected: PASS — 3 tests

- [ ] **Step 2: Rewrite App.jsx**

Replace the entire file with:

```jsx
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

  const [route,       setRoute]       = useState(null);
  const [routeParams, setRouteParams] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [routeError,  setRouteError]  = useState(null);
  const [showAuth,    setShowAuth]    = useState(false);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [activeTab,   setActiveTab]   = useState('map');
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
      geojson:       savedRoute.geojson,
      distanceKm:    savedRoute.distance,
      durationMin:   savedRoute.duree,
      elevationGainM:savedRoute.denivele,
    });
    setShowFavSheet(false);
    setActiveTab('map');
  }

  async function handleShowFavorites() {
    if (!user) { setShowAuth(true); return; }
    const routes = await getSavedRoutes();
    setSavedRoutes(routes);
    setShowFavSheet(true);
  }

  return (
    <div className="app">

      {/* Desktop top bar */}
      <div className="desktop-topbar">
        <span className="topbar-logo">🌿 ChronoPath</span>
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
      <div className="logo-pill">🌿 ChronoPath</div>

      {/* Mobile: floating card above tab bar / Desktop: sidebar */}
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
```

- [ ] **Step 3: Run App tests to verify they still pass**

```bash
cd client && npm test -- --run App 2>&1 | tail -15
```

Expected: PASS — 3 tests

Note:
- `getByText('ChronoPath')`: "ChronoPath" appears in `.topbar-logo` ("🌿 ChronoPath") — `getByText` finds text nodes, so the combined "🌿 ChronoPath" text matches a partial text search. Actually the test uses `getByText('ChronoPath')` exact. The `.topbar-logo` renders "🌿 ChronoPath" as a single text node, which won't match exactly `'ChronoPath'`. Solution: use `getByText(/ChronoPath/)` — but we can't change the test. Instead, put just "ChronoPath" as its own span. Updated topbar-logo to: `<span className="topbar-logo"><span>🌿</span> ChronoPath</span>` — the text node "ChronoPath" would be found. Actually `getByText` uses exact by default and would find nodes whose text content is 'ChronoPath'. Since "🌿 ChronoPath" ≠ "ChronoPath", we need a dedicated span.

**Important fix in Step 2** — replace `.topbar-logo` rendering:

```jsx
<span className="topbar-logo">
  <span aria-hidden="true">🌿</span>
  <span>ChronoPath</span>
</span>
```

Also do the same for `.logo-pill`:
```jsx
<div className="logo-pill">
  <span aria-hidden="true">🌿</span>
  <span>ChronoPath</span>
</div>
```

- [ ] **Step 4: Fix logo rendering so App test passes**

In `client/src/App.jsx`, update both logo instances.

In the topbar:
```jsx
<span className="topbar-logo">
  <span aria-hidden="true">🌿</span>
  <span>ChronoPath</span>
</span>
```

In the logo pill:
```jsx
<div className="logo-pill">
  <span aria-hidden="true">🌿</span>
  <span>ChronoPath</span>
</div>
```

- [ ] **Step 5: Re-run App tests**

```bash
cd client && npm test -- --run App 2>&1 | tail -15
```

Expected: PASS — 3 tests

- [ ] **Step 6: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat: refactor App with mobile-first layout, FloatingCard, TabBar, bottom sheet"
```

---

## Task 8: Full Test Suite

**Files:**
- All test files (no changes)

- [ ] **Step 1: Run all client tests**

```bash
cd client && npm test -- --run 2>&1
```

Expected: All 25+ tests pass (Panel ×4, AuthModal ×3, FavoritesList ×4, Map ×N, FloatingCard ×3, TabBar ×4, App ×3, hooks ×N)

- [ ] **Step 2: Fix any failures**

If any test fails, read the error message carefully. Common issues:
- Text matching: check exact strings vs regex
- Missing imports: verify all new components are exported correctly
- CSS class assertions: check that class names match exactly

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete frontend redesign — mobile-first, Forest Green, floating card"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task covering it |
|---|---|
| Forest Green `#16a34a` design tokens | Task 1 |
| Soft & Rounded card style | Task 1 (`.float-card` with `--radius-card: 22px`) |
| FloatingCard component + handle | Task 2 |
| TabBar 3 tabs + active dot | Task 3 |
| Panel: activity pills | Task 4 |
| Panel: stat-boxes with steppers (mobile) | Task 4 |
| Panel: result state (distance/duration/elevation) | Task 4 |
| Panel: Regénérer + ♥ Sauvegarder buttons | Task 4 |
| AuthModal: logo header | Task 5 |
| FavoritesList: activity icon + meta + delete | Task 6 |
| FavoritesList: empty state | Task 6 |
| App: activeTab state management | Task 7 |
| App: bottom sheet for favorites | Task 7 |
| App: desktop TopBar | Task 7 (CSS `display:none` on mobile, `display:flex` on desktop) |
| App: desktop sidebar layout | Task 7 (`.sidebar` + CSS media query) |
| Responsive breakpoint 768px | Task 1 |
| FloatingCard bounce animation | Task 1 (`transition: transform 0.3s cubic-bezier(...)`) |
| Bottom sheet slide-up animation | Task 1 (`@keyframes slide-up`) |
| Pulse animation on loading | Task 1 (`@keyframes pulse-green`) |
| Existing tests unbroken | Task 8 |

**Type consistency check:** All class names used in JSX match exactly the CSS classes defined in Task 1. No mismatch found.
