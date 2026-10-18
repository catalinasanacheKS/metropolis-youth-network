/**
 * Metropolis Youth Network — Pages advanced worker (_worker.js)
 * Backend on the EXISTING D1 database (binding: DB), matching the live schema.
 *
 * API (same contract the frontend expects):
 *   GET    /api/theatres        -> { theatres: [...] }
 *   POST   /api/theatres        -> { theatre: {...} }   (user via "x-user" header or body._user)
 *   PUT    /api/theatres/:id     -> { theatre: {...} }   (user via "x-user" header)
 *   DELETE /api/theatres/:id     -> { ok: true }         (user via "x-user" header)
 *   GET    /api/activity         -> { activity: [...] }
 *
 * D1 schema:
 *   theatres(id, name, city, country, cc, founded, type, website, age_range,
 *            tagline, profile, repertoire, awards, international, mission,
 *            lat, lng, created_at, updated_at)
 *   activity(id, user, action, target, target_id, ts)
 *
 * JSON<->column mapping: ageRange<->age_range, missionFit(bool)<->mission(0/1),
 *   createdAt<->created_at, updatedAt<->updated_at; others identical.
 * If the theatres table is empty (e.g. a fresh local DB), it self-seeds once
 * from the bundled seed-theatres.json. In production the table already holds
 * the data, so seeding never runs there.
 */

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });

function slug(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function rand(n = 4) { return Math.random().toString(36).slice(2, 2 + n); }

// Columns in the theatres table (DB order), excluding id/created_at/updated_at handled explicitly.
const FIELD_COLS = [
  ["name", "name"], ["city", "city"], ["country", "country"], ["cc", "cc"],
  ["founded", "founded"], ["type", "type"], ["website", "website"],
  ["ageRange", "age_range"], ["tagline", "tagline"], ["profile", "profile"],
  ["repertoire", "repertoire"], ["awards", "awards"], ["international", "international"],
  ["missionFit", "mission"], ["lat", "lat"], ["lng", "lng"],
];

function rowToObj(r) {
  return {
    id: r.id, name: r.name, city: r.city, country: r.country, cc: r.cc,
    founded: r.founded, type: r.type, website: r.website, ageRange: r.age_range,
    tagline: r.tagline, profile: r.profile, repertoire: r.repertoire, awards: r.awards,
    international: r.international, missionFit: !!r.mission, lat: r.lat, lng: r.lng,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}
function colValue(jsonKey, obj) {
  if (jsonKey === "missionFit") return obj.missionFit ? 1 : 0;
  if (jsonKey === "founded") return (obj.founded === "" || obj.founded == null) ? null : (parseInt(obj.founded, 10) || null);
  if (jsonKey === "lat" || jsonKey === "lng") return (obj[jsonKey] === "" || obj[jsonKey] == null) ? null : Number(obj[jsonKey]);
  const v = obj[jsonKey];
  return v === undefined ? null : v;
}

async function ensureSchema(env) {
  await env.DB.exec(
    "CREATE TABLE IF NOT EXISTS theatres (id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, country TEXT NOT NULL, cc TEXT, founded INTEGER, type TEXT, website TEXT, age_range TEXT, tagline TEXT, profile TEXT, repertoire TEXT, awards TEXT, international TEXT, mission INTEGER, lat REAL, lng REAL, created_at TEXT, updated_at TEXT);"
  );
  await env.DB.exec(
    "CREATE TABLE IF NOT EXISTS activity (id TEXT PRIMARY KEY, user TEXT, action TEXT, target TEXT, target_id TEXT, ts TEXT);"
  );
}

async function seedIfEmpty(env) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM theatres").first();
  if (row && row.n > 0) return;
  let seed = [];
  try {
    const res = await env.ASSETS.fetch(new Request("https://assets.local/seed-theatres.json"));
    if (res && res.ok) seed = await res.json();
  } catch (e) { /* no seed */ }
  if (!Array.isArray(seed) || !seed.length) return;
  const cols = ["id", ...FIELD_COLS.map(c => c[1]), "created_at", "updated_at"];
  const placeholders = cols.map(() => "?").join(", ");
  const stmt = env.DB.prepare(`INSERT OR IGNORE INTO theatres (${cols.join(", ")}) VALUES (${placeholders})`);
  const batch = seed.map(t => {
    const vals = [t.id || (slug(t.name) + "-" + slug(t.country) + "-" + rand(3))];
    for (const [jk] of FIELD_COLS) vals.push(colValue(jk, t));
    vals.push(t.createdAt || new Date().toISOString(), t.updatedAt || new Date().toISOString());
    return stmt.bind(...vals);
  });
  await env.DB.batch(batch);
}

const userOf = (request, body) =>
  (request.headers.get("x-user") || (body && body._user) || "necunoscut").toString().slice(0, 80);

async function logActivity(env, { user, action, target, targetId }) {
  try {
    await env.DB.prepare("INSERT INTO activity (id, user, action, target, target_id, ts) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(Date.now() + "-" + rand(5), user || "necunoscut", action, target || "", targetId || "", new Date().toISOString())
      .run();
  } catch (e) { /* non-fatal */ }
}

async function handleApi(request, env, url) {
  if (!env.DB) return json({ error: "no_database" }, 503);
  await ensureSchema(env);

  const path = url.pathname.replace(/^\/api/, "");
  const method = request.method.toUpperCase();

  if (path === "/theatres" && method === "GET") {
    await seedIfEmpty(env);
    const { results } = await env.DB.prepare("SELECT * FROM theatres ORDER BY name COLLATE NOCASE").all();
    return json({ theatres: (results || []).map(rowToObj) });
  }

  if (path === "/theatres" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    if (!body.name || !body.city || !body.country) return json({ error: "missing_fields" }, 400);
    const user = userOf(request, body);
    const base = (slug(body.name) + "-" + slug(body.country)) || ("t-" + rand(6));
    let id = base;
    while (await env.DB.prepare("SELECT 1 FROM theatres WHERE id = ?").bind(id).first()) id = base + "-" + rand(3);
    const now = new Date().toISOString();
    const cols = ["id", ...FIELD_COLS.map(c => c[1]), "created_at", "updated_at"];
    const vals = [id, ...FIELD_COLS.map(([jk]) => colValue(jk, body)), now, now];
    await env.DB.prepare(`INSERT INTO theatres (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`).bind(...vals).run();
    await logActivity(env, { user, action: "add", target: body.name, targetId: id });
    const created = await env.DB.prepare("SELECT * FROM theatres WHERE id = ?").bind(id).first();
    return json({ theatre: rowToObj(created) }, 201);
  }

  const m = path.match(/^\/theatres\/([^/]+)$/);
  if (m && method === "PUT") {
    const id = decodeURIComponent(m[1]);
    const body = await request.json().catch(() => ({}));
    const user = userOf(request, body);
    const existing = await env.DB.prepare("SELECT * FROM theatres WHERE id = ?").bind(id).first();
    if (!existing) return json({ error: "not_found" }, 404);
    const sets = FIELD_COLS.map(([, col]) => `${col} = ?`).concat("updated_at = ?");
    const vals = FIELD_COLS.map(([jk]) => colValue(jk, body)).concat(new Date().toISOString(), id);
    await env.DB.prepare(`UPDATE theatres SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
    await logActivity(env, { user, action: "edit", target: body.name || existing.name, targetId: id });
    const updated = await env.DB.prepare("SELECT * FROM theatres WHERE id = ?").bind(id).first();
    return json({ theatre: rowToObj(updated) });
  }

  if (m && method === "DELETE") {
    const id = decodeURIComponent(m[1]);
    const body = await request.json().catch(() => ({}));
    const user = userOf(request, body);
    const existing = await env.DB.prepare("SELECT * FROM theatres WHERE id = ?").bind(id).first();
    if (!existing) return json({ error: "not_found" }, 404);
    await env.DB.prepare("DELETE FROM theatres WHERE id = ?").bind(id).run();
    await logActivity(env, { user, action: "delete", target: existing.name, targetId: id });
    return json({ ok: true });
  }

  if (path === "/activity" && method === "GET") {
    const { results } = await env.DB.prepare("SELECT * FROM activity ORDER BY ts DESC LIMIT 500").all();
    const activity = (results || []).map(r => ({ id: r.id, user: r.user, action: r.action, target: r.target, targetId: r.target_id, ts: r.ts }));
    return json({ activity });
  }

  return json({ error: "not_found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    return env.ASSETS.fetch(request);
  }
};
