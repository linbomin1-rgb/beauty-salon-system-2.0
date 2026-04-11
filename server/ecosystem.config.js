module.exports = {module.exports = {
  apps: [{
    name: 'beauty-salon-server',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3003
    },
  ]
};
    }
  }]
};
