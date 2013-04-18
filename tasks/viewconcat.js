/*
 * Copyright (c) 2013 墨智
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
    // http://nuysoft.iteye.com/blog/1217898
    var rcjk = /[\u2E80-\u2EFF\u2F00-\u2FDF\u3000-\u303F\u31C0-\u31EF\u3200-\u32FF\u3300-\u33FF\u3400-\u4DBF\u4DC0-\u4DFF\u4E00-\u9FBF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF]+/g;

    grunt.registerMultiTask('viewconcat', 'Concat JavaScript and HTML of View.', function() {
        var options = this.options();
        grunt.verbose.writeflags(options, 'Options');

        this.files.forEach(function(file) {
            // src dest
            var src = file.src.filter(function(filepath) {
                // Warn on and remove invalid source files (if nonull was set).
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                }
                if (!grunt.file.exists(filepath.replace(/\.js$/, '.html'))) {
                    return false;
                }

                return true;
            })[0];
            if (src) {
                var jsfile = src.replace(/\.html$/, '.js');
                if (!grunt.file.exists(jsfile)) return;

                var js = grunt.file.read(jsfile),
                    html = grunt.file.read(src),
                    escaped = html.replace(rcjk, function(cjk) {
                        return escape(cjk).toLocaleLowerCase().replace(/%u/gi, '\\u');
                    }),
                    mode = js.match(/KISSY\.add\(["']([^"']+)["'],\s*function/);
                if (mode) {
                    escaped = escaped.replace(/"/g, '\\"').replace(/'/g, '\\\''),
                    // escaped = escaped ? 'Magix.templates["' + mode[1] + '"]="' + escaped + '";\n' : '';
                    // Magix.tmpl('app/home/views/index','html')
                    escaped = escaped ? 'Magix.tmpl("' + mode[1] + '","' + escaped + '");\n' : '';

                    grunt.file.write(file.dest, escaped + js)
                    grunt.log.writeln('File ' + file.dest + ' created.')

                    grunt.file['delete'](src)
                    grunt.log.writeln('File ' + src + ' deleted.')
                }
            }

            // .map(grunt.file.read).join(grunt.util.normalizelf(grunt.util.linefeed));
        });

    });
};