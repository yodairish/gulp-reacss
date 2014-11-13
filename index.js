var through = require('through2'),
    gutil = require('gulp-util'),
    fs = require("fs"),
    css = require('css'),
    changeCase = require('change-case');

const PLUGIN_NAME = 'gulp-reacss';

module.exports = function(){
  var filePath;
  
  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      cb(null, file);
      return;
    }
    
    if (file.isStream()) {
      cb(new gutil.PluginError(
        PLUGIN_NAME,
        'Streams are not supported!'
      ));
      return;
    }
    
    // remove file name from path
    filePath = file.path.replace(/\/[^\/]*$/, '/');
    
    // get all templates from file
    var contents = file.contents.toString(),
        templates = getTemplates(contents);

    if (templates.length) {
      var error;
      // convert all templates to inline style
      templates.forEach(function(template, index){
        if (error) return;
        
        var options = parseTemplate(template),
            styles = getInlineStyles(options);

        if (options.error) {
          error = options.error;
          return;
        }

        contents = contents.replace(
          template,
          JSON.stringify(styles, null, 2) + ';'
        );
      });

      if (!error) {
        file.contents = Buffer(contents);
        this.push(file);
      } else {
        this.emit('error', new gutil.PluginError(PLUGIN_NAME, error));
      }
    }

    cb();
  });
  
  /**
   * get all reacss templates in file
   * @param {string} content
   * @return {Array.<string>}
   */
  function getTemplates(content){
    return content.match(/@\([^)]*\);?/g) || [];
  }
  
  /**
   * Get selector and files from template
   * @param {string} template
   * @return {Object}
   */
  function parseTemplate(template){
    var obj, selectors, files;
    
    template = template.substring(2, template.length - 1);
    obj = template.split('=>');
    
    if (!obj[1]) {
      return {
        error: 'found incorrect template'
      };
    }
    
    selectors = obj[0].split(',');
    files = obj[1].split(',');
    
    cleanValues(selectors);
    cleanValues(files);
    
    if (!selectors.length || !files.length) {
      return {
        error: 'found template without any selectors or files'
      };
    }
    
    return {
      selectors: selectors,
      files: files
    };
  }
  
  /**
   * Remove extra symbols from values
   * @param {Array.<string>} list
   */
  function cleanValues(list){
    list.forEach(function(val, index, array){
      // remove quotes
      var cleaned = val.replace(/['"]+/g, '');
      // remove first slash
      cleaned = cleaned.replace(/^\//, '');
      cleaned = cleaned.trim();
      
      if (cleaned) {
        array[index] = cleaned;
      }
    });
  }
  
  /**
   * Concat all files and parse them to object
   * @param {Array.<string>} files
   * @return {Object}
   */
  function getStyles(files){
    var styles = [];
      
    // merge all files
    files.forEach(function(file){
      try {
        var fileContent = fs.readFileSync(filePath + file, 'utf8');
        styles.push(fileContent);
      } catch(e){
        gutil.log('can\'t find file', (filePath + file));
      }
    });
    
    return css.parse(styles.join(''), {});
  }
  
  /**
   * Get styles object by choosen selector and files
   * @param {Array.<Object>} options
   * @return {Object}
   */
  function getInlineStyles(options){
    var styles = getStyles(options.files),
        selectors = options.selectors,
        inline = {};
    
    styles.stylesheet.rules.forEach(function(rule){
      if (isSelectorInRule(rule, selectors)) {
        inline = addPropsFromRule(rule, inline);
      }
    });
    
    return inline;
  }
  
  /**
   * Validate selector
   * @param {Object} rule
   * @param {Array.<String>} selectors
   */
  function isSelectorInRule(rule, selectors){
    var have = false;
    
    rule.selectors.some(function(sel){
      if (selectors.indexOf(sel) !== -1) {
        have = true;
        return true;
      }
    });
    
    return have;
  }
  
  /**
   * Add prop to styles object
   * @param {Object} rule
   * @param {Object} inline
   * @return {Object}
   */
  function addPropsFromRule(rule, inline){
    rule.declarations.forEach(function(dec){
      var prop = changeCase.camel(dec.property);
      if (prop.indexOf('webkit') === 0 || prop.indexOf('moz') === 0) {
        prop = changeCase.ucFirst(prop);
      }
      inline[prop] = dec.value;
    });
    
    return inline;
  }
};