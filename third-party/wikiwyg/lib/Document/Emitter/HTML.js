Class('Document.Emitter.HTML(Document.Emitter)', function() {

var proto = this.prototype;
proto.className = 'Document.Emitter.HTML';

proto.begin_node = function(node) {
    var tag = node.type;
    switch (tag) {
        case 'asis': case 'line': return;
        case 'br': case 'hr': {
            this.output += '<'+tag+' />';
            return;
        }
        case 'html': {
            this.output += '<span class="wafl">Raw HTML section. Edit in Wiki Text mode.</span>';
            return;
        }
        case 'waflparagraph': case 'waflphrase': case 'im': {
            if (node._wafl.match(/^image:\s*(\S+)(?:\s+size=(\w+))?/)) {
                var onload = "if (typeof(ss) != 'undefined' && ss.editor) { var recalc = function () { try { ss.editor.DoPositionCalculations() } catch (e) { setTimeout(recalc, 500) } }; recalc() } if (!window.image_dimension_cache) window.image_dimension_cache = {};window.image_dimension_cache['/data/wafl/"+node._label.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "\\'").replace(/\\/g, "\\\\")+"'] = [ this.offsetWidth, this.offsetHeight ]; this.style.width = this.offsetWidth + 'px'; this.style.height = this.offsetHeight + 'px'";

                var imageName = RegExp.$1;
                var width = RegExp.$2;
                switch (width) {
                    case 'small':  { width = '100'; break; }
                    case 'medium': { width = '300'; break; }
                    case 'large':  { width = '600'; break; }
                }
                if (width) {
                    width = ' width="'+width+'"';
                }
                this.output += '<img src="'+imageName.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")+'" onload="'+onload+'"'+width+' />';
                return;
            }
            this.output += '<span class="wafl">'+node._label.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "\\'").replace(/\\/g, "\\\\")+'</span>';

            return;
        }
        case 'a': case 'wikilink': {
            this.output += '<a href="'+encodeURI(node._href)+'">';
            return;
        }
        case 'file': {
            this.output += '<a title="(network resource)" href="'+encodeURI(node._href)+'">';
            return;
        }
        case 'ul': case 'ol': case 'table': case 'tr': {
            this.output += '<'+tag+">\n";
            return;
        }
        default: {
            this.output += '<'+tag+'>';
            return;
        }
    }
}

proto.end_node = function(node) {
    var tag = node.type;
    switch (tag) {
        case 'asis': case 'br': case 'hr': case 'html': case 'waflparagraph': case 'waflphrase': case 'im': return;
        case 'line': {
            this.output += '<br />';
            return;
        }
        case 'file': case 'wikilink': {
            this.output += '</a>';
            return;
        }
        default: {
            if (tag.search(/^(?:p|ul|ol|li|h\d|table|tr|td)$/) == 0) {
                this.output += '</'+tag+">\n";
            }
            else {
                this.output += '</'+tag+'>';
            }
            return;
        }
    }
    return;
}

proto.text_node = function(text) {
    this.output += text
        .replace(/&/g, '&amp;')
        .replace(/>/g, '&gt;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

});
