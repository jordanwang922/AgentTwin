module.exports = {
  apps: [
    {
      name: "agenttwin-api",
      cwd: "./apps/api",
      script: "dist/main.js"
    },
    {
      name: "agenttwin-worker",
      cwd: "./workers/processor",
      script: "dist/index.js"
    }
  ]
};
