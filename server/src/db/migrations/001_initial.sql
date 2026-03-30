CREATE TABLE IF NOT EXISTS users (
  id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email          VARCHAR(255) UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  vitesse_marche FLOAT DEFAULT 5,
  vitesse_course FLOAT DEFAULT 10,
  vitesse_velo   FLOAT DEFAULT 20,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_routes (
  id         CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id    CHAR(36) NOT NULL,
  nom        VARCHAR(255),
  activite   VARCHAR(20) NOT NULL,
  duree      INTEGER NOT NULL,
  distance   FLOAT NOT NULL,
  denivele   INTEGER,
  geojson    JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
