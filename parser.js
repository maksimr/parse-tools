var path_ = require('path');

//  ---------------------------------------------------------------------------------------------------------------  //
//  Parser
//  ---------------------------------------------------------------------------------------------------------------  //

var InputStream = require('./inputstream.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var Parser = function(grammar, factory, _cwd) {
    this.grammar = grammar;
    this.factory = factory;

    this.cwd = _cwd || process.cwd();
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.read = function(filename) {
    filename = path_.join(this.cwd, filename);
    this.input = new InputStream(filename);
    this.skipper = null;
    this.cache = {};
};

Parser.prototype.parse = function(filename, rule) {
    this.read(filename);

    return this.match(rule);
};

Parser.prototype.subparser = function() {
    return new Parser( this.grammar, this.factory, path_.dirname(this.input.filename) );
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.makeAST = function(id) {
    return this.factory.make( id, this.input.getPos() );
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Errors
//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.error = function(msg) {
    throw new Parser.Error( msg || 'Unknown error', this.input.getPos() );
};

//  Этот метод нужен для того, чтобы показать,
//  что правило не смогло правильно сматчиться и нужно делать backtrace.
Parser.prototype.backtrace = function() {
    throw 'backtrace()';
};

Parser.Error = function(msg, pos) {
    this.msg = msg;
    this.pos = pos;
};

Parser.Error.prototype.toString = function() {
    var s = 'ERROR: ' + this.msg + '\n';
    var pos = this.pos;
    s += pos.input.where(pos);

    return s;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.skip = function(id) {
    id = id || this.skipper;
    var skipper = this.grammar.skippers[id];
    var r = skipper.call(this);

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.get = function(id) {
    var grammar = this.grammar;

    var pattern = grammar.patterns[id];
    if (!pattern) {
        pattern = grammar.addToken(id, id);
    }

    return pattern;
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Test / Match
//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.test = function(id) {
    var key = this.input.whereKey() + '|' + id;
    var cached = this.cache[key];
    if (cached !== undefined) {
        return cached;
    }

    var state = this.getState();
    var r = true;
    try {
        this.get(id).call(this);
        /// console.log('Ok: ' + id);
    } catch (e) {
        r = false;
        /// console.log('Failed: ' + id, e);
    }
    this.setState(state);

    this.cache[key] = r;

    return r;
};

Parser.prototype.testAny = function(ids) {
    for (var i = 0, l = ids.length; i < l; i++) {
        var id = ids[i];
        if (this.test(id)) {
            return id;
        }
    }

    return false;
};

Parser.prototype.testAll = function(ids) {
    var state = this.getState();
    var r = true;
    try {
        for (var i = 0, l = ids.length; i < l; i++) {
            this.get( ids[i] ).call(this);
        }
    } catch (e) {
        r = false;
        /// console.log(e);
    }
    this.setState(state);

    return r;
};

Parser.prototype.match = function(id, params) {
    var options = {};
    if (typeof id === 'object') {
        options = id.options;
        id = id.rule
    }

    var skipper = this.setSkipper(options.skipper);

    var rule = this.get(id);
    var r = rule.call(this, params);

    this.setSkipper(skipper);

    return r;
};

Parser.prototype.matchAny = function(ids) {
    for (var i = 0, l = ids.length; i < l; i++) {
        var id = ids[i];
        if (this.test(id)) {
            return this.match(id);
        }
    }

    this.error( 'Expected: ' + ids.join(', ') );
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Getters / Setters
//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.getSkipper = function() {
    return this.skipper;
};

Parser.prototype.setSkipper = function(id) {
    var skipper = this.skipper;
    if (id) {
        this.skipper = id;
        this.skip();
    }

    return skipper;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.setState = function(state) {
    this.input.setPos(state.pos);
    this.setSkipper(state.skipper);
};

Parser.prototype.getState = function() {
    return {
        pos: this.input.getPos(),
        skipper: this.getSkipper()
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Parser;

//  ---------------------------------------------------------------------------------------------------------------  //

