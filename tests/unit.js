/*jslint node: true */
/*jslint es5: true */
'use strict';

var sharp = require("../index");
var fs = require("fs");
var path = require("path");
var assert = require("assert");
var async = require("async");

var fixturesPath = path.join(__dirname, "fixtures");

var inputJpg = path.join(fixturesPath, "2569067123_aca715a2ee_o.jpg"); // http://www.flickr.com/photos/grizdave/2569067123/
var outputJpg = path.join(fixturesPath, "output.jpg");

var inputTiff = path.join(fixturesPath, "G31D.TIF"); // http://www.fileformat.info/format/tiff/sample/e6c9a6e5253348f4aef6d17b534360ab/index.htm
var outputTiff = path.join(fixturesPath, "output.tiff");

var inputJpgWithExif = path.join(fixturesPath, "Landscape_8.jpg"); // https://github.com/recurser/exif-orientation-examples/blob/master/Landscape_8.jpg

// Ensure cache limits can be set
sharp.cache(0); // Disable
sharp.cache(50, 500); // 50MB, 500 items

async.series([
  // Resize with exact crop
  function(done) {
    sharp(inputJpg).resize(320, 240).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // Resize to fixed width
  function(done) {
    sharp(inputJpg).resize(320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
    });
  },
  // Resize to fixed height
  function(done) {
    sharp(inputJpg).resize(null, 320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(391, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  },
  // Identity transform
  function(done) {
    sharp(inputJpg).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(2725, info.width);
      assert.strictEqual(2225, info.height);
      done();
    });
  },
  // Upscale
  function(done) {
    sharp(inputJpg).resize(3000).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(3000, info.width);
      assert.strictEqual(2449, info.height);
      done();
    });
  },
  // Quality
  function(done) {
    sharp(inputJpg).resize(320, 240).quality(70).toBuffer(function(err, buffer70) {
      if (err) throw err;
      sharp(inputJpg).resize(320, 240).toBuffer(function(err, buffer80) {
        if (err) throw err;
        sharp(inputJpg).resize(320, 240).quality(90).toBuffer(function(err, buffer90) {
          assert(buffer70.length < buffer80.length);
          assert(buffer80.length < buffer90.length);
          done();
        });
      });
    });
  },
  // TIFF with dimensions known to cause rounding errors
  function(done) {
    sharp(inputTiff).resize(240, 320).embedBlack().jpeg().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(240, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  },
  function(done) {
    sharp(inputTiff).resize(240, 320).jpeg().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(240, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  },
  // Resize to max width or height considering ratio (landscape)
  function(done) {
    sharp(inputJpg).resize(320, 320).max().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
    });
  },
  // Resize to max width or height considering ratio (portrait)
  function(done) {
    sharp(inputTiff).resize(320, 320).max().jpeg().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(243, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  },
  // Attempt to resize to max but only provide one dimension, so should default to crop
  function(done) {
    sharp(inputJpg).resize(320).max().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
    });
  },
  // Attempt to output to input, should fail
  function(done) {
    sharp(inputJpg).toFile(inputJpg, function(err) {
      assert(!!err);
      done();
    });
  },
  // Rotate by 90 degrees, respecting output input size
  function(done) {
    sharp(inputJpg).rotate(90).resize(320, 240).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // Input image has Orientation EXIF tag but do not rotate output
  function(done) {
    sharp(inputJpgWithExif).resize(320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(320, info.width);
      assert.strictEqual(426, info.height);
      done();
    });
  },
  // Input image has Orientation EXIF tag value of 8 (270 degrees), auto-rotate
  function(done) {
    sharp(inputJpgWithExif).rotate().resize(320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // Attempt to auto-rotate using image that has no EXIF
  function(done) {
    sharp(inputJpg).rotate().resize(320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
    });
  },
  // Rotate to an invalid angle, should fail
  function(done) {
    var fail = false;
    try {
      sharp(inputJpg).rotate(1);
      fail = true;
    } catch (e) {}
    assert(!fail);
    done();
  },
  // Do not enlarge the output if the input width is already less than the output width
  function(done) {
    sharp(inputJpg).resize(2800).withoutEnlargement().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(2725, info.width);
      assert.strictEqual(2225, info.height);
      done();
    });
  },
  // Do not enlarge the output if the input height is already less than the output height
  function(done) {
    sharp(inputJpg).resize(null, 2300).withoutEnlargement().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(2725, info.width);
      assert.strictEqual(2225, info.height);
      done();
    });
  },
  // Promises/A+
  function(done) {
    sharp(inputJpg).resize(320, 240).toBuffer().then(function(data) {
      sharp(data).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
    }).catch(function(err) {
      throw err;
    });
  },
  // Empty Buffer, should fail
  function(done) {
    var fail = false;
    try {
      sharp(new Buffer(0));
      fail = true;
    } catch (e) {}
    assert(!fail);
    done();
  },
  // Check colour space conversion occurs from TIFF to WebP (this used to segfault)
  function(done) {
    sharp(inputTiff).webp().toBuffer().then(function() {
      done();
    });
  },
  // Interpolation: bilinear
  function(done) {
    sharp(inputJpg).resize(320, 240).bilinearInterpolation().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // Interpolation: bicubic
  function(done) {
    sharp(inputJpg).resize(320, 240).bicubicInterpolation().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // Interpolation: nohalo
  function(done) {
    sharp(inputJpg).resize(320, 240).nohaloInterpolation().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // File-Stream
  function(done) {
    var writable = fs.createWriteStream(outputJpg);
    writable.on('finish', function() {
      sharp(outputJpg).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.unlinkSync(outputJpg);
        done();
      });
    });
    sharp(inputJpg).resize(320, 240).pipe(writable);
  },
  // Buffer-Stream
  function(done) {
    var inputJpgBuffer = fs.readFileSync(inputJpg);
    var writable = fs.createWriteStream(outputJpg);
    writable.on('finish', function() {
      sharp(outputJpg).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.unlinkSync(outputJpg);
        done();
      });
    });
    sharp(inputJpgBuffer).resize(320, 240).pipe(writable);
  },
  // Stream-File
  function(done) {
    var readable = fs.createReadStream(inputJpg);
    var pipeline = sharp().resize(320, 240).toFile(outputJpg, function(err, info) {
      if (err) throw err;
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      fs.unlinkSync(outputJpg);
      done();
    });
    readable.pipe(pipeline);
  },
  // Stream-Buffer
  function(done) {
    var readable = fs.createReadStream(inputJpg);
    var pipeline = sharp().resize(320, 240).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
    readable.pipe(pipeline);
  },
  // Stream-Stream
  function(done) {
    var readable = fs.createReadStream(inputJpg);
    var writable = fs.createWriteStream(outputJpg);
    writable.on('finish', function() {
      sharp(outputJpg).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.unlinkSync(outputJpg);
        done();
      });
    });
    var pipeline = sharp().resize(320, 240);
    readable.pipe(pipeline).pipe(writable)
  },
  // Verify internal counters
  function(done) {
    var counters = sharp.counters();
    assert.strictEqual(0, counters.queue);
    assert.strictEqual(0, counters.process);
    done();
  }
]);
