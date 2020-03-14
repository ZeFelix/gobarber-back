module.exports = {
  dialect: 'postgres',
  host: 'localhost',
  port: '15432',
  username: 'postgres',
  password: 'postgres',
  database: 'gobarber',
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};
