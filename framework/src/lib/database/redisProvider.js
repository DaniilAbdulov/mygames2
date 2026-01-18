class RedisProvider {
  static #compareAndDeleteScript = `
    if redis.call("get", ARGV[1]) == ARGV[2] then
      redis.pcall("del", ARGV[1])
      return 1
    else 
      return 0
    end
  `;

  static get SetRangeTypes() {
    return {
      BY_INDEX: 0,
      BY_SCORE: 1,
      BY_LEX: 2,
    };
  }

  /**
   * @param {import('redis').RedisClient} client
   */
  constructor(client, original = null) {
    this.client = client;
    this.original = original || client;
  }

  async transaction(fn) {
    const transactionProvider = new RedisProvider(
      this.client.multi(),
      this.original,
    );

    await fn(transactionProvider);

    return new Promise((resolve, reject) => {
      transactionProvider.client.exec((err, replies) => {
        err ? reject(err) : resolve(replies);
      });
    });
  }

  setObj(props, key) {
    return new Promise((resolve, reject) => {
      this.client.hmset(key, props, (err) => {
        err ? reject(err) : resolve();
      });
    });
  }

  getObj(key) {
    return new Promise((resolve, reject) => {
      this.client.hgetall(key, (err, res) => {
        err ? reject(err) : resolve(res);
      });
    });
  }

  getObjField(key, field) {
    return new Promise((resolve, reject) => {
      this.client.hget(key, field, (err, res) => {
        err ? reject(err) : resolve(res);
      });
    });
  }

  hasObjField(key, field) {
    return new Promise((resolve, reject) => {
      this.client.hexists(key, field, (err, res) => {
        err ? reject(err) : resolve(res);
      });
    });
  }

  removeObjFields(key, ...fields) {
    return new Promise((resolve, reject) => {
      this.client.hdel(key, fields.flat(), (err, res) => {
        err ? reject(err) : resolve(res);
      });
    });
  }

  scanObjFields(key, prefix, onScannedKeys, batchCount = 100) {
    return this._scan('hscan', key)(prefix, onScannedKeys, batchCount);
  }

  setStr(props, key, options) {
    const args = [key, props];

    if (options?.notExists) {
      args.push('NX');
    } else if (options?.exists) {
      args.push('XX');
    }
    if (Number(options?.ttl)) {
      args.push('EX', Number(options.ttl));
    }

    return new Promise((resolve, reject) => {
      this.client.set(...args, (err, result) => {
        if (err) {
          reject(err);
        } else if (result === 'OK') {
          resolve();
        } else {
          reject(new Error('Key not set'));
        }
      });
    });
  }

  getStr(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, res) => {
        err ? reject(err) : resolve(res);
      });
    });
  }

  remove(...keys) {
    return new Promise((resolve, reject) => {
      this.client.del(keys.flat(), (err, res) => {
        err ? reject(err) : resolve(!!res);
      });
    });
  }

  has(key) {
    return new Promise((resolve, reject) => {
      if (!key) {
        reject(new Error('empty key'));

        return;
      }
      this.client.exists(key, (err, res) => {
        err ? reject(err) : resolve(res === 1);
      });
    });
  }

  /* istanbul ignore next */
  expire(key, time) {
    return new Promise((resolve, reject) => {
      this.client.expire(key, time, (err) => {
        err ? reject(err) : resolve();
      });
    });
  }

  publish(channel, message) {
    return new Promise((resolve, reject) => {
      this.client.publish(channel, message, (err) => {
        err ? reject() : resolve();
      });
    });
  }

  subscribe(channels, onMessage) {
    this.client.on('message', onMessage);

    return new Promise((resolve) => {
      this.client.subscribe(...channels, () => {
        resolve();
      });
    });
  }

  scan(prefix, onScannedKeys, batchCount = 100) {
    return this._scan('scan')(prefix, onScannedKeys, batchCount);
  }

  addSetMember(key, member, score) {
    return new Promise((resolve, reject) => {
      this.client.zadd(key, score, member, (err, res) => {
        err ? reject(err) : resolve(res);
      });
    });
  }

  incrementSetMember(key, member, increment = 1) {
    return new Promise((resolve, reject) => {
      this.client.zincrby(key, increment, member, (err, res) => {
        err ? reject(err) : resolve(res);
      });
    });
  }

  getSetMembersRange(
    key,
    start,
    stop,
    by = RedisProvider.SetRangeTypes.BY_INDEX,
  ) {
    const options = [key, start, stop];
    let operation = 'zrange';

    if (by === RedisProvider.SetRangeTypes.BY_SCORE) {
      operation = 'zrangebyscore';
    } else if (by === RedisProvider.SetRangeTypes.BY_LEX) {
      operation = 'zrangebylex';
    }

    return new Promise((resolve, reject) => {
      this.client[operation](...options, (err, res) => {
        err ? reject(err) : resolve(res);
      });
    });
  }

  removeSetMembers(key, ...members) {
    return new Promise((resolve, reject) => {
      this.client.zrem(key, members.flat(), (err, res) => {
        err ? reject(err) : resolve(res);
      });
    });
  }

  removeSetMembersRange(key, start, stop) {
    return new Promise((resolve, reject) => {
      this.client.zremrangebyrank(key, start, stop, (err, res) => {
        err ? reject(err) : resolve(res);
      });
    });
  }

  scanSetMembers(key, prefix, onScannedKeys, batchCount = 100) {
    return this._scan('zscan', key)(prefix, onScannedKeys, batchCount);
  }

  compareAndRemove(key, value) {
    return this._eval(
      RedisProvider.#compareAndDeleteScript,
      [key],
      [key, value],
    );
  }

  _eval(script, keys, args) {
    const evalArgs = [script, keys.length, ...keys, ...args];

    return new Promise((resolve, reject) => {
      this.client.eval(...evalArgs, (err, res) => {
        err ? reject(err) : resolve(res);
      });
    });
  }

  _scan(method, ...restParams) {
    if (!['scan', 'sscan', 'zscan', 'hscan'].includes(method)) {
      throw new Error('Invalid scan method');
    }
    if (method === 'scan' && restParams.length) {
      throw new Error('Unexpected additional params for scan');
    }
    if (
      ['sscan', 'zscan', 'hscan'].includes(method) &&
      restParams.length !== 1 &&
      restParams[0] &&
      typeof restParams[0] === 'string'
    ) {
      throw new Error(
        `${method} should have one additional param and it should be string`,
      );
    }

    return async (prefix, onScannedKeys, batchCount = 100) => {
      const DEFAULT_CURSOR = '0';

      const getArrayOfNextCursorAndScannedKeys = (cursor) =>
        new Promise((resolve, reject) => {
          this.original[method](
            ...restParams,
            cursor,
            'MATCH',
            prefix,
            'COUNT',
            batchCount,
            (err, [newCursor, keys]) => {
              if (err) {
                reject(err);

                return;
              }

              const result = ['zscan', 'hscan'].includes(method)
                ? keys.reduce((keyValues, elem, idx) => {
                    if (idx % 2 === 0) {
                      keyValues.push([elem]);
                    } else {
                      keyValues[keyValues.length - 1].push(elem);
                    }

                    return keyValues;
                  }, [])
                : keys;

              resolve([newCursor, result]);
            },
          );
        });

      const transaction = this.client.multi();

      let cursor = null;

      while (cursor !== DEFAULT_CURSOR) {
        let keys;

        // Следующая итерация курсора зависит от предыдущей
        // eslint-disable-next-line no-await-in-loop
        [cursor, keys] = await getArrayOfNextCursorAndScannedKeys(
          cursor || DEFAULT_CURSOR,
        );

        if (keys.length) {
          // Следующая итерация курсора зависит от предыдущей
          // eslint-disable-next-line no-await-in-loop
          await onScannedKeys(keys, transaction);
        }

        if (cursor === DEFAULT_CURSOR) {
          return new Promise((transactionResolve, transactionReject) => {
            transaction.exec((transactionError, transactionResponse) => {
              transactionError
                ? transactionReject(transactionError)
                : transactionResolve(transactionResponse);
            });
          });
        }
      }
    };
  }
}

module.exports = RedisProvider;
