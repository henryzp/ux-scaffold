/*
 * Copyright (c) 2013 墨智
 */

module.exports = function(grunt) {
    // http://nuysoft.iteye.com/blog/1217898
    var rcjk = /[\u2E80-\u2EFF\u2F00-\u2FDF\u3000-\u303F\u31C0-\u31EF\u3200-\u32FF\u3300-\u33FF\u3400-\u4DBF\u4DC0-\u4DFF\u4E00-\u9FBF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF]+/g;

    grunt.registerMultiTask('htmlmin', 'Minify HTML', function() {
        var options = this.options();
        grunt.verbose.writeflags(options, 'Options');

        this.files.forEach(function(file) {
            var html = grunt.file.read(file.src) //
            .replace(/>\s*?</g, '><') //
            .replace(/\n+/g, '') //
            .replace(/\r+/g, '') //
            .replace(/\s{2,}/g, ' ') //
            .replace(/<!\-\-.*?\-\->/g, '');

            grunt.file.write(file.dest, html)
            grunt.log.writeln('File ' + file.dest + ' created.')

        });

    });
};