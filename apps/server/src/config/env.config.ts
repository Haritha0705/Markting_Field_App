export default () => ({
  port: process.env.PORT,
  env: process.env.NODE_ENV,

  database: {
    host: process.env.MASTER_DATABASE_HOST,
    port: Number(process.env.MASTER_DATABASE_PORT),
    username: process.env.MASTER_DATABASE_USERNAME,
    password: process.env.MASTER_DATABASE_PASSWORD,
    database: process.env.MASTER_DATABASE_NAME,
  },
});