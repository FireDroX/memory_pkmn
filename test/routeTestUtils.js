const invokeRoute = async (router, method, path, request = {}) => {
  const layer = router.stack.find(
    (entry) =>
      entry.route?.path === path && entry.route.methods[method.toLowerCase()],
  );
  if (!layer) throw new Error(`Route ${method} ${path} introuvable.`);

  const result = { statusCode: 200, body: undefined, headers: {} };
  const response = {
    status(code) {
      result.statusCode = code;
      return response;
    },
    json(body) {
      result.body = body;
      return response;
    },
    sendStatus(code) {
      result.statusCode = code;
      return response;
    },
    clearCookie(name, options) {
      result.clearedCookie = { name, options };
      return response;
    },
    setHeader(name, value) {
      result.headers[name] = value;
      return response;
    },
    getHeader(name) {
      return result.headers[name];
    },
  };

  await layer.route.stack[0].handle(
    { query: {}, body: {}, ...request },
    response,
  );
  return result;
};

const loadRouterWithPool = (routePath, pool) => {
  const dbPath = require.resolve("../db");
  const resolvedRoute = require.resolve(routePath);
  const previousDb = require.cache[dbPath];

  require.cache[dbPath] = { exports: pool };
  delete require.cache[resolvedRoute];
  const router = require(resolvedRoute);

  if (previousDb) require.cache[dbPath] = previousDb;
  else delete require.cache[dbPath];
  delete require.cache[resolvedRoute];
  return router;
};

module.exports = { invokeRoute, loadRouterWithPool };
