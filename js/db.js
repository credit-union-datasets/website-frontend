let db = null;
const cache = new Map();

export async function initDB() {
  const SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });

  const response = await fetch('data/beautiful_data.db');
  const buffer = await response.arrayBuffer();
  db = new SQL.Database(new Uint8Array(buffer));

  return db;
}

export function query(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);

  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function cachedQuery(key, sql, params = []) {
  if (cache.has(key)) return cache.get(key);
  const result = query(sql, params);
  cache.set(key, result);
  return result;
}

export function clearCache() {
  cache.clear();
}
