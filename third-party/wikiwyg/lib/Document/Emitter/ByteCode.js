Class('Document.Emitter.ByteCode(Document.Emitter)', function() {

var proto = this.prototype;
proto.className = 'Document.Emitter.ByteCode';

proto.begin_node = function(node) {
    this.output += '+' + node.type + '\n';
    return;
}

proto.end_node = function(node) {
    this.output += '-' + node.type + '\n';
    return;
}

proto.text_node = function(text) {
    text = text.replace(/\n/g, '\n ');
    this.output += ' ' + text + '\n';
    return;
}


});
