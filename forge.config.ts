module.exports = {
  // ...
  packagerConfig: {
    icon: "/path/to/icon", // no file extension required
    devContentSecurityPolicy: "connect-src 'self' * 'unsafe-eval'",
  },
  devContentSecurityPolicy: "connect-src 'self' * 'unsafe-eval'",
};
