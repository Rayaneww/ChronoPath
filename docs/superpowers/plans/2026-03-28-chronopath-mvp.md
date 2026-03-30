# ChronoPath MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ChronoPath MVP — application web qui génère des boucles pédestres/cyclistes basées sur un temps disponible, avec auth JWT et favoris sauvegardés.

**Architecture:** Frontend React 18 + Vite avec Leaflet pour la carte OSM ; backend Express orchestre GraphHopper (routage), Open-Elevation (dénivelé) et PostgreSQL (users + routes) ; JWT Bearer pour l'auth.

**Tech Stack:** React 18, Vite, Leaflet 1.9 + react-leaflet 4, Express 4, PostgreSQL 15, pg, bcrypt, jsonwebtoken, express-validator, axios, cors, dotenv, Jest, Supertest, nock, Vitest, @testing-library/react

---

## File Map

### Server
| Fichier | Responsabilité |
|---------|---------------|
| `server/src/app.js` | Setup Express, middlewares, montage des routes |
| `server/src/server.js` | Point d'entrée, écoute du port |
| `server/src/db/pool.js` | Pool de connexion PostgreSQL |
| `server/src/db/migrations/001_initial.sql` | Définition des tables |
| `server/src/routes/auth.js` | POST /api/auth/register, POST /api/auth/login |
| `server/src/routes/route.js` | POST /api/route/generate |
| `server/src/routes/saved.js` | GET/POST/DELETE /api/routes/saved |
| `server/src/middleware/auth.js` | Vérification JWT |
| `server/src/services/graphhopper.js` | Client API GraphHopper |
| `server/src/services/elevation.js` | Client API Open-Elevation |
| `server/src/services/loopGenerator.js` | Algorithme de boucle (pur, sans I/O) |

### Client
| Fichier | Responsabilité |
|---------|---------------|
| `client/src/App.jsx` | Composant racine, layout, orchestration état global |
| `client/src/App.css` | Styles globaux |
| `client/src/api/client.js` | Instance Axios avec intercepteur JWT |
| `client/src/api/auth.js` | register(), login() |
| `client/src/api/routes.js` | generateRoute(), getSaved(), saveRoute(), deleteRoute() |
| `client/src/hooks/useGeolocation.js` | Géolocalisation navigateur avec fallback Paris |
| `client/src/hooks/useAuth.js` | État auth (user, login, register, logout) |
| `client/src/components/Map.jsx` | Carte Leaflet avec tracé de la boucle |
| `client/src/components/Panel.jsx` | Sélecteurs activité/durée/vitesse + bouton Générer |
| `client/src/components/AuthModal.jsx` | Modal login/inscription |
| `client/src/components/FavoritesList.jsx` | Liste des boucles sauvegardées |

---

## Task 1: Server — project setup

**Files:**
- Create: `server/package.json`
- Create: `server/.env.example`
- Create: `server/.gitignore`
- Create: `server/src/app.js`
- Create: `server/src/server.js`
- Create: `server/jest.config.js`
- Create: `server/tests/setup.js`

- [ ] **Step 1: Initialize server directory and install dependencies**

```bash
cd C:/Users/Rayane/Dev/ChronoPath
mkdir -p server/src/{routes,services,middleware,db/migrations} server/tests
cd server
npm init -y
npm install express cors dotenv pg bcrypt jsonwebtoken express-validator axios
npm install --save-dev jest supertest nock
```

- [ ] **Step 2: Create `server/.gitignore`**

```
node_modules/
.env
```

- [ ] **Step 3: Create `server/.env.example`**

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/chronopath
JWT_SECRET=change_me_to_a_long_random_string
GRAPHHOPPER_API_KEY=your_graphhopper_api_key_here
CLIENT_URL=http://localhost:5173
PORT=3000
```

> **Note :** Obtenir une clé GraphHopper gratuite (500 req/jour) sur https://www.graphhopper.com/

- [ ] **Step 4: Create `server/jest.config.js`**

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js']
};
```

- [ ] **Step 5: Create `server/tests/setup.js`**

```js
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/chronopath_test';
process.env.JWT_SECRET = 'test_secret_do_not_use_in_prod';
process.env.GRAPHHOPPER_API_KEY = 'test_key';
process.env.CLIENT_URL = 'http://localhost:5173';
```

- [ ] **Step 6: Create `server/src/app.js`**

```js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
```

- [ ] **Step 7: Create `server/src/server.js`**

```js
const app = require('./app');
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`ChronoPath server running on port ${port}`));
```

- [ ] **Step 8: Update scripts in `server/package.json`**

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "test": "jest --runInBand"
  }
}
```

> `--runInBand` évite les conflits de pool PostgreSQL entre tests parallèles.

- [ ] **Step 9: Write health check test**

Create `server/tests/health.test.js`:
```js
const request = require('supertest');
const app = require('../src/app');

test('GET /api/health returns ok', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('ok');
});
```

- [ ] **Step 10: Run test to verify it passes**

```bash
cd C:/Users/Rayane/Dev/ChronoPath/server && npm test -- tests/health.test.js
```
Expected: PASS — 1 test green

- [ ] **Step 11: Commit**

```bash
cd C:/Users/Rayane/Dev/ChronoPath
git init
git add server/
git commit -m "feat: server project setup with health endpoint"
```

---

## Task 2: Database — pool and migrations

**Files:**
- Create: `server/src/db/pool.js`
- Create: `server/src/db/migrations/001_initial.sql`

- [ ] **Step 1: Write the failing test**

Create `server/tests/db.test.js`:
```js
const pool = require('../src/db/pool');

afterAll(() => pool.end());

test('pool connects to database', async () => {
  const result = await pool.query('SELECT 1 AS value');
  expect(result.rows[0].value).toBe(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/db.test.js
```
Expected: FAIL — "Cannot find module '../src/db/pool'"

- [ ] **Step 3: Create `server/src/db/pool.js`**

```js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = pool;
```

- [ ] **Step 4: Create `server/src/db/migrations/001_initial.sql`**

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          VARCHAR(255) UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  vitesse_marche FLOAT DEFAULT 5,
  vitesse_course FLOAT DEFAULT 10,
  vitesse_velo   FLOAT DEFAULT 20,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_routes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  nom        VARCHAR(255),  -- auto-généré : "{activite} {duree}min – {date}"
  activite   VARCHAR(20) NOT NULL,  -- 'marche' | 'course' | 'velo'
  duree      INTEGER NOT NULL,      -- en minutes (durée demandée)
  distance   FLOAT NOT NULL,        -- en km (distance réelle)
  denivele   INTEGER,               -- en mètres
  geojson    JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

- [ ] **Step 5: Create the PostgreSQL databases and run migration**

```bash
psql -U postgres -c "CREATE DATABASE chronopath;"
psql -U postgres -c "CREATE DATABASE chronopath_test;"
psql -U postgres -d chronopath -f src/db/migrations/001_initial.sql
psql -U postgres -d chronopath_test -f src/db/migrations/001_initial.sql
```
Expected: CREATE TABLE (x2) for each database

- [ ] **Step 6: Create `.env` from `.env.example`**

```bash
cp .env.example .env
```
Then edit `.env` with your actual PostgreSQL credentials.

- [ ] **Step 7: Run test to verify it passes**

```bash
npm test -- tests/db.test.js
```
Expected: PASS — 1 test green

- [ ] **Step 8: Commit**

```bash
git add server/src/db/ server/tests/db.test.js
git commit -m "feat: database pool and initial migration"
```

---

## Task 3: Auth — register endpoint

**Files:**
- Create: `server/src/routes/auth.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/auth.test.js`:
```js
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

beforeEach(async () => {
  await pool.query('DELETE FROM users');
});

afterAll(() => pool.end());

describe('POST /api/auth/register', () => {
  test('creates a user and returns 201 with token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  test('returns 400 if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'password123' });
    expect(res.status).toBe(400);
  });

  test('returns 400 if password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: '123' });
    expect(res.status).toBe(400);
  });

  test('returns 409 if email already exists', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'otherpass' });
    expect(res.status).toBe(409);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/auth.test.js
```
Expected: FAIL — routes not mounted

- [ ] **Step 3: Create `server/src/routes/auth.js`**

```js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const password_hash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, password_hash]
      );
      const user = result.rows[0];
      res.status(201).json({ token: signToken(user.id), user: { id: user.id, email: user.email } });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Email déjà utilisé' });
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

module.exports = router;
```

- [ ] **Step 4: Mount auth router in `server/src/app.js`**

```js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRouter = require('./routes/auth');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);

module.exports = app;
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- tests/auth.test.js
```
Expected: PASS — 4 register tests green

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/auth.js server/src/app.js server/tests/auth.test.js
git commit -m "feat: auth register endpoint"
```

---

## Task 4: Auth — login + JWT middleware

**Files:**
- Modify: `server/src/routes/auth.js`
- Create: `server/src/middleware/auth.js`

- [ ] **Step 1: Write the failing tests**

Add to `server/tests/auth.test.js` (before `afterAll`):
```js
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@example.com', password: 'password123' });
  });

  test('returns token on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
  });

  test('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('returns 401 on unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});
```

Create `server/tests/middleware.test.js`:
```js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middleware/auth');

const testApp = express();
testApp.use(express.json());
testApp.get('/protected', authMiddleware, (req, res) => res.json({ userId: req.userId }));

test('allows request with valid JWT', async () => {
  const token = jwt.sign({ userId: 'abc-123' }, 'test_secret_do_not_use_in_prod', { expiresIn: '1h' });
  const res = await request(testApp)
    .get('/protected')
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(res.body.userId).toBe('abc-123');
});

test('rejects request without token', async () => {
  const res = await request(testApp).get('/protected');
  expect(res.status).toBe(401);
});

test('rejects request with invalid token', async () => {
  const res = await request(testApp)
    .get('/protected')
    .set('Authorization', 'Bearer invalid.token.here');
  expect(res.status).toBe(401);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/auth.test.js tests/middleware.test.js
```
Expected: FAIL — login route and middleware missing

- [ ] **Step 3: Add login route to `server/src/routes/auth.js`**

Add after the register route (before `module.exports`):
```js
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Identifiants invalides' });

      res.json({ token: signToken(user.id), user: { id: user.id, email: user.email } });
    } catch {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);
```

- [ ] **Step 4: Create `server/src/middleware/auth.js`**

```js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- tests/auth.test.js tests/middleware.test.js
```
Expected: PASS — 7 tests green

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/auth.js server/src/middleware/auth.js server/tests/auth.test.js server/tests/middleware.test.js
git commit -m "feat: auth login endpoint and JWT middleware"
```

---

## Task 5: GraphHopper service

**Files:**
- Create: `server/src/services/graphhopper.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/graphhopper.test.js`:
```js
const nock = require('nock');
const { getRoute } = require('../src/services/graphhopper');

afterEach(() => nock.cleanAll());

const mockGHResponse = {
  paths: [{
    distance: 4850,
    time: 2910000,
    points: {
      type: 'LineString',
      coordinates: [[2.347, 48.859], [2.350, 48.862], [2.347, 48.859]]
    },
    ascend: 45
  }]
};

test('getRoute returns distanceKm, durationMin, elevationGainM and geojson', async () => {
  nock('https://graphhopper.com')
    .post('/api/1/route')
    .reply(200, mockGHResponse);

  const result = await getRoute({
    waypoints: [{ lat: 48.859, lng: 2.347 }, { lat: 48.862, lng: 2.350 }, { lat: 48.859, lng: 2.347 }],
    profile: 'marche',
    apiKey: 'test_key'
  });

  expect(result.distanceKm).toBeCloseTo(4.85, 1);
  expect(result.durationMin).toBeCloseTo(48.5, 0);
  expect(result.elevationGainM).toBe(45);
  expect(result.geojson.type).toBe('LineString');
  expect(result.geojson.coordinates).toHaveLength(3);
});

test('getRoute throws on API error', async () => {
  nock('https://graphhopper.com')
    .post('/api/1/route')
    .reply(400, { message: 'Cannot find point near location' });

  await expect(
    getRoute({ waypoints: [{ lat: 0, lng: 0 }, { lat: 0, lng: 0 }], profile: 'marche', apiKey: 'test_key' })
  ).rejects.toThrow('GraphHopper error');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/graphhopper.test.js
```
Expected: FAIL — "Cannot find module '../src/services/graphhopper'"

- [ ] **Step 3: Create `server/src/services/graphhopper.js`**

```js
const axios = require('axios');

const PROFILE_MAP = {
  marche: 'foot',
  course: 'foot',
  velo: 'bike'
};

async function getRoute({ waypoints, profile, apiKey }) {
  // GraphHopper uses [longitude, latitude] order
  const points = waypoints.map(({ lng, lat }) => [lng, lat]);

  let response;
  try {
    response = await axios.post(
      'https://graphhopper.com/api/1/route',
      {
        points,
        profile: PROFILE_MAP[profile] || profile,
        instructions: false,
        calc_points: true,
        points_encoded: false,
        elevation: true
      },
      { params: { key: apiKey } }
    );
  } catch (err) {
    throw new Error(`GraphHopper error: ${err.response?.data?.message || err.message}`);
  }

  const path = response.data.paths[0];
  return {
    distanceKm: path.distance / 1000,
    durationMin: path.time / 60000,
    elevationGainM: Math.round(path.ascend || 0),
    geojson: path.points  // GeoJSON LineString
  };
}

module.exports = { getRoute, PROFILE_MAP };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/graphhopper.test.js
```
Expected: PASS — 2 tests green

- [ ] **Step 5: Commit**

```bash
git add server/src/services/graphhopper.js server/tests/graphhopper.test.js
git commit -m "feat: GraphHopper routing service"
```

---

## Task 6: Open-Elevation service

**Files:**
- Create: `server/src/services/elevation.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/elevation.test.js`:
```js
const nock = require('nock');
const { getElevationGain } = require('../src/services/elevation');

afterEach(() => nock.cleanAll());

test('getElevationGain returns positive gain only', async () => {
  nock('https://api.open-elevation.com')
    .post('/api/v1/lookup')
    .reply(200, {
      results: [
        { latitude: 48.859, longitude: 2.347, elevation: 35 },
        { latitude: 48.862, longitude: 2.350, elevation: 55 },
        { latitude: 48.864, longitude: 2.352, elevation: 50 },
        { latitude: 48.859, longitude: 2.347, elevation: 35 }
      ]
    });

  // Up: 35→55 = +20, 55→50 = ignored (descent), 50→35 = ignored
  const result = await getElevationGain([[2.347, 48.859], [2.350, 48.862], [2.352, 48.864], [2.347, 48.859]]);
  expect(result).toBe(20);
});

test('getElevationGain returns 0 on API failure (fallback)', async () => {
  nock('https://api.open-elevation.com')
    .post('/api/v1/lookup')
    .reply(500);

  const result = await getElevationGain([[2.347, 48.859]]);
  expect(result).toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/elevation.test.js
```
Expected: FAIL

- [ ] **Step 3: Create `server/src/services/elevation.js`**

```js
const axios = require('axios');

async function getElevationGain(coordinates) {
  try {
    // coordinates are GeoJSON [lng, lat], Open-Elevation wants {latitude, longitude}
    const locations = coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
    const response = await axios.post('https://api.open-elevation.com/api/v1/lookup', { locations });
    const elevations = response.data.results.map(r => r.elevation);

    let gain = 0;
    for (let i = 1; i < elevations.length; i++) {
      const diff = elevations[i] - elevations[i - 1];
      if (diff > 0) gain += diff;
    }
    return Math.round(gain);
  } catch {
    return 0; // fallback silencieux si l'API est indisponible
  }
}

module.exports = { getElevationGain };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/elevation.test.js
```
Expected: PASS — 2 tests green

- [ ] **Step 5: Commit**

```bash
git add server/src/services/elevation.js server/tests/elevation.test.js
git commit -m "feat: Open-Elevation service with silent fallback"
```

---

## Task 7: Loop generator algorithm

**Files:**
- Create: `server/src/services/loopGenerator.js`

- [ ] **Step 1: Write the failing tests**

Create `server/tests/loopGenerator.test.js`:
```js
const {
  calculateTargetDistance,
  radiusFromDistance,
  generateWaypoints
} = require('../src/services/loopGenerator');

describe('calculateTargetDistance', () => {
  test('returns flat distance when no elevation', () => {
    // 30min à 10km/h = 5km
    expect(calculateTargetDistance(30, 10, 0)).toBeCloseTo(5.0, 2);
  });

  test('reduces distance for elevation gain (Naismith rule)', () => {
    // 30min à 10km/h = 5km flat. 300m gain = 0.5h extra → 4.5km
    expect(calculateTargetDistance(30, 10, 300)).toBeCloseTo(4.5, 2);
  });

  test('never returns negative distance', () => {
    expect(calculateTargetDistance(10, 5, 10000)).toBeGreaterThan(0);
  });

  test('15min à 5km/h = 1.25km', () => {
    expect(calculateTargetDistance(15, 5, 0)).toBeCloseTo(1.25, 2);
  });
});

describe('radiusFromDistance', () => {
  test('5km loop → radius ≈ 796m', () => {
    expect(radiusFromDistance(5)).toBeCloseTo(795.8, 0);
  });

  test('10km loop → radius ≈ 1592m', () => {
    expect(radiusFromDistance(10)).toBeCloseTo(1591.5, 0);
  });
});

describe('generateWaypoints', () => {
  test('generates the requested number of waypoints', () => {
    const wps = generateWaypoints(48.8566, 2.3522, 500, 4);
    expect(wps).toHaveLength(4);
  });

  test('each waypoint has lat and lng', () => {
    const wps = generateWaypoints(48.8566, 2.3522, 500, 4);
    wps.forEach(wp => {
      expect(typeof wp.lat).toBe('number');
      expect(typeof wp.lng).toBe('number');
    });
  });

  test('waypoints are at approximately the correct radius from center', () => {
    const lat = 48.8566, lng = 2.3522, radius = 500;
    const wps = generateWaypoints(lat, lng, radius, 4);
    wps.forEach(wp => {
      const dLat = (wp.lat - lat) * 111320;
      const dLng = (wp.lng - lng) * 111320 * Math.cos(lat * Math.PI / 180);
      const dist = Math.sqrt(dLat ** 2 + dLng ** 2);
      expect(dist).toBeCloseTo(radius, -1); // ±50m tolerance
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/loopGenerator.test.js
```
Expected: FAIL — "Cannot find module '../src/services/loopGenerator'"

- [ ] **Step 3: Create `server/src/services/loopGenerator.js`**

```js
/**
 * Calcule la distance cible en km, ajustée pour le dénivelé.
 * Formule de Naismith : +1h pour chaque 600m de dénivelé positif.
 */
function calculateTargetDistance(durationMin, speedKmh, elevationGainM = 0) {
  const totalTimeH = durationMin / 60;
  const elevationTimeH = elevationGainM / 600;
  const flatTimeH = Math.max(totalTimeH - elevationTimeH, 0.02); // minimum 0.02h
  return flatTimeH * speedKmh;
}

/**
 * Calcule le rayon d'un cercle dont le périmètre est la distance donnée.
 * distance en km → rayon en mètres
 */
function radiusFromDistance(distanceKm) {
  return (distanceKm * 1000) / (2 * Math.PI);
}

/**
 * Génère des waypoints en cercle autour d'un point central.
 * Retourne des objets { lat, lng }.
 */
function generateWaypoints(lat, lng, radiusMeters, numPoints = 4) {
  const deltaLat = radiusMeters / 111320;
  const deltaLng = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));
  const waypoints = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    waypoints.push({
      lat: lat + deltaLat * Math.sin(angle),
      lng: lng + deltaLng * Math.cos(angle)
    });
  }
  return waypoints;
}

module.exports = { calculateTargetDistance, radiusFromDistance, generateWaypoints };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/loopGenerator.test.js
```
Expected: PASS — 8 tests green

- [ ] **Step 5: Commit**

```bash
git add server/src/services/loopGenerator.js server/tests/loopGenerator.test.js
git commit -m "feat: loop generator algorithm (distance, radius, waypoints)"
```

---

## Task 8: Route generation endpoint

**Files:**
- Create: `server/src/routes/route.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/route.test.js`:
```js
const request = require('supertest');
const nock = require('nock');
const app = require('../src/app');

afterEach(() => nock.cleanAll());

const mockGHResponse = {
  paths: [{
    distance: 4850,
    time: 2910000,
    points: {
      type: 'LineString',
      coordinates: [[2.347, 48.859], [2.350, 48.862], [2.347, 48.859]]
    },
    ascend: 30
  }]
};

const mockElevationResponse = {
  results: [
    { latitude: 48.859, longitude: 2.347, elevation: 35 },
    { latitude: 48.862, longitude: 2.350, elevation: 55 },
    { latitude: 48.859, longitude: 2.347, elevation: 35 }
  ]
};

function mockExternalAPIs() {
  // Mock multiple GH calls (up to 3 iterations)
  nock('https://graphhopper.com').post('/api/1/route').times(3).reply(200, mockGHResponse);
  nock('https://api.open-elevation.com').post('/api/v1/lookup').times(3).reply(200, mockElevationResponse);
}

describe('POST /api/route/generate', () => {
  test('returns route with required fields', async () => {
    mockExternalAPIs();
    const res = await request(app).post('/api/route/generate').send({
      lat: 48.8566,
      lng: 2.3522,
      activite: 'course',
      duree: 30,
      vitesse: 10
    });
    expect(res.status).toBe(200);
    expect(res.body.geojson).toBeDefined();
    expect(res.body.distanceKm).toBeDefined();
    expect(res.body.durationMin).toBeDefined();
    expect(res.body.elevationGainM).toBeDefined();
  });

  test('returns 400 if lat is missing', async () => {
    const res = await request(app).post('/api/route/generate').send({
      lng: 2.3522, activite: 'course', duree: 30, vitesse: 10
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 if duree is out of range (>180)', async () => {
    const res = await request(app).post('/api/route/generate').send({
      lat: 48.8566, lng: 2.3522, activite: 'course', duree: 200, vitesse: 10
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 if activite is invalid', async () => {
    const res = await request(app).post('/api/route/generate').send({
      lat: 48.8566, lng: 2.3522, activite: 'natation', duree: 30, vitesse: 10
    });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/route.test.js
```
Expected: FAIL

- [ ] **Step 3: Create `server/src/routes/route.js`**

```js
const express = require('express');
const { body, validationResult } = require('express-validator');
const { getRoute } = require('../services/graphhopper');
const { getElevationGain } = require('../services/elevation');
const {
  calculateTargetDistance,
  radiusFromDistance,
  generateWaypoints
} = require('../services/loopGenerator');

const router = express.Router();
const MAX_ITERATIONS = 3;
const TOLERANCE = 0.1; // ±10%

router.post(
  '/generate',
  [
    body('lat').isFloat({ min: -90, max: 90 }),
    body('lng').isFloat({ min: -180, max: 180 }),
    body('activite').isIn(['marche', 'course', 'velo']),
    body('duree').isInt({ min: 5, max: 180 }),
    body('vitesse').isFloat({ min: 2, max: 50 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { lat, lng, activite, duree, vitesse } = req.body;
    const apiKey = process.env.GRAPHHOPPER_API_KEY;

    try {
      let targetDistance = calculateTargetDistance(duree, vitesse, 0);
      let radius = radiusFromDistance(targetDistance);
      let route;

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        // waypoints : départ → 4 points en cercle → retour départ
        const circlePoints = generateWaypoints(lat, lng, radius, 4);
        const waypoints = [{ lat, lng }, ...circlePoints, { lat, lng }];

        route = await getRoute({ waypoints, profile: activite, apiKey });

        const elevGain = await getElevationGain(route.geojson.coordinates);
        route.elevationGainM = elevGain;

        const adjustedTarget = calculateTargetDistance(duree, vitesse, elevGain);
        const ratio = adjustedTarget / route.distanceKm;

        if (Math.abs(ratio - 1) <= TOLERANCE) break;
        radius = radius * ratio;
      }

      res.json({
        geojson: route.geojson,
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        elevationGainM: route.elevationGainM
      });
    } catch (err) {
      if (err.message.startsWith('GraphHopper error')) {
        return res.status(422).json({ error: err.message });
      }
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

module.exports = router;
```

- [ ] **Step 4: Mount route router in `server/src/app.js`**

```js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRouter = require('./routes/auth');
const routeRouter = require('./routes/route');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/route', routeRouter);

module.exports = app;
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- tests/route.test.js
```
Expected: PASS — 4 tests green

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/route.js server/src/app.js server/tests/route.test.js
git commit -m "feat: route generation endpoint with elevation-adjusted loop"
```

---

## Task 9: Saved routes endpoints

**Files:**
- Create: `server/src/routes/saved.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/saved.test.js`:
```js
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

let token, userId;

beforeAll(async () => {
  await pool.query("DELETE FROM users WHERE email = 'saved@example.com'");
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'saved@example.com', password: 'password123' });
  token = res.body.token;
  userId = res.body.user.id;
});

beforeEach(async () => {
  await pool.query('DELETE FROM saved_routes WHERE user_id = $1', [userId]);
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email = 'saved@example.com'");
  await pool.end();
});

const sampleRoute = {
  activite: 'course',
  duree: 30,
  distance: 4.8,
  denivele: 45,
  geojson: { type: 'LineString', coordinates: [[2.347, 48.859], [2.350, 48.862]] }
};

describe('GET /api/routes/saved', () => {
  test('returns empty array when no routes', async () => {
    const res = await request(app)
      .get('/api/routes/saved')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/routes/saved');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/routes/saved', () => {
  test('saves a route and returns it with auto-generated nom', async () => {
    const res = await request(app)
      .post('/api/routes/saved')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleRoute);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.activite).toBe('course');
    expect(res.body.nom).toMatch(/course/i);
  });

  test('returns 401 without token', async () => {
    const res = await request(app).post('/api/routes/saved').send(sampleRoute);
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/routes/saved/:id', () => {
  test('deletes a saved route', async () => {
    const created = await request(app)
      .post('/api/routes/saved')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleRoute);
    const id = created.body.id;

    const res = await request(app)
      .delete(`/api/routes/saved/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  test('returns 404 for non-existent route', async () => {
    const res = await request(app)
      .delete('/api/routes/saved/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/saved.test.js
```
Expected: FAIL

- [ ] **Step 3: Create `server/src/routes/saved.js`**

```js
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM saved_routes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post(
  '/',
  [
    body('activite').isIn(['marche', 'course', 'velo']),
    body('duree').isInt({ min: 5, max: 180 }),
    body('distance').isFloat({ min: 0 }),
    body('geojson').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { activite, duree, distance, denivele, geojson } = req.body;
    const now = new Date();
    const label = `${activite.charAt(0).toUpperCase() + activite.slice(1)} ${duree}min`;
    const nom = `${label} – ${now.getDate()} ${now.toLocaleString('fr-FR', { month: 'short' })}`;

    try {
      const result = await pool.query(
        `INSERT INTO saved_routes (user_id, nom, activite, duree, distance, denivele, geojson)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [req.userId, nom, activite, duree, distance, denivele || null, JSON.stringify(geojson)]
      );
      res.status(201).json(result.rows[0]);
    } catch {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM saved_routes WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Itinéraire introuvable' });
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
```

- [ ] **Step 4: Mount saved router in `server/src/app.js`**

```js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRouter = require('./routes/auth');
const routeRouter = require('./routes/route');
const savedRouter = require('./routes/saved');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/route', routeRouter);
app.use('/api/routes/saved', savedRouter);

module.exports = app;
```

- [ ] **Step 5: Run all backend tests**

```bash
npm test
```
Expected: PASS — tous les tests green

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/saved.js server/src/app.js server/tests/saved.test.js
git commit -m "feat: saved routes CRUD endpoints"
```

---

## Task 10: Client — project setup

**Files:**
- Create: `client/` (Vite React project)

- [ ] **Step 1: Scaffold Vite + React client**

```bash
cd C:/Users/Rayane/Dev/ChronoPath
npm create vite@latest client -- --template react
cd client
npm install
npm install axios leaflet react-leaflet
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Configure Vite for tests in `client/vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3000' }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js']
  }
});
```

- [ ] **Step 3: Create `client/src/test-setup.js`**

```js
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Add test script to `client/package.json`**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  }
}
```

- [ ] **Step 5: Create `client/.env.example`**

```
VITE_API_BASE_URL=
```

> Laisser vide en développement : le proxy Vite redirige `/api` vers `localhost:3000`.

- [ ] **Step 6: Delete Vite boilerplate files**

```bash
rm client/src/App.css client/src/App.jsx client/src/assets/react.svg
```

- [ ] **Step 7: Commit**

```bash
cd C:/Users/Rayane/Dev/ChronoPath
git add client/
git commit -m "feat: Vite React client setup with Leaflet and Vitest"
```

---

## Task 11: API client module

**Files:**
- Create: `client/src/api/client.js`
- Create: `client/src/api/auth.js`
- Create: `client/src/api/routes.js`

- [ ] **Step 1: Write the failing test**

Create `client/src/api/__tests__/auth.test.js`:
```js
import { vi } from 'vitest';
import { login, register } from '../auth';

vi.mock('../client', () => ({
  default: {
    post: vi.fn()
  }
}));

import apiClient from '../client';

test('login calls POST /api/auth/login with credentials', async () => {
  apiClient.post.mockResolvedValue({ data: { token: 'abc', user: { id: '1', email: 'a@b.com' } } });
  const result = await login('a@b.com', 'password123');
  expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', {
    email: 'a@b.com',
    password: 'password123'
  });
  expect(result.token).toBe('abc');
});

test('register calls POST /api/auth/register', async () => {
  apiClient.post.mockResolvedValue({ data: { token: 'xyz', user: { id: '2', email: 'b@c.com' } } });
  const result = await register('b@c.com', 'pass123');
  expect(apiClient.post).toHaveBeenCalledWith('/api/auth/register', {
    email: 'b@c.com',
    password: 'pass123'
  });
  expect(result.token).toBe('xyz');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd client && npm test src/api/__tests__/auth.test.js
```
Expected: FAIL

- [ ] **Step 3: Create `client/src/api/client.js`**

```js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || ''
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// JWT expiré → déconnexion automatique
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

- [ ] **Step 4: Create `client/src/api/auth.js`**

```js
import apiClient from './client';

export async function login(email, password) {
  const res = await apiClient.post('/api/auth/login', { email, password });
  return res.data;
}

export async function register(email, password) {
  const res = await apiClient.post('/api/auth/register', { email, password });
  return res.data;
}
```

- [ ] **Step 5: Create `client/src/api/routes.js`**

```js
import apiClient from './client';

export async function generateRoute(params) {
  const res = await apiClient.post('/api/route/generate', params);
  return res.data;
}

export async function getSavedRoutes() {
  const res = await apiClient.get('/api/routes/saved');
  return res.data;
}

export async function saveRoute(routeData) {
  const res = await apiClient.post('/api/routes/saved', routeData);
  return res.data;
}

export async function deleteRoute(id) {
  await apiClient.delete(`/api/routes/saved/${id}`);
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npm test src/api/__tests__/auth.test.js
```
Expected: PASS — 2 tests green

- [ ] **Step 7: Commit**

```bash
cd C:/Users/Rayane/Dev/ChronoPath
git add client/src/api/
git commit -m "feat: API client module with JWT interceptor"
```

---

## Task 12: useGeolocation hook

**Files:**
- Create: `client/src/hooks/useGeolocation.js`

- [ ] **Step 1: Write the failing test**

Create `client/src/hooks/__tests__/useGeolocation.test.js`:
```js
import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import useGeolocation from '../useGeolocation';

test('returns GPS position on success', async () => {
  vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success) =>
    success({ coords: { latitude: 48.8566, longitude: 2.3522 } })
  );

  const { result } = renderHook(() => useGeolocation());
  await waitFor(() => expect(result.current.position).not.toBeNull());

  expect(result.current.position).toEqual({ lat: 48.8566, lng: 2.3522 });
  expect(result.current.error).toBeNull();
});

test('falls back to Paris and sets error message on denied permission', async () => {
  vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((_, error) =>
    error(new Error('Permission denied'))
  );

  const { result } = renderHook(() => useGeolocation());
  await waitFor(() => expect(result.current.position).not.toBeNull());

  expect(result.current.position).toEqual({ lat: 48.8566, lng: 2.3522 });
  expect(result.current.error).toBe('Autorisez la géolocalisation pour un meilleur résultat');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test src/hooks/__tests__/useGeolocation.test.js
```
Expected: FAIL

- [ ] **Step 3: Create `client/src/hooks/useGeolocation.js`**

```js
import { useState, useEffect } from 'react';

const DEFAULT_POSITION = { lat: 48.8566, lng: 2.3522 }; // Paris

export default function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition(DEFAULT_POSITION);
      setError('Géolocalisation non supportée par votre navigateur');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => {
        setPosition(DEFAULT_POSITION);
        setError('Autorisez la géolocalisation pour un meilleur résultat');
      }
    );
  }, []);

  return { position, error };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test src/hooks/__tests__/useGeolocation.test.js
```
Expected: PASS — 2 tests green

- [ ] **Step 5: Commit**

```bash
cd C:/Users/Rayane/Dev/ChronoPath
git add client/src/hooks/useGeolocation.js client/src/hooks/__tests__/useGeolocation.test.js
git commit -m "feat: useGeolocation hook with Paris fallback"
```

---

## Task 13: useAuth hook

**Files:**
- Create: `client/src/hooks/useAuth.js`

- [ ] **Step 1: Write the failing test**

Create `client/src/hooks/__tests__/useAuth.test.js`:
```js
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import useAuth from '../useAuth';
import * as authApi from '../../api/auth';

vi.mock('../../api/auth');

beforeEach(() => localStorage.clear());

test('initializes as logged out when no token in localStorage', () => {
  const { result } = renderHook(() => useAuth());
  expect(result.current.user).toBeNull();
});

test('login stores token and user, sets user state', async () => {
  authApi.login.mockResolvedValue({ token: 'tok123', user: { id: '1', email: 'a@b.com' } });

  const { result } = renderHook(() => useAuth());
  await act(async () => { await result.current.login('a@b.com', 'pass'); });

  expect(localStorage.getItem('token')).toBe('tok123');
  expect(result.current.user).toEqual({ id: '1', email: 'a@b.com' });
});

test('logout clears localStorage and user state', async () => {
  authApi.login.mockResolvedValue({ token: 'tok123', user: { id: '1', email: 'a@b.com' } });

  const { result } = renderHook(() => useAuth());
  await act(async () => { await result.current.login('a@b.com', 'pass'); });
  act(() => result.current.logout());

  expect(localStorage.getItem('token')).toBeNull();
  expect(result.current.user).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test src/hooks/__tests__/useAuth.test.js
```
Expected: FAIL

- [ ] **Step 3: Create `client/src/hooks/useAuth.js`**

```js
import { useState } from 'react';
import { login as apiLogin, register as apiRegister } from '../api/auth';

export default function useAuth() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  async function login(email, password) {
    const data = await apiLogin(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }

  async function register(email, password) {
    const data = await apiRegister(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return { user, login, register, logout };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test src/hooks/__tests__/useAuth.test.js
```
Expected: PASS — 3 tests green

- [ ] **Step 5: Commit**

```bash
cd C:/Users/Rayane/Dev/ChronoPath
git add client/src/hooks/useAuth.js client/src/hooks/__tests__/useAuth.test.js
git commit -m "feat: useAuth hook with localStorage persistence"
```

---

## Task 14: Panel component

**Files:**
- Create: `client/src/components/Panel.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/__tests__/Panel.test.jsx`:
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Panel from '../Panel';

const defaultProps = {
  onGenerate: vi.fn(),
  onSave: vi.fn(),
  onShowFavorites: vi.fn(),
  isLoggedIn: false,
  loading: false,
  error: null,
  route: null
};

test('renders all three activity buttons', () => {
  render(<Panel {...defaultProps} />);
  expect(screen.getByRole('button', { name: /marche/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /course/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /vélo/i })).toBeInTheDocument();
});

test('calls onGenerate with activity, duree, vitesse on click', () => {
  const onGenerate = vi.fn();
  render(<Panel {...defaultProps} onGenerate={onGenerate} />);

  fireEvent.click(screen.getByRole('button', { name: /course/i }));
  fireEvent.click(screen.getByRole('button', { name: /générer/i }));

  expect(onGenerate).toHaveBeenCalledWith(
    expect.objectContaining({ activite: 'course', duree: expect.any(Number), vitesse: expect.any(Number) })
  );
});

test('shows save button only when route exists AND user is logged in', () => {
  const { rerender } = render(<Panel {...defaultProps} />);
  expect(screen.queryByRole('button', { name: /sauvegarder/i })).toBeNull();

  rerender(<Panel {...defaultProps} route={{ distanceKm: 5 }} isLoggedIn={false} />);
  expect(screen.queryByRole('button', { name: /sauvegarder/i })).toBeNull();

  rerender(<Panel {...defaultProps} route={{ distanceKm: 5 }} isLoggedIn={true} />);
  expect(screen.getByRole('button', { name: /sauvegarder/i })).toBeInTheDocument();
});

test('displays error message when error prop is set', () => {
  render(<Panel {...defaultProps} error="Pas d'itinéraire possible" />);
  expect(screen.getByText("Pas d'itinéraire possible")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test src/components/__tests__/Panel.test.jsx
```
Expected: FAIL

- [ ] **Step 3: Create `client/src/components/Panel.jsx`**

```jsx
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test src/components/__tests__/Panel.test.jsx
```
Expected: PASS — 4 tests green

- [ ] **Step 5: Commit**

```bash
cd C:/Users/Rayane/Dev/ChronoPath
git add client/src/components/Panel.jsx client/src/components/__tests__/Panel.test.jsx
git commit -m "feat: Panel component with activity/duration/speed selectors"
```

---

## Task 15: AuthModal component

**Files:**
- Create: `client/src/components/AuthModal.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/__tests__/AuthModal.test.jsx`:
```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthModal from '../AuthModal';

test('renders login form by default', () => {
  render(<AuthModal onClose={vi.fn()} onAuth={vi.fn()} />);
  expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
});

test('switches to register form when clicking créer un compte', () => {
  render(<AuthModal onClose={vi.fn()} onAuth={vi.fn()} />);
  fireEvent.click(screen.getByText(/créer un compte/i));
  expect(screen.getByRole('heading', { name: /inscription/i })).toBeInTheDocument();
});

test('calls onAuth with mode login, email, password on submit', async () => {
  const onAuth = vi.fn().mockResolvedValue(undefined);
  render(<AuthModal onClose={vi.fn()} onAuth={onAuth} />);

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'pass123' } });
  fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

  await waitFor(() =>
    expect(onAuth).toHaveBeenCalledWith('login', 'test@example.com', 'pass123')
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test src/components/__tests__/AuthModal.test.jsx
```
Expected: FAIL

- [ ] **Step 3: Create `client/src/components/AuthModal.jsx`**

```jsx
import { useState } from 'react';

export default function AuthModal({ onClose, onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
        <h2>{mode === 'login' ? 'Connexion' : 'Inscription'}</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Créer un compte' : 'Déjà un compte ? Se connecter'}
        </button>
        <button type="button" onClick={onClose}>✕ Fermer</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test src/components/__tests__/AuthModal.test.jsx
```
Expected: PASS — 3 tests green

- [ ] **Step 5: Commit**

```bash
cd C:/Users/Rayane/Dev/ChronoPath
git add client/src/components/AuthModal.jsx client/src/components/__tests__/AuthModal.test.jsx
git commit -m "feat: AuthModal login/register component"
```

---

## Task 16: Map component

**Files:**
- Create: `client/src/components/Map.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/__tests__/Map.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Polyline: ({ positions }) => (
    <div data-testid="polyline" data-count={positions.length} />
  ),
  Marker: () => <div data-testid="marker" />,
  useMap: () => ({ setView: vi.fn() })
}));

vi.mock('leaflet', () => ({
  default: { Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } } }
}));

import Map from '../Map';

test('renders map container', () => {
  render(<Map position={{ lat: 48.8566, lng: 2.3522 }} route={null} />);
  expect(screen.getByTestId('map')).toBeInTheDocument();
});

test('renders marker at current position', () => {
  render(<Map position={{ lat: 48.8566, lng: 2.3522 }} route={null} />);
  expect(screen.getByTestId('marker')).toBeInTheDocument();
});

test('renders polyline when route has coordinates', () => {
  const route = {
    geojson: {
      type: 'LineString',
      coordinates: [[2.347, 48.859], [2.350, 48.862], [2.347, 48.859]]
    }
  };
  render(<Map position={{ lat: 48.8566, lng: 2.3522 }} route={route} />);
  expect(screen.getByTestId('polyline')).toBeInTheDocument();
  expect(screen.getByTestId('polyline').dataset.count).toBe('3');
});

test('does not render polyline when route is null', () => {
  render(<Map position={{ lat: 48.8566, lng: 2.3522 }} route={null} />);
  expect(screen.queryByTestId('polyline')).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test src/components/__tests__/Map.test.jsx
```
Expected: FAIL

- [ ] **Step 3: Create `client/src/components/Map.jsx`**

```jsx
import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons pour Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng]);
  }, [position, map]);
  return null;
}

export default function Map({ position, route }) {
  const center = position ? [position.lat, position.lng] : [48.8566, 2.3522];

  // GeoJSON: [lng, lat] → Leaflet: [lat, lng]
  const polylinePositions = route?.geojson?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];

  return (
    <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {position && <Marker position={[position.lat, position.lng]} />}
      {polylinePositions.length > 0 && (
        <Polyline positions={polylinePositions} color="#3b82f6" weight={4} />
      )}
      <RecenterMap position={position} />
    </MapContainer>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test src/components/__tests__/Map.test.jsx
```
Expected: PASS — 4 tests green

- [ ] **Step 5: Commit**

```bash
cd C:/Users/Rayane/Dev/ChronoPath
git add client/src/components/Map.jsx client/src/components/__tests__/Map.test.jsx
git commit -m "feat: Map component with Leaflet OSM and route polyline"
```

---

## Task 17: FavoritesList component

**Files:**
- Create: `client/src/components/FavoritesList.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/__tests__/FavoritesList.test.jsx`:
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import FavoritesList from '../FavoritesList';

const routes = [
  { id: '1', nom: 'Course 30min – 28 mar', activite: 'course', distance: 4.8, duree: 30 },
  { id: '2', nom: 'Marche 45min – 27 mar', activite: 'marche', distance: 3.5, duree: 45 }
];

test('renders all saved route names', () => {
  render(<FavoritesList routes={routes} onSelect={vi.fn()} onDelete={vi.fn()} />);
  expect(screen.getByText('Course 30min – 28 mar')).toBeInTheDocument();
  expect(screen.getByText('Marche 45min – 27 mar')).toBeInTheDocument();
});

test('calls onSelect with the route when clicking a route name', () => {
  const onSelect = vi.fn();
  render(<FavoritesList routes={routes} onSelect={onSelect} onDelete={vi.fn()} />);
  fireEvent.click(screen.getByText('Course 30min – 28 mar'));
  expect(onSelect).toHaveBeenCalledWith(routes[0]);
});

test('calls onDelete with route id when clicking delete button', () => {
  const onDelete = vi.fn();
  render(<FavoritesList routes={routes} onSelect={vi.fn()} onDelete={onDelete} />);
  const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
  fireEvent.click(deleteButtons[0]);
  expect(onDelete).toHaveBeenCalledWith('1');
});

test('shows empty state when routes array is empty', () => {
  render(<FavoritesList routes={[]} onSelect={vi.fn()} onDelete={vi.fn()} />);
  expect(screen.getByText(/aucun itinéraire sauvegardé/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test src/components/__tests__/FavoritesList.test.jsx
```
Expected: FAIL

- [ ] **Step 3: Create `client/src/components/FavoritesList.jsx`**

```jsx
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test src/components/__tests__/FavoritesList.test.jsx
```
Expected: PASS — 4 tests green

- [ ] **Step 5: Commit**

```bash
cd C:/Users/Rayane/Dev/ChronoPath
git add client/src/components/FavoritesList.jsx client/src/components/__tests__/FavoritesList.test.jsx
git commit -m "feat: FavoritesList component"
```

---

## Task 18: App integration

**Files:**
- Create: `client/src/App.jsx`
- Create: `client/src/App.css`
- Modify: `client/src/main.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/App.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('./components/Map', () => ({ default: () => <div data-testid="map" /> }));
vi.mock('./components/Panel', () => ({
  default: ({ onGenerate }) => (
    <button onClick={() => onGenerate({ activite: 'course', duree: 30, vitesse: 10 })}>
      Generate
    </button>
  )
}));
vi.mock('./components/AuthModal', () => ({ default: () => null }));
vi.mock('./components/FavoritesList', () => ({ default: () => null }));
vi.mock('./hooks/useGeolocation', () => ({
  default: () => ({ position: { lat: 48.8566, lng: 2.3522 }, error: null })
}));
vi.mock('./hooks/useAuth', () => ({
  default: () => ({ user: null, login: vi.fn(), register: vi.fn(), logout: vi.fn() })
}));

import App from './App';

test('renders ChronoPath header', () => {
  render(<App />);
  expect(screen.getByText('ChronoPath')).toBeInTheDocument();
});

test('renders map and panel', () => {
  render(<App />);
  expect(screen.getByTestId('map')).toBeInTheDocument();
  expect(screen.getByText('Generate')).toBeInTheDocument();
});

test('shows login button when not authenticated', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /connexion/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test src/App.test.jsx
```
Expected: FAIL

- [ ] **Step 3: Create `client/src/App.jsx`**

```jsx
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
```

- [ ] **Step 4: Create `client/src/App.css`**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body { font-family: system-ui, -apple-system, sans-serif; }

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #1e293b;
  color: white;
  flex-shrink: 0;
}

header h1 { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.5px; }
.header-right { display: flex; align-items: center; gap: 1rem; }
.header-right button { background: none; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem; }
.header-right button:hover { background: rgba(255,255,255,0.1); }
.geo-warning { font-size: 0.75rem; color: #fbbf24; }

main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.panel {
  width: 280px;
  flex-shrink: 0;
  padding: 1rem;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.map-container { flex: 1; }

.activity-selector { display: flex; gap: 0.5rem; }
.activity-selector button {
  flex: 1; padding: 0.5rem 0.25rem;
  border: 2px solid #e2e8f0; border-radius: 8px;
  cursor: pointer; background: white; font-size: 0.8rem;
  transition: all 0.15s;
}
.activity-selector button.active {
  background: #3b82f6; color: white; border-color: #3b82f6;
}

.duration-selector { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.duration-selector label { display: flex; align-items: center; gap: 0.25rem; cursor: pointer; font-size: 0.875rem; }

.speed-input label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
.speed-input input { width: 60px; padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; }

.panel > button {
  padding: 0.6rem; border: none; border-radius: 8px;
  cursor: pointer; font-size: 0.9rem; font-weight: 500;
  background: #3b82f6; color: white;
  transition: background 0.15s;
}
.panel > button:hover { background: #2563eb; }
.panel > button:disabled { background: #94a3b8; cursor: not-allowed; }
.panel > button:last-child { background: #f1f5f9; color: #475569; }
.panel > button:last-child:hover { background: #e2e8f0; }

.route-info {
  font-size: 0.85rem; color: #475569;
  background: #e2e8f0; padding: 0.6rem 0.75rem;
  border-radius: 8px; text-align: center;
}

.error { color: #ef4444; font-size: 0.8rem; background: #fef2f2; padding: 0.5rem; border-radius: 6px; }

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}

.modal {
  background: white; padding: 1.5rem;
  border-radius: 12px; width: 340px;
  display: flex; flex-direction: column; gap: 0.75rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal h2 { font-size: 1.1rem; font-weight: 600; }
.modal form { display: flex; flex-direction: column; gap: 0.5rem; }
.modal label { font-size: 0.875rem; font-weight: 500; color: #374151; }
.modal input {
  padding: 0.6rem; border: 1px solid #d1d5db;
  border-radius: 6px; font-size: 0.9rem; width: 100%;
}
.modal input:focus { outline: 2px solid #3b82f6; border-color: transparent; }
.modal button[type="submit"] {
  margin-top: 0.25rem; padding: 0.6rem;
  background: #3b82f6; color: white;
  border: none; border-radius: 6px;
  font-size: 0.9rem; font-weight: 500; cursor: pointer;
}
.modal button[type="button"] {
  background: none; border: none; color: #6b7280;
  font-size: 0.85rem; cursor: pointer; text-align: left; padding: 0.25rem 0;
}

.favorites-list { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto; }
.favorites-list li {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.6rem 0.75rem; border: 1px solid #e2e8f0;
  border-radius: 8px; background: #f8fafc;
}
.favorites-list .route-name {
  flex: 1; text-align: left; background: none; border: none;
  cursor: pointer; font-size: 0.875rem; color: #1e293b;
}
.favorites-list .route-name:hover { color: #3b82f6; }
.favorites-list span { font-size: 0.8rem; color: #94a3b8; white-space: nowrap; }
.favorites-list li > button:last-child {
  background: none; border: none; color: #cbd5e1;
  cursor: pointer; font-size: 0.9rem; padding: 0.2rem;
}
.favorites-list li > button:last-child:hover { color: #ef4444; }
```

- [ ] **Step 5: Update `client/src/main.jsx`**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npm test src/App.test.jsx
```
Expected: PASS — 3 tests green

- [ ] **Step 7: Run all client tests**

```bash
npm test
```
Expected: PASS — tous les tests green

- [ ] **Step 8: Commit**

```bash
cd C:/Users/Rayane/Dev/ChronoPath
git add client/src/App.jsx client/src/App.css client/src/App.test.jsx client/src/main.jsx
git commit -m "feat: App integration — ChronoPath MVP complet"
```

---

## Task 19: End-to-end verification

- [ ] **Step 1: Run all backend tests**

```bash
cd C:/Users/Rayane/Dev/ChronoPath/server && npm test
```
Expected: PASS — tous les tests green, aucune suite failing

- [ ] **Step 2: Run all client tests**

```bash
cd C:/Users/Rayane/Dev/ChronoPath/client && npm test
```
Expected: PASS — tous les tests green

- [ ] **Step 3: Start dev servers and verify manually**

Terminal 1:
```bash
cd C:/Users/Rayane/Dev/ChronoPath/server && npm run dev
```

Terminal 2:
```bash
cd C:/Users/Rayane/Dev/ChronoPath/client && npm run dev
```

Ouvrir `http://localhost:5173` et vérifier :
1. La carte se charge centrée sur ta position (ou Paris si refusé)
2. Sélectionner une activité + durée + vitesse → clic "Générer" → boucle dessinée sur la carte
3. S'inscrire / se connecter fonctionne
4. Sauvegarder une boucle et la retrouver dans les favoris

- [ ] **Step 4: Final commit**

```bash
cd C:/Users/Rayane/Dev/ChronoPath
git add .
git commit -m "chore: ChronoPath MVP — verification complete"
```
