const pool = require('../src/db/pool');

afterAll(() => pool.end());

test('pool connects to database', async () => {
  const [rows] = await pool.query('SELECT 1 AS value');
  expect(rows[0].value).toBe(1);
});
