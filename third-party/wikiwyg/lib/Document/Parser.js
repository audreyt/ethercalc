Class('Document.Parser', function() {

var proto = this.prototype;

proto.className = 'Document.Parser';

proto.init = function() {}

proto.parse = function(input, receiver) {
    this.input = (input.search(/\n$/) == -1) ? input+"\n" : input;
    if (receiver) this.receiver = receiver;
    this.receiver.init();
    this.grammar = this.create_grammar();
    this.parse_blocks('top');
    return this.receiver.content();
}

proto.create_grammar = function() {
    throw "Please define create_grammar in a derived class of Document.Parser.";
};

//------------------------------------------------------------------------------
// Parse input into a series of blocks. With each iteration the parser must
// match a block at position 0 of the text, and remove that block from the
// input reparse it further. This continues until there is no input left.
//------------------------------------------------------------------------------
proto.parse_blocks = function(container_type) {
    var types = this.grammar[container_type].blocks; // Document.contains[container_type];
    if (!types) return;
    while (this.input.length) {
        var length = this.input.length;
        for (var i = 0; i < types.length; i++) {
            var type = types[i];
            var matched = this.find_match('matched_block', type);
            if (matched) {
                this.input = this.input.substr(matched.end);
                this.handle_match(type, matched);
                break;
            }
        }
        if (this.input.length >= length)
            throw this.classname + ': Reduction error for:\n' + this.input +
            '\n' + JSON.stringify(this);
    }
    return;
}

proto.handle_match = function(type, match) {
    var grammar = this.grammar[type];
    var parse = grammar.blocks ? 'parse_blocks' : 'parse_phrases';
    // console.log("Subparsing " + parse + '(' + type + '): ');
    // console.log(match);
    this.subparse(parse, match, type, grammar.filter);
}

proto.find_match = function(matched_func, type) {
    var re = this.grammar[type].match;
    if (!re) throw 'no regexp for type: ' + type;
    var capture = this.input.match(re);
    if (capture) {
        // console.log("Found match " + type + " - " + matched_func);
        var match = this[matched_func].call(this, capture, this.grammar[type].lookbehind);
        match.type = this.grammar[type].type || type;
        // console.log(match);
        return match;
    }
    return;
};

//------------------------------------------------------------------------------
// This code parses a chunk into interleaved pieces of plain text and
// phrases. It repeatedly tries to match every possible phrase and
// then takes the match closest to the start. Everything before a
// match is written as text. Matched phrases are subparsed according
// to their rules. This continues until the input is all eaten.
//------------------------------------------------------------------------------
proto.parse_phrases = function(container_type) {
    var types = this.grammar[container_type].phrases;
    if (!types) { this.receiver.text_node(this.input || ''); return }
    // console.log("INPUT: " + this.input);
    while (this.input.length) {
        var match = null;
        for (var i = 0; i < types.length; i++) {
            var type = types[i];
            var matched = this.find_match('matched_phrase', type);
            if (! matched) continue;

            if (!match || (matched.begin < match.begin)) {
                match = matched;
                if (match.begin == 0) break;
            }
        }
        if (!match) {
            // console.log("NO MATCH: " + this.input);
            this.receiver.text_node(this.input || '');
            break;
        }
        if (match.begin != 0) {
            // console.log("MATCH OFFSET:" + this.input + " (" + match.type + ")" + match.begin);
            this.receiver.text_node(this.input.substr(0, match.begin) || '');
            }
        this.input = this.input.substr(match.end);
        this.handle_match(match.type, match);
    }
    return;
}

proto.subparse = function(func, match, type, filter) {
    /* The call could cause side effects to the match object. */
    match.type = this.grammar[type].type;
    if (match.type == null) match.type = type;

    var filtered_text = filter ? filter(match) : null;

    if (match.type) this.receiver.begin_node(match);

    var parser = eval('new ' + this.className + '()');

    parser.input = (filtered_text == null) ? match.text : filtered_text;
    parser.grammar = this.grammar;
    parser.receiver = this.receiver.instantiate();
    // console.log("SEEDED: (" + type + ")" + parser.input);
    parser[func].call(parser, type);
    this.receiver.insert(parser.receiver);

    if (match.type) this.receiver.end_node(match);
}

//------------------------------------------------------------------------------
// Helper functions
//
// These are the odds and ends called by the code above.
//------------------------------------------------------------------------------

/* Blocks has no lookbehinds, so:
 * All match begins at 0. The first capture is text; the next ones are various parts.
 */
proto.matched_block = function(capture) {
    return {
        begin: capture.index,
        text: capture[1],
        end: capture[0].length,
        1: capture[2],
        2: capture[3],
        3: capture[4]
    };
}

/* The first capture in a Phrases is the lookbehind. So:
 */
proto.matched_phrase = function(capture, lookbehind) {
    if (lookbehind) {
        var text = capture[2];
        var begin = this.input.indexOf(capture[1]);
        return {
            text: text,
            begin: begin,
            end: (begin + capture[1].length),
            1: RegExp.$2,
            2: RegExp.$3,
            3: RegExp.$4
        };
    }

    return {
        begin: capture.index,
        text: capture[1],
        end: capture.index + capture[0].length,
        1: capture[2],
        2: capture[3],
        3: capture[4]
    };
}

});
