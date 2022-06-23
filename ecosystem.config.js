module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: 'node-easywechat',
      script: 'app.js',
      env: {
        "NODE_ENV": "production",
      },
      env_production: {
        "NODE_ENV": "production"
      }
    }
  ]
};
