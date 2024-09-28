// we are encapsulating necessary context such as ParsedRequest,...
// responseHander, ()=>{}
// so we dont have to give ->> await handler(request, responseHandler, () => {})
// like this we can just ->>> await handleRequest(xl)

module.exports = function createContext(request, responseHandler) {
  return {
    req: request,
    res: responseHandler,
    settedValue: {},
    isAuthenticated: false,
    next: () => {},
    //
    set(key, value) {
      this.settedValue[key] = value;
    },
    get(key) {
      return this.settedValue[key];
    },
    setAuthentication(isAuthenticated) {
      this.isAuthenticated = isAuthenticated;
    },
    checkAuthentication() {
      return this.isAuthenticated;
    },
    json(data, statusCode = 200) {
      return this.res.json(data, statusCode);
    },
    send(data, statusCode = 200) {
      return this.res.send(data, (statusCode = 200));
    },
    text(data, statusCode = 200) {
      return this.res.send(data, statusCode);
    },
    html(filePath, templatePath, statusCode = 200) {
      return this.res.render(filePath, templatePath, "", (statusCode = 200));
    },
    redirect(url, statusCode = 302) {
      return this.res.redirect(url, statusCode);
    },
    setCookie(name, value, options = {}) {
      this.res.cookie(name, value, options);
    },
    getCookie(cookieName) {
      const cookies = this.req.cookies;
      return cookies[cookieName];
    },
  };
};
