/**
 * ONYXRA — db.js
 *
 * Thin client over /api/data/[resource] (cookie-authenticated, RLS-backed) for
 * the normalized library + stats tables (routines, recipes, business/passion
 * templates, personal bests, sessions).
 *
 * Every method FAILS SOFT — returns [] / null / false — so the pages keep
 * working from local state when the user is signed out or offline.
 *
 *   await OnyxDB.cloudEnabled()             // true if signed in + Supabase configured
 *   await OnyxDB.list('routines')           // [{...}]  (defaults + own)
 *   await OnyxDB.create('recipes', {...})   // {row} | null
 *   await OnyxDB.update('routines', id, {}) // {row} | null
 *   await OnyxDB.remove('sessions', id)     // true | false
 */
(function () {
  const BASE = '/api/data/';
  let _cloud = null;          // null = unknown, true/false after first probe

  async function req(method, resource, body, query) {
    try {
      const url = BASE + resource + (query ? '?' + query : '');
      const opts = { method, headers: {}, credentials: 'same-origin' };
      if (body !== undefined) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
      const res = await fetch(url, opts);
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { error: String(e) } };
    }
  }

  const DB = {
    /** True only when the server has Supabase configured AND a session exists. */
    async cloudEnabled(force) {
      if (_cloud !== null && !force) return _cloud;
      const r = await req('GET', 'routines');
      _cloud = !!(r.ok && !r.data.fallback);
      return _cloud;
    },
    /** List all rows the user may see for a resource (defaults + own). */
    async list(resource) {
      const r = await req('GET', resource);
      return (r.ok && Array.isArray(r.data.rows)) ? r.data.rows : [];
    },
    /** Create a row owned by the signed-in user. Returns the saved row or null. */
    async create(resource, obj) {
      const r = await req('POST', resource, obj);
      return (r.ok && r.data.row) ? r.data.row : null;
    },
    /** Update one of the user's own rows by id. Returns the saved row or null. */
    async update(resource, id, patch) {
      const r = await req('PATCH', resource, Object.assign({ id }, patch || {}));
      return (r.ok && r.data.row) ? r.data.row : null;
    },
    /** Delete one of the user's own rows by id. Returns true on success. */
    async remove(resource, id) {
      const r = await req('DELETE', resource, undefined, 'id=' + encodeURIComponent(id));
      return !!(r.ok && r.data.ok);
    },
  };

  if (typeof window !== 'undefined') window.OnyxDB = DB;
})();
