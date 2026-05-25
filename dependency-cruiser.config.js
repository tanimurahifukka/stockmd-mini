// Module boundary rules — enforced by scripts/verify/50-module-boundaries.sh.
// See docs/engineering-policy.md and references/module-boundaries.md.

module.exports = {
  forbidden: [
    {
      name: "no-cross-module-deep-import",
      severity: "error",
      comment:
        "Modules under src/modules/<A> may only access src/modules/<B> via its index.ts.",
      from: { path: "^src/modules/([^/]+)/" },
      to: {
        path: "^src/modules/([^/]+)/(?!index\\.(ts|js)$)",
        pathNot: "^src/modules/$1/",
      },
    },
    {
      name: "lib-cannot-import-modules",
      severity: "error",
      comment: "src/lib/** is leaf — it may not import from src/modules/**.",
      from: { path: "^src/lib/" },
      to: { path: "^src/modules/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};
