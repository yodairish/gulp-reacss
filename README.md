# gulp-reacss [![Build Status](https://travis-ci.org/yodairish/gulp-reacss.svg?branch=master)](https://travis-ci.org/yodairish/gulp-reacss)

Adding styles from a css files to the react component.
Using templates where you set list of selectors and css files separated by comma.

Css files parsed by [css](https://github.com/reworkcss/css)


## Install

```sh
$ npm install gulp-reacss --save-dev
```

## Usage

```js
var styles = @('.some',
               '.some .one'
                =>
                'css/comp.css',
                'css/all.css')
var Component = React.createClass({
  render: function(){
    return (
      <div className="one" style={styles}></div>
    );
  }
});
```

```js
var gulp = require('gulp');
var reacss = require('gulp-reacss');

gulp.task('reacss', function () {
	return gulp.src('component.js')
		.pipe(reacss())
		.pipe(gulp.dest('dist'));
});
```

## License

MIT © Yodairish 2014
