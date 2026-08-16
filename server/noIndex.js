const noIndexDirective =
  "noindex, nofollow, noarchive, nosnippet, noimageindex";

const noIndex = (_request, response, next) => {
  response.set("X-Robots-Tag", noIndexDirective);
  next();
};

module.exports = noIndex;
