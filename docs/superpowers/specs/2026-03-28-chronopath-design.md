# ChronoPath — Design Spec
**Date :** 2026-03-28
**Stack :** React + Express + PostgreSQL
**Périmètre :** MVP — Générateur de boucle temporelle avec auth et favoris

---

## 1. Vue d'ensemble

ChronoPath inverse la logique GPS classique : au lieu de calculer un temps pour une destination, l'utilisateur fournit un temps disponible et l'app génère un itinéraire qui respecte ce chrono.

**Principe fondamental :**
```
distance_cible = (durée_min / 60) × vitesse_km/h
```

---

## 2. Architecture générale

```
┌─────────────────────────────────┐
│         FRONTEND (React)        │
│  - Leaflet.js (carte OSM)       │
│  - Sélecteur activité/temps     │
│  - Auth (login/register)        │
│  - Favoris sauvegardés          │
└────────────────┬────────────────┘
                 │ REST API (JSON)
┌────────────────▼────────────────┐
│         BACKEND (Express)       │
│  - POST /api/route/generate     │
│  - POST /api/auth/login         │
│  - POST /api/auth/register      │
│  - GET/POST/DELETE /api/routes  │
│  - Algorithme de boucle         │
│  - Calcul dénivelé              │
└──────┬──────────┬───────────────┘
       │          │              │
┌──────▼──────┐ ┌─▼────────────┐ ┌▼──────────┐
│ GraphHopper │ │Open-Elevation│ │PostgreSQL │
│  (routage   │ │  (relief)    │ │(users +   │
│   OSM)      │ │              │ │ routes)   │
└─────────────┘ └──────────────┘ └───────────┘
```

**Principes :**
- Frontend React stateless — pas d'état serveur côté client sauf JWT en localStorage
- Backend Express orchestre les appels aux APIs externes
- Pas de base de données de cache pour le MVP

---

## 3. Algorithme de génération de boucle

### Entrée
| Paramètre | Type | Contrainte |
|-----------|------|------------|
| lat, lng | float | Position GPS du navigateur |
| activite | string | `marche` / `course` / `velo` |
| duree | integer | 5–180 minutes |
| vitesse | float | 2–50 km/h |

### Calcul

**Distance brute :**
```
distance_brute = (duree / 60) × vitesse
```

**Ajustement dénivelé** (formule de Naismith simplifiée) :
```
temps_ajouté (h) = dénivelé_positif (m) / 600
distance_ajustée = distance_brute − (temps_ajouté × vitesse)
```

**Génération de la boucle :**
1. Calculer le rayon cible : `rayon = distance_ajustée / (2π)`
2. Générer 4 à 6 waypoints répartis en cercle autour du point de départ
3. Soumettre les waypoints à GraphHopper (API publique, profil selon activité)
4. Vérifier que la distance retournée est dans ±10% de la cible
5. Si hors tolérance → ajuster le rayon et relancer (max 3 itérations)

### Sortie (GeoJSON enrichi)
```json
{
  "type": "Feature",
  "geometry": { "type": "LineString", "coordinates": [...] },
  "properties": {
    "distance_km": 4.8,
    "denivele_m": 45,
    "duree_estimee_min": 29,
    "activite": "course"
  }
}
```

---

## 4. Modèle de données PostgreSQL

```sql
-- Utilisateurs
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  vitesse_marche  FLOAT DEFAULT 5,
  vitesse_course  FLOAT DEFAULT 10,
  vitesse_velo    FLOAT DEFAULT 20,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Itinéraires sauvegardés
CREATE TABLE saved_routes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  nom         VARCHAR(255),        -- auto-généré : "{activite} {duree}min – {date}"
  activite    VARCHAR(20) NOT NULL,  -- 'marche' | 'course' | 'velo'
  duree       INTEGER NOT NULL,      -- en minutes
  distance    FLOAT NOT NULL,        -- en km
  denivele    INTEGER,               -- en mètres
  geojson     JSONB NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 5. API REST

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/auth/register` | Non | Créer un compte |
| POST | `/api/auth/login` | Non | Login → retourne JWT |
| POST | `/api/route/generate` | Optionnel | Générer une boucle |
| GET | `/api/routes/saved` | Oui | Lister ses favoris |
| POST | `/api/routes/saved` | Oui | Sauvegarder un itinéraire |
| DELETE | `/api/routes/saved/:id` | Oui | Supprimer un favori |

**Auth :** JWT Bearer token, expiration 7 jours.

---

## 6. Frontend & UX

### Layout (une seule page)
```
┌─────────────────────────────────────────────┐
│  HEADER  [ChronoPath]        [Login/Profil] │
├──────────────┬──────────────────────────────┤
│   PANNEAU    │                              │
│   ─────────  │         CARTE                │
│   Activité   │      (Leaflet / OSM)         │
│   🚶 🏃 🚴   │                              │
│              │    [tracé affiché ici]        │
│   Durée      │                              │
│   ○15 ○30    │                              │
│   ○45 ○60+   │                              │
│              │                              │
│   Vitesse    │                              │
│   [___] km/h │                              │
│              │                              │
│  [Générer]   │                              │
│  [♥ Sauver]  │                              │
│  [Favoris]   │                              │
└──────────────┴──────────────────────────────┘
```

### Flux utilisateur
1. Chargement → demande de géolocalisation navigateur → carte centrée sur position
2. Sélection activité + durée + vitesse → clic "Générer"
3. Appel `POST /api/route/generate` → tracé affiché sur la carte
4. Si connecté : bouton "Sauvegarder" → appel `POST /api/routes/saved`
5. Section "Favoris" : liste des boucles sauvegardées, clic pour recharger le tracé

### Auth
- Modal login/register accessible depuis le header
- JWT stocké en `localStorage`

---

## 7. Gestion des erreurs & cas limites

| Cas | Comportement |
|-----|-------------|
| GPS refusé par l'utilisateur | Carte centrée sur Paris, message "Autorisez la géolocalisation" |
| GraphHopper ne trouve pas de route | Message "Pas d'itinéraire possible dans cette zone" |
| Boucle hors tolérance ±10% après 3 itérations | Retourner le meilleur résultat avec mention "Distance approximative" |
| Open-Elevation indisponible | Générer sans ajustement dénivelé, mention "Dénivelé non pris en compte" |
| JWT expiré | Déconnexion automatique, redirection vers login |

---

## 8. Sécurité

- Mots de passe hashés avec `bcrypt` (salt rounds : 12)
- JWT signé avec secret en variable d'environnement
- Validation des entrées côté serveur (express-validator)
- CORS configuré pour n'autoriser que le domaine frontend

---

## 9. Structure de projet

```
chronopath/
├── client/               # React app
│   ├── src/
│   │   ├── components/   # Map, Panel, Auth, FavoritesList
│   │   ├── hooks/        # useGeolocation, useRouteGenerator
│   │   ├── api/          # Fonctions d'appel API
│   │   └── App.jsx
│   └── package.json
├── server/               # Express app
│   ├── src/
│   │   ├── routes/       # auth.js, route.js, saved.js
│   │   ├── services/     # graphhopper.js, elevation.js, loopGenerator.js
│   │   ├── middleware/   # auth.js (JWT verify)
│   │   ├── db/           # migrations, pool.js
│   │   └── app.js
│   └── package.json
└── docs/
```

---

## 10. Hors périmètre MVP

- Les 3 variantes (Vert / Efficace / Culturel)
- Mode "Retour Immédiat"
- Cartes hors-ligne
- Synchronisation montres connectées
- Partenariats locaux
- Heatmaps de fréquentation
