module.exports = {
  apps: [
    {
      name: 'misc-automation',
      script: './server.js',
      cwd: '/var/www/misc/server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5010
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5010
      }
    }
  ]
};
