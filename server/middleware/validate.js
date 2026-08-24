/* ================================================================
   VALIDATE.JS — تحقّق المدخلات بـ zod
   ================================================================ */
const { HttpError } = require('./errorHandler');

/**
 * يتحقق من جزء من الطلب ويستبدله بالنتيجة المحوّلة.
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} source
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map(i => ({
        field: i.path.join('.') || '(root)',
        message: i.message,
      }));
      return next(new HttpError(400, 'بيانات غير صالحة', details));
    }
    // req.query في Express 5 getter فقط — نخزّن النتيجة في مكان منفصل
    if (source === 'query') req.validatedQuery = result.data;
    else req[source] = result.data;
    next();
  };
}

module.exports = { validate };
