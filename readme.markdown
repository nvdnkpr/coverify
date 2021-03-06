# coverify

code coverage browserify transform

# example

Suppose we have a test.js:

``` js
var test = require('tape');
var foo = require('./foo.js');

test('beep boop', function (t) {
    t.plan(1);
    
    foo(function (err, x) {
        if (err) deadCode();
        t.equal(x * 5, 555);
    });
});
```

and a foo.js:

``` js
module.exports = function (cb) {
    var i = 0;
    var iv = setInterval(function () {
        if (i++ === 10 || (false && neverFires())) {
            clearInterval(iv);
            cb(null, 111);
        }
    }, 10);
};
```

Now with [browserify](http://browserify.org) and
[testling](https://npmjs.org/package/testling) we can do:

```
$ browserify -t coverify example/test.js | testling | coverify; echo EXIT CODE: $?

TAP version 13
# beep boop
ok 1 should be equal

1..1
# tests 1
# pass  1

# ok

# /home/substack/projects/coverify/example/test.js: line 7, column 16-28

  if (err) deadCode();
           ^^^^^^^^^^^

# /home/substack/projects/coverify/example/foo.js: line 3, column 35-48

  if (i++ === 10 || (false && neverFires())) {
                              ^^^^^^^^^^^^

EXIT CODE: 1
```

`browserify` compiled our `test.js` file, then `testling` ran our code in a
local headless browser (we also could have used `node`), and then `coverify`
parsed the test output for code coverage data and printed some nicely formatted
results on stderr. Hooray!

# methods

``` js
var coverify = require('coverify')
```

Usually you can just do `browserify -t coverify` to get code coverage but you
can also use the api directly if you want to use this code directly.

## var stream = coverify(file, opts={})

Return a transform stream for `file` that will instrument the input source file
using `console.log()`.

To use a different function from `console.log()`, pass in `opts.output`.

# install

With [npm](https://npmjs.org) do:

```
npm install coverify
```

and then when you compile your tests with browserify you can just do:

```
browserify -t coverify ...
```

# license

MIT
