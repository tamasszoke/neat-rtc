module.exports = {
    root: true,
    parserOptions: {
      sourceType: 'module',
      parser: 'babel-eslint'
    },
    env: {
      browser: true,
    },
    extends: [
      'standard'
    ],
    rules:{
      "linebreak-style": 0
    }
}