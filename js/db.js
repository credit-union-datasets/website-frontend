let db = null;
const cache = new Map();

export async function initDB() {
  const [SQL, buffer] = await Promise.all([
    initSqlJs({ locateFile: file => `vendor/${file}` }),
    fetch('data/beautiful_data.db').then(r => r.arrayBuffer())
  ]);
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
