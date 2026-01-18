const {Etcd3, isRecoverableError} = require('etcd3');
const {Policy, ConsecutiveBreaker, ExponentialBackoff} = require('cockatiel');
// todo after node >= 16
// const {
//   circuitBreaker, handleWhen, ConsecutiveBreaker, ConstantBackoff, retry
// } = require('cockatiel');

class EtcdConnector {
  options;

  client;

  constructor({plugins}) {
    this.options = {
      hosts: plugins.etcd,
      dialTimeout: 5000,
      faultHandling: {
        host: () =>
          Policy.handleWhen(isRecoverableError)
            .circuitBreaker(5000, new ConsecutiveBreaker(3)),
        global: Policy.handleWhen(isRecoverableError)
          .retry()
          .attempts(Infinity)
          .delay(3000),
        watchBackoff: new ExponentialBackoff({maxAttempts: Infinity, maxDelay: 5000})
      }
    };

    // todo after node >= 16
    // this.options = {
    //   hosts: plugins.etcd,
    //   dialTimeout: 5000,
    //   faultHandling: {
    //     host: () =>
    //       circuitBreaker(handleWhen(isRecoverableError), {
    //         halfOpenAfter: 5000,
    //         breaker: new ConsecutiveBreaker(3)
    //       }),
    //     global: retry(
    //       handleWhen(isRecoverableError),
    //       {maxAttempts: Infinity, backoff: new ConstantBackoff(3000)}
    //     ),
    //     watchBackoff: new ConstantBackoff(2000)
    //   }
    // };

    this.client = new Etcd3(this.options);
  }

  close() {
    this.client?.close();
  }

  getAll() {
    return this.client.getAll();
  }

  getByPrefix(name) {
    return this.client.getAll().prefix(`${name}|`);
  }

  get(key) {
    return this.client.get(key);
  }

  put(key, value) {
    return this.client.put(key).value(value);
  }

  delete(key) {
    return this.client.delete().key(key);
  }

  deleteByPrefix(name) {
    return this.client.delete().prefix(`${name}|`);
  }

  watch() {
    return this.client.watch();
  }
}

module.exports = EtcdConnector;
