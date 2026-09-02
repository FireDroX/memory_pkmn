const composeMiddleware = (...middlewares) => (req, res) =>
  new Promise((resolve, reject) => {
    const run = (index) => {
      const middleware = middlewares[index];
      if (!middleware) return resolve();

      if (index === middlewares.length - 1) {
        Promise.resolve()
          .then(() => middleware(req, res))
          .then(resolve, reject);
        return undefined;
      }

      let advanced = false;
      const next = (error) => {
        advanced = true;
        if (error) return reject(error);
        return run(index + 1);
      };

      return Promise.resolve()
        .then(() => middleware(req, res, next))
        .then(() => {
          if (!advanced) resolve();
        }, reject);
    };

    run(0);
  });

module.exports = composeMiddleware;
