// ESLint flat config. Extends Next.js defaults; adds boundary hints.
// The hard module-boundary enforcement lives in dependency-cruiser.

import next from "eslint-config-next";

export default [
  ...next,
  {
    rules: {
      // Be loud about console in production code; allow in scripts/.
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];
