# ChronoPath — Frontend Redesign Spec

**Date:** 2026-03-30
**Status:** Approved

---

## Overview

Redesign complet du frontend ChronoPath. L'objectif est une UI professionnelle, mobile-first, inspirée de Strava/AllTrails/Komoot. L'app est principalement utilisée sur téléphone pendant ou avant une activité sportive — lisibilité en extérieur, gestes naturels, minimum de friction.

---

## Design Decisions

| Décision | Choix | Raison |
|---|---|---|
| Layout mobile | **Floating Card (B)** | Map maximale, card flottante toujours visible sans cacher la carte |
| Palette | **Forest Green** (`#16a34a`) | Cohérent outdoor/nature, se distingue de Strava orange |
| Style carte | **Soft & Rounded** | Blanc pur, très lisible en plein soleil, friendly |
| Approche CSS | **CSS custom properties + utility classes** | Cohérence tokens, pas de dépendance Tailwind |

---

## Design Tokens

```css
--color-primary:     #16a34a;   /* vert forêt */
--color-primary-dark:#14532d;   /* vert foncé — textes, logo */
--color-primary-light:#f0fdf4;  /* vert très clair — backgrounds chips */
--color-primary-glow: rgba(22, 163, 74, 0.20); /* ombre verte douce */

--color-text:        #1e293b;   /* slate-800 */
--color-text-muted:  #64748b;   /* slate-500 */
--color-text-subtle: #94a3b8;   /* slate-400 */
--color-surface:     #ffffff;   /* card backgrounds */
--color-bg:          #f8fafc;   /* page background */
--color-border:      #e2e8f0;   /* slate-200 */

--radius-card:  22px;
--radius-btn:   14px;
--radius-pill:  12px;
--radius-input: 10px;

--shadow-card: 0 8px 32px rgba(0,0,0,0.10), 0 -2px 0 rgba(22,163,74,0.06);
--shadow-btn:  0 4px 14px rgba(22,163,74,0.30);
--shadow-float:0 2px 12px rgba(0,0,0,0.10);
```

---

## Architecture — Fichiers à modifier/créer

### Fichiers modifiés
| Fichier | Nature du changement |
|---|---|
| `client/src/App.jsx` | Layout global, logique show/hide panels, tab bar |
| `client/src/App.css` | Réécriture complète avec design tokens |
| `client/src/components/Panel.jsx` | Floating card, 2 états (params / résultat) |
| `client/src/components/Map.jsx` | Inchangé côté logique, wrapper CSS seulement |
| `client/src/components/AuthModal.jsx` | Nouveau style avec logo |
| `client/src/components/FavoritesList.jsx` | Bottom sheet style |

### Fichiers créés
| Fichier | Rôle |
|---|---|
| `client/src/components/TabBar.jsx` | Barre de navigation fixe en bas (Carte / Favoris / Profil) |
| `client/src/components/FloatingCard.jsx` | Wrapper carte flottante (handle + container) |

---

## Layout Mobile

```
┌──────────────────────────┐
│   Status bar (native)    │
│  ┌──────────┐   [avatar] │  ← logo pill + avatar, absolu sur la map
│  │ 🌿 Logo │            │
│  └──────────┘            │
│                          │
│      MAP OSM             │  ← flex:1, z-index 0
│    (Leaflet plein écran) │
│                          │
│  ┌──────────────────────┐│  ← FloatingCard, position:absolute bottom:58px
│  │  ▬ (handle)          ││
│  │  [🏃][🚶][🚴]       ││  ← Pills activité
│  │  [30min][10km/h][~5] ││  ← Stats row
│  │  [ Générer ma boucle]││  ← CTA button
│  └──────────────────────┘│
│ [🗺️Carte][♥Favoris][👤] │  ← TabBar, position:fixed bottom:0
└──────────────────────────┘
```

**État 2 — Route générée :**
La FloatingCard remplace les paramètres par :
- Stats résultat : distance km · durée réelle · dénivelé+
- Bouton "Regénérer" (primary)
- Bouton "♥ Sauvegarder" (secondary, outline vert, visible uniquement si connecté)

---

## Layout Desktop (≥ 768px)

```
┌─────────────────────────────────────┐
│ 🌿 ChronoPath    Carte Favoris Conn │  ← TopBar 52px
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │     MAP OSM              │
│  260px   │     (flex:1)             │
│          │                          │
│ Activité │                          │
│ Sliders  │                          │
│ Stats    │                          │
│ [CTA]    │                          │
└──────────┴──────────────────────────┘
```

Sur desktop :
- La FloatingCard devient la sidebar gauche fixe
- La TabBar est remplacée par la nav dans la TopBar
- Les sliders `<input type="range">` remplacent les radios durée

---

## Composants

### `TabBar.jsx`
Props : `activeTab: 'map' | 'favorites' | 'profile'`, `onTabChange: (tab) => void`, `user: object | null`

- Visible **uniquement sur mobile** (`display: none` à partir de 768px)
- 3 onglets : Carte (🗺️), Favoris (♥), Profil (👤)
- Onglet actif : couleur `--color-primary` + dot vert sous l'icône
- Tap Favoris sans être connecté → ouvre AuthModal
- Tap Profil sans être connecté → ouvre AuthModal

### `FloatingCard.jsx`
Props : `children`, `className?`

- Wrapper pur : `position: absolute; bottom: 58px; left: 12px; right: 12px`
- `border-radius: var(--radius-card)`, fond blanc, `box-shadow: var(--shadow-card)`
- Handle décoratif en haut centré
- Responsive : sur desktop, devient `position: static`, largeur 100%

### `Panel.jsx` (refonte)
Props identiques à l'existant, comportement identique.

**État paramètres :**
- Section label "Activité" + 3 pills (Marche / Course / Vélo)
- Section label "Paramètres" + row de 3 stat-boxes (durée, vitesse, distance cible calculée)
- Sur mobile : stepper +/- pour durée et vitesse (touch-friendly)
- Sur desktop : `<input type="range">` avec affichage valeur
- Bouton "Générer ma boucle" (primary, pleine largeur)

**État résultat** (prop `route` non null) :
- Row de 3 stat-boxes vertes : distance réelle / durée réelle / dénivelé
- Bouton "Regénérer" (primary)
- Bouton "♥ Sauvegarder" (secondary, visible si `isLoggedIn`)

### `FavoritesList.jsx` (refonte)
Rendu dans un bottom sheet sur mobile (géré par App.jsx via overlay).

- Item : icône activité + nom bold + meta (distance · dénivelé) + bouton ✕
- État vide : illustration simple + texte "Aucune boucle sauvegardée"
- Tap sur un item → ferme le sheet + charge la route sur la carte

### `AuthModal.jsx` (refonte)
- Logo 🌿 + "ChronoPath" centré en haut
- Formulaire email + password
- Bouton submit primary
- Toggle login/register texte en bas
- Overlay dark semi-transparent

---

## App.jsx — Gestion des états

```
activeTab: 'map' | 'favorites' | 'profile'
showAuth: boolean
route: RouteResult | null
routeParams: { activite, duree, vitesse } | null
loading: boolean
routeError: string | null
savedRoutes: SavedRoute[]
```

- `activeTab === 'favorites'` → ouvre le bottom sheet favoris (charge `savedRoutes` si connecté, sinon `showAuth = true`)
- `activeTab === 'profile'` → si non connecté `showAuth = true`, sinon affiche profil minimaliste (email + bouton déconnexion)
- Route générée → Panel passe en état résultat, map affiche la trace

---

## Animations

- FloatingCard : `transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)` — légère bounce au chargement
- Bottom sheet favoris : slide-up `transform: translateY(0)` depuis `translateY(100%)`
- Bouton Générer : pulse vert pendant le loading (`@keyframes pulse-green`)
- Pills activité : transition background/color `0.15s ease`

---

## Responsive Breakpoints

```css
/* Mobile first — styles de base = mobile */
/* Tablet/Desktop */
@media (min-width: 768px) {
  .tab-bar { display: none; }
  .desktop-topbar { display: flex; }
  .sidebar { display: flex; } /* remplace FloatingCard absolue */
  .float-card { position: static; border-radius: var(--radius-card); }
}
```

---

## Tests à maintenir

Les tests existants (`Panel.test.jsx`, `AuthModal.test.jsx`, `Map.test.jsx`, `FavoritesList.test.jsx`, `App.test.jsx`) doivent continuer à passer. Les tests vérifient le comportement (présence d'éléments, appels de fonctions), pas le style — la refonte CSS ne casse aucun test. Les nouveaux composants (`TabBar`, `FloatingCard`) recevront des tests unitaires simples.

---

## Ce qui ne change PAS

- Logique métier dans `App.jsx` (génération, sauvegarde, auth)
- Hooks `useGeolocation`, `useAuth`
- API client (`api/`)
- Backend (aucune modification)
- Tests backend
