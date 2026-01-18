/*
 * Made by Vladislav Moshkovskiy, Esoft. 09.10.2019, 11:53
 */

class Plugin {
  constructor(name, version, hooks = []) {
    this._name = `${name}Plugin`;
    this._version = version || '1.0.0';
    this._hooks = hooks;
    this._settings = {};
    this._sharedContext = null;
  }

  get Name() {
    return this._name;
  }

  set Name(value) {
    throw new Error('U cant change name!');
  }

  get Version() {
    return this._version;
  }

  set Version(value) {
    throw new Error('U cant change version!');
  }

  get Hooks() {
    return this._hooks;
  }

  set Hooks(newValue) {
    throw new Error('U cant change hooks!');
  }

  get Settings() {
    return this._settings;
  }

  set Settings(newValue) {
    this._settings = newValue;
  }

  get SharedContext() {
    return this._sharedContext;
  }

  set SharedContext(context) {
    if (!this._sharedContext) {
      this._sharedContext = context;
    } else {
      throw new Error('U cant change shared context!');
    }
  }

  getSettingByCity(cityId, filterFunc) {
    const {
      cities: {
        [cityId]: citySettings = []
      } = {},
      all: allOfficesSettings = []
    } = this._settings;

    if (filterFunc) {
      return citySettings.find(filterFunc) || allOfficesSettings.find(filterFunc);
    }

    return citySettings[0] || allOfficesSettings[0];
  }

  getSettingByOffice(officeId, filterFunc) {
    const {
      offices: {
        [officeId]: officeSettings = []
      } = {},
      all: allOfficesSettings = []
    } = this._settings;

    if (filterFunc) {
      return officeSettings.find(filterFunc) || allOfficesSettings.find(filterFunc);
    }

    return officeSettings[0] || allOfficesSettings[0];
  }
}

module.exports = Plugin;
