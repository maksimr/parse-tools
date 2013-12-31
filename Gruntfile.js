module.exports = function(grunt) {
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        files: {
            server: ['lib/**/*.js'],
            client: ['client/**/*.js'],
            test: ['test/**/*.js'],
            grunt: ['grunt.js', 'tasks/*.js']
        },
        browserify: {
            client: {
                files: {
                    'static/karma.js': ['client/main.js']
                }
            }
        },
        test: {
            unit: 'simplemocha:unit',
            client: 'test/client/karma.conf.js'
        },
        watch: {
            server: {
                files: ['<%= files.server %>', '<%= files.test %>'],
                tasks: 'simplemocha:unit'
            },
            client: {
                files: '<%= files.client %>',
                tasks: 'browserify:client'
            }
        },
        simplemocha: {
            options: {
                ui: 'bdd',
                reporter: 'dot'
            },
            unit: {
                src: ['test/unit/mocha-globals.js', 'test/unit/**/*.js']
            }
        }
    });

    grunt.registerTask('test', ['simplemocha:unit']);
    grunt.registerTask('default', ['watch:server']);
};
