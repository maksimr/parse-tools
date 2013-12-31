describe('actions', function() {
    /*global mockery*/

    var mocks = require('mocks');

    beforeEach(function() {
        mockery.registerMock('fs', mocks.fs.create({
            test: {
                'file.js': mocks.fs.file(null, 'module :name\n\n    main')
            }
        }));

        this.pt = require('../../lib/pt.js');
        require('../../lib/pt.codegen.js');
    });

    it('should generate code by file path', function() {
        var result = new this.pt.Codegen('js', '/test/file.js');

        expect(result.lang).to.be.eql('js');
    });

    it('should generate code by content', function() {
        var result = new this.pt.Codegen('js', null, 'module :name\n\n    main');

        expect(result.lang).to.be.eql('js');
    });
});
