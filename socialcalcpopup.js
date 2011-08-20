//
/*
// The module of the SocialCalc package for the optional popup menus in socialcalcspreadsheetcontrol.js
//
// (c) Copyright 2009 Socialtext, Inc.
// All Rights Reserved.
//
// The contents of this file are subject to the Artistic License 2.0; you may not
// use this file except in compliance with the License. You may obtain a copy of 
// the License at http://socialcalc.org/licenses/al-20/.
//
// Some of the other files in the SocialCalc package are licensed under
// different licenses. Please note the licenses of the modules you use.
//
// Code History:
//
// Initially coded by Dan Bricklin of Software Garden, Inc., for Socialtext, Inc.
//
*/

   var SocialCalc; // All values are stored in the master SocialCalc object
   if (!SocialCalc) {
      SocialCalc = {};
      }

   // The main Popup data -- there is only one set

   SocialCalc.Popup = {};

   // Routines and values for each type of control, indexed by type name
   // The value for each is an object constructed as follows:
   //
   //    Create = function(type, id, attribs)
   //    Initialize = function(type, id, data)
   //    SetValue = function(type, id, value)
   //    GetValue = function(type, id) returns value
   //    SetDisabled = function(type, id, t/f)
   //    Show = function(type, id)
   //    Hide = function(type, id)
   //    Cancel = function(type, id)
   //    Reset = function(type)
   //
   //    data = object to hold type-specific data
   //

   SocialCalc.Popup.Types = {};

   // Definitions for each individual control, indexed by id
   // The value for each is an object constructed as follows:
   //
   //    type: type name of the control
   //    value: current value of the control (usually a string, but can depend on type)
   //    data: object with type-specific items
   //

   SocialCalc.Popup.Controls = {};

   // System-wide values of currently active control
   //
   //    id: id of current control or null
   //

   SocialCalc.Popup.Current = {};

   // Other values used by the Popup system
   //

   SocialCalc.Popup.imagePrefix = "images/sc-"; // image prefix

   // Override this for localization

   SocialCalc.Popup.LocalizeString = function(str) {return str;};


// * * * * * * * * * * * * * * * *
//
// GENERAL ROUTINES
//
// * * * * * * * * * * * * * * * *

//
// SocialCalc.Popup.Create(type, id, attribs)
//
// Creates a control of type "type" as the children of document element "id" using "attribs"
//

SocialCalc.Popup.Create = function(type, id, attribs) {

   var pt = SocialCalc.Popup.Types[type];
   if (pt && pt.Create) {
      pt.Create(type, id, attribs);
      }

   }


//
// SocialCalc.Popup.SetValue(id, value)
//
// Sets the value of control.
//

SocialCalc.Popup.SetValue = function(id, value) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (!spc[id]) {alert("Unknown control "+id);return;}

   var type = spc[id].type;
   var pt = spt[type];
   var spcdata = spc[id].data;

   if (pt && pt.Create) {
      pt.SetValue(type, id, value);
      if (spcdata.attribs && spcdata.attribs.changedcallback) {
         spcdata.attribs.changedcallback(spcdata.attribs, id, value);
         }
      }

   }


//
// SocialCalc.Popup.SetDisabled(id, disabled)
//
// Sets whether the control is disabled (true) or not (false).
//

SocialCalc.Popup.SetDisabled = function(id, disabled) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (!spc[id]) {alert("Unknown control "+id);return;}

   var type = spc[id].type;

   var pt = spt[type];
   if (pt && pt.Create) {
      if (sp.Current.id && id == sp.Current.id) {
         pt.Hide(type, sp.Current.id);
         sp.Current.id = null;
         }
      pt.SetDisabled(type, id, disabled);
      }

   }


//
// SocialCalc.Popup.GetValue(id)
//
// Returns the value of control.
//

SocialCalc.Popup.GetValue = function(id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (!spc[id]) {alert("Unknown control "+id);return;}

   var type = spc[id].type;

   var pt = spt[type];
   if (pt && pt.Create) {
      return pt.GetValue(type, id);
      }

   return null;

   }


//
// SocialCalc.Popup.Initialize(id, data)
//
// Gives "data" to the appropriate initialization code.
//

SocialCalc.Popup.Initialize = function(id, data) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (!spc[id]) {alert("Unknown control "+id);return;}

   var type = spc[id].type;

   var pt = spt[type];
   if (pt && pt.Initialize) {
      pt.Initialize(type, id, data);
      }

   }


//
// SocialCalc.Popup.Reset(type)
//
// Resets Popup, such as when turning to page.
//

SocialCalc.Popup.Reset = function(type) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (spt[type].Reset) spt[type].Reset(type);

   }


//
// SocialCalc.Popup.CClick(id)
//
// Should be called when the user clicks on a control to do the popup
//

SocialCalc.Popup.CClick = function(id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (!spc[id]) {alert("Unknown control "+id);return;}

   if (spc[id].data && spc[id].data.disabled) return;

   var type = spc[id].type;

   var pt = spt[type];

   if (sp.Current.id) {
      spt[spc[sp.Current.id].type].Hide(type, sp.Current.id);
      if (id == sp.Current.id) { // same one - done
         sp.Current.id = null;
         return;
         }
      }

   if (pt && pt.Show) {
      pt.Show(type, id);
      }

   sp.Current.id = id;

   }


//
// SocialCalc.Popup.Close()
//
// Used to close any open popup.
//

SocialCalc.Popup.Close = function() {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (!sp.Current.id) return;

   sp.CClick(sp.Current.id);

   }

//
// SocialCalc.Popup.Cancel()
//
// Closes Popup and restores old value
//

SocialCalc.Popup.Cancel = function() {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (!sp.Current.id) return;

   var type = spc[sp.Current.id].type;

   var pt = spt[type];

   pt.Cancel(type, sp.Current.id);

   sp.Current.id = null;

   }

//
// ele = SocialCalc.Popup.CreatePopupDiv(id, attribs)
//
// Utility function to create the main popup div of width attribs.width.
// If attribs.title, create one with that text, and optionally attribs.moveable.
//

SocialCalc.Popup.CreatePopupDiv = function(id, attribs) {

   var pos, ele;

   var sp = SocialCalc.Popup;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   var main = document.createElement("div");
   main.style.position = "absolute";

   pos = SocialCalc.GetElementPositionWithScroll(spcdata.mainele);

   main.style.top = (pos.top+spcdata.mainele.offsetHeight)+"px";
   main.style.left = (pos.left)+"px";
   main.style.zIndex = 100;
   main.style.backgroundColor = "#FFF";
   main.style.border = "1px solid black";

   if (attribs.width) {
      main.style.width = attribs.width;
      }

   spcdata.mainele.appendChild(main);

   if (attribs.title) {
      main.innerHTML = '<table cellspacing="0" cellpadding="0" style="border-bottom:1px solid black;"><tr>'+
         '<td style="font-size:10px;cursor:default;width:100%;background-color:#999;color:#FFF;">'+attribs.title+'</td>'+
         '<td style="font-size:10px;cursor:default;color:#666;" onclick="SocialCalc.Popup.Cancel();">&nbsp;X&nbsp;</td></tr></table>';

      if (attribs.moveable) {
         spcdata.dragregistered = main.firstChild.firstChild.firstChild.firstChild;
         SocialCalc.DragRegister(spcdata.dragregistered, true, true, {MouseDown: SocialCalc.DragFunctionStart, MouseMove: SocialCalc.DragFunctionPosition,
                     MouseUp: SocialCalc.DragFunctionPosition,
                     Disabled: null, positionobj: main});
         }
      }

   return main;

   }

//
// SocialCalc.Popup.EnsurePosition(id, container)
//
// Utility function to make sure popup is positioned completely within container (both element objects)
// and appropriate with respect to the main element controlling the popup.
//

SocialCalc.Popup.EnsurePosition = function(id, container) {

   var sp = SocialCalc.Popup;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   var main = spcdata.mainele.firstChild;
   if (!main) {alert("No main popup element firstChild.");return};
   var popup = spcdata.popupele;

   function GetLayoutValues(ele) {
      var r = SocialCalc.GetElementPositionWithScroll(ele);
      r.height = ele.offsetHeight;
      r.width = ele.offsetWidth;
      r.bottom = r.top+r.height;
      r.right = r.left+r.width;
      return r;
      }

   var p = GetLayoutValues(popup);
   var c = GetLayoutValues(container);
   var m = GetLayoutValues(main);
   var t = 0; // type of placement
//addmsg("popup t/r/b/l/h/w= "+p.top+"/"+p.right+"/"+p.bottom+"/"+p.left+"/"+p.height+"/"+p.width);
//addmsg("container t/r/b/l/h/w= "+c.top+"/"+c.right+"/"+c.bottom+"/"+c.left+"/"+c.height+"/"+c.width);
//addmsg("main t/r/b/l/h/w= "+m.top+"/"+m.right+"/"+m.bottom+"/"+m.left+"/"+m.height+"/"+m.width);

   // Check various layout cases in priority order

   if (m.bottom+p.height < c.bottom && m.left+p.width < c.right) { // normal case: room on bottom and right
      popup.style.top = m.bottom + "px";
      popup.style.left = m.left + "px";
      t = 1;
      }

   else if (m.top-p.height > c.top && m.left+p.width < c.right) { // room on top and right
      popup.style.top = (m.top-p.height) + "px";
      popup.style.left = m.left + "px";
      t = 2;
      }

   else if (m.bottom+p.height < c.bottom && m.right-p.width > c.left) { // room on bottom and left
      popup.style.top = m.bottom + "px";
      popup.style.left = (m.right-p.width) + "px";
      t = 3;
      }

   else if (m.top-p.height > c.top && m.right-p.width > c.left) { // room on top and left
      popup.style.top = (m.top-p.height) + "px";
      popup.style.left = (m.right-p.width) + "px";
      t = 4;
      }

   else if (m.bottom+p.height < c.bottom && p.width < c.width) { // room on bottom and middle
      popup.style.top = m.bottom + "px";
      popup.style.left = (c.left+Math.floor((c.width-p.width)/2)) + "px";
      t = 5;
      }

   else if (m.top-p.height > c.top && p.width < c.width) { // room on top and middle
      popup.style.top = (m.top-p.height) + "px";
      popup.style.left = (c.left+Math.floor((c.width-p.width)/2)) + "px";
      t = 6;
      }

   else if (p.height < c.height && m.right+p.width < c.right) { // room on middle and right
      popup.style.top = (c.top+Math.floor((c.height-p.height)/2)) + "px";
      popup.style.left = m.right + "px";
      t = 7;
      }

   else if (p.height < c.height && m.left-p.width > c.left) { // room on middle and left
      popup.style.top = (c.top+Math.floor((c.height-p.height)/2)) + "px";
      popup.style.left = (m.left-p.width) + "px";
      t = 8;
      }

   else { // nothing works, so leave as it is
      }
//addmsg("Popup layout "+t);

}

//
// ele = SocialCalc.Popup.DestroyPopupDiv(ele, dragregistered)
//
// Utility function to get rid of the main popup div.
//

SocialCalc.Popup.DestroyPopupDiv = function(ele, dragregistered) {

   if (!ele) return;

   ele.innerHTML = "";

   SocialCalc.DragUnregister(dragregistered); // OK to do this even if not registered

   if (ele.parentNode) {
      ele.parentNode.removeChild(ele);
      }

   }

//
// Color Utility Functions
//

SocialCalc.Popup.RGBToHex = function(val) {

   var sp = SocialCalc.Popup;

   if (val=="") {
      return "000000";
      }
   var rgbvals = val.match(/(\d+)\D+(\d+)\D+(\d+)/);
   if (rgbvals) {
      return sp.ToHex(rgbvals[1])+sp.ToHex(rgbvals[2])+sp.ToHex(rgbvals[3]);
      }
   else {
      return "000000";
      }
   }

SocialCalc.Popup.HexDigits="0123456789ABCDEF";

SocialCalc.Popup.ToHex = function(num) {
   var sp = SocialCalc.Popup;
   var first=Math.floor(num / 16);
   var second=num % 16;
   return sp.HexDigits.charAt(first)+sp.HexDigits.charAt(second);
   }

SocialCalc.Popup.FromHex = function(str) {

   var sp = SocialCalc.Popup;
   var first = sp.HexDigits.indexOf(str.charAt(0).toUpperCase());
   var second = sp.HexDigits.indexOf(str.charAt(1).toUpperCase());
   return ((first>=0)?first:0)*16+((second>=0)?second:0);
   }

SocialCalc.Popup.HexToRGB = function(val) {

   var sp = SocialCalc.Popup;

   return "rgb("+sp.FromHex(val.substring(1,3))+","+sp.FromHex(val.substring(3,5))+","+sp.FromHex(val.substring(5,7))+")";

   }

SocialCalc.Popup.makeRGB = function(r, g, b) {
   return "rgb("+(r>0?r:0)+","+(g>0?g:0)+","+(b>0?b:0)+")";
   }

SocialCalc.Popup.splitRGB = function(rgb) {
   var parts = rgb.match(/(\d+)\D+(\d+)\D+(\d+)\D/);
   if (!parts) {
      return {r:0, g:0, b:0};
      }
   else {
      return {r: parts[1]-0, g: parts[2]-0, b: parts[3]-0};
      }
   }

// * * * * * * * * * * * * * * * *
//
// ROUTINES FOR EACH TYPE
//
// * * * * * * * * * * * * * * * *

//
// List
//
// type: List
// value: value of control,
// display: "value to display",
// custom: true if custom value,
// disabled: t/f,
// attribs: {
//    title: "popup title string",
//    moveable: t/f,
//    width: optional width, e.g., "100px",
//    ensureWithin: optional element object to ensure popup fits within if possible
//    changedcallback: optional function(attribs, id, newvalue),
//    ...
//    }
// data: {
//    ncols: calculated number of columns
//    options: [
//       {o: option-name, v: value-to-return,
//        a: {option attribs} // optional: {skip: true, custom: true, cancel: true, newcol: true}
//       },
//       ...]
//    }
//
// popupele: gets popup element object when created
// contentele: gets element created with all the content
// listdiv: gets div with list of items
// customele: gets input element with custom value
// dragregistered: gets element, if any, registered as draggable
//

SocialCalc.Popup.Types.List = {};

SocialCalc.Popup.Types.List.Create = function(type, id, attribs) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   var spcid = {type: type, value: "", display: "", data: {}};
   if (spc[id]) {alert("Already created "+id); return;}
   spc[id] = spcid;
   var spcdata = spcid.data;

   spcdata.attribs = attribs || {};

   var ele = document.getElementById(id);
   if (!ele) {alert("Missing element "+id); return;}

   spcdata.mainele = ele;

   ele.innerHTML = '<input style="cursor:pointer;width:'+(spcdata.attribs.inputWidth||'100px')+';font-size:smaller;" onfocus="this.blur();" onclick="SocialCalc.Popup.CClick(\''+id+'\');" value="">';

   spcdata.options = []; // set to nothing - use Initialize to fill

   }

SocialCalc.Popup.Types.List.SetValue = function(type, id, value) {

   var i;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   spcdata.value = value;
   spcdata.custom = false;

   for (i=0; i<spcdata.options.length; i++) {
      o = spcdata.options[i];
      if (o.a) {
         if (o.a.skip || o.a.custom || o.a.cancel) {
            continue;
            }
         }
      if (o.v == spcdata.value) { // matches value
         spcdata.display = o.o;
         break;
         }
      }
   if (i==spcdata.options.length) { // none found
      spcdata.display = "Custom";
      spcdata.custom = true;
      }

   if (spcdata.mainele && spcdata.mainele.firstChild) {
      spcdata.mainele.firstChild.value = spcdata.display;
      }

   }


SocialCalc.Popup.Types.List.SetDisabled = function(type, id, disabled) {

   var i;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   spcdata.disabled = disabled;

   if (spcdata.mainele && spcdata.mainele.firstChild) {
      spcdata.mainele.firstChild.disabled = disabled;
      }

   }


SocialCalc.Popup.Types.List.GetValue = function(type, id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   return spcdata.value;

   }


// data is: {value: initial value, attribs: {attribs stuff}, options: [{o: option-name, v: value-to-return, a: optional-attribs}, ...]}

SocialCalc.Popup.Types.List.Initialize = function(type, id, data) {

   var a;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   for (a in data.attribs) {
      spcdata.attribs[a] = data.attribs[a];
      }

   spcdata.options = data ? data.options : [];

   if (data.value) { // if has a value, set to it
      sp.SetValue(id, data.value);
      }

   }


SocialCalc.Popup.Types.List.Reset = function(type) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (sp.Current.id && spc[sp.Current.id].type == type) { // we have a popup
      spt[type].Hide(type, sp.Current.id);
      sp.Current.id = null;
      }

   }


SocialCalc.Popup.Types.List.Show = function(type, id) {

   var i, ele, o, bg;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data

   var str = "";

   spcdata.popupele = sp.CreatePopupDiv(id, spcdata.attribs);

   if (spcdata.custom) {
      str = SocialCalc.Popup.Types.List.MakeCustom(type, id);

      ele = document.createElement("div");
      ele.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">'+str+'</div>';

      spcdata.customele = ele.firstChild.firstChild.childNodes[1];
      spcdata.listdiv = null;
      spcdata.contentele = ele;
      }
   else {
      str = SocialCalc.Popup.Types.List.MakeList(type, id);

      ele = document.createElement("div");
      ele.innerHTML = '<div style="cursor:default;padding:4px;">'+str+'</div>';

      spcdata.customele = null;
      spcdata.listdiv = ele.firstChild;
      spcdata.contentele = ele;
      }

   if (spcdata.mainele && spcdata.mainele.firstChild) {
      spcdata.mainele.firstChild.disabled = true;
      }

   spcdata.popupele.appendChild(ele);

   if (spcdata.attribs.ensureWithin) {
      SocialCalc.Popup.EnsurePosition(id, spcdata.attribs.ensureWithin);
      }

   }


SocialCalc.Popup.Types.List.MakeList = function(type, id) {

   var i, ele, o, bg;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data

   var str = '<table cellspacing="0" cellpadding="0"><tr>';
   var td = '<td style="vertical-align:top;">';

   str += td;

   spcdata.ncols = 1;

   for (i=0; i<spcdata.options.length; i++) {
      o = spcdata.options[i];
      if (o.a) {
         if ( o.a.newcol) {
            str += '</td>'+td+"&nbsp;&nbsp;&nbsp;&nbsp;"+'</td>'+td;
            spcdata.ncols += 1;
            continue;
            }
         if (o.a.skip) {
            str += '<div style="font-size:x-small;white-space:nowrap;">'+o.o+'</div>';
            continue;
            }
         }
      if (o.v == spcdata.value && !(o.a && (o.a.custom || o.a.cancel))) { // matches value
         bg = "background-color:#DDF;";
         }
      else {
         bg = "";
         }
      str += '<div style="font-size:x-small;white-space:nowrap;'+bg+'" onclick="SocialCalc.Popup.Types.List.ItemClicked(\''+id+'\',\''+i+'\');" onmousemove="SocialCalc.Popup.Types.List.MouseMove(\''+id+'\',this);">'+o.o+'</div>';
      }

   str += "</td></tr></table>";

   return str;

   }


SocialCalc.Popup.Types.List.MakeCustom = function(type, id) {

   var SPLoc = SocialCalc.Popup.LocalizeString;

   var i, ele, o, bg;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   var style = 'style="font-size:smaller;"';

   var str = "";

   var val = spcdata.value;
   val = SocialCalc.special_chars(val);

   str = '<div style="white-space:nowrap;"><br>'+
         '<input id="customvalue" value="'+val+'"><br><br>'+
         '<input '+style+' type="button" value="'+SPLoc("OK")+'" onclick="SocialCalc.Popup.Types.List.CustomOK(\''+id+'\');return false;">'+
         '<input '+style+' type="button" value="'+SPLoc("List")+'" onclick="SocialCalc.Popup.Types.List.CustomToList(\''+id+'\');">'+
         '<input '+style+' type="button" value="'+SPLoc("Cancel")+'" onclick="SocialCalc.Popup.Close();">'+
         '<br></div>';

   return str;

   }


SocialCalc.Popup.Types.List.ItemClicked = function(id, num) {

   var oele, str, nele;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   var a = spcdata.options[num].a;

   if (a && a.custom) {
      oele = spcdata.contentele;
      str = SocialCalc.Popup.Types.List.MakeCustom("List", id);
      nele = document.createElement("div");
      nele.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">'+str+'</div>';
      spcdata.customele = nele.firstChild.firstChild.childNodes[1];
      spcdata.listdiv = null;
      spcdata.contentele = nele;
      spcdata.popupele.replaceChild(nele, oele);
      if (spcdata.attribs.ensureWithin) {
         SocialCalc.Popup.EnsurePosition(id, spcdata.attribs.ensureWithin);
         }
      return;
      }

   if (a && a.cancel) {
      SocialCalc.Popup.Close();
      return;
      }

   SocialCalc.Popup.SetValue(id, spcdata.options[num].v);

   SocialCalc.Popup.Close();
   
   }


SocialCalc.Popup.Types.List.CustomToList = function(id) {

   var oele, str, nele;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   oele = spcdata.contentele;
   str = SocialCalc.Popup.Types.List.MakeList("List", id);
   nele = document.createElement("div");
   nele.innerHTML = '<div style="cursor:default;padding:4px;">'+str+'</div>';
   spcdata.customele = null;
   spcdata.listdiv = nele.firstChild;
   spcdata.contentele = nele;
   spcdata.popupele.replaceChild(nele, oele);
   
   if (spcdata.attribs.ensureWithin) {
      SocialCalc.Popup.EnsurePosition(id, spcdata.attribs.ensureWithin);
      }
   }


SocialCalc.Popup.Types.List.CustomOK = function(id) {

   var i, c;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   SocialCalc.Popup.SetValue(id, spcdata.customele.value);

   SocialCalc.Popup.Close();
   
   }


SocialCalc.Popup.Types.List.MouseMove = function(id, ele) {

   var col, i, c;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   var list = spcdata.listdiv;

   if (!list) return;

   var rowele = list.firstChild.firstChild.firstChild; // div.table.tbody.tr

   for (col=0; col<spcdata.ncols; col++) {
      for (i=0; i<rowele.childNodes[col*2].childNodes.length; i++) {
         rowele.childNodes[col*2].childNodes[i].style.backgroundColor = "#FFF";
         }
      }

   ele.style.backgroundColor = "#DDF";
   
   }

SocialCalc.Popup.Types.List.Hide = function(type, id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   sp.DestroyPopupDiv(spcdata.popupele, spcdata.dragregistered);
   spcdata.popupele = null;

   if (spcdata.mainele && spcdata.mainele.firstChild) {
      spcdata.mainele.firstChild.disabled = false;
      }

   }

SocialCalc.Popup.Types.List.Cancel = function(type, id) {

   SocialCalc.Popup.Types.List.Hide(type, id);

   }


//
// ColorChooser
//
// type: ColorChooser
// value: value of control as "rgb(r,g,b)" or "" if default,
// oldvalue: starting value to reset to on close,
// display: "value to display" as hex color value,
// custom: true if custom value,
// disabled: t/f,
// attribs: {
//    title: "popup title string",
//    moveable: t/f,
//    width: optional width, e.g., "100px", of popup chooser
//    ensureWithin: optional element object to ensure popup fits within if possible
//    sampleWidth: optional width, e.g., "20px",
//    sampleHeight: optional height, e.g., "20px",
//    backgroundImage: optional background image for sample (transparent where want to show current color), e.g., "colorbg.gif"
//    backgroundImageDefault: optional background image for sample when default (transparent shows white)
//    backgroundImageDisabled: optional background image for sample when disabled (transparent shows gray)
//    changedcallback: optional function(attribs, id, newvalue),
//    ...
//    }
// data: {
//    }
//
// popupele: gets popup element object when created
// contentele: gets element created with all the content
// customele: gets input element with custom value
//

SocialCalc.Popup.Types.ColorChooser = {};

SocialCalc.Popup.Types.ColorChooser.Create = function(type, id, attribs) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   var spcid = {type: type, value: "", display: "", data: {}};
   if (spc[id]) {alert("Already created "+id); return;}
   spc[id] = spcid;
   var spcdata = spcid.data;

   spcdata.attribs = attribs || {};
   var spca = spcdata.attribs;

   spcdata.value = "";

   var ele = document.getElementById(id);
   if (!ele) {alert("Missing element "+id); return;}

   spcdata.mainele = ele;

   ele.innerHTML = '<div style="cursor:pointer;border:1px solid black;vertical-align:top;width:'+
                   (spca.sampleWidth || '15px')+';height:'+(spca.sampleHeight || '15px')+
                   ';" onclick="SocialCalc.Popup.Types.ColorChooser.ControlClicked(\''+id+'\');">&nbsp;</div>';

   }

SocialCalc.Popup.Types.ColorChooser.SetValue = function(type, id, value) {

   var i, img, pos;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;
   var spca = spcdata.attribs;

   spcdata.value = value;
   spcdata.custom = false;

   if (spcdata.mainele && spcdata.mainele.firstChild) {
      if (spcdata.value) {
         spcdata.mainele.firstChild.style.backgroundColor = spcdata.value;
         if (spca.backgroundImage) {
            img = "url("+sp.imagePrefix+spca.backgroundImage+")";
            }
         else {
            img = "";
            }
         pos = "center center";
         }
      else {
         spcdata.mainele.firstChild.style.backgroundColor = "#FFF";
         if (spca.backgroundImageDefault) {
            img = "url("+sp.imagePrefix+spca.backgroundImageDefault+")";
            pos = "center center";
            }
         else {
            img = "url("+sp.imagePrefix+"defaultcolor.gif)";
            pos = "left top";
            }
         }
      spcdata.mainele.firstChild.style.backgroundPosition = pos;
      spcdata.mainele.firstChild.style.backgroundImage = img;
      }

   }


SocialCalc.Popup.Types.ColorChooser.SetDisabled = function(type, id, disabled) {

   var i;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;
   var spca = spcdata.attribs;

   spcdata.disabled = disabled;

   if (spcdata.mainele && spcdata.mainele.firstChild) {
      if (disabled) {
         spcdata.mainele.firstChild.style.backgroundColor = "#DDD";
         if (spca.backgroundImageDisabled) {
            img = "url("+sp.imagePrefix+spca.backgroundImageDisabled+")";
            pos = "center center";
            }
         else {
            img = "url("+sp.imagePrefix+"defaultcolor.gif)";
            pos = "left top";
            }
         spcdata.mainele.firstChild.style.backgroundPosition = pos;
         spcdata.mainele.firstChild.style.backgroundImage = img;
         }
      else {
         sp.SetValue(id, spcdata.value);
         }
      }

   }


SocialCalc.Popup.Types.ColorChooser.GetValue = function(type, id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   return spcdata.value;

   }


SocialCalc.Popup.Types.ColorChooser.Initialize = function(type, id, data) {

   var a;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   for (a in data.attribs) {
      spcdata.attribs[a] = data.attribs[a];
      }

   if (data.value) { // if has a value, set to it
      sp.SetValue(id, data.value);
      }

   }


SocialCalc.Popup.Types.ColorChooser.Reset = function(type) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (sp.Current.id && spc[sp.Current.id].type == type) { // we have a popup
      spt[type].Hide(type, sp.Current.id);
      sp.Current.id = null;
      }

   }


SocialCalc.Popup.Types.ColorChooser.Show = function(type, id) {

   var i, ele, mainele;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data

   var str = "";

   spcdata.oldvalue = spcdata.value; // remember starting value

   spcdata.popupele = sp.CreatePopupDiv(id, spcdata.attribs);

   if (spcdata.custom) {
      str = SocialCalc.Popup.Types.ColorChooser.MakeCustom(type, id);

      ele = document.createElement("div");
      ele.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">'+str+'</div>';

      spcdata.customele = ele.firstChild.firstChild.childNodes[2];
      spcdata.contentele = ele;
      }
   else {
      mainele = SocialCalc.Popup.Types.ColorChooser.CreateGrid(type, id);

      ele = document.createElement("div");
      ele.style.padding = "3px";
      ele.style.backgroundColor = "#CCC";
      ele.appendChild(mainele);

      spcdata.customele = null;
      spcdata.contentele = ele;
      }

   spcdata.popupele.appendChild(ele);

   if (spcdata.attribs.ensureWithin) {
      SocialCalc.Popup.EnsurePosition(id, spcdata.attribs.ensureWithin);
      }

   }


SocialCalc.Popup.Types.ColorChooser.MakeCustom = function(type, id) {

   var i, ele, o, bg;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   var SPLoc = sp.LocalizeString;

   var style = 'style="font-size:smaller;"';

   var str = "";

   str = '<div style="white-space:nowrap;"><br>'+
         '#<input id="customvalue" style="width:75px;" value="'+spcdata.value+'"><br><br>'+
         '<input '+style+' type="button" value="'+SPLoc("OK")+'" onclick="SocialCalc.Popup.Types.ColorChooser.CustomOK(\''+id+'\');return false;">'+
         '<input '+style+' type="button" value="'+SPLoc("Grid")+'" onclick="SocialCalc.Popup.Types.ColorChooser.CustomToGrid(\''+id+'\');">'+
         '<br></div>';

   return str;

   }


SocialCalc.Popup.Types.ColorChooser.ItemClicked = function(id, num) {

   var oele, str, nele;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   SocialCalc.Popup.Close();
   
   }


SocialCalc.Popup.Types.ColorChooser.CustomToList = function(id) {

   var oele, str, nele;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   }


SocialCalc.Popup.Types.ColorChooser.CustomOK = function(id) {

   var i, c;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   sp.SetValue(id, spcdata.customele.value);

   sp.Close();
   
   }


SocialCalc.Popup.Types.ColorChooser.Hide = function(type, id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   sp.DestroyPopupDiv(spcdata.popupele, spcdata.dragregistered);
   spcdata.popupele = null;

   }


SocialCalc.Popup.Types.ColorChooser.Cancel = function(type, id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   sp.SetValue(id, spcdata.oldvalue); // reset to old value

   SocialCalc.Popup.Types.ColorChooser.Hide(type, id);

   }


SocialCalc.Popup.Types.ColorChooser.CreateGrid = function (type, id) {

   var ele, pos, row, rowele, col, g;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var SPLoc = sp.LocalizeString;
   var spcdata = spc[id].data;
   spcdata.grid = {};
   var grid = spcdata.grid;

   var mainele = document.createElement("div");

   ele = document.createElement("table");
   ele.cellSpacing = 0;
   ele.cellPadding = 0;
   ele.style.width = "100px";
   grid.table = ele;

   ele = document.createElement("tbody");
   grid.table.appendChild(ele);
   grid.tbody = ele;

   for (row=0; row<16; row++) {
      rowele = document.createElement("tr");
      for (col=0; col<5; col++) {
         g = {};
         grid[row+","+col] = g;
         ele = document.createElement("td");
         ele.style.fontSize = "1px";
         ele.innerHTML = "&nbsp;";
         ele.style.height = "10px";
         if (col<=1) {
            ele.style.width = "17px";
            ele.style.borderRight = "3px solid white";
            }
         else {
            ele.style.width = "20px";
            ele.style.backgroundRepeat = "no-repeat";
            }
         rowele.appendChild(ele);
         g.ele = ele;
         }
      grid.tbody.appendChild(rowele);
      }
   mainele.appendChild(grid.table);

   ele = document.createElement("div");
   ele.style.marginTop = "3px";
   ele.innerHTML = '<table cellspacing="0" cellpadding="0"><tr>'+
      '<td style="width:17px;background-color:#FFF;background-image:url('+sp.imagePrefix+'defaultcolor.gif);height:16px;font-size:10px;cursor:pointer;" title="'+SPLoc("Default")+'">&nbsp;</td>'+
      '<td style="width:23px;height:16px;font-size:10px;text-align:center;cursor:pointer;" title="'+SPLoc("Custom")+'">#</td>'+
      '<td style="width:60px;height:16px;font-size:10px;text-align:center;cursor:pointer;">'+SPLoc("OK")+'</td>'+
      '</tr></table>';
   grid.defaultbox = ele.firstChild.firstChild.firstChild.childNodes[0];
   grid.defaultbox.onclick = spt.ColorChooser.DefaultClicked;
   grid.custom = ele.firstChild.firstChild.firstChild.childNodes[1];
   grid.custom.onclick = spt.ColorChooser.CustomClicked;
   grid.msg = ele.firstChild.firstChild.firstChild.childNodes[2];
   grid.msg.onclick = spt.ColorChooser.CloseOK;
   mainele.appendChild(ele);

   grid.table.onmousedown = spt.ColorChooser.GridMouseDown;

   spt.ColorChooser.DetermineColors(id);
   spt.ColorChooser.SetColors(id);

   return mainele;

   }

SocialCalc.Popup.Types.ColorChooser.gridToG = function(grid, row, col) {

   return grid[row+","+col];

   }

SocialCalc.Popup.Types.ColorChooser.DetermineColors = function(id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var sptc = spt.ColorChooser;
   var spc = sp.Controls;
   var spcdata = spc[id].data;
   var grid = spcdata.grid;

   var col, row;
   var rgb = sp.splitRGB(spcdata.value);
   var color;

   col = 2;
   row = 16-Math.floor((rgb.r+16)/16);
   grid["selectedrow"+col] = row;
   for (row=0; row<16; row++) {
      sptc.gridToG(grid,row,col).rgb = sp.makeRGB(17*(15-row),0,0);
      }

   col = 3;
   row = 16-Math.floor((rgb.g+16)/16);
   grid["selectedrow"+col] = row;
   for (row=0; row<16; row++) {
      sptc.gridToG(grid,row,col).rgb = sp.makeRGB(0,17*(15-row),0);
      }

   col = 4;
   row = 16-Math.floor((rgb.b+16)/16);
   grid["selectedrow"+col] = row;
   for (row=0; row<16; row++) {
      sptc.gridToG(grid,row,col).rgb = sp.makeRGB(0,0,17*(15-row));
      }

   col = 1;
   for (row=0; row<16; row++) {
      sptc.gridToG(grid,row,col).rgb = sp.makeRGB(17*(15-row),17*(15-row),17*(15-row));
      }

   col = 0;
   var steps = [0, 68, 153, 204, 255];
   var commonrgb = ["400", "310", "420", "440", "442", "340", "040", "042", "032", "044", "024", "004", "204", "314", "402", "414"];
   var x;
   for (row=0; row<16; row++) {
      x = commonrgb[row];
      sptc.gridToG(grid,row,col).rgb = "rgb("+steps[x.charAt(0)-0]+","+steps[x.charAt(1)-0]+","+steps[x.charAt(2)-0]+")";
      }

   }

SocialCalc.Popup.Types.ColorChooser.SetColors = function(id) {

   var row, col, g, ele, rgb;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var sptc = spt.ColorChooser;
   var spc = sp.Controls;
   var spcdata = spc[id].data;
   var grid = spcdata.grid;

   for (row=0; row<16; row++) {
      for (col=0; col<5; col++) {
         g = sptc.gridToG(grid,row, col);
         g.ele.style.backgroundColor = g.rgb;
         g.ele.title = sp.RGBToHex(g.rgb);
         if (grid["selectedrow"+col]==row) {
            g.ele.style.backgroundImage = "url("+sp.imagePrefix+"chooserarrow.gif)";
            }
         else {
            g.ele.style.backgroundImage = "";
            }
         }
      }

   sp.SetValue(id, spcdata.value);

   grid.msg.style.backgroundColor = spcdata.value;
   rgb = sp.splitRGB(spcdata.value || "rgb(255,255,255)");
   if (rgb.r+rgb.g+rgb.b < 220) {
      grid.msg.style.color = "#FFF";
      }
   else {
      grid.msg.style.color = "#000";
      }
   if (!spcdata.value) { // default
      grid.msg.style.backgroundColor = "#FFF";
      grid.msg.style.backgroundImage = "url("+sp.imagePrefix+"defaultcolor.gif)";
      grid.msg.title = "Default";
      }
   else {
      grid.msg.style.backgroundImage = "";
      grid.msg.title = sp.RGBToHex(spcdata.value);
      }

   }

SocialCalc.Popup.Types.ColorChooser.GridMouseDown = function(e) {

   var event = e || window.event;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var sptc = spt.ColorChooser;
   var spc = sp.Controls;

   var id = sp.Current.id;
   if (!id) return;

   var spcdata = spc[id].data;
   var grid = spcdata.grid;

   switch (event.type) {
      case "mousedown":
         grid.mousedown = true;
         break;
      case "mouseup":
         grid.mousedown = false;
         break;
      case "mousemove":
         if (!grid.mousedown) {
            return;
            }
         break;
      }

   var viewport = SocialCalc.GetViewportInfo();
   var clientX = event.clientX + viewport.horizontalScroll;
   var clientY = event.clientY + viewport.verticalScroll;
   var gpos = SocialCalc.GetElementPosition(grid.table);
   var row = Math.floor((clientY-gpos.top-2)/10); // -2 is to split the diff btw IE & FF
   row = row < 0 ? 0 : row;
   var col = Math.floor((clientX-gpos.left)/20);
   row = row < 0 ? 0 : (row > 15 ? 15 : row);
   col = col < 0 ? 0 : (col > 4 ? 4 : col);
   var color = sptc.gridToG(grid,row,col).ele.style.backgroundColor;
   var newrgb = sp.splitRGB(color);
   var oldrgb = sp.splitRGB(spcdata.value);

   switch (col) {
      case 2:
         spcdata.value = sp.makeRGB(newrgb.r, oldrgb.g, oldrgb.b);
         break;
      case 3:
         spcdata.value = sp.makeRGB(oldrgb.r, newrgb.g, oldrgb.b);
         break;
      case 4:
         spcdata.value = sp.makeRGB(oldrgb.r, oldrgb.g, newrgb.b);
         break;
      case 0:
      case 1:
         spcdata.value = color;
      }

   sptc.DetermineColors(id);
   sptc.SetColors(id);

   }


SocialCalc.Popup.Types.ColorChooser.ControlClicked = function(id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var sptc = spt.ColorChooser;
   var spc = sp.Controls;

   var cid = sp.Current.id;
   if (!cid || id != cid) {
      sp.CClick(id);
      return;
      }

   sptc.CloseOK();

   }

SocialCalc.Popup.Types.ColorChooser.DefaultClicked = function(e) {

   var event = e || window.event;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var sptc = spt.ColorChooser;
   var spc = sp.Controls;

   var id = sp.Current.id;
   if (!id) return;

   var spcdata = spc[id].data;

   spcdata.value = "";
   SocialCalc.Popup.SetValue(id, spcdata.value);

   SocialCalc.Popup.Close();

   }

SocialCalc.Popup.Types.ColorChooser.CustomClicked = function(e) {

   var event = e || window.event;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var sptc = spt.ColorChooser;
   var spc = sp.Controls;

   var id = sp.Current.id;
   if (!id) return;

   var spcdata = spc[id].data;

   var oele, str, nele;

   oele = spcdata.contentele;
   str = SocialCalc.Popup.Types.ColorChooser.MakeCustom("ColorChooser", id);
   nele = document.createElement("div");
   nele.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">'+str+'</div>';
   spcdata.customele = nele.firstChild.firstChild.childNodes[2];
   spcdata.contentele = nele;
   spcdata.popupele.replaceChild(nele, oele);

   spcdata.customele.value = sp.RGBToHex(spcdata.value);

   if (spcdata.attribs.ensureWithin) {
      SocialCalc.Popup.EnsurePosition(id, spcdata.attribs.ensureWithin);
      }

   }



SocialCalc.Popup.Types.ColorChooser.CustomToGrid = function(id) {

   var oele, str, nele;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   SocialCalc.Popup.SetValue(id, sp.HexToRGB("#"+spcdata.customele.value));

   var oele, mainele, nele;

   oele = spcdata.contentele;
   mainele = SocialCalc.Popup.Types.ColorChooser.CreateGrid("ColorChooser", id);
   nele = document.createElement("div");
   nele.style.padding = "3px";
   nele.style.backgroundColor = "#CCC";
   nele.appendChild(mainele);
   spcdata.customele = null;
   spcdata.contentele = nele;
   spcdata.popupele.replaceChild(nele, oele);
   
   if (spcdata.attribs.ensureWithin) {
      SocialCalc.Popup.EnsurePosition(id, spcdata.attribs.ensureWithin);
      }
   }


SocialCalc.Popup.Types.ColorChooser.CustomOK = function(id) {

   var i, c;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   SocialCalc.Popup.SetValue(id, sp.HexToRGB("#"+spcdata.customele.value));

   SocialCalc.Popup.Close();
   
   }

SocialCalc.Popup.Types.ColorChooser.CloseOK = function(e) {

   var event = e || window.event;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var sptc = spt.ColorChooser;
   var spc = sp.Controls;

   var id = sp.Current.id;
   if (!id) return;

   var spcdata = spc[id].data;

   SocialCalc.Popup.SetValue(id, spcdata.value);

   SocialCalc.Popup.Close();

   }

