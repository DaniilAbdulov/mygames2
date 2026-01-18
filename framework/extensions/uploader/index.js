const Fetcher = require('../fetcher');

const {Extension} = require('../../src/classes');

class Uploader extends Extension {
  constructor() {
    super(Extension.Types.DYNAMIC, 'Uploader');
  }

  load() {
    const fetcher = new Fetcher();

    this._fetcher = fetcher.action().fetchRequest;
  }

  addToAttachments(rawFilesData, api) {
    const filesData = rawFilesData.message.map((item) => {
      return {
        path: item.path,
        name: item.originalname || item.name,
        dir: item.dir,
        ext: item.ext,
        size: item.size || null
      };
    });

    return api()
      .service('attachments.addAttachments')
      .body(filesData);
  }

  async action({api}, files, params = {}) {
    if (!files.length) {
      throw new Error('Empty array. Need at least one file'); // eslint-disable-line
    }

    const {
      dir = 'ecosystem',
      ext = '',
      timeout = 60000,
      addToDb = true
    } = params;

    const res = await this._fetcher({
      url: 'http://saturn:10101/upload',
      uriParams: {dir, ext},
      headers: {
        'Authorization': 'Basic INTERNAL'
      },
      timeout,
      formData: {file: files}
    });

    if (addToDb) {
      await this.addToAttachments(res, api);
    }

    return res;
  }
}

module.exports = Uploader;
