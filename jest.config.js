/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.spec.js"],
  verbose: true,
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { strict: false } }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
};