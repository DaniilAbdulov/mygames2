class AttributesAccessControl {
  static _combinators = {
    $or: (rules, fn) => rules.some(fn),
    $and: (rules, fn) => rules.every(fn),
  };

  static _predicates = {
    $eq: (rule, target) => target === rule,
    $ne: (rule, target) => target !== rule,
    $gt: (rule, target) => target > rule,
    $gte: (rule, target) => target >= rule,
    $lt: (rule, target) => target < rule,
    $lte: (rule, target) => target <= rule,
    $in: (rule, target) => rule.includes(target),
    $subset: (rule, target) => {
      const set = new Set(rule);

      return target.every((value) => set.has(value));
    },
    $superset: (rule, target) => {
      const set = new Set(target);

      return rule.every((value) => set.has(value));
    },
    $overlaps: (rule, target) => {
      const set = new Set(rule);

      return target.some((value) => set.has(value));
    },
  };

  _context;

  _entityType = null;

  _accessLevel = 0;

  _attributesList = null;

  _isAllAgg = false;

  _isAnyAgg = false;

  _preventMissing = true;

  get _isNeedFullAccess() {
    return Boolean(this._context.req.headers['x-full']);
  }

  get _userId() {
    // 'X-USER': `userId;user;sessionId;lang;timezone`
    const [sessionUserId] = this._context.req.headers['x-user'].split(';');

    return Number(sessionUserId);
  }

  get _cache() {
    return this._context.cache;
  }

  get _config() {
    return this._context.config;
  }

  constructor(context) {
    this._context = context;
  }

  entityType(entityType) {
    this._entityType = entityType;

    return this;
  }

  accessLevel(accessLevel) {
    this._accessLevel = accessLevel;

    return this;
  }

  attributesList(attributesList) {
    this._attributesList = attributesList;

    return this;
  }

  all() {
    this._isAllAgg = true;

    return this;
  }

  any() {
    this._isAnyAgg = true;

    return this;
  }

  ignoreMissing() {
    this._preventMissing = false;

    return this;
  }

  preventMissing() {
    this._preventMissing = true;

    return this;
  }

  async invalidate(userId, entityType) {
    const prefix = `${userId}:${entityType}:*`;

    try {
      await this._cache.removeByPrefix(prefix);
    } catch (err) {
      this._logger.error(`Cant invalidate - ${prefix}, reason: ${err.stack}`);
    }
  }

  async then(callback, errorCallback) {
    try {
      const result = await this._run();

      if (callback) {
        return await callback(result);
      }

      return Promise.resolve(result);
    } catch (error) {
      if (errorCallback) {
        return errorCallback(error);
      }

      return Promise.reject(error);
    }
  }

  async catch(callback) {
    try {
      const result = await this._run();

      return Promise.resolve(result);
    } catch (error) {
      return callback(error);
    }
  }

  async _run() {
    try {
      if (!this._entityType) {
        return Promise.reject(
          new Error('Missing required parameter. Please pass entity'),
        );
      }
      if (this._isAnyAgg && this._isAllAgg) {
        return Promise.reject(new Error('any() and all() called in same time'));
      }

      if (this._isNeedFullAccess || !this._userId) {
        if (this._isAllAgg || this._isAnyAgg) {
          return this._isNeedFullAccess;
        }
        if (this._attributesList) {
          return Array.from(
            {length: this._attributesList.length},
            () => this._isNeedFullAccess,
          );
        }

        return [];
      }
      if (this._attributesList && !this._attributesList.length) {
        if (this._isAnyAgg) {
          return false;
        }
        if (this._isAllAgg) {
          return true;
        }

        return [];
      }

      const policies = await this._get();

      if (!this._attributesList) {
        return policies;
      }

      const check = (attributes) =>
        policies.some(({policy}) => this._runPolicy(attributes, policy));

      if (this._isAnyAgg) {
        return this._attributesList.some(check);
      }
      if (this._isAllAgg) {
        return this._attributesList.every(check);
      }

      return this._attributesList.map(check);
    } catch (err) {
      throw err;
    } finally {
    }
  }

  async _get() {
    const key = `${this._userId}:${this._entityType}:${this._accessLevel}`;

    try {
      const cachePolicies = await this._cache.get(key);

      if (cachePolicies) {
        return cachePolicies;
      }
    } catch (err) {
      console.log(err);
    }

    const servicePolicies = await this._context
      .api()
      .service('users.getUserAttributeAccessPolicies')
      .params({
        requestedUserId: this._userId,
        entityType: this._entityType,
        accessLevel: this._accessLevel,
      });

    this._cache
      .set({key, val: servicePolicies, ttl: this._config.ttl})
      .catch((err) =>
        this._logger.error(`Cant set values - ${key}, reason: ${err.stack}`),
      );

    return servicePolicies;
  }

  _runPolicy(attributes, policy) {
    const processRule = (attribute, rule, op) => {
      if (AttributesAccessControl._combinators[attribute]) {
        return AttributesAccessControl._combinators[attribute](
          rule,
          checkRules,
        );
      }

      if (!(attribute in attributes)) {
        return false;
      }

      const targetValue = attributes[attribute];

      if (typeof rule !== 'object' || rule === null) {
        return AttributesAccessControl._predicates[op ?? '$eq'](
          rule,
          targetValue,
        );
      }
      if (Array.isArray(rule)) {
        if (!Array.isArray(targetValue)) {
          return AttributesAccessControl._predicates.$in(rule, targetValue);
        }

        return AttributesAccessControl._predicates[op ?? '$subset'](
          rule,
          targetValue,
        );
      }
      if (op) {
        throw new Error('Invalid state');
      }

      const keys = Object.keys(rule);

      if (keys.length !== 1 || !AttributesAccessControl._predicates[keys[0]]) {
        throw new Error('Invalid state');
      }

      return processRule(attribute, rule[keys[0]], keys[0]);
    };
    const checkRules = (subPolicy) =>
      Object.entries(subPolicy)
        .filter(
          ([attribute]) =>
            !!AttributesAccessControl._combinators[attribute] ||
            attribute in attributes ||
            this._preventMissing,
        )
        .every(([attribute, rule]) => processRule(attribute, rule));

    try {
      return checkRules(policy);
    } catch (_) {
      this._logger.error(
        `Invalid state occured, policy: ${JSON.stringify(policy)}`,
      );

      return false;
    }
  }
}

module.exports = AttributesAccessControl;
