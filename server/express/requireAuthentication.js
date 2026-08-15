const requireAuthentication = (req, res, next) => {
  const user = req.session?.user;
  if (!user?.id || !user?.name) {
    return res.status(401).json({ status: "Authentification requise." });
  }

  req.auth = user;
  return next();
};

module.exports = requireAuthentication;
