export const config = {
  port: +process.env.PORT || 3000,
  apiUrl: process.env.API_URL || 'http://0.0.0.0:3000/api/',
  dbUrl: process.env.DB_URL || 'mongodb://admin:admin@db:27017/fx-rates',
  rates: {
    ttl: +process.env.RATES_TTL || 36e5,
    url: process.env.RATES_URL
      || 'http://data.fixer.io/api/latest?access_key=ffcc344a3f31700c0020d166fd17ea96',
  },
}
