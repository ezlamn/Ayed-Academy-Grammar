/* ================================================================
   SANITIZE.JS — تنظيف الـ HTML المسموح داخل حقول المحتوى
   ----------------------------------------------------------------
   المحتوى الحالي بيتعرض بـ innerHTML في renderers.js وفيه وسوم
   تنسيق حقيقية (<strong>, <span dir="ltr">, <br>, <em>). فبدل ما
   نمنع الـ HTML خالص، بننضّفه بقائمة سماح ضيقة عند الكتابة.
   ================================================================ */
const sanitizeHtml = require('sanitize-html');

const OPTIONS = {
  allowedTags: [
    'b', 'strong', 'i', 'em', 'u', 's', 'mark', 'small',
    'br', 'p', 'div', 'span', 'code', 'pre',
    'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'sup', 'sub', 'a', 'img', 'h3', 'h4', 'h5',
  ],
  allowedAttributes: {
    '*': ['class', 'dir', 'style', 'lang'],
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
  },
  // ما نسمحش بـ javascript: أو data: (غير الصور) في الروابط
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  // style مسموح بس بخصائص آمنة
  allowedStyles: {
    '*': {
      color: [/^[\w#().,%\s-]+$/],
      'background-color': [/^[\w#().,%\s-]+$/],
      'font-weight': [/^[\w\d]+$/],
      'font-size': [/^[\d.]+(px|rem|em|%)$/],
      'text-align': [/^(left|right|center|justify)$/],
      direction: [/^(ltr|rtl)$/],
    },
  },
  disallowedTagsMode: 'discard',
};

/** ينضّف حقل نصي قد يحتوي HTML. يرجّع null/undefined كما هي. */
function cleanHtml(value) {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, OPTIONS);
}

/** ينزع كل الوسوم — للحقول اللي المفروض نص خالص (زي nameAr). */
function stripTags(value) {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}

/**
 * ينضّف كل القيم النصية داخل كائن/مصفوفة متداخلة (للبلوكات JSONB).
 * بيحافظ على الشكل زي ما هو.
 */
function cleanDeep(value) {
  if (Array.isArray(value)) return value.map(cleanDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = cleanDeep(v);
    return out;
  }
  if (typeof value === 'string') return cleanHtml(value);
  return value;
}

module.exports = { cleanHtml, stripTags, cleanDeep };
