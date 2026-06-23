module.exports = {
  apps: [{
    name: 'finance-backend-3001',
    script: 'server.js',
    env: {
      PORT: 3001
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false
  }]
};
