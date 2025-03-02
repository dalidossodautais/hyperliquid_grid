import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Specific rule for configuration files
  {
    files: ["*.config.js", "*.config.mjs", "*.setup.js"],
    rules: {
      // Allow the use of require in configuration files
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-require-imports": "off",
      "import/no-commonjs": "off",
    },
  },
];

export default eslintConfig;
