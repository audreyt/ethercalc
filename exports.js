if (typeof global != 'undefined') var window = global;
if (typeof SocialCalc != 'undefined' && typeof module != 'undefined') module.exports = SocialCalc;
if (typeof document == 'undefined') var document = SocialCalc.document = {};

// Compatibility with webworker-threads
if (typeof self !== 'undefined' && self.thread) {
    window.setTimeout = function (cb, ms) {
        if (ms <= 1) { self.thread.nextTick(cb); }
    };
    window.clearTimeout = function () {};
}

// We don't really need a DOM-based presentation layer for embedded SC.
SocialCalc.GetEditorCellElement = function () {};
SocialCalc.ReplaceCell = function () {};
SocialCalc.EditorRenderSheet = function () {};
SocialCalc.SpreadsheetControlSortSave = function () { return "" };
SocialCalc.SpreadsheetControlStatuslineCallback = function () {};
SocialCalc.DoPositionCalculations = function (editor) {
    SocialCalc.EditorSheetStatusCallback(
        null, "doneposcalc", null, editor
    );
}
