const {Readable} = require('stream');

class StreamConverter {
  constructor(value) {
    this._buffer = Buffer.from(value);
  }

  getStream() {
    const stream = new Readable();
    let currentPos = 0;

    stream._read = (size) => {
      if (this._buffer.length < currentPos) {
        stream.push(null);
      } else {
        stream.push(this._buffer.subarray(currentPos, currentPos + size));

        currentPos += size;
      }
    };

    return stream;

  }
}

module.exports = StreamConverter;
