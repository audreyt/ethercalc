(function(){
  this.include = function(){
    return this.client({
      '/player-broadcast.js': function(){
        var SocialCalc;
        SocialCalc = window.SocialCalc || alert('Cannot find window.SocialCalc');
        if (SocialCalc != null && SocialCalc.OrigDoPositionCalculations) {
          return;
        }
        SocialCalc.OrigDoPositionCalculations = SocialCalc.DoPositionCalculations;
        SocialCalc.DoPositionCalculations = function(){
          var __ref;
          SocialCalc.OrigDoPositionCalculations();
          if (typeof (__ref = SocialCalc.Callbacks).broadcast === 'function') {
            __ref.broadcast('ask.ecell');
          }
        };
        SocialCalc.Sheet.prototype.ScheduleSheetCommands = function(cmd, saveundo, isRemote){
          return SocialCalc.ScheduleSheetCommands(this, cmd, saveundo, isRemote);
        };
        SocialCalc.OrigScheduleSheetCommands = SocialCalc.ScheduleSheetCommands;
        SocialCalc.ScheduleSheetCommands = function(sheet, cmdstr, saveundo, isRemote){
          var cmdstr, __ref;
          cmdstr = cmdstr.replace(/\n\n+/g, '\n');
          if (!/\S/.test(cmdstr)) {
            return;
          }
          if (cmdstr && !isRemote && cmdstr !== 'redisplay' && cmdstr !== 'recalc') {
            if (typeof (__ref = SocialCalc.Callbacks).broadcast === 'function') {
              __ref.broadcast('execute', {
                cmdstr: cmdstr,
                saveundo: saveundo
              });
            }
          }
          return SocialCalc.OrigScheduleSheetCommands(sheet, cmdstr, saveundo, isRemote);
        };
        return SocialCalc.MoveECell = function(editor, newcell){
          var newcell, highlights, cell, f, __ref;
          highlights = editor.context.highlights;
          if (editor.ecell) {
            if (editor.ecell.coord === newcell) {
              return newcell;
            }
            if (typeof (__ref = SocialCalc.Callbacks).broadcast === 'function') {
              __ref.broadcast('ecell', {
                original: editor.ecell.coord,
                ecell: newcell
              });
            }
            cell = SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
            delete highlights[editor.ecell.coord];
            if (editor.range2.hasrange && editor.ecell.row >= editor.range2.top && editor.ecell.row <= editor.range2.bottom && editor.ecell.col >= editor.range2.left && editor.ecell.col <= editor.range2.right) {
              highlights[editor.ecell.coord] = 'range2';
            }
            editor.UpdateCellCSS(cell, editor.ecell.row, editor.ecell.col);
            editor.SetECellHeaders('');
            editor.cellhandles.ShowCellHandles(false);
          } else {
            if (typeof (__ref = SocialCalc.Callbacks).broadcast === 'function') {
              __ref.broadcast('ecell', {
                ecell: newcell
              });
            }
          }
          newcell = editor.context.cellskip[newcell] || newcell;
          editor.ecell = SocialCalc.coordToCr(newcell);
          editor.ecell.coord = newcell;
          cell = SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
          highlights[newcell] = 'cursor';
          for (f in editor.MoveECellCallback) {
            editor.MoveECellCallback[f](editor);
          }
          editor.UpdateCellCSS(cell, editor.ecell.row, editor.ecell.col);
          editor.SetECellHeaders('selected');
          for (f in editor.StatusCallback) {
            editor.StatusCallback[f].func(editor, 'moveecell', newcell, editor.StatusCallback[f].params);
          }
          if (editor.busy) {
            editor.ensureecell = true;
          } else {
            editor.ensureecell = false;
            editor.EnsureECellVisible();
          }
          return newcell;
        };
      }
    });
  };
}).call(this);
