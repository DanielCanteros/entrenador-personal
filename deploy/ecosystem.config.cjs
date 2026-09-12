module.exports = {
  apps: [
    {
      name: "entrenador-personal-api",
      cwd: "/opt/entrenador-personal/backend",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
