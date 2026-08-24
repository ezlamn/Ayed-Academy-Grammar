/* ================================================================
   API.JS — طبقة الاتصال بالسيرفر
   ----------------------------------------------------------------
   كل الطلبات بتبعت الكوكي (credentials: 'include') لأن التوثيق
   بـ httpOnly cookie مش توكن في الذاكرة.
   ================================================================ */

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(method, path, body, options = {}) {
  const init = {
    method,
    credentials: 'include',
    headers: {},
    ...options,
  };

  if (body instanceof FormData) {
    init.body = body; // المتصفح بيحط Content-Type بنفسه مع الـ boundary
  } else if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`/api${path}`, init);

  if (res.status === 204) return null;

  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (payload && payload.error) || `خطأ ${res.status}`,
      payload && payload.details
    );
  }

  return payload;
}

export const api = {
  get: (path, options) => request('GET', path, undefined, options),
  post: (path, body, options) => request('POST', path, body, options),
  patch: (path, body, options) => request('PATCH', path, body, options),
  delete: (path, options) => request('DELETE', path, undefined, options),
};

/** يبني query string من كائن، متجاهلاً القيم الفاضية. */
export function qs(params) {
  const entries = Object.entries(params || {}).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  return entries.length ? '?' + new URLSearchParams(entries).toString() : '';
}
