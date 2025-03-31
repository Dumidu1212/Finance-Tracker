// babel.config.js
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        // Transpile only what current Node version doesn’t support
        targets: {
          node: 'current'
        }
      }
    ]
  ]
};
