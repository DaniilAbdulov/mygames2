const {Extension} = require('../../src/classes');

class Permissions extends Extension {
  constructor() {
    super(Extension.Types.DYNAMIC, 'Permissions');
  }

  hasPermission(userPermissions, service, permissions) {
    if (!permissions.length) {
      throw new Error('Missing required parameter. Please pass need permission'); // eslint-disable-line
    }

    const servicePermissions = userPermissions[service];

    if (!servicePermissions) {
      return false;
    }

    if (permissions.length === 1) {
      return (servicePermissions & permissions[0]) === permissions[0];
    }

    return permissions.map((right) => (servicePermissions & right) === right)
      .reduce((acc, cur) => acc || cur);
  }

  async action({req, api}, service, ...permissions) {
    const isNeedFullAccess = req.headers['x-full'];

    if (isNeedFullAccess) {
      return true;
    }

    let userId = 0;

    if ('x-user' in req.headers) {
      // 'X-USER': `userId;user;sessionId;lang;timezone`
      const [sessionUserId] = req.headers['x-user'].split(';');

      userId = Number(sessionUserId);
    }

    if (!Number(userId)) {
      return false;
    }

    try {
      const userPermissions = await api()
        .service('users.getUserPermissions')
        .params({id: userId});

      return this.hasPermission(userPermissions, service, permissions);
    } catch(err) {
      return false;
    }
  }
}

module.exports = Permissions;
