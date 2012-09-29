if (typeof global != 'undefined') var window = global;
if (typeof SocialCalc != 'undefined' && typeof module != 'undefined') module.exports = SocialCalc;

// We don't really need a DOM-based presentation layer for embedded SC.
SocialCalc.EditorRenderSheet = function () {};
SocialCalc.SpreadsheetControlSortSave = function () {};
SocialCalc.SpreadsheetControlStatuslineCallback = function () {};
SocialCalc.DoPositionCalculations = function () {
    SocialCalc.EditorSheetStatusCallback(
        null, "doneposcalc", null, SocialCalc.EditorStepInfo.editor
    );
}
