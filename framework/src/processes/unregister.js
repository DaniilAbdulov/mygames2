const {ConfigConstructor, RedisConnect, logger, Coordinator} = require('../lib');

const [,, serviceName, servicePort] = process.argv;

if (!serviceName || !servicePort) {
  process.exit(0);
}

global.serviceName = serviceName;

const settings = new ConfigConstructor()
  .add('development')
  .add('production')
  .get();
const redisConnect = new RedisConnect(logger, settings.redis);

const coordinator = new Coordinator(
  [redisConnect.getChannel(settings.redis.pubDb), redisConnect.getChannel(settings.redis.subDb)],
  null,
  Number(servicePort),
  null
);

coordinator.onTerminate()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    // балансер разберется сам тогда
    process.exit(0);
  });
