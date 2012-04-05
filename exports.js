if (typeof global != 'undefined') var window = global;
if (typeof SocialCalc != 'undefined' && typeof module != 'undefined') module.exports = SocialCalc;
var jsdom    = require("jsdom").jsdom;
var document = jsdom("<html><head></head><body><div id='tableeditor'></div></body></html>");
var window   = document.createWindow();
var navigator = { userAgent: "" };
