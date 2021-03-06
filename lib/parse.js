var split = require('split');
var through = require('through');
var combine = require('stream-combiner');
var fs = require('fs');

module.exports = function (cb) {
    var files = {};
    var original = {};
    
    return combine(split(), through(write, end));

    function write (line) {
        var m;
        if (m = /^COVERAGE\s+("[^"]+"|\S+)\s+(\S+)/.exec(line)) {
            var file = m[1], ranges = m[2];
            if (/^"/.test(file) && /"$/.test(file)) file = JSON.parse(file);
            files[file] = JSON.parse(ranges);
            original[file] = JSON.parse(ranges);
        }
        else if (m = /^COVERED\s+("[^"]+"|\S+)\s+(\S+)/.exec(line)) {
            var file = m[1], index = m[2];
            if (/^"/.test(file) && /"$/.test(file)) file = JSON.parse(file);
            delete files[file][index];
        }
        else this.queue(line + '\n');
    }
    
    function end () {
        var ranges = Object.keys(files).reduce(function (acc, file) {
            return acc.concat(files[file].filter(Boolean));
        }, []);
        
        var missed = Object.keys(files).reduce(function (acc, file) {
            acc[file] = files[file].filter(Boolean).filter(function (mr) {
                return !ranges.some(function (rr) {
                    return (mr[0] > rr[0] && mr[1] < rr[1])
                        || (mr[0] === rr[0] && mr[1] < rr[1])
                        || (mr[0] > rr[0] && mr[1] === rr[1])
                    ;
                });
            });
            return acc;
        }, {});
        
        var sources = {};
        var pending = 0;
        Object.keys(missed).forEach(function (file) {
            pending ++;
            sources[file] = {};
            
            fs.readFile(file, 'utf8', function (err, src) {
                if (err) return cb(err);
                
                var lines = src.split('\n');
                function findLine (r) {
                    var c = 0;
                    for (var i = 0; i < lines.length; i++) {
                        c += lines[i].length + 1;
                        if (c > r[0]) break;
                    }
                    var offset =  c - lines[i].length;
                    var lr = [ r[0] - offset, r[1] - offset + 1 ];
                    return { num: i, range: lr };
                }
                
                sources[file] = [];
                missed[file].forEach(function (range) {
                    var match = findLine(range);
                    sources[file].push({
                        range: range,
                        lineNum: match.num,
                        column: match.range,
                        line: lines[match.num],
                        code: src.slice(range[0], range[1])
                    });
                });
                next();
            });
        });
        
        function next () {
            if (--pending === 0) {
                cb(null, sources);
            }
        }
    }
};
