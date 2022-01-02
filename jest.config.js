module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRunner: 'jest-jasmine2' // default is jest-circus (regression issue in jestv27)
};

// "jest": {
//   "transform": {
//       "^.+\\.tsx?$": "ts-jest"
//   },
//   "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
//   "moduleFileExtensions": [
//       "ts",
//       "tsx",
//       "js",
//       "jsx",
//       "json",
//       "node"
//   ]
// }