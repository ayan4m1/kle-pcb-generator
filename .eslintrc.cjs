module.exports = {
  "env": {
    "es2020": true,
    
    "node": true
  },
  "extends": [
    "eslint:recommended",
    
    "plugin:prettier/recommended",
    "plugin:import/recommended"
  ],
  "parser": "@babel/eslint-parser",
  "parserOptions": {
    "requireConfigFile": false,
    "ecmaVersion": 12
  },
  "settings": {
    "import/resolver": {
      node: {
        paths: ['./src']
      }
    }
  }
};
