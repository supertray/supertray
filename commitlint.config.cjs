// If you want to implement custom scopes uncomment this
module.exports = {
  extends: ['@commitlint/config-conventional'],

  // If you want to implement custom scopes uncomment this
  rules: {
    'scope-enum': async () => {
      return [2, 'always', ['api']];
    },
  },
};
