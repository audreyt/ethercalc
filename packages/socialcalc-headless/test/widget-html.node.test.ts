import { describe, expect, it } from 'vitest';
import { createSpreadsheet } from '../src/index.js';

/** The HTML SocialCalc renders for the form widget in `coord`. */
function widgetHtml(commands: string[], coord = 'B1'): string {
  const sheet = createSpreadsheet();
  sheet.executeCommand(commands.join('\n'));
  sheet.createSheetHTML();
  const cell = sheet.exportSheetData().cells[coord] as { displaystring: string };
  return cell.displaystring;
}

const textBox = (value: string) =>
  `<input type='text' id='TEXTBOX_B1' onblur='SocialCalc.CmdGotFocus(null);' oninput="SocialCalc.TriggerIoAction.TextBox('B1')" value='${value}' >`;

describe('form widget HTML', () => {
  it('fills the template with the cell values', () => {
    expect(widgetHtml(['set A1 text t hello', 'set B1 formula TEXTBOX(A1)'])).toBe(
      textBox('hello'),
    );
    expect(widgetHtml(['set B1 formula TEXTBOX("x")+STYLE("color:red")'])).toBe(
      textBox('x').replace('<input', "<input style='color:red'"),
    );
    expect(widgetHtml(['set A1 text t a,b,c', 'set B1 formula SELECT("b",A1,2)'])).toBe(
      `<select size='2' id='SELECT_B1' onchange="SocialCalc.TriggerIoAction.SelectList('B1')" ><option>a</option><option selected>b</option><option>c</option></select>`,
    );
    expect(widgetHtml(['set B1 formula RADIOBUTTON(1,"group")'])).toBe(
      `<input type='radio' value='B1' id='RADIOBUTTON_B1'  name='group' onblur="SocialCalc.CmdGotFocus(null);" onclick="SocialCalc.TriggerIoAction.RadioButton('group');" >`,
    );
    expect(widgetHtml(['set B1 formula CHECKBOX(1)'])).toBe(
      `<input type='checkbox' id='CHECKBOX_B1' checked onblur='SocialCalc.CmdGotFocus(null);' onchange="SocialCalc.TriggerIoAction.CheckBox('B1')" >`,
    );
    expect(widgetHtml(['set B1 formula SUBMIT("Send")'])).toBe(
      `<button type='button' onclick="SocialCalc.TriggerIoAction.Submit('B1');">Send</button>`,
    );
  });

  it('inserts cell text that names a placeholder or a replacement pattern as text', () => {
    const names = "<%=parameter0_value%><%=display_value%><%=cell_reference%>$&$`$'";
    expect(widgetHtml([`set A1 text t ${names}`, 'set B1 formula TEXTBOX(A1)'])).toBe(
      textBox(names),
    );
    expect(widgetHtml([`set A1 text t ${names}`, 'set B1 formula TEXTBOX("x")+STYLE(A1)'])).toBe(
      textBox('x').replace('<input', () => `<input style='${names}'`),
    );
    expect(
      widgetHtml(["set A1 text t b|$'", "set A2 text t a,b|$',c", 'set B1 formula SELECT(A1,A2)']),
    ).toBe(
      `<select size='1' id='SELECT_B1' onchange="SocialCalc.TriggerIoAction.SelectList('B1')" ><option>a</option><option selected>b|$'</option><option>c</option></select>`,
    );
    expect(
      widgetHtml(["set A1 text t b|$'", 'set A2 text t a,b,c', 'set B1 formula SELECT(A1,A2)']),
    ).toBe(
      `<select size='1' id='SELECT_B1' onchange="SocialCalc.TriggerIoAction.SelectList('B1')" ><option>a</option><option>b</option><option>c</option></select>`,
    );
  });

  it('renders a widget no longer than its template and values together', () => {
    const repeated = '<%=parameter0_value%><%=parameter1_value%>'.repeat(50);
    const html = widgetHtml([
      `set A1 text t ${repeated}`,
      `set A2 text t ${repeated}`,
      'set B1 formula AUTOCOMPLETE(A1,A2)',
    ]);
    expect(html).toContain(`value='${repeated}'`);
    expect(html.length).toBeLessThan(repeated.length + 300);
  });
});
