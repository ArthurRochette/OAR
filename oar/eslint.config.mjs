import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.browser,
        axios: "readonly", // Ajoutez axios ici
      },
    },
  },
  pluginJs.configs.recommended,
];
