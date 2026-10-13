// Parses req.body / req.query / req.params with zod and replaces them with the parsed values.
// ZodErrors fall through to errorHandler, which turns them into 400s.
export function validate({ body, query, params }) {
  return (req, _res, next) => {
    if (body) req.body = body.parse(req.body ?? {});
    // Express 5 exposes query/params as getters, so redefine instead of assigning
    if (query) Object.defineProperty(req, 'query', { value: query.parse(req.query), writable: true });
    if (params) Object.defineProperty(req, 'params', { value: params.parse(req.params), writable: true });
    next();
  };
}
