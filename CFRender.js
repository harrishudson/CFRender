/**
 * CFRender
 * CFUtils
 * Basic Cartesian 2D Grid Renderer for NetCDF (v3.0)
 * For NetCDF files in CF (Climate Forecasting) convention format
 *
 * Includes (modified) embedded dependent libraries;
 * Embedded libraries have been modified by the author for usage here.
 * 1. IOBuffer
 * 2. netCDFjs (modified by Harris Hudson)
 * Copyright as per respective authors
 *
 * So, this script has no external dependencies and is browser ready.
 * 
 * CFRender 
 * CFUtils
 *
 * Author: Copyright (c) 2023 Harris Hudson  harris@harrishudson.com 
 **/


/* ------------------------------------------------------------------------------------------------- */

// ----------------------------------
// BEGIN Embedded dependent libraries
// ----------------------------------

/**
 * @file IO Buffer
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 * @private
 *
 * Adapted from https://github.com/image-js/iobuffer
 * MIT License, Copyright (c) 2015 Michaël Zasso
 **/
 
const defaultByteLength = 1024 * 8
const charArray = []
 
/**
 * Class for writing and reading binary data
 */
class IOBuffer {
  /**
   * @param {undefined|number|ArrayBuffer|TypedArray|IOBuffer|Buffer} data - The data to construct the IOBuffer with.
   *
   * If it's a number, it will initialize the buffer with the number as
   * the buffer's length. If it's undefined, it will initialize the buffer
   * with a default length of 8 Kb. If its an ArrayBuffer, a TypedArray,
   * an IOBuffer instance, or a Node.js Buffer, it will create a view over
   * the underlying ArrayBuffer.
   * @param {object} [params]
   * @param {number} [params.offset=0] - Ignore the first n bytes of the ArrayBuffer
   */
  constructor (data, params) {
    const p = params || {}
    let dataIsGiven = false
    if (data === undefined) {
      data = defaultByteLength
    }
    if (typeof data === 'number') {
      data = new ArrayBuffer(data)
    } else {
      dataIsGiven = true
      this._lastWrittenByte = data.byteLength
    }
 
    const offset = p.offset ? p.offset >>> 0 : 0
    let byteLength = data.byteLength - offset
    let dvOffset = offset
    if (data.buffer) {
      if (data.byteLength !== data.buffer.byteLength) {
        dvOffset = data.byteOffset + offset
      }
      data = data.buffer
    }
    if (dataIsGiven) {
      this._lastWrittenByte = byteLength
    } else {
      this._lastWrittenByte = 0
    }
 
    /**
     * Reference to the internal ArrayBuffer object
     * @type {ArrayBuffer}
     */
    this.buffer = data
    /**
     * Byte length of the internal ArrayBuffer
     * @type {Number}
     */
    this.length = byteLength
    /**
     * Byte length of the internal ArrayBuffer
     * @type {Number}
     */
    this.byteLength = byteLength
    /**
     * Byte offset of the internal ArrayBuffer
     * @type {Number}
     */
    this.byteOffset = dvOffset
    /**
     * The current offset of the buffer's pointer
     * @type {Number}
     */
    this.offset = 0
 
    this.littleEndian = true
    this._data = new DataView(this.buffer, dvOffset, byteLength)
    this._mark = 0
    this._marks = []
  }
 
  /**
   * Checks if the memory allocated to the buffer is sufficient to store more bytes after the offset
   * @param {number} [byteLength=1] The needed memory in bytes
   * @return {boolean} Returns true if there is sufficient space and false otherwise
   */
  available (byteLength) {
    if (byteLength === undefined) byteLength = 1
    return (this.offset + byteLength) <= this.length
  }
 
  /**
   * Check if little-endian mode is used for reading and writing multi-byte values
   * @return {boolean} Returns true if little-endian mode is used, false otherwise
   */
  isLittleEndian () {
    return this.littleEndian
  }
 
  /**
   * Set little-endian mode for reading and writing multi-byte values
   * @return {IOBuffer}
   */
  setLittleEndian () {
    this.littleEndian = true
    return this
  }
 
  /**
   * Check if big-endian mode is used for reading and writing multi-byte values
   * @return {boolean} Returns true if big-endian mode is used, false otherwise
   */
  isBigEndian () {
    return !this.littleEndian
  }
 
  /**
   * Switches to big-endian mode for reading and writing multi-byte values
   * @return {IOBuffer}
   */
  setBigEndian () {
    this.littleEndian = false
    return this
  }
 
  /**
   * Move the pointer n bytes forward
   * @param {number} n
   * @return {IOBuffer}
   */
  skip (n) {
    if (n === undefined) n = 1
    this.offset += n
    return this
  }
 
  /**
   * Move the pointer to the given offset
   * @param {number} offset
   * @return {IOBuffer}
   */
  seek (offset) {
    this.offset = offset
    return this
  }
 
  /**
   * Store the current pointer offset.
   * @see {@link IOBuffer#reset}
   * @return {IOBuffer}
   */
  mark () {
    this._mark = this.offset
    return this
  }
 
  /**
   * Move the pointer back to the last pointer offset set by mark
   * @see {@link IOBuffer#mark}
   * @return {IOBuffer}
   */
  reset () {
    this.offset = this._mark
    return this
  }
 
  /**
   * Push the current pointer offset to the mark stack
   * @see {@link IOBuffer#popMark}
   * @return {IOBuffer}
   */
  pushMark () {
    this._marks.push(this.offset)
    return this
  }
 
  /**
   * Pop the last pointer offset from the mark stack, and set the current pointer offset to the popped value
   * @see {@link IOBuffer#pushMark}
   * @return {IOBuffer}
   */
  popMark () {
    const offset = this._marks.pop()
    if (offset === undefined) throw new Error('Mark stack empty')
    this.seek(offset)
    return this
  }
 
  /**
   * Move the pointer offset back to 0
   * @return {IOBuffer}
   */
  rewind () {
    this.offset = 0
    return this
  }
 
  /**
   * Make sure the buffer has sufficient memory to write a given byteLength at the current pointer offset
   * If the buffer's memory is insufficient, this method will create a new buffer (a copy) with a length
   * that is twice (byteLength + current offset)
   * @param {number} [byteLength = 1]
   * @return {IOBuffer}
   */
  ensureAvailable (byteLength) {
    if (byteLength === undefined) byteLength = 1
    if (!this.available(byteLength)) {
      const lengthNeeded = this.offset + byteLength
      const newLength = lengthNeeded * 2
      const newArray = new Uint8Array(newLength)
      newArray.set(new Uint8Array(this.buffer))
      this.buffer = newArray.buffer
      this.length = this.byteLength = newLength
      this._data = new DataView(this.buffer)
    }
    return this
  }
 
  /**
   * Read a byte and return false if the byte's value is 0, or true otherwise
   * Moves pointer forward
   * @return {boolean}
   */
  readBoolean () {
    return this.readUint8() !== 0
  }
 
  /**
   * Read a signed 8-bit integer and move pointer forward
   * @return {number}
   */
  readInt8 () {
    return this._data.getInt8(this.offset++)
  }
 
  /**
   * Read an unsigned 8-bit integer and move pointer forward
   * @return {number}
   */
  readUint8 () {
    return this._data.getUint8(this.offset++)
  }
 
  /**
   * Alias for {@link IOBuffer#readUint8}
   * @return {number}
   */
  readByte () {
    return this.readUint8()
  }
 
  /**
   * Read n bytes and move pointer forward.
   * @param {number} n
   * @return {Uint8Array}
   */
  readBytes (n) {
    if (n === undefined) n = 1
    var bytes = new Uint8Array(n)
    for (var i = 0; i < n; i++) {
      bytes[i] = this.readByte()
    }
    return bytes
  }
 
  /**
   * Read a 16-bit signed integer and move pointer forward
   * @return {number}
   */
  readInt16 () {
    var value = this._data.getInt16(this.offset, this.littleEndian)
    this.offset += 2
    return value
  }
 
  /**
   * Read a 16-bit unsigned integer and move pointer forward
   * @return {number}
   */
  readUint16 () {
    var value = this._data.getUint16(this.offset, this.littleEndian)
    this.offset += 2
    return value
  }
 
  /**
   * Read a 32-bit signed integer and move pointer forward
   * @return {number}
   */
  readInt32 () {
    var value = this._data.getInt32(this.offset, this.littleEndian)
    this.offset += 4
    return value
  }
 
  /**
   * Read a 32-bit unsigned integer and move pointer forward
   * @return {number}
   */
  readUint32 () {
    var value = this._data.getUint32(this.offset, this.littleEndian)
    this.offset += 4
    return value
  }
 
  /**
   * Read a 32-bit floating number and move pointer forward
   * @return {number}
   */
  readFloat32 () {
    var value = this._data.getFloat32(this.offset, this.littleEndian)
    this.offset += 4
    return value
  }
 
  /**
   * Read a 64-bit floating number and move pointer forward
   * @return {number}
   */
  readFloat64 () {
    var value = this._data.getFloat64(this.offset, this.littleEndian)
    this.offset += 8
    return value
  }
 
  /**
   * Read 1-byte ascii character and move pointer forward
   * @return {string}
   */
  readChar () {
    return String.fromCharCode(this.readInt8())
  }
 
  /**
   * Read n 1-byte ascii characters and move pointer forward
   * @param {number} n
   * @return {string}
   */
  readChars (n) {
    if (n === undefined) n = 1
    charArray.length = n
    for (var i = 0; i < n; i++) {
      charArray[i] = this.readChar()
    }
    return charArray.join('')
  }
 
  /**
   * Write 0xff if the passed value is truthy, 0x00 otherwise
   * @param {any} value
   * @return {IOBuffer}
   */
  writeBoolean (value) {
    this.writeUint8(value ? 0xff : 0x00)
    return this
  }
 
  /**
   * Write value as an 8-bit signed integer
   * @param {number} value
   * @return {IOBuffer}
   */
  writeInt8 (value) {
    this.ensureAvailable(1)
    this._data.setInt8(this.offset++, value)
    this._updateLastWrittenByte()
    return this
  }
 
  /**
   * Write value as a 8-bit unsigned integer
   * @param {number} value
   * @return {IOBuffer}
   */
  writeUint8 (value) {
    this.ensureAvailable(1)
    this._data.setUint8(this.offset++, value)
    this._updateLastWrittenByte()
    return this
  }
 
  /**
   * An alias for {@link IOBuffer#writeUint8}
   * @param {number} value
   * @return {IOBuffer}
   */
  writeByte (value) {
    return this.writeUint8(value)
  }
 
  /**
   * Write bytes
   * @param {Array|Uint8Array} bytes
   * @return {IOBuffer}
   */
  writeBytes (bytes) {
    this.ensureAvailable(bytes.length)
    for (var i = 0; i < bytes.length; i++) {
      this._data.setUint8(this.offset++, bytes[i])
    }
    this._updateLastWrittenByte()
    return this
  }
 
  /**
   * Write value as an 16-bit signed integer
   * @param {number} value
   * @return {IOBuffer}
   */
  writeInt16 (value) {
    this.ensureAvailable(2)
    this._data.setInt16(this.offset, value, this.littleEndian)
    this.offset += 2
    this._updateLastWrittenByte()
    return this
  }
 
  /**
   * Write value as a 16-bit unsigned integer
   * @param {number} value
   * @return {IOBuffer}
   */
  writeUint16 (value) {
    this.ensureAvailable(2)
    this._data.setUint16(this.offset, value, this.littleEndian)
    this.offset += 2
    this._updateLastWrittenByte()
    return this
  }
 
  /**
   * Write a 32-bit signed integer at the current pointer offset
   * @param {number} value
   * @return {IOBuffer}
   */
  writeInt32 (value) {
    this.ensureAvailable(4)
    this._data.setInt32(this.offset, value, this.littleEndian)
    this.offset += 4
    this._updateLastWrittenByte()
    return this
  }
 
  /**
   * Write a 32-bit unsigned integer at the current pointer offset
   * @param {number} value - The value to set
   * @return {IOBuffer}
   */
  writeUint32 (value) {
    this.ensureAvailable(4)
    this._data.setUint32(this.offset, value, this.littleEndian)
    this.offset += 4
    this._updateLastWrittenByte()
    return this
  }
 
  /**
   * Write a 32-bit floating number at the current pointer offset
   * @param {number} value - The value to set
   * @return {IOBuffer}
   */
  writeFloat32 (value) {
    this.ensureAvailable(4)
    this._data.setFloat32(this.offset, value, this.littleEndian)
    this.offset += 4
    this._updateLastWrittenByte()
    return this
  }
 
  /**
   * Write a 64-bit floating number at the current pointer offset
   * @param {number} value
   * @return {IOBuffer}
   */
  writeFloat64 (value) {
    this.ensureAvailable(8)
    this._data.setFloat64(this.offset, value, this.littleEndian)
    this.offset += 8
    this._updateLastWrittenByte()
    return this
  }
 
  /**
   * Write the charCode of the passed string's first character to the current pointer offset
   * @param {string} str - The character to set
   * @return {IOBuffer}
   */
  writeChar (str) {
    return this.writeUint8(str.charCodeAt(0))
  }
 
  /**
   * Write the charCodes of the passed string's characters to the current pointer offset
   * @param {string} str
   * @return {IOBuffer}
   */
  writeChars (str) {
    for (var i = 0; i < str.length; i++) {
      this.writeUint8(str.charCodeAt(i))
    }
    return this
  }
 
  /**
   * Export a Uint8Array view of the internal buffer.
   * The view starts at the byte offset and its length
   * is calculated to stop at the last written byte or the original length.
   * @return {Uint8Array}
   */
  toArray () {
    return new Uint8Array(this.buffer, this.byteOffset, this._lastWrittenByte)
  }
 
  /**
   * Same as {@link IOBuffer#toArray} but returns a Buffer if possible. Otherwise returns a Uint8Array.
   * @return {Buffer|Uint8Array}
   */
  getBuffer () {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(this.toArray())
    } else {
      return this.toArray()
    }
  }
 
  /**
   * Update the last written byte offset
   * @private
   */
  _updateLastWrittenByte () {
    if (this.offset > this._lastWrittenByte) {
      this._lastWrittenByte = this.offset
    }
  }
}
 


/** Embedded dependent library
 *  NetCDFjs
 *  Originally sourced from; https://github.com/cheminfo/netcdfjs
 *  Significant modifications by Harris Hudson (2023) to make it self contained and web browser ready
 **/

class NetCDFjs {

  constructor() {

   // Type constants
   this.types = {
    BYTE: 1,
    CHAR: 2,
    SHORT: 3,
    INT: 4,
    FLOAT: 5,
    DOUBLE: 6,
   }

   // Grammar constants
   this.ZERO = 0;
   this.NC_DIMENSION = 10;
   this.NC_VARIABLE = 11;
   this.NC_ATTRIBUTE = 12;
   this.NC_UNLIMITED = 0;


   /* Byte data values will be returned as integer to make byte
    * datasets interpretable and can be rendered in a scalable way.
    **/
   this.read_byte_as_integer = true;

  }

  /**
   * Throws a non-valid NetCDF exception if the statement it's true
   * @ignore
   * @param {boolean} statement - Throws if true
   * @param {string} reason - Reason to throw
   */
  notNetcdf(statement, reason) {
    if (statement) {
      throw new TypeError(`Not a valid NetCDF v3.x file: ${reason}`);
    }
  }

  /**
   * Moves 1, 2, or 3 bytes to next 4-byte boundary
   * @ignore
   * @param {IOBuffer} buffer - Buffer for the file data
   */
  padding(buffer) {
    if (buffer.offset % 4 !== 0) {
      buffer.skip(4 - (buffer.offset % 4));
    }
  }

  /**
   * Reads the name
   * @ignore
   * @param {IOBuffer} buffer - Buffer for the file data
   * @return {string} - Name
   */
  readName(buffer) {
    // Read name
    let nameLength = buffer.readUint32();
    let name = buffer.readChars(nameLength);

    // validate name
    // TODO

    // Apply padding
    this.padding(buffer);
    return name;
  }

  /**
   * Parse a number into their respective type
   * @ignore
   * @param {number} type - integer that represents the type
   * @return {string} - parsed value of the type
   */
  num2str(type) {
    switch (Number(type)) {
      case this.types.BYTE:
        return "byte";
      case this.types.CHAR:
        return "char";
      case this.types.SHORT:
        return "short";
      case this.types.INT:
        return "int";
      case this.types.FLOAT:
        return "float";
      case this.types.DOUBLE:
        return "double";
      /* istanbul ignore next */
      default:
        return "undefined";
    }
  }

  /**
   * Parse a number type identifier to his size in bytes
   * @ignore
   * @param {number} type - integer that represents the type
   * @return {number} -size of the type
   */
  num2bytes(type) {
    switch (Number(type)) {
      case this.types.BYTE:
        return 1;
      case this.types.CHAR:
        return 1;
      case this.types.SHORT:
        return 2;
      case this.types.INT:
        return 4;
      case this.types.FLOAT:
        return 4;
      case this.types.DOUBLE:
        return 8;
      /* istanbul ignore next */
      default:
        return -1;
    }
  }

  /**
   * Reverse search of num2str
   * @ignore
   * @param {string} type - string that represents the type
   * @return {number} - parsed value of the type
   */
  str2num(type) {
  switch (String(type)) {
    case "byte":
      return this.types.BYTE;
    case "char":
      return this.types.CHAR;
    case "short":
      return this.types.SHORT;
    case "int":
      return this.types.INT;
    case "float":
      return this.types.FLOAT;
    case "double":
      return this.types.DOUBLE;
    /* istanbul ignore next */
    default:
      return -1;
    }
  }

  /**
   * Auxiliary function to read numeric data
   * @ignore
   * @param {number} size - Size of the element to read
   * @param {function} bufferReader - Function to read next value
   * @return {Array<number>|number}
   */
  readNumber(size, bufferReader) {
    if (size !== 1) {
      let numbers = new Array(size);
      for (let i = 0; i < size; i++) {
        numbers[i] = bufferReader();
      }
      return numbers;
    } else {
      return bufferReader();
    }
  }

  /**
   * Given a type and a size reads the next element
   * @ignore
   * @param {IOBuffer} buffer - Buffer for the file data
   * @param {number} type - Type of the data to read
   * @param {number} size - Size of the element to read
   * @return {string|Array<number>|number}
   */
  readType(buffer, type, size) {
    switch (type) {
      case this.types.BYTE:
        return buffer.readBytes(size);
      case this.types.CHAR:
        return this.trimNull(buffer.readChars(size));
      case this.types.SHORT:
        return this.readNumber(size, buffer.readInt16.bind(buffer));
      case this.types.INT:
        return this.readNumber(size, buffer.readInt32.bind(buffer));
      case this.types.FLOAT:
        return this.readNumber(size, buffer.readFloat32.bind(buffer));
      case this.types.DOUBLE:
        return this.readNumber(size, buffer.readFloat64.bind(buffer));
      /* istanbul ignore next */
      default:
        this.notNetcdf(true, `non valid type ${type}`);
        return undefined;
    }
  }

  /**
   * Removes null terminate value
   * @ignore
   * @param {string} value - String to trim
   * @return {string} - Trimmed string
   */
  trimNull(value) {
    if (value.charCodeAt(value.length - 1) === 0) {
      return value.substring(0, value.length - 1);
    }
    return value;
  }

  toString() {
    let result = [];
  
    result.push("DIMENSIONS");
    for (let dimension of this.dimensions) {
      result.push(`  ${dimension.name.padEnd(30)} = size: ${dimension.size}`);
    }

    result.push("");
    result.push("GLOBAL ATTRIBUTES");
    for (let attribute of this.globalAttributes) {
      result.push(`  ${attribute.name.padEnd(30)} = ${attribute.value}`);
    }

    let variables = JSON.parse(JSON.stringify(this.variables));
    result.push("");
    result.push("VARIABLES:");
    for (let variable of variables) {
      variable.value = this.getDataVariable(variable);
      let stringify = JSON.stringify(variable.value);
      if (stringify.length > 50) stringify = stringify.substring(0, 50);
      if (!isNaN(variable.value.length)) {
        stringify += ` (length: ${variable.value.length})`;
      }
      result.push(`  ${variable.name.padEnd(30)} = ${stringify}`);
    }
    return result.join("\n");
  }

  // const STREAMING = 4294967295;

  /**
   * Read data for the given non-record variable
   * @ignore
   * @param {IOBuffer} buffer - Buffer for the file data
   * @param {object} variable - Variable metadata
   * @return {Array} - Data of the element
   */
  nonRecord(buffer, variable) {
    // variable type
    const type = this.str2num(variable.type);
  
    // size of the data
    let size = variable.size / this.num2bytes(type);
  
    // iterates over the data
    let data = new Array(size);
    for (let i = 0; i < size; i++) {
     if ((this.read_byte_as_integer) && (variable.type == this.types.BYTE))
      data[i] = this.readType(buffer, type, 1)[0];
     else
      data[i] = this.readType(buffer, type, 1);
    }
  
    return data;
  }

  /**
   * Read data for the given record variable
   * @ignore
   * @param {IOBuffer} buffer - Buffer for the file data
   * @param {object} variable - Variable metadata
   * @param {object} recordDimension - Record dimension metadata
   * @return {Array} - Data of the element
   */
  record(buffer, variable, recordDimension) {
    // variable type
    const type = this.str2num(variable.type);
    const width = variable.size ? variable.size / this.num2bytes(type) : 1;
  
    // size of the data
    // TODO streaming data
    let size = recordDimension.length;
  
    // iterates over the data
    let data = new Array(size);
    const step = recordDimension.recordStep;
  
    for (let i = 0; i < size; i++) {
      let currentOffset = buffer.offset;
      if ((this.read_byte_as_integer) && (variable.type == this.types.BYTE))
       data[i] = this.readType(buffer, type, width)[0];
      else
       data[i] = this.readType(buffer, type, width);
      //Was this;   data[i] = this.readType(buffer, type, width);
      buffer.seek(currentOffset + step);
    }
  
    return data;
  }
  
  /**
   * Read the header of the file
   * @ignore
   * @param {IOBuffer} buffer - Buffer for the file data
   * @param {number} version - Version of the file
   * @return {object} - Object with the fields:
   *  * `recordDimension`: Number with the length of record dimension
   *  * `dimensions`: List of dimensions
   *  * `globalAttributes`: List of global attributes
   *  * `variables`: List of variables
   */
  header(buffer, version) {
    // Length of record dimension
    // sum of the varSize's of all the record variables.
    let header = { recordDimension: { length: buffer.readUint32() } };
  
    // Version
    header.version = version;
  
    // List of dimensions
    let dimList = this.dimensionsList(buffer);
    header.recordDimension.id = dimList.recordId; // id of the unlimited dimension
    header.recordDimension.name = dimList.recordName; // name of the unlimited dimension
    header.dimensions = dimList.dimensions;

    // List of global attributes
    header.globalAttributes = this.attributesList(buffer);

    // List of variables
    let variables = this.variablesList(buffer, dimList.recordId, version);
    header.variables = variables.variables;
    header.recordDimension.recordStep = variables.recordStep;
  
    return header;
  }

  /**
   * List of dimensions
   * @ignore
   * @param {IOBuffer} buffer - Buffer for the file data
   * @return {object} - Ojbect containing the following properties:
   *  * `dimensions` that is an array of dimension object:
   *  * `name`: String with the name of the dimension
   *  * `size`: Number with the size of the dimension dimensions: dimensions
   *  * `recordId`: the id of the dimension that has unlimited size or undefined,
   *  * `recordName`: name of the dimension that has unlimited size
   */
  dimensionsList(buffer) {
    let recordId, recordName;
    const dimList = buffer.readUint32();
    let dimensions;
    if (dimList === this.ZERO) {
      this.notNetcdf(
        buffer.readUint32() !== this.ZERO,
        "wrong empty tag for list of dimensions"
      );
      return [];
    } else {
      this.notNetcdf(dimList !== this.NC_DIMENSION, "wrong tag for list of dimensions");
  
      // Length of dimensions
      const dimensionSize = buffer.readUint32();
      dimensions = new Array(dimensionSize);
      for (let dim = 0; dim < dimensionSize; dim++) {
        // Read name
        let name = this.readName(buffer);
  
        // Read dimension size
        const size = buffer.readUint32();
        if (size === this.NC_UNLIMITED) {
          // in netcdf 3 one field can be of size unlimmited
          recordId = dim;
          recordName = name;
        }
  
        dimensions[dim] = {
          name,
          size,
        };
      }
    }
    return {
      dimensions,
      recordId,
      recordName,
    };
  }

  /**
   * List of attributes
   * @ignore
   * @param {IOBuffer} buffer - Buffer for the file data
   * @return {Array<object>} - List of attributes with:
   *  * `name`: String with the name of the attribute
   *  * `type`: String with the type of the attribute
   *  * `value`: A number or string with the value of the attribute
   */
  attributesList(buffer) {
    const gAttList = buffer.readUint32();
    let attributes;
    if (gAttList === this.ZERO) {
      this.notNetcdf(
        buffer.readUint32() !== this.ZERO,
        "wrong empty tag for list of attributes"
      );
      return [];
    } else {
      this.notNetcdf(gAttList !== this.NC_ATTRIBUTE, "wrong tag for list of attributes");
  
      // Length of attributes
      const attributeSize = buffer.readUint32();
      attributes = new Array(attributeSize);
      for (let gAtt = 0; gAtt < attributeSize; gAtt++) {
        // Read name
        let name = this.readName(buffer);

        // Read type
        let type = buffer.readUint32();
        this.notNetcdf(type < 1 || type > 6, `non valid type ${type}`);
  
        // Read attribute
        let size = buffer.readUint32();
        let value = this.readType(buffer, type, size);
  
        // Apply padding
        this.padding(buffer);
  
        attributes[gAtt] = {
          name,
          type: this.num2str(type),
          value,
        };
      }
    }
    return attributes;
  }

  /**
   * List of variables
   * @ignore
   * @param {IOBuffer} buffer - Buffer for the file data
   * @param {number} recordId - Id of the unlimited dimension (also called record dimension)
   *                            This value may be undefined if there is no unlimited dimension
   * @param {number} version - Version of the file
   * @return {object} - Number of recordStep and list of variables with:
   *  * `name`: String with the name of the variable
   *  * `dimensions`: Array with the dimension IDs of the variable
   *  * `attributes`: Array with the attributes of the variable
   *  * `type`: String with the type of the variable
   *  * `size`: Number with the size of the variable
   *  * `offset`: Number with the offset where of the variable begins
   *  * `record`: True if is a record variable, false otherwise (unlimited size)
   */
  variablesList(buffer, recordId, version) {
    const varList = buffer.readUint32();
    let recordStep = 0;
    let variables;
    if (varList === this.ZERO) {
      this.notNetcdf(
        buffer.readUint32() !== this.ZERO,
        "wrong empty tag for list of variables"
      );
      return [];
    } else {
      this.notNetcdf(varList !== this.NC_VARIABLE, "wrong tag for list of variables");
  
      // Length of variables
      const variableSize = buffer.readUint32();
      variables = new Array(variableSize);
      for (let v = 0; v < variableSize; v++) {
        // Read name
        let name = this.readName(buffer);
  
        // Read dimensionality of the variable
        const dimensionality = buffer.readUint32();
  
        // Index into the list of dimensions
        let dimensionsIds = new Array(dimensionality);
        for (let dim = 0; dim < dimensionality; dim++) {
          dimensionsIds[dim] = buffer.readUint32();
        }
  
        // Read variables size
        let attributes = this.attributesList(buffer);
  
        // Read type
        let type = buffer.readUint32();
        this.notNetcdf(type < 1 && type > 6, `non valid type ${type}`);
  
        // Read variable size
        // The 32-bit varSize field is not large enough to contain the size of variables that require
        // more than 2^32 - 4 bytes, so 2^32 - 1 is used in the varSize field for such variables.
        const varSize = buffer.readUint32();
  
        // Read offset
        let offset = buffer.readUint32();
        if (version === 2) {
          this.notNetcdf(offset > 0, "offsets larger than 4GB not supported");
          offset = buffer.readUint32();
        }
  
        let record = false;
        // Count amount of record variables
        if (typeof recordId !== "undefined" && dimensionsIds[0] === recordId) {
          recordStep += varSize;
          record = true;
        }
        variables[v] = {
          name,
          dimensions: dimensionsIds,
          attributes,
          type: this.num2str(type),
          size: varSize,
          offset,
          record,
        };
      }
    }
  
    return {
      variables,
      recordStep,
    };
  }
}


/**
 * Reads a NetCDF v3.x file
 * https://www.unidata.ucar.edu/software/netcdf/docs/file_format_specifications.html
 * @param {ArrayBuffer} data - ArrayBuffer or any Typed Array (including Node.js' Buffer from v4) with the data
 * @constructor
 */
class NetCDFReader extends NetCDFjs {
  constructor(data) {
    super()

    const buffer = new IOBuffer(data);
    buffer.setBigEndian();

    // Validate that it's a NetCDF file
    this.notNetcdf(buffer.readChars(3) !== "CDF", "should start with CDF");

    // Check the NetCDF format
    const version = buffer.readByte();
    this.notNetcdf(version > 2, "unknown version");

    // Read the header
    this.headers = this.header(buffer, version);
    this.buffer = buffer;
  }

  /**
   * @return {string} - Version for the NetCDF format
   */
  get version() {
    if (this.headers.version === 1) {
      return "classic format";
    } else {
      return "64-bit offset format";
    }
  }

  /**
   * @return {object} - Metadata for the record dimension
   *  * `length`: Number of elements in the record dimension
   *  * `id`: Id number in the list of dimensions for the record dimension
   *  * `name`: String with the name of the record dimension
   *  * `recordStep`: Number with the record variables step size
   */
  get recordDimension() {
    return this.headers.recordDimension;
  }

  /**
   * @return {Array<object>} - List of dimensions with:
   *  * `name`: String with the name of the dimension
   *  * `size`: Number with the size of the dimension
   */
  get dimensions() {
    return this.headers.dimensions;
  }

  /**
   * @return {Array<object>} - List of global attributes with:
   *  * `name`: String with the name of the attribute
   *  * `type`: String with the type of the attribute
   *  * `value`: A number or string with the value of the attribute
   */
  get globalAttributes() {
    return this.headers.globalAttributes;
  }

  /**
   * Returns the value of an attribute
   * @param {string} attributeName
   * @return {string} Value of the attributeName or null
   */
  getAttribute(attributeName) {
    const attribute = this.globalAttributes.find(
      (val) => val.name === attributeName
    );
    if (attribute) return attribute.value;
    return null;
  }

  /**
   * Returns the value of a variable as a string
   * @param {string} variableName
   * @return {string} Value of the variable as a string or null
   */
  getDataVariableAsString(variableName) {
    const variable = this.getDataVariable(variableName);
    if (variable) return variable.join("");
    return null;
  }

  /**
   * @return {Array<object>} - List of variables with:
   *  * `name`: String with the name of the variable
   *  * `dimensions`: Array with the dimension IDs of the variable
   *  * `attributes`: Array with the attributes of the variable
   *  * `type`: String with the type of the variable
   *  * `size`: Number with the size of the variable
   *  * `offset`: Number with the offset where of the variable begins
   *  * `record`: True if is a record variable, false otherwise
   */
  get variables() {
    return this.header.variables;
  }

  toString() {
    return toString.call(this);
  }

  /**
   * Retrieves the data for a given variable
   * @param {string|object} variableName - Name of the variable to search or variable object
   * @return {Array} - List with the variable values
   */
  getDataVariable(variableName) {
    let variable;
    if (typeof variableName === "string") {
      // search the variable
      variable = this.headers.variables.find((val) => {
        return val.name === variableName;
      });
    } else {
      variable = variableName;
    }

    // throws if variable not found
    this.notNetcdf(variable === undefined, `variable not found: ${variableName}`);

    // go to the offset position
    this.buffer.seek(variable.offset);

    if (variable.record) {
      // record variable case
      return this.record(this.buffer, variable, this.headers.recordDimension);
    } else {
      // non-record variable case
      return this.nonRecord(this.buffer, variable);
    }
  }

  /**
   * Check if a dataVariable exists
   * @param {string} variableName - Name of the variable to find
   * @return {boolean}
   */
  dataVariableExists(variableName) {
    const variable = this.headers.variables.find((val) => {
      return val.name === variableName;
    });
    return variable !== undefined;
  }

  /**
   * Check if an attribute exists
   * @param {string} attributeName - Name of the attribute to find
   * @return {boolean}
   */
  attributeExists(attributeName) {
    const attribute = this.globalAttributes.find(
      (val) => val.name === attributeName
    );
    return attribute !== undefined;
  }
}


// --------------------------------
// END Embedded dependent libraries
// --------------------------------







/* ------------------------------------------------------------------------------------------------- */







// ---------------------------
// Core components of CFRender
// ---------------------------

var _CFUtils = {

 steppedHexColor: function(value, colorStops) {
  if ((!value) && (value != 0))
   return null

  if (!colorStops)
   return null

  let orderedColorStops = colorStops.sort((a, b) => a.value - b.value)

  let minKey = 0
  let maxKey = orderedColorStops.length - 1

  if (value <= orderedColorStops[minKey].value) 
   return orderedColorStops[minKey].color;
  if (value >= orderedColorStops[maxKey].value) 
   return orderedColorStops[maxKey].color;

  let startIndex = 0;
  while (value > orderedColorStops[startIndex].value) {
    startIndex++;
  }

  const startColorStop = orderedColorStops[startIndex - 1]
  const endColorStop = orderedColorStops[startIndex]
  const percentage = (value - startColorStop.value) / (endColorStop.value - startColorStop.value);

  const startRGB = this.hexToRgb(startColorStop.color);
  const endRGB = this.hexToRgb(endColorStop.color);
  const interpolatedColor = this.interpolateColor(startRGB, endRGB, percentage);
  const hexColor = this.rgbToHex(interpolatedColor);

  return hexColor;
 },

 interpolateColor: function(startColor, endColor, percentage) {
  const r = parseInt(startColor[0] + (endColor[0] - startColor[0]) * percentage);
  const g = parseInt(startColor[1] + (endColor[1] - startColor[1]) * percentage);
  const b = parseInt(startColor[2] + (endColor[2] - startColor[2]) * percentage);
  return [ r, g, b ];
 },

 linearHexColor: function(value, minValue, maxValue, minHexColor, maxHexColor) {
  if ((!value) && (value != 0))
   return null
  value = Math.min(value, maxValue)
  value = Math.max(value, minValue)
  const valuePercent = (value - minValue) / (maxValue - minValue)
  const minColorArray = this.hexToRgb(minHexColor)
  const maxColorArray = this.hexToRgb(maxHexColor)
  const colorArray = []
  for (let i = 0; i < 3; i++) {
    colorArray[i] = Math.round(minColorArray[i] + (maxColorArray[i] - minColorArray[i]) * valuePercent)
  }
  return this.rgbToHex(colorArray)
 },

 hexToRgb: function(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  const resultSplit = result ? [  
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null

  if (resultSplit) {
   return resultSplit
  }

  return null
 },

 componentToHex: function(c) {
  const hex = c.toString(16)
  return hex.length === 1 ? "0" + hex : hex
 },

 rgbToHex: function(rgb) {
  return "#" + this.componentToHex(rgb[0]) + this.componentToHex(rgb[1]) + this.componentToHex(rgb[2])
 },

 linearOpacity: function(value, minValue, maxValue, minOpacity = 0, maxOpacity = 1) {
  if ((!value) && (value != 0))
   return null
  value = Math.min(value, maxValue)
  value = Math.max(value, minValue)
  minOpacity = Math.max(0, minOpacity)
  maxOpacity = Math.min(1, maxOpacity)
  const valuePercent = (value - minValue) / (maxValue - minValue)
  return parseFloat(((maxOpacity - minOpacity) * valuePercent) + minOpacity)
 },

 getTimeISOString: function(value, units) {
  try {
   // Extract the numeric value and units from the time string
   const [clock_units, , baseDateStr] = units.split(" ")
   // Convert the value to a floating-point number
   const numericValue = parseFloat(value);
   // Convert the numeric value to milliseconds based on the units
   let milliseconds;
   let lower_clock_units = clock_units.toLowerCase() 
   if ((lower_clock_units === "days") || (lower_clock_units === 'day')) {
     milliseconds = numericValue * 24 * 60 * 60 * 1000;
   } else if ((lower_clock_units === "seconds") || (lower_clock_units === 'second')) {
     milliseconds = numericValue * 1000;
   } else if ((lower_clock_units === "minutes") || (lower_clock_units === 'minute')) {
     milliseconds = numericValue * 60 * 1000;
   } else if ((lower_clock_units === "hours") || (lower_clock_units === "hour")) {
     milliseconds = numericValue * 60 * 60 * 1000;
   } else {
    return value
   }
   // Base date
   const baseDate = new Date(baseDateStr)
   // Calculate the final date by adding milliseconds to the base date
   const finalDate = new Date(baseDate.getTime() + milliseconds)
   // Format the final date as a string
   const formattedDate = finalDate.toISOString()
   return formattedDate
  } catch(e) {
   return value
  }
 }

}

function CFUtils() {return _CFUtils; }

class CFRender {
  constructor(src, extentCache, projectionCache) {

   this.netCDF = new NetCDFReader(src)
  
   // If file is used read only then various caching will be utilised
   this.file_read_only = true

   this.dimensionFilter = {}

   this.dimIndex = {}
   for (let idx = 0; idx < this.netCDF.headers.dimensions.length; idx++)
    this.dimIndex[this.netCDF.headers.dimensions[idx].name] = idx

   this.varIndex = {}
   for (let idx = 0; idx < this.netCDF.headers.variables.length; idx++)
    this.varIndex[this.netCDF.headers.variables[idx].name] = idx

   this.Axes = {}
   try {
    this.Axes['X'] = this.searchVariablesforAxis('X')
   } catch(e) { console.error(e); console.error('Cannot determine X axis'); }

   try {
    this.Axes['Y'] = this.searchVariablesforAxis('Y')
   } catch(e) { console.error(e); console.error('Cannot determine Y axis'); }

   try {
    this.Axes['T'] = this.searchVariablesforAxis('T')
   } catch(e) { console.info(e); console.info('Cannot determine T axis - info only'); }

   // when file_read_only is true, these will be used as caching objects
   this.stats = {}
   this.XYbbox = {}
   this.XYBounds = {} 
   if (extentCache)
    this.extentCache = extentCache
   else
    this.extentCache = {}
   if (projectionCache)
    this.projectionCache = projectionCache
   else
    this.projectionCache = {}

   this.debug = false
  }

  clearCache() {
   this.projectionCache = {}
   this.extentCache = {}
  }

  DimsIndexOfName(name) {
   return this.dimIndex[name]
  }

  searchVariablesforAxis(Axis) {
   if (!this.netCDF.headers.variables)
    throw 'No NetCDF variable found.'

   // CoordAxis - only used for final search of '_CoordinateAxisType'
   // Translate defintive axis to loose _CoordinateAxisType definition
   var CoordAxis;
   switch(Axis) {
    case 'X':
     CoordAxis = 'Lon';
     break;
    case 'Y':
     CoordAxis = 'Lat';
     break;
    case 'T':
     CoordAxis = 'Time';
     break;
   }

   // Standard_Name - only used for final search of 'standard_name'
   // As last ditch attempt to determine axis
   var StandardNameAxis;
   switch(Axis) {
    case 'X':
     StandardNameAxis = 'longitude';
     break;
    case 'Y':
     StandardNameAxis = 'latitude';
     break;
    case 'T':
     StandardNameAxis = 'time';
     break;
   }


   for (let var_idx = 0; var_idx < this.netCDF.headers.variables.length; var_idx++) {
    let this_var = this.netCDF.headers.variables[var_idx]

    // Search for 'axis' == Axis
    for (let attr_idx = 0; attr_idx < this_var.attributes.length; attr_idx++) {
     let this_attr = this_var.attributes[attr_idx]
     if ((this_attr.name.toLowerCase() == 'axis') && 
         (this_attr.value == Axis) && 
         (this_var.dimensions.length == 1))
      return this_var.name
     // return this.netCDF.headers.dimensions[this_var.dimensions[0]].name
    }
   
    // Search for 'cartesian_axis' == Axis
    for (let attr_idx = 0; attr_idx < this_var.attributes.length; attr_idx++) {
     let this_attr = this_var.attributes[attr_idx]
     if ((this_attr.name.toLowerCase() == 'cartesian_axis') && 
         (this_attr.value == Axis) && 
         (this_var.dimensions.length == 1))
      return this_var.name
     // return this.netCDF.headers.dimensions[this_var.dimensions[0]].name
    }

    // search for loosely supported '_CoordinateAxisType'
    // Translate defintive axis to loose _CoordinateAxisType definition
    if (CoordAxis) {
     for (let attr_idx = 0; attr_idx < this_var.attributes.length; attr_idx++) {
      let this_attr = this_var.attributes[attr_idx]
      if ((this_attr.name == '_CoordinateAxisType') && 
          (this_attr.value == CoordAxis) && 
          (this_var.dimensions.length == 1))
       return this_var.name
      // return this.netCDF.headers.dimensions[this_var.dimensions[0]].name
     }
    }
  
    // Final last ditch attemp to search for 'standard_name' 
    if (StandardNameAxis) {
     for (let attr_idx = 0; attr_idx < this_var.attributes.length; attr_idx++) {
      let this_attr = this_var.attributes[attr_idx]
      if ((this_attr.name == 'standard_name') && 
          (this_attr.value.toLowerCase() == StandardNameAxis) && 
          (this_var.dimensions.length == 1))
       return this_var.name
      // return this.netCDF.headers.dimensions[this_var.dimensions[0]].name
     }
    }

   }

   return undefined
  }

  getCleansedDataVariable(DataVariable) {

   let varIdx = this.varIndex[DataVariable]
   var FillValue = null, ScaleFactor = null, AddOffset = null;

   // Check for FillValue
   for (let attr_idx = 0; attr_idx < this.netCDF.headers.variables[varIdx].attributes.length; attr_idx++) {
    let this_attr = this.netCDF.headers.variables[varIdx].attributes[attr_idx]
    if ((FillValue == null) && ((this_attr.name == "_FillValue") || (this_attr.name == 'missing_value')))
     FillValue = this_attr.value
   }

   var varData = this.netCDF.getDataVariable(DataVariable).flat()

   if (FillValue != null)
    varData = varData.map(function(val) { return (val == FillValue) ? null : val }) 

   // Check for Packed Data
   for (let attr_idx = 0; attr_idx < this.netCDF.headers.variables[varIdx].attributes.length; attr_idx++) {
    let this_attr = this.netCDF.headers.variables[varIdx].attributes[attr_idx]
    if ((ScaleFactor == null) && (this_attr.name == "scale_factor") )
     ScaleFactor = this_attr.value
   }

   if (ScaleFactor != null) 
    varData = varData.map(function(val) { return (val != null) ? (val * ScaleFactor) : null }) 

   for (let attr_idx = 0; attr_idx < this.netCDF.headers.variables[varIdx].attributes.length; attr_idx++) {
    let this_attr = this.netCDF.headers.variables[varIdx].attributes[attr_idx]
    if ((AddOffset == null) && (this_attr.name == "add_offset") )
     AddOffset = this_attr.value
   }

   if (AddOffset != null) 
    varData = varData.map(function(val) { return (val != null) ? (val + AddOffset) : null }) 

   return varData
  }


  getCleansedDataVariableSingleValue(DataVariable, theValue) {

   if (theValue == null)
    return null;

   let varIdx = this.varIndex[DataVariable]
   var FillValue = null, ScaleFactor = null, AddOffset = null;

   // Check for FillValue
   for (let attr_idx = 0; attr_idx < this.netCDF.headers.variables[varIdx].attributes.length; attr_idx++) {
    let this_attr = this.netCDF.headers.variables[varIdx].attributes[attr_idx]
    if ((FillValue == null) && 
        ((this_attr.name == "_FillValue") || (this_attr.name == 'missing_value')))
     FillValue = this_attr.value
   }

   if (theValue == FillValue)
    return null

   // Check for Packed Data
   for (let attr_idx = 0; attr_idx < this.netCDF.headers.variables[varIdx].attributes.length; attr_idx++) {
    let this_attr = this.netCDF.headers.variables[varIdx].attributes[attr_idx]
    if ((ScaleFactor == null) && (this_attr.name == "scale_factor") )
     ScaleFactor = this_attr.value
   }

   if (ScaleFactor != null)
    theValue*= ScaleFactor
  
   for (let attr_idx = 0; attr_idx < this.netCDF.headers.variables[varIdx].attributes.length; attr_idx++) {
    let this_attr = this.netCDF.headers.variables[varIdx].attributes[attr_idx]
    if ((AddOffset == null) && (this_attr.name == "add_offset") )
     AddOffset = this_attr.value
   }

   if (AddOffset != null) 
    theValue+= AddOffset

   return theValue
  }

  getNumDataVariableStats(DataVariable) {

   if (!DataVariable)
    throw 'No data variable passed.'

   // Return stats if previously cached and file is in read only mode
   if ((this.file_read_only) && (DataVariable in this.stats)) return this.stats[DataVariable]

   var varDataCleansed = this.getCleansedDataVariable(DataVariable)

   if (!varDataCleansed)
    throw `No data found for variable ${DataVariable}.`

   var NullCount = 0
   var MinValue = null
   var MaxValue = null
   var SumValue = 0

   for (let idx = 0; idx <varDataCleansed.length; idx++) {
    let d = varDataCleansed[idx]
    if (d == null) NullCount++
    if ((MinValue == null) || (MinValue > d)) MinValue = d
    if ((MaxValue == null) || (MaxValue < d)) MaxValue = d
    SumValue+= d
   }
  
   //median
   let cloneArray = [...varDataCleansed].filter(function(v){ return (v != null) })
   cloneArray.sort(function(a,b) { return a - b })
   let mid = cloneArray.length/2;
   let MedianValue = mid%1?cloneArray[mid - 0.5]:(cloneArray[mid - 1] + cloneArray[mid])/2;

   this.stats[DataVariable] =
    {"min": MinValue,
     "max": MaxValue,
     "sum": SumValue,
     "mean": SumValue/(varDataCleansed.length - NullCount),
     "median": MedianValue,
     "nullCount": NullCount,
     "count": varDataCleansed.length}

   return this.stats[DataVariable]

  }

  searchBounds(axis) {

   let Axis = this.Axes[axis]
   if (Axis) {
   
    //TODO check bounds dimension size must equal 2
   
    // Try definitive method
    let var_idx = this.varIndex[Axis]
    let this_var = this.netCDF.headers.variables[var_idx]
    //for (let attr_idx in this_var.attributes) {
    for (let attr_idx = 0; attr_idx < this_var.attributes.length; attr_idx++) {
     let this_attr = this_var.attributes[attr_idx]
     if (this_attr.name.toLowerCase() == 'bounds') {
      let bounds_var = this_attr.value 
      var the_bounds = null;
      try {the_bounds = this.netCDF.getDataVariable(bounds_var); } catch(e) {}
      if (the_bounds) {
       this.XYBounds[axis] = {"bounds": the_bounds, "mode": "definitive"}
       return this.XYBounds[axis]
      }
     }
    }
   
    // Unable to automatically determine axis - so interpolate (assumes ordinates are sequential - ie, grid)
    let this_axis_data = this.netCDF.getDataVariable(Axis)
    let bounds_array=[]
    let delta
    for (let i = 0; i < this_axis_data.length; i++) {
     if (i == 0) 
      delta = parseFloat((this_axis_data[i+1] - this_axis_data[i])/2)
     else
      delta = parseFloat((this_axis_data[i] - this_axis_data[i-1])/2)
     bounds_array.push(parseFloat(this_axis_data[i] - delta))
     bounds_array.push(parseFloat(this_axis_data[i] + delta))
    }

    this.XYBounds[axis] = {"bounds": bounds_array, "mode": "interpolated"}
    return this.XYBounds[axis]
   }

   return null;
  }
 
  getXYbbox() {

   if ((this.file_read_only) && ('bounds' in this.XYbbox)) return this.XYbbox

   let xBounds = this.searchBounds('X')
   let yBounds = this.searchBounds('Y')
   var the_mode = 'definitive'

   if ((xBounds.mode != 'definitive') || (yBounds.mode != 'definitive'))
    the_mode = 'interpolated'
   var minX = null, maxX = null, minY = null, maxY = null

   for (let i = 0; i < xBounds.bounds.length; i++) {
    let x = xBounds.bounds[i]
    if ((minX == null) || (minX > x)) minX = x
    if ((maxX == null) || (maxX < x)) maxX = x
   }

   for (let i = 0; i < yBounds.bounds.length; i++) {
    let y = yBounds.bounds[i]
    if ((minY == null) || (minY > y)) minY = y
    if ((maxY == null) || (maxY < y)) maxY = y
   }

   this.XYbbox = {"bbox": [[minX, minY],[maxX, maxY]], "mode": the_mode}
   return this.XYbbox
  }

  hexToRgb(hex) {
   const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
   const resultSplit = result ? [  
     parseInt(result[1], 16),
     parseInt(result[2], 16),
     parseInt(result[3], 16)
   ] : null
   if (resultSplit) {
    return resultSplit
   }
   return null
  }

  preprocessDataValidation(DataVariable,
                           DimensionFilter) {
  
   // Validate X/Y Axes
   if (!('X' in this.Axes))
    throw '"X" not found in Axes.  Please set X and Y in "Axes" manually if required.  Perhaps "Axis" = "X" missing from NetCDF attribute data.'

   let xDimName = this.Axes['X']
   if (!(xDimName in this.dimIndex))
    throw `"X" dimension ${xDimName} not found in NetCDF Dimensions`
   const xDimIndex = this.dimIndex[xDimName]

   if (!('Y' in this.Axes))
    throw '"Y" not found in Axes.  Please set X and Y in "Axes" manually if required.  Perhaps "Axis" = "Y" missing from NetCDF attribute data.'

   let yDimName = this.Axes['Y']
   if (!(yDimName in this.dimIndex))
    throw `"Y" dimension ${yDimName} not found in NetCDF Dimensions`
   const yDimIndex = this.dimIndex[yDimName]

   // Validate DataVariable 
 
   if (!(DataVariable))
    throw 'DataVariable is a required parameter.'

   if (!(DataVariable in this.varIndex))
    throw `DataVariable ${DataVariable} not found in NetCDF Variables`

   const theVarIdx = this.varIndex[DataVariable]
   const theVariable = this.netCDF.headers.variables[theVarIdx]

   const varDimensions = theVariable.dimensions

   const xVarDimOffset = varDimensions.indexOf(xDimIndex)
   if (xVarDimOffset < 0)
    throw `"X" Axis "${xDimName}" not found as a dimension of ${DataVariable} in NetCDF.`

   const yVarDimOffset = varDimensions.indexOf(yDimIndex)
   if (yVarDimOffset < 0)
    throw `"Y" Axis "${yDimName}" not found as a dimension of ${DataVariable} in NetCDF.`

   // Check data is non-interlaced (that is X,Y are final data dimensions).  Currently, reading of interlaced data not yet supported
   var nonInterlaced = (((varDimensions.length - (xVarDimOffset + 1)) + (varDimensions.length - (yVarDimOffset + 1))) == 1)
   if (!nonInterlaced) 
    throw `Currently unable to perform interlaced data reading.  Please ensure "X" and "Y" are final dimensions in the Data Variable "${theVariable}."`
 
   // Check any remaining dimensions are bound correctly with dimensionFilter
   for (let idx = 0; idx < varDimensions.length; idx++) {
    if ([xVarDimOffset, yVarDimOffset].indexOf(idx) < 0) {  //Not a spatial X,Y dimension
     let otherDimIdx = varDimensions[idx]

     if (!(otherDimIdx in this.netCDF.headers.dimensions)) 
      throw `Data Variable ${DataVariable} in NetCDF contains undefined dimensions.  Please check NetCDF.`

     let otherVarName = this.netCDF.headers.dimensions[otherDimIdx].name
     if (!otherVarName)
      throw `Data Variable ${DataVariable} in NetCDF contains unamed dimension variables.  Please check NetCDF.`

     if (!(otherVarName in this.varIndex))
      throw `Data Variable ${DataVariable} in NetCDF contains undefined dimension variable: ${otherVarName}.  Please check NetCDF.`
  
     // Check dimension data
     let otherVarData = this.netCDF.getDataVariable(otherVarName)

     // If only 1 entry in otherDataVariable and missing DimensionFilter - then just set dimensionFilter to this value
     if (((!DimensionFilter) || (!(otherVarName in DimensionFilter))) && (otherVarData.length == 1))
      DimensionFilter[otherVarName] = otherVarData[0]

     // Check Dimension Data Exists
     if ((DimensionFilter) && (otherVarName in DimensionFilter)) {
      if (otherVarData.indexOf(DimensionFilter[otherVarName]) < 0) 
       throw `DimensionFilter data value "${DimensionFilter[otherVarName]}" not found in NetCDF data values for variable ${otherVarName}.`
     }

     // Check for unbound Dimension
     if ((otherVarData) && (otherVarData.length > 0) && ((!DimensionFilter) || (!(otherVarName in DimensionFilter))))
      throw `Unbound dimension "${otherVarName}".  Please use DimensionFilter parameter and set "${otherVarName}" to a vaild value.`

    }
   }

   return {"xDimIndex": xDimIndex,
           "yDimIndex": yDimIndex,
           "xDimName": xDimName,
           "yDimName": yDimName,
           "theVarIdx": theVarIdx,
           "theVariable": theVariable,
           "varDimensions": varDimensions,
           "xVarDimOffset": xVarDimOffset,
           "yVarDimOffset": yVarDimOffset }
   }

  getCellValue(DataVariable,
               DimensionFilter,
               X,
               Y) {

   const p = this.preprocessDataValidation(DataVariable, DimensionFilter)

   if (isNaN(X))
    throw 'X parameter missing or not numeric.'

   if (isNaN(Y))
    throw 'Y parameter missing or not numeric.'

   // Determine result array offset to use
   let xSize = this.netCDF.getDataVariable(p.xDimName).length;
   let ySize = this.netCDF.getDataVariable(p.yDimName).length;
   let gridSize = xSize * ySize;
   var startingOffset = gridSize;
   for (var idx = p.varDimensions.length - 3; idx >= 0; idx--) {  
    // Assumes data is non-interlaced and X,Y are final dimensions
    let otherDimIdx = p.varDimensions[idx]
    let otherVarName = this.netCDF.headers.dimensions[otherDimIdx].name
    let otherVarIndex = this.netCDF.getDataVariable(otherVarName).indexOf(DimensionFilter[otherVarName])
    startingOffset *= otherVarIndex
   }
   if (p.varDimensions.length == 2)
    startingOffset = 0

   let the_data = this.netCDF.getDataVariable(DataVariable).flat()
   let the_result = {}
   var result_transpose = false;
   var data_offset = startingOffset
   let xData = this.netCDF.getDataVariable(p.xDimName)
   let yData = this.netCDF.getDataVariable(p.yDimName)
   let xDataLength = xData.length
   let yDataLength = yData.length

   if (p.varDimensions[p.varDimensions.length - 1] == p.yDimIndex) {

    // Will Read Y,X
    for (let x_idx = 0; x_idx < xDataLength; x_idx++) {
     let x_idx_times_2 = x_idx * 2
     let xLower = Math.min(this.XYBounds['X'].bounds[x_idx_times_2],
                           this.XYBounds['X'].bounds[x_idx_times_2 + 1])
     let xUpper = Math.max(this.XYBounds['X'].bounds[x_idx_times_2],
                           this.XYBounds['X'].bounds[x_idx_times_2 + 1])
     if ((xLower <= X) && (xUpper >= X)) {
      // Within xBounds
      for (let y_idx = 0; y_idx < yDataLength; y_idx++) {
       let y_idx_times_2 = y_idx * 2
       let yLower = Math.min(this.XYBounds['Y'].bounds[y_idx_times_2],
                             this.XYBounds['Y'].bounds[y_idx_times_2 + 1])
       let yUpper = Math.max(this.XYBounds['Y'].bounds[y_idx_times_2],
                             this.XYBounds['Y'].bounds[y_idx_times_2 + 1])
       if ((yLower <= Y) && (yUpper >= Y)) {
        // Within yBounds
        return this.getCleansedDataVariableSingleValue(DataVariable, the_data[data_offset])
       }
       data_offset++
      }
     } else
      data_offset+= yDataLength
    }

   } else {

    // Will Read Y,X
    for (let y_idx = 0; y_idx < yDataLength; y_idx++) {
     let y_idx_times_2 = y_idx * 2
     let yLower = Math.min(this.XYBounds['Y'].bounds[y_idx_times_2],
                           this.XYBounds['Y'].bounds[y_idx_times_2 + 1])
     let yUpper = Math.max(this.XYBounds['Y'].bounds[y_idx_times_2],
                           this.XYBounds['Y'].bounds[y_idx_times_2 + 1])
     if ((yLower <= Y) && (yUpper >= Y)) {
      // Within yBounds
      for (let x_idx = 0; x_idx < xDataLength; x_idx++) {
       let x_idx_times_2 = x_idx * 2
       let xLower = Math.min(this.XYBounds['X'].bounds[x_idx_times_2],
                             this.XYBounds['X'].bounds[x_idx_times_2 + 1])
       let xUpper = Math.max(this.XYBounds['X'].bounds[x_idx_times_2],
                             this.XYBounds['X'].bounds[x_idx_times_2 + 1])
       if ((xLower <= X) && (xUpper >= X)) {
        // Within xBounds
        return this.getCleansedDataVariableSingleValue(DataVariable, the_data[data_offset])
       }
       data_offset++
      }
     } else
      data_offset+= xDataLength
    }

   } 

   return null;
  }

  generateCaches(XYprojectionFunction) {
  
   //Projection function
   var localProjectionCache = {} 
   let isFunc = typeof XYprojectionFunction == 'function'
   const projFunc = (isFunc)?
    function(coords) { 
     if ((coords[0] in localProjectionCache) &&
         (coords[1] in localProjectionCache[coords[0]])) {
      return localProjectionCache[coords[0]][coords[1]]
     } else {
      let projectedCoords = XYprojectionFunction(coords)
      if (!(coords[0] in localProjectionCache))
       localProjectionCache[coords[0]] = {}
      localProjectionCache[coords[0]][coords[1]] = projectedCoords
      return projectedCoords
     }
    }:
    function(coords) { return coords; }

   var xRange, yRange, minPoint, maxPoint
   var extentCache = {} 
   var bounds = this.getXYbbox().bbox
   //find minXY 
   var xMin=Infinity, yMin=Infinity, xMax=-Infinity, yMax=-Infinity
   for (let x=0; x < this.XYBounds['X'].bounds.length; x++) 
    for (let y=0; y < this.XYBounds['Y'].bounds.length; y++) {
     let the_point = projFunc([this.XYBounds['X'].bounds[x], this.XYBounds['Y'].bounds[y]])
     if (the_point[0] < xMin) xMin = the_point[0]
     if (the_point[1] < yMin) yMin = the_point[1]
     if (the_point[0] > xMax) xMax = the_point[0]
     if (the_point[1] > yMax) yMax = the_point[1]
    }
   minPoint = [xMin, yMin]
   maxPoint = [xMax, yMax]

   return {"extentCache": [minPoint, maxPoint], "projectionCache": localProjectionCache}
  }
 
  draw2DbasicGrid(DataVariable,
                  DimensionFilter,
                  XYprojectionFunction,
                  ImageType,
                  ImageStyle) {

   const p = this.preprocessDataValidation(DataVariable, DimensionFilter)

   // Determine result array offset to use
   let xSize = this.netCDF.getDataVariable(p.xDimName).length;
   let ySize = this.netCDF.getDataVariable(p.yDimName).length;
   let gridSize = xSize * ySize;
   var startingOffset = gridSize;
   for (var idx = p.varDimensions.length - 3; idx >= 0; idx--) {  // Assumes data is non-interlaced and X,Y are final dimensions
    let otherDimIdx = p.varDimensions[idx]
    let otherVarName = this.netCDF.headers.dimensions[otherDimIdx].name
    let otherVarIndex = this.netCDF.getDataVariable(otherVarName).indexOf(DimensionFilter[otherVarName])
    startingOffset *= otherVarIndex
   }
   if (p.varDimensions.length == 2)
    startingOffset = 0

   // Fetch data
   let the_data =  this.getCleansedDataVariable(DataVariable)
   let the_result = {}
   var result_transpose = false;
   var data_offset = startingOffset
   var xData = this.netCDF.getDataVariable(p.xDimName)
   var yData = this.netCDF.getDataVariable(p.yDimName)
   if (p.varDimensions[p.varDimensions.length - 1] == p.yDimIndex) {
    // Will Read X,Y
    for (let x_idx = 0; x_idx < xData.length; x_idx++) {
     if (!(xData[x_idx] in the_result)) 
      the_result[xData[x_idx]] = {} 
     for (let y_idx = 0; y_idx < yData.length; y_idx++) {
      if (!(yData[y_idx] in the_result[xData[x_idx]])) 
       the_result[xData[x_idx]][yData[y_idx]] = {} 
      the_result[xData[x_idx]][yData[y_idx]] =  {
       "x_offset": x_idx,
       "y_offset": y_idx,
       "value": the_data[data_offset] 
      } 
      data_offset++
     }
    }
   } else {
    result_transpose = true;
    // Will Read Y,X
    for (let y_idx = 0; y_idx < yData.length; y_idx++) {
     if (!(yData[y_idx] in the_result)) 
      the_result[yData[y_idx]] = {} 
     for (let x_idx = 0; x_idx < xData.length; x_idx++) {
      if (!(xData[x_idx] in the_result[yData[y_idx]])) 
       the_result[yData[y_idx]][xData[x_idx]] = {} 
      the_result[yData[y_idx]][xData[x_idx]] =  {
        "x_offset": x_idx,
        "y_offset": y_idx,
        "value": the_data[data_offset] 
      } 
      data_offset++
     }
    }
   }

   // Set ImageType
   ImageType = ((ImageType) && (ImageType.toLowerCase()))
   switch (ImageType) {
    case 'svg': break;
    case 'canvas': break;
    case 'url':  break; 
    default:  ImageType = 'image' 
   }

   //Projection function
   var localProjectionCache = this.projectionCache
   const projFunc = (typeof XYprojectionFunction == 'function')?
    function(coords) { 
     if  ((coords[0] in localProjectionCache) &&
          (coords[1] in localProjectionCache[coords[0]])) {
      // Cache hit
      return localProjectionCache[coords[0]][coords[1]]
     } else {
      let projectedCoords = XYprojectionFunction(coords)
      if (!localProjectionCache)
       localProjectionCache = {}
      if (!(coords[0] in localProjectionCache))
       localProjectionCache[coords[0]] = {}
      localProjectionCache[coords[0]][coords[1]] = projectedCoords
      return projectedCoords
     }
    }:
    function(coords) { return coords; }

   var xRange, yRange, minPoint, maxPoint, BoundsAspectRatio;
   var bounds = this.getXYbbox().bbox
   if ((this.extentCache) &&
       (this.extentCache.length == 2) &&
       (this.extentCache[0].length == 2) &&
       (this.extentCache[1].length == 2)) {
    // extentCache hit
    if (this.debug)
     console.log('Extent Cache hit.')
    minPoint = this.extentCache[0]
    maxPoint = this.extentCache[1]
   } else {
     //find minXY 
     var xMin=Infinity, yMin=Infinity, xMax=-Infinity, yMax=-Infinity
     for (let x=0; x < this.XYBounds['X'].bounds.length; x++) 
      for (let y=0; y < this.XYBounds['Y'].bounds.length; y++) {
       let the_point = projFunc([this.XYBounds['X'].bounds[x], this.XYBounds['Y'].bounds[y]])
       if (the_point[0] < xMin) xMin = the_point[0]
       if (the_point[1] < yMin) yMin = the_point[1]
       if (the_point[0] > xMax) xMax = the_point[0]
       if (the_point[1] > yMax) yMax = the_point[1]
      }
     this.projectionCache = localProjectionCache  //Update global projectionCache
     minPoint = [xMin, yMin]
     maxPoint = [xMax, yMax]
     if (!this.extentCache)
      this.extentCache = {}
     this.extentCache = [minPoint, maxPoint]  // Update global extentCache
    }
   xRange = maxPoint[0] - minPoint[0]
   yRange = maxPoint[1] - minPoint[1]

   var BoundsAspectRatio = parseFloat(yRange/xRange)

   // WebGL Vertex shader source code
   const vertexShaderSource = `
     attribute vec2 a_position;
     attribute vec4 a_fillColor;
     varying vec4 v_fillColor;
     void main() {
       gl_Position = vec4(a_position, 0, 1);
       v_fillColor = a_fillColor;
     }
   `;

   // WebGL Fragment shader source code
   const fragmentShaderSource = `
    precision mediump float;
    varying vec4 v_fillColor;
    void main() {
     vec4 color1 = vec4(v_fillColor[0], v_fillColor[1], v_fillColor[2], v_fillColor[3]);
     gl_FragColor = color1;
    }
   `;

   if (ImageType == 'svg') {
    // Svg
    var svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.setAttribute('xmlns', "http://www.w3.org/2000/svg");
    svgElement.setAttribute('width', '100%')
    svgElement.setAttribute('height', '100%')
    svgElement.setAttribute('viewBox', "0 0 "+xRange.toString()+" "+yRange.toString());
    //TODO xlink:href for title?
    //TODO aspectRatio (as style param)?
   } else {
    // Canvas
    // See; https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#maximum_canvas_size
    const BROWSER_MAX_CANVAS_WIDTH = 16000  
    var idealCellSize = 8; 
    if (ImageStyle) {
        if ('idealCellSize' in ImageStyle) {
         if (typeof ImageStyle['idealCellSize'] === 'number')
          idealCellSize = ImageStyle['idealCellSize']
        }
    }
    const maxCellSize = parseInt(BROWSER_MAX_CANVAS_WIDTH / Math.max(xSize, ySize))
    const cell_pixel_size = parseInt(Math.max(1, Math.min(idealCellSize, maxCellSize)))
    var pixel_width = Math.max(xSize, ySize) * cell_pixel_size;  //Good enough approximation
    var pixel_height = pixel_width * BoundsAspectRatio;

    var canvasElement = document.createElement("canvas");
    canvasElement.height = pixel_height;
    canvasElement.width = pixel_width;

    var pixel_width_over_xRange = pixel_width / xRange
    var pixel_height_over_yRange = pixel_height / yRange
    var two_over_xRange = 2 / xRange
    var two_over_yRange = 2 / yRange
    var allGLverts = [], allGLcolors = []

    var theCanvasContext = "2d"
    if (ImageStyle) {
     if ('canvasContext' in ImageStyle) {
      if (typeof ImageStyle['canvasContext'] === 'string')
       theCanvasContext = ImageStyle['canvasContext']
     }
    }

    if (['webgl', 'experimental-webgl', '2d'].indexOf(theCanvasContext) < 0)
     theCanvasContext = '2d'

    var ctx = canvasElement.getContext(theCanvasContext, 
                                       {antialias: true, 
                                        desynchronized: true, 
                                        alpha: true, 
                                        premultipliedAlpha: false });

    if ((theCanvasContext == 'webgl') || (theCanvasContext == 'experimental-webgl')) {
     var vertexShader = ctx.createShader(ctx.VERTEX_SHADER);
     ctx.shaderSource(vertexShader, vertexShaderSource);
     ctx.compileShader(vertexShader);
     // Create and compile the fragment shader
     var fragmentShader = ctx.createShader(ctx.FRAGMENT_SHADER);
     ctx.shaderSource(fragmentShader, fragmentShaderSource);
     ctx.compileShader(fragmentShader);
     // Create the shader program
     var shaderProgram = ctx.createProgram();
     ctx.attachShader(shaderProgram, vertexShader);
     ctx.attachShader(shaderProgram, fragmentShader);
     ctx.linkProgram(shaderProgram);
     ctx.useProgram(shaderProgram);
    }
   }

   //Assume getXYbbox has already been run (TODO need to check)

   var cellcount = 0
   for (let i in the_result)
    for (let j in the_result[i]) {
     if (the_result[i][j].value != null) {  

      // Assemble cellData
      let cellData = {}
      cellData.dimensions = DimensionFilter;
      cellData.value = the_result[i][j].value
 
      if (!(result_transpose)) {
       cellData.dimensions[p.xDimName] = i
       cellData.dimensions[p.yDimName] = j
      } else {
       cellData.dimensions[p.xDimName] = j
       cellData.dimensions[p.yDimName] = i
      } 

      var omit = false
      if (ImageStyle) {
       if ('omit' in ImageStyle) {
        if (typeof ImageStyle['omit'] === 'function')
         omit = ImageStyle['omit'](cellData)
        else if ((typeof ImageStyle['omit'] === 'boolean') ||
                 (typeof ImageStyle['omit'] === 'string') ||
                 (typeof ImageStyle['omit'] === 'number'))
         omit = ImageStyle['omit']
       }
      }
     
      if (omit) 
       continue

      let x_offset_times_2 = the_result[i][j].x_offset * 2
      let y_offset_times_2 = the_result[i][j].y_offset * 2
      let x_offset_times_2_plus_1 = x_offset_times_2 + 1
      let y_offset_times_2_plus_1 = y_offset_times_2 + 1
      let minXminY = projFunc([this.XYBounds['X'].bounds[x_offset_times_2], this.XYBounds['Y'].bounds[y_offset_times_2]])
      let x1 = minXminY[0] - minPoint[0]
      let y1 = maxPoint[1] - minXminY[1]
      let minXmaxY = projFunc([this.XYBounds['X'].bounds[x_offset_times_2], this.XYBounds['Y'].bounds[y_offset_times_2_plus_1]])
      let x2 = minXmaxY[0] - minPoint[0]
      let y2 = maxPoint[1] - minXmaxY[1]
      let maxXmaxY = projFunc([this.XYBounds['X'].bounds[x_offset_times_2_plus_1], this.XYBounds['Y'].bounds[y_offset_times_2_plus_1]])
      let x3 = maxXmaxY[0] - minPoint[0]
      let y3 = maxPoint[1] - maxXmaxY[1]
      let maxXminY = projFunc([this.XYBounds['X'].bounds[x_offset_times_2_plus_1], this.XYBounds['Y'].bounds[y_offset_times_2]])
      let x4 = maxXminY[0] - minPoint[0]
      let y4 = maxPoint[1] - maxXminY[1]
 
      if (ImageType == 'svg') {
       var cellEvents = []
      
       //Styling
       var stroke = "none", strokeWidth = 1, fill = "#000000", opacity = 1
       if (ImageStyle) {
        if ('stroke' in ImageStyle) {
         if (typeof ImageStyle['stroke'] === 'function')
          stroke = ImageStyle['stroke'](cellData)
         else if (typeof ImageStyle['stroke'] === 'string')
          stroke = ImageStyle['stroke']
        }
        if ('strokeWidth' in ImageStyle) {
         if (typeof ImageStyle['strokeWidth'] === 'function')
          strokeWidth = ImageStyle['strokeWidth'](cellData)
         else if (typeof ImageStyle['strokeWidth'] === 'number')
          strokeWidth = ImageStyle['strokeWidth']
        }
        if ('fill' in ImageStyle) {
         if (typeof ImageStyle['fill'] === 'function')
          fill = ImageStyle['fill'](cellData)
         else if (typeof ImageStyle['fill'] === 'string')
          fill = ImageStyle['fill']
        }
        if ('opacity' in ImageStyle) {
         if (typeof ImageStyle['opacity'] === 'function')
          opacity = ImageStyle['opacity'](cellData)
         else if (typeof ImageStyle['opacity'] === 'number')
          opacity = ImageStyle['opacity']
        }
        if ('eventListeners' in ImageStyle) {
          try {
          for (let ev = 0; ev < ImageStyle['eventListeners'].length; ev++) {
           let this_event = ImageStyle['eventListeners'][ev]
           if ((typeof this_event[0] === 'string') && (typeof this_event[1] === 'function')) 
            cellEvents.push(this_event)
          }
             } catch(e) { if (this.debug) console.log(e); }
        }
       }

       let cell = document.createElementNS("http://www.w3.org/2000/svg", "path")
       //var path = "M"+x1+","+y1+'L'+x2+','+y2+'L'+x3+','+y3+'L'+x4+','+y4+'L'+x1+','+y1+'z'
       //var path = "M"+x1+","+y1+'L'+x2+','+y2+'L'+x3+','+y3+'L'+x4+','+y4+'z'
       let path = `M${x1},${y1}L${x2},${y2}L${x3},${y3}L${x4},${y4}z`
       cell.setAttribute("d", path)

       // Styling
       cell.setAttribute("fill", fill)
       cell.setAttribute("stroke", stroke)
       cell.setAttribute("stroke-width", strokeWidth.toString()+'px')
       cell.setAttribute("opacity", opacity.toString())
       cell.setAttribute("vector-effect", "non-scaling-stroke")
      
       //Set cell data value and dimensions 
       cell.setAttribute('data-value', the_result[i][j].value)
       for (let dim in cellData.dimensions) {
        if ((cellData.dimensions[dim]) && (typeof cellData.dimensions[dim] != 'function'))
         cell.setAttribute('data-dimension_'+dim.replace(/\s/g, ''), cellData.dimensions[dim])
       }

       // Add events
       for (let ev = 0; ev < cellEvents.length; ev++)
         cell.addEventListener(cellEvents[ev][0],cellEvents[ev][1],cellEvents[ev][2])
 
       svgElement.appendChild(cell) 

      } else {
       // Canvas
 
       if (theCanvasContext == "2d") {

        //Styling
        var stroke = "none", strokeWidth = 1, fill = "#000000", opacity = 1
        if (ImageStyle) {
         if ('stroke' in ImageStyle) {
          if (typeof ImageStyle['stroke'] === 'function')
           stroke = ImageStyle['stroke'](cellData)
          else if (typeof ImageStyle['stroke'] === 'string')
           stroke = ImageStyle['stroke']
         }
         if ('strokeWidth' in ImageStyle) {
          if (typeof ImageStyle['strokeWidth'] === 'function')
           strokeWidth = ImageStyle['strokeWidth'](cellData)
          else if (typeof ImageStyle['strokeWidth'] === 'number')
           strokeWidth = ImageStyle['strokeWidth']
         }
         if ('fill' in ImageStyle) {
          if (typeof ImageStyle['fill'] === 'function')
           fill = ImageStyle['fill'](cellData)
         else if (typeof ImageStyle['fill'] === 'string')
           fill = ImageStyle['fill']
         }
         if ('opacity' in ImageStyle) {
          if (typeof ImageStyle['opacity'] === 'function')
           opacity = ImageStyle['opacity'](cellData)
          else if (typeof ImageStyle['opacity'] === 'number')
           opacity = ImageStyle['opacity']
         }
        }
  
        let x1pixel = x1 * pixel_width_over_xRange
        let x2pixel = x2 * pixel_width_over_xRange
        let x3pixel = x3 * pixel_width_over_xRange
        let x4pixel = x4 * pixel_width_over_xRange
        let y1pixel = y1 * pixel_height_over_yRange
        let y2pixel = y2 * pixel_height_over_yRange
        let y3pixel = y3 * pixel_height_over_yRange
        let y4pixel = y4 * pixel_height_over_yRange

        if (opacity != null)
         ctx.globalAlpha = opacity
        ctx.beginPath();
        ctx.fillStyle = fill
        ctx.strokeStyle = stroke
        ctx.moveTo(x1pixel, y1pixel);
        ctx.lineTo(x2pixel, y2pixel)
        ctx.lineTo(x3pixel, y3pixel)
        ctx.lineTo(x4pixel, y4pixel)
        if (fill != 'none')
         ctx.fill()
        if (stroke != 'none')
         ctx.stroke()

       } else {
        // Webgl

        //Styling
        var fill = "#000000", opacity = 1 
        if (ImageStyle) {
         if ('fill' in ImageStyle) {
          if (typeof ImageStyle['fill'] === 'function')
           fill = ImageStyle['fill'](cellData)
          else if (typeof ImageStyle['fill'] === 'string')
           fill = ImageStyle['fill']
         }
         if ('opacity' in ImageStyle) {
          if (typeof ImageStyle['opacity'] === 'function')
           opacity = ImageStyle['opacity'](cellData)
          else if (typeof ImageStyle['opacity'] === 'number')
           opacity = ImageStyle['opacity']
         }
        }

        let x1pixel = (x1 * two_over_xRange) - 1
        let x2pixel = (x2 * two_over_xRange) - 1
        let x3pixel = (x3 * two_over_xRange) - 1
        let x4pixel = (x4 * two_over_xRange) - 1
        let y1pixel = 1 - (y1 * two_over_yRange)
        let y2pixel = 1 - (y2 * two_over_yRange)
        let y3pixel = 1 - (y3 * two_over_yRange)
        let y4pixel = 1 - (y4 * two_over_yRange)

        allGLverts.push(x1pixel, y1pixel, x2pixel, y2pixel, x3pixel, y3pixel,  //Triangle 1
                        x3pixel, y3pixel, x4pixel, y4pixel, x1pixel, y1pixel )  //Triangle 2


        let fillPrimitive = this.hexToRgb(fill).map(function(color){ return color/255}) 

        allGLcolors.push(fillPrimitive[0], fillPrimitive[1], fillPrimitive[2], opacity,
                         fillPrimitive[0], fillPrimitive[1], fillPrimitive[2], opacity,
                         fillPrimitive[0], fillPrimitive[1], fillPrimitive[2], opacity,
                         fillPrimitive[0], fillPrimitive[1], fillPrimitive[2], opacity,
                         fillPrimitive[0], fillPrimitive[1], fillPrimitive[2], opacity,
                         fillPrimitive[0], fillPrimitive[1], fillPrimitive[2], opacity)

      }
     }
 
    cellcount++
    }
   }

   // Send WebGL arrays to the GPU if using WebGL
   if ((theCanvasContext == "webgl") || (theCanvasContext == 'experimental-webgl')) {
    var vertLoc = ctx.getAttribLocation(shaderProgram, "a_position");
    const vertexBuffer = ctx.createBuffer();
    var vertArray = new Float32Array(allGLverts);
    var fsize = vertArray.BYTES_PER_ELEMENT;
    ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexBuffer);
    ctx.bufferData(ctx.ARRAY_BUFFER, vertArray, ctx.STATIC_DRAW);
    ctx.enableVertexAttribArray(vertLoc);
    ctx.vertexAttribPointer(vertLoc, 2, ctx.FLOAT, false, 0, 0);
    var theBufferColors = new Float32Array(allGLcolors)
    var theBufferColorsSize = theBufferColors.BYTES_PER_ELEMENT;
    const instanceBuffer = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, instanceBuffer);
    ctx.bufferData(ctx.ARRAY_BUFFER, theBufferColors, ctx.STATIC_DRAW);
    const colorLoc = ctx.getAttribLocation(shaderProgram, 'a_fillColor');
    ctx.vertexAttribPointer(colorLoc, 4, ctx.FLOAT, false, 0, 0) 
    ctx.enableVertexAttribArray(colorLoc);
    ctx.drawArrays(ctx.TRIANGLES, 0, vertArray.length);
   }

   if (this.debug)
    console.log(`Cells Rendered; ${cellcount}`)

   var imgFormat = null, imgQuality = null
   if (ImageStyle) {
    if ('imageFormat' in ImageStyle) {
     if (typeof ImageStyle['imageFormat'] === 'string')
      imgFormat = ImageStyle['imageFormat']
    }
    if ('imageQuality' in ImageStyle) {
     if (typeof ImageStyle['imageQuality'] === 'number')
      imgQuality = ImageStyle['imageQuality']
    }
   }

   switch (ImageType) {
    case 'svg': return svgElement; break
    case 'canvas': return canvasElement; break
    case 'url': return canvasElement.toDataURL(imgFormat, imgQuality); break
    default: {
     var img = new Image()
     img.setAttribute('width', '100%')
     img.setAttribute('height', '100%')
     img.src = canvasElement.toDataURL(imgFormat, imgQuality)
     return img
    }
   }
  }
}

