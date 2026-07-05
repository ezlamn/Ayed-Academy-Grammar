/* ================================================================
   LOCAL AUTH SHIM — يعمل بدون Firebase ولا أي مفاتيح API
   يحاكي نفس واجهة Firebase (Auth + Firestore) باستخدام localStorage
   عشان التطبيق يشتغل أوفلاين من غير ما نلمس باقي الكود.
   ================================================================ */

const USERS_KEY = "local_auth_users";   // { [email]: { uid, email, pass } }
const DB_KEY    = "local_auth_db";      // { "users/<uid>": {...} }
const CUR_KEY   = "local_auth_current"; // uid الحالي

// ── أدوات تخزين ───────────────────────────────────────────────
function _load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; }
  catch { return {}; }
}
function _save(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}
function _uid() {
  return "u_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// خطأ بنفس شكل أخطاء Firebase (فيه .code و .message)
function _authError(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}

// ── كائن المصادقة (Auth) ──────────────────────────────────────
const auth = {
  currentUser: null,
  _listeners: [],
  _emit() { this._listeners.forEach(cb => { try { cb(this.currentUser); } catch (_) {} }); }
};

// استرجاع آخر جلسة لو موجودة
(function restoreSession() {
  const uid = localStorage.getItem(CUR_KEY);
  if (!uid) return;
  const users = _load(USERS_KEY);
  const found = Object.values(users).find(u => u.uid === uid);
  if (found) auth.currentUser = { uid: found.uid, email: found.email };
})();

// ── دوال المصادقة ─────────────────────────────────────────────
async function signInWithEmailAndPassword(_auth, email, pass) {
  email = String(email).trim().toLowerCase();
  const users = _load(USERS_KEY);
  const user = users[email];
  if (!user) throw _authError("auth/user-not-found", "المستخدم غير موجود");
  if (user.pass !== pass) throw _authError("auth/wrong-password", "كلمة المرور غير صحيحة");
  auth.currentUser = { uid: user.uid, email: user.email };
  localStorage.setItem(CUR_KEY, user.uid);
  auth._emit();
  return { user: auth.currentUser };
}

async function createUserWithEmailAndPassword(_auth, email, pass) {
  email = String(email).trim().toLowerCase();
  if (!pass || pass.length < 6)
    throw _authError("auth/weak-password", "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
  const users = _load(USERS_KEY);
  if (users[email]) throw _authError("auth/email-already-in-use", "البريد مستخدم بالفعل");
  const user = { uid: _uid(), email, pass };
  users[email] = user;
  _save(USERS_KEY, users);
  auth.currentUser = { uid: user.uid, email: user.email };
  localStorage.setItem(CUR_KEY, user.uid);
  auth._emit();
  return { user: auth.currentUser };
}

function onAuthStateChanged(_auth, cb) {
  auth._listeners.push(cb);
  // استدعاء فوري بالحالة الحالية (نفس سلوك Firebase)
  Promise.resolve().then(() => cb(auth.currentUser));
  return () => { auth._listeners = auth._listeners.filter(x => x !== cb); };
}

async function signOut() {
  auth.currentUser = null;
  localStorage.removeItem(CUR_KEY);
  auth._emit();
}

// ── محاكاة Firestore ──────────────────────────────────────────
// doc(db, "users", uid) → مرجع بسيط فيه المسار
function doc(_db, ...pathParts) {
  return { _path: pathParts.join("/") };
}

async function getDoc(ref) {
  const db = _load(DB_KEY);
  const data = db[ref._path];
  return {
    exists: () => data !== undefined,
    data: () => data
  };
}

async function setDoc(ref, value, opts = {}) {
  const db = _load(DB_KEY);
  if (opts.merge && db[ref._path]) {
    db[ref._path] = { ...db[ref._path], ...value };
  } else {
    db[ref._path] = value;
  }
  _save(DB_KEY, db);
}

// ── تصدير نفس الواجهة المتوقعة من باقي الكود ───────────────────
window.FirebaseAuth = auth;
window.FirebaseDB = { _local: true };
window.FirebaseAPI = {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  doc,
  setDoc,
  getDoc
};

console.log("Local Auth initialized (no Firebase keys required).");
