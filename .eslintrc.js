module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: ["airbnb", "prettier"],
  parser: "@typescript-eslint/parser",
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: "module",
  },
  plugins: ["prettier", "react", "@typescript-eslint/eslint-plugin"],
  rules: {
    "global-require": 0,
    "import/no-unresolved": 0,
    quotes: ["error", "double"],
    "import/extensions": 0,
    "@typescript-eslint/no-unused-vars": ["error"],
    "react/jsx-filename-extension": [
      2,
      { extensions: [".js", ".jsx", ".ts", ".tsx"] },
    ],
    "react/react-in-jsx-scope": 0,
    "react/function-component-definition": [
      1,
      {
        namedComponents: "arrow-function",
      },
    ],
    "react/jsx-props-no-spreading": "off",
    "class-methods-use-this": "off",
    "prefer-promise-reject-errors": "off",
    "import/prefer-default-export": "off",
    "array-callback-return": "off",
    "consistent-return": "off",
    "max-len": "off",
    camelcase: "off",
    "no-return-await": "off",
    "no-use-before-defined": "off",
    "prettier/prettier": ["error"],
    "jsx-a11y/media-has-caption": "off",
    eqeqeq: "off",
  },
  overrides: [
    {
      files: ["./Backend/**/*"],
      env: {
        node: true,
      },
      rules: {
        "no-console": "off",
        "import/no-extraneous-dependencies": "off",
        "no-param-reassign": "off",
        "no-plusplus": "off",
      },
    },
  ],
};
