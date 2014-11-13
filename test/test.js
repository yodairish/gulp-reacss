var assert = require('assert'),
    gutil = require('gulp-util'),
    fsMock = require('mock-fs'),
    reactStyle = require('../');
    
const PLUGIN_NAME = 'gulp-reactStyle';
    
describe(PLUGIN_NAME, function(){
  it('should transform templates to styles object', function(done){
    fsMock({
      '/styles': {
        'test.css': '.one{color:#fff;}.two .one{margin: 0;}.one,.two{-webkit-box-shadow:5px;}',
        'test2.css': '.some .three{padding:2px;}',
      }
    });
    
    var srcFile = new gutil.File({
      path: '/',
      contents: new Buffer("var styles2 = @('.one', '.some .three' => 'styles/test.css', 'styles/test2.css')")
    });
    
    var stream = reactStyle();
    
    stream.on('data', function(file){
      assert(file.isBuffer());
      assert.equal(
        file.contents.toString('utf8'),
        'var styles2 = {\n' +
        '  "color": "#fff",\n' +
        '  "WebkitBoxShadow": "5px",\n' +
        '  "padding": "2px"\n' +
        '};'
      );
      fsMock.restore();
      done();
    });
    
    stream.write(srcFile);
    stream.end();
  });
});