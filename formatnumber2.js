//
/*
// SocialCalc Number Formatting Library
//
// Part of the SocialCalc package.
//
// (c) Copyright 2008 Socialtext, Inc.
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
// Based in part on the SocialCalc 1.1.0 code written in Perl.
// The SocialCalc 1.1.0 code was:
//    Portions (c) Copyright 2005, 2006, 2007 Software Garden, Inc.
//    All Rights Reserved.
//    Portions (c) Copyright 2007 Socialtext, Inc.
//    All Rights Reserved.
// The Perl SocialCalc started as modifications to the wikiCalc(R) program, version 1.0.
// wikiCalc 1.0 was written by Software Garden, Inc.
// Unless otherwise specified, referring to "SocialCalc" in comments refers to this
// JavaScript version of the code, not the SocialCalc Perl code.
//
*/

   var SocialCalc;
   if (!SocialCalc) SocialCalc = {}; // May be used with other SocialCalc libraries or standalone

SocialCalc.FormatNumber = {};

SocialCalc.FormatNumber.format_definitions = {}; // Parsed formats are stored here globally

// Most constants that are often customized for localization are in the SocialCalc.Constants module.
// If you use this module standalone, provide at least the "FormatNumber" values.
//

// The following values may be customized externally for further localization of the format definitions themselves,
// but that would make them incompatible with other uses and is discouraged.
//

SocialCalc.FormatNumber.separatorchar = ",";
SocialCalc.FormatNumber.decimalchar = ".";
SocialCalc.FormatNumber.daynames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
SocialCalc.FormatNumber.daynames3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
SocialCalc.FormatNumber.monthnames3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
SocialCalc.FormatNumber.monthnames = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
                                      "October", "November", "December"];

SocialCalc.FormatNumber.allowedcolors =
   {BLACK: "#000000", BLUE: "#0000FF", CYAN: "#00FFFF", GREEN: "#00FF00", MAGENTA: "#FF00FF",
    RED: "#FF0000", WHITE: "#FFFFFF", YELLOW: "#FFFF00"};

SocialCalc.FormatNumber.alloweddates =
   {H: "h]", M: "m]", MM: "mm]", S: "s]", SS: "ss]"};

// Other constants

SocialCalc.FormatNumber.commands =
   {copy: 1, color: 2, integer_placeholder: 3, fraction_placeholder: 4, decimal: 5,
    currency: 6, general:7, separator: 8, date: 9, comparison: 10, section: 11, style: 12};

SocialCalc.FormatNumber.datevalues = {julian_offset: 2415019, seconds_in_a_day: 24 * 60 * 60, seconds_in_an_hour: 60 * 60};

/* *******************

 result = SocialCalc.FormatNumber.formatNumberWithFormat = function(rawvalue, format_string, currency_char)

************************* */

SocialCalc.FormatNumber.formatNumberWithFormat = function(rawvalue, format_string, currency_char) {

   var scc = SocialCalc.Constants;
   var scfn = SocialCalc.FormatNumber;

   var op, operandstr, fromend, cval, operandstrlc;
   var startval, estartval;
   var hrs, mins, secs, ehrs, emins, esecs, ampmstr, ymd;
   var minOK, mpos;
   var result="";
   var thisformat;
   var section, gotcomparison, compop, compval, cpos, oppos;
   var sectioninfo;
   var i, decimalscale, scaledvalue, strvalue, strparts, integervalue, fractionvalue;
   var integerdigits2, integerpos, fractionpos, textcolor, textstyle, separatorchar, decimalchar;
   var value; // working copy to change sign, etc.

   rawvalue = rawvalue-0; // make sure a number
   value = rawvalue;
   if (!isFinite(value)) return "NaN";

   var negativevalue = value < 0 ? 1 : 0; // determine sign, etc.
   if (negativevalue) value = -value;
   var zerovalue = value == 0 ? 1 : 0;

   currency_char = currency_char || scc.FormatNumber_DefaultCurrency;

   scfn.parse_format_string(scfn.format_definitions, format_string); // make sure format is parsed
   thisformat = scfn.format_definitions[format_string]; // Get format structure

   if (!thisformat) throw "Format not parsed error!";

   section = thisformat.sectioninfo.length - 1; // get number of sections - 1

   if (thisformat.hascomparison) { // has comparisons - determine which section
      section = 0; // set to which section we will use
      gotcomparison = 0; // this section has no comparison
      for (cpos=0; ;cpos++) { // scan for comparisons
         op = thisformat.operators[cpos];
         operandstr = thisformat.operands[cpos]; // get next operator and operand
         if (!op) { // at end with no match
            if (gotcomparison) { // if comparison but no match
               format_string = "General"; // use default of General
               scfn.parse_format_string(scfn.format_definitions, format_string);
               thisformat = scfn.format_definitions[format_string];
               section = 0;
               }
            break; // if no comparision, matches on this section
            }
         if (op == scfn.commands.section) { // end of section
            if (!gotcomparison) { // no comparison, so it's a match
               break;
               }
            gotcomparison = 0;
            section++; // check out next one
            continue;
            }
         if (op == scfn.commands.comparison) { // found a comparison - do we meet it?
            i=operandstr.indexOf(":");
            compop=operandstr.substring(0,i);
            compval=operandstr.substring(i+1)-0;
            if ((compop == "<" && rawvalue < compval) ||
                (compop == "<=" && rawvalue <= compval) ||
                (compop == "=" && rawvalue == compval) ||
                (compop == "<>" && rawvalue != compval) ||
                (compop == ">=" && rawvalue >= compval) ||
                (compop == ">" && rawvalue > compval)) { // a match
               break;
               }
            gotcomparison = 1;
            }
         }
      }
   else if (section > 0) { // more than one section (separated by ";")
      if (section == 1) { // two sections
         if (negativevalue) {
            negativevalue = 0; // sign will provided by section, not automatically
            section = 1; // use second section for negative values
            }
         else {
            section = 0; // use first for all others
            }
         }
      else if (section == 2) { // three sections
         if (negativevalue) {
            negativevalue = 0; // sign will provided by section, not automatically
            section = 1; // use second section for negative values
            }
         else if (zerovalue) {
            section = 2; // use third section for zero values
            }
         else {
            section = 0; // use first for positive
            }
         }
      }

   sectioninfo = thisformat.sectioninfo[section]; // look at values for our section

   if (sectioninfo.commas > 0) { // scale by thousands
      for (i=0; i<sectioninfo.commas; i++) {
         value /= 1000;
         }
      }
   if (sectioninfo.percent > 0) { // do percent scaling
      for (i=0; i<sectioninfo.percent; i++) {
         value *= 100;
         }
      }

   decimalscale = 1; // cut down to required number of decimal digits
   for (i=0; i<sectioninfo.fractiondigits; i++) {
      decimalscale *= 10;
      }
   scaledvalue = Math.floor(value * decimalscale + 0.5);
   scaledvalue = scaledvalue / decimalscale;

   if (typeof scaledvalue != "number") return "NaN";
   if (!isFinite(scaledvalue)) return "NaN";

   strvalue = scaledvalue+""; // convert to string (Number.toFixed doesn't do all we need)

//   strvalue = value.toFixed(sectioninfo.fractiondigits); // cut down to required number of decimal digits
                                                         // and convert to string

   if (scaledvalue == 0 && (sectioninfo.fractiondigits || sectioninfo.integerdigits)) {
      negativevalue = 0; // no "-0" unless using multiple sections or General
      }

   if (strvalue.indexOf("e")>=0) { // converted to scientific notation
      return rawvalue+""; // Just return plain converted raw value
      }

   strparts=strvalue.match(/^\+{0,1}(\d*)(?:\.(\d*)){0,1}$/); // get integer and fraction parts
   if (!strparts) return "NaN"; // if not a number
   integervalue = strparts[1];
   if (!integervalue || integervalue=="0") integervalue="";
   fractionvalue = strparts[2];
   if (!fractionvalue) fractionvalue = "";

   if (sectioninfo.hasdate) { // there are date placeholders
      if (rawvalue < 0) { // bad date
         return "??-???-??&nbsp;??:??:??";
         }
      startval = (rawvalue-Math.floor(rawvalue)) * scfn.datevalues.seconds_in_a_day; // get date/time parts
      estartval = rawvalue * scfn.datevalues.seconds_in_a_day; // do elapsed time version, too
      hrs = Math.floor(startval / scfn.datevalues.seconds_in_an_hour);
      ehrs = Math.floor(estartval / scfn.datevalues.seconds_in_an_hour);
      startval = startval - hrs * scfn.datevalues.seconds_in_an_hour;
      mins = Math.floor(startval / 60);
      emins = Math.floor(estartval / 60);
      secs = startval - mins * 60;
      decimalscale = 1; // round appropriately depending if there is ss.0
      for (i=0; i<sectioninfo.fractiondigits; i++) {
         decimalscale *= 10;
         }
      secs = Math.floor(secs * decimalscale + 0.5);
      secs = secs / decimalscale;
      esecs = Math.floor(estartval * decimalscale + 0.5);
      esecs = esecs / decimalscale;
      if (secs >= 60) { // handle round up into next second, minute, etc.
         secs = 0;
         mins++; emins++;
         if (mins >= 60) {
            mins = 0;
            hrs++; ehrs++;
            if (hrs >= 24) {
               hrs = 0;
               rawvalue++;
               }
            }
         }
      fractionvalue = (secs-Math.floor(secs))+""; // for "hh:mm:ss.000"
      fractionvalue = fractionvalue.substring(2); // skip "0."

      ymd = SocialCalc.FormatNumber.convert_date_julian_to_gregorian(Math.floor(rawvalue+scfn.datevalues.julian_offset));

      minOK = 0; // says "m" can be minutes if true
      mspos = sectioninfo.sectionstart; // m scan position in ops
      for ( ; ; mspos++) { // scan for "m" and "mm" to see if any minutes fields, and am/pm
         op = thisformat.operators[mspos];
         operandstr = thisformat.operands[mspos]; // get next operator and operand
         if (!op) break; // don't go past end
         if (op==scfn.commands.section) break;
         if (op==scfn.commands.date) {
            if ((operandstr.toLowerCase()=="am/pm" || operandstr.toLowerCase()=="a/p") && !ampmstr) {
               if (hrs >= 12) {
                  hrs -= 12;
                  ampmstr = operandstr.toLowerCase()=="a/p" ? scc.s_FormatNumber_pm1 : scc.s_FormatNumber_pm; // "P" : "PM";
                  }
               else {
                  ampmstr = operandstr.toLowerCase()=="a/p" ? scc.s_FormatNumber_am1 : scc.s_FormatNumber_am; // "A" : "AM";
                  }
               if (operandstr.indexOf(ampmstr)<0)
                  ampmstr = ampmstr.toLowerCase(); // have case match case in format
               }
            if (minOK && (operandstr=="m" || operandstr=="mm")) {
               thisformat.operands[mspos] += "in"; // turn into "min" or "mmin"
               }
            if (operandstr.charAt(0)=="h") {
               minOK = 1; // m following h or hh or [h] is minutes not months
               }
            else {
               minOK = 0;
               }
            }
         else if (op!=scfn.commands.copy) { // copying chars can be between h and m
            minOK = 0;
            }
         }
      minOK = 0;
      for (--mspos; ; mspos--) { // scan other way for s after m
         op = thisformat.operators[mspos];
         operandstr = thisformat.operands[mspos]; // get next operator and operand
         if (!op) break; // don't go past end
         if (op==scfn.commands.section) break;
         if (op==scfn.commands.date) {
            if (minOK && (operandstr=="m" || operandstr=="mm")) {
               thisformat.operands[mspos] += "in"; // turn into "min" or "mmin"
               }
            if (operandstr=="ss") {
               minOK = 1; // m before ss is minutes not months
               }
            else {
               minOK = 0;
               }
            }
         else if (op!=scfn.commands.copy) { // copying chars can be between ss and m
            minOK = 0;
            }
         }
      }

   integerdigits2 = 0; // init counters, etc.
   integerpos = 0;
   fractionpos = 0;
   textcolor = "";
   textstyle = "";
   separatorchar = scc.FormatNumber_separatorchar;
   if (separatorchar.indexOf(" ")>=0) separatorchar = separatorchar.replace(/ /g, "&nbsp;");
   decimalchar = scc.FormatNumber_decimalchar;
   if (decimalchar.indexOf(" ")>=0) decimalchar = decimalchar.replace(/ /g, "&nbsp;");

   oppos = sectioninfo.sectionstart;

   while (op = thisformat.operators[oppos]) { // execute format
      operandstr = thisformat.operands[oppos++]; // get next operator and operand

      if (op == scfn.commands.copy) { // put char in result
         result += operandstr;
         }

      else if (op == scfn.commands.color) { // set color
         textcolor = operandstr;
         }

      else if (op == scfn.commands.style) { // set style
         textstyle = operandstr;
         }

      else if (op == scfn.commands.integer_placeholder) { // insert number part
         if (negativevalue) {
            result += "-";
            negativevalue = 0;
            }
         integerdigits2++;
         if (integerdigits2 == 1) { // first one
            if (integervalue.length > sectioninfo.integerdigits) { // see if integer wider than field
               for (;integerpos < (integervalue.length - sectioninfo.integerdigits); integerpos++) {
                  result += integervalue.charAt(integerpos);
                  if (sectioninfo.thousandssep) { // see if this is a separator position
                     fromend = integervalue.length - integerpos - 1;
                     if (fromend > 2 && fromend % 3 == 0) {
                        result += separatorchar;
                        }
                     }
                  }
               }
            }
         if (integervalue.length < sectioninfo.integerdigits
             && integerdigits2 <= sectioninfo.integerdigits - integervalue.length) { // field is wider than value
            if (operandstr == "0" || operandstr == "?") { // fill with appropriate characters
               result += operandstr == "0" ? "0" : "&nbsp;";
               if (sectioninfo.thousandssep) { // see if this is a separator position
                  fromend = sectioninfo.integerdigits - integerdigits2;
                  if (fromend > 2 && fromend % 3 == 0) {
                     result += separatorchar;
                     }
                  }
               }
            }
         else { // normal integer digit - add it
            result += integervalue.charAt(integerpos);
            if (sectioninfo.thousandssep) { // see if this is a separator position
               fromend = integervalue.length - integerpos - 1;
               if (fromend > 2 && fromend % 3 == 0) {
                  result += separatorchar;
                  }
               }
            integerpos++;
            }
         }
      else if (op == scfn.commands.fraction_placeholder) { // add fraction part of number
         if (fractionpos >= fractionvalue.length) {
            if (operandstr == "0" || operandstr == "?") {
               result += operandstr == "0" ? "0" : "&nbsp;";
               }
            }
         else {
            result += fractionvalue.charAt(fractionpos);
            }
         fractionpos++;
         }

      else if (op == scfn.commands.decimal) { // decimal point
         if (negativevalue) {
            result += "-";
            negativevalue = 0;
            }
         result += decimalchar;
         }

      else if (op == scfn.commands.currency) { // currency symbol
         if (negativevalue) {
            result += "-";
            negativevalue = 0;
            }
         result += operandstr;
         }

      else if (op == scfn.commands.general) { // insert "General" conversion

         // *** Cut down number of significant digits to avoid floating point artifacts:

         if (value!=0) { // only if non-zero
            var factor = Math.floor(Math.LOG10E * Math.log(value)); // get integer magnitude as a power of 10
            factor = Math.pow(10, 13-factor); // turn into scaling factor
            value = Math.floor(factor * value + 0.5)/factor; // scale positive value, round, undo scaling
            if (!isFinite(value)) return "NaN";
            }
         if (negativevalue) {
            result += "-";
            }
         strvalue = value+""; // convert original value to string
         if (strvalue.indexOf("e")>=0) { // converted to scientific notation
            result += strvalue;
            continue;
            }
         strparts=strvalue.match(/^\+{0,1}(\d*)(?:\.(\d*)){0,1}$/); // get integer and fraction parts
         integervalue = strparts[1];
         if (!integervalue || integervalue=="0") integervalue="";
         fractionvalue = strparts[2];
         if (!fractionvalue) fractionvalue = "";
         integerpos = 0;
         fractionpos = 0;
         if (integervalue.length) {
            for (;integerpos < integervalue.length; integerpos++) {
               result += integervalue.charAt(integerpos);
               if (sectioninfo.thousandssep) { // see if this is a separator position
                  fromend = integervalue.length - integerpos - 1;
                  if (fromend > 2 && fromend % 3 == 0) {
                     result += separatorchar;
                     }
                  }
               }
             }
         else {
            result += "0";
            }
         if (fractionvalue.length) {
            result += decimalchar;
            for (;fractionpos < fractionvalue.length; fractionpos++) {
               result += fractionvalue.charAt(fractionpos);
               }
            }
         }
      else if (op==scfn.commands.date) { // date placeholder
         operandstrlc = operandstr.toLowerCase();
         if (operandstrlc=="y" || operandstrlc=="yy") {
            result += (ymd.year+"").substring(2);
            }
         else if (operandstrlc=="yyyy") {
            result += ymd.year+"";
            }
         else if (operandstrlc=="d") {
            result += ymd.day+"";
            }
         else if (operandstrlc=="dd") {
            cval = 1000 + ymd.day;
            result += (cval+"").substr(2);
            }
         else if (operandstrlc=="ddd") {
            cval = Math.floor(rawvalue+6) % 7;
            result += scc.s_FormatNumber_daynames3[cval];
            }
         else if (operandstrlc=="dddd") {
            cval = Math.floor(rawvalue+6) % 7;
            result += scc.s_FormatNumber_daynames[cval];
            }
         else if (operandstrlc=="m") {
            result += ymd.month+"";
            }
         else if (operandstrlc=="mm") {
            cval = 1000 + ymd.month;
            result += (cval+"").substr(2);
            }
         else if (operandstrlc=="mmm") {
            result += scc.s_FormatNumber_monthnames3[ymd.month-1];
            }
         else if (operandstrlc=="mmmm") {
            result += scc.s_FormatNumber_monthnames[ymd.month-1];
            }
         else if (operandstrlc=="mmmmm") {
            result += scc.s_FormatNumber_monthnames[ymd.month-1].charAt(0);
            }
         else if (operandstrlc=="h") {
            result += hrs+"";
            }
         else if (operandstrlc=="h]") {
            result += ehrs+"";
            }
         else if (operandstrlc=="mmin") {
            cval = (1000 + mins)+"";
            result += cval.substr(2);
            }
         else if (operandstrlc=="mm]") {
            if (emins < 100) {
               cval = (1000 + emins)+"";
               result += cval.substr(2);
               }
            else {
               result += emins+"";
               }
            }
         else if (operandstrlc=="min") {
            result += mins+"";
            }
         else if (operandstrlc=="m]") {
            result += emins+"";
            }
         else if (operandstrlc=="hh") {
            cval = (1000 + hrs)+"";
            result += cval.substr(2);
            }
         else if (operandstrlc=="s") {
            cval = Math.floor(secs);
            result += cval+"";
            }
         else if (operandstrlc=="ss") {
            cval = (1000 + Math.floor(secs))+"";
            result += cval.substr(2);
            }
         else if (operandstrlc=="am/pm" || operandstrlc=="a/p") {
            result += ampmstr;
            }
         else if (operandstrlc=="ss]") {
            if (esecs < 100) {
               cval = (1000 + Math.floor(esecs))+"";
               result += cval.substr(2);
               }
            else {
               cval = Math.floor(esecs);
               result += cval+"";
               }
            }
         }
      else if (op == scfn.commands.section) { // end of section
         break;
         }

      else if (op == scfn.commands.comparison) { // ignore
         continue;
         }

      else {
         result += "!! Parse error !!";
         }
      }

   if (textcolor) {
      result = '<span style="color:'+textcolor+';">'+result+'</span>';
      }
   if (textstyle) {
      result = '<span style="'+textstyle+';">'+result+'</span>';
      }

   return result;

   };

/* *******************

 SocialCalc.FormatNumber.parse_format_string(format_defs, format_string)

 Takes a format string (e.g., "#,##0.00_);(#,##0.00)") and fills in format_defs with the parsed info

 format_defs
    ["#,##0.0"]->{} - elements in the hash are one hash for each format
       .operators->[] - array of operators from parsing the format string (each a number)
       .operands->[] - array of corresponding operators (each usually a string)
       .sectioninfo->[] - one hash for each section of the format
          .start
          .integerdigits
          .fractiondigits
          .commas
          .percent
          .thousandssep
          .hasdates
       .hascomparison - true if any section has [<100], etc.

************************* */

SocialCalc.FormatNumber.parse_format_string = function(format_defs, format_string) {

   var scfn = SocialCalc.FormatNumber;

   var thisformat, section, sectionfinfo;
   var integerpart = 1; // start out in integer part
   var lastwasinteger; // last char was an integer placeholder
   var lastwasslash; // last char was a backslash - escaping following character
   var lastwasasterisk; // repeat next char
   var lastwasunderscore; // last char was _ which picks up following char for width
   var inquote, quotestr; // processing a quoted string
   var inbracket, bracketstr, bracketdata; // processing a bracketed string
   var ingeneral, gpos; // checks for characters "General"
   var ampmstr, part; // checks for characters "A/P" and "AM/PM"
   var indate; // keeps track of date/time placeholders
   var chpos; // character position being looked at
   var ch; // character being looked at

   if (format_defs[format_string]) return; // already defined - nothing to do

   thisformat = {operators: [], operands: [], sectioninfo: [{}]}; // create info structure for this format
   format_defs[format_string] = thisformat; // add to other format definitions

   section = 0; // start with section 0
   sectioninfo = thisformat.sectioninfo[section]; // get reference to info for current section
   sectioninfo.sectionstart = 0; // position in operands that starts this section
   sectioninfo.integerdigits = 0; // number of integer-part placeholders
   sectioninfo.fractiondigits = 0; // fraction placeholders
   sectioninfo.commas = 0; // commas encountered, to handle scaling
   sectioninfo.percent = 0; // times to scale by 100

   for (chpos=0; chpos<format_string.length; chpos++) { // parse
      ch = format_string.charAt(chpos); // get next char to examine
      if (inquote) {
         if (ch == '"') {
            inquote = 0;
            thisformat.operators.push(scfn.commands.copy);
            thisformat.operands.push(quotestr);
            continue;
            }
         quotestr += ch;
         continue;
         }
      if (inbracket) {
         if (ch==']') {
            inbracket = 0;
            bracketdata=SocialCalc.FormatNumber.parse_format_bracket(bracketstr);
            if (bracketdata.operator==scfn.commands.separator) {
               sectioninfo.thousandssep = 1; // explicit [,]
               continue;
               }
            if (bracketdata.operator==scfn.commands.date) {
               sectioninfo.hasdate = 1;
               }
            if (bracketdata.operator==scfn.commands.comparison) {
               thisformat.hascomparison = 1;
               }
            thisformat.operators.push(bracketdata.operator);
            thisformat.operands.push(bracketdata.operand);
            continue;
            }
         bracketstr += ch;
         continue;
         }
      if (lastwasslash) {
         thisformat.operators.push(scfn.commands.copy);
         thisformat.operands.push(ch);
         lastwasslash=false;
         continue;
         }
      if (lastwasasterisk) {
         thisformat.operators.push(scfn.commands.copy);
         thisformat.operands.push(ch+ch+ch+ch+ch); // do 5 of them since no real tabs
         lastwasasterisk=false;
         continue;
         }
      if (lastwasunderscore) {
         thisformat.operators.push(scfn.commands.copy);
         thisformat.operands.push("&nbsp;");
         lastwasunderscore=false;
         continue;
         }
      if (ingeneral) {
         if ("general".charAt(ingeneral)==ch.toLowerCase()) {
            ingeneral++;
            if (ingeneral == 7) {
               thisformat.operators.push(scfn.commands.general);
               thisformat.operands.push(ch);
               ingeneral=0;
               }
            continue;
            }
         ingeneral = 0;
         }
      if (indate) { // last char was part of a date placeholder
         if (indate.charAt(0)==ch) { // another of the same char
            indate += ch; // accumulate it
            continue;
            }
         thisformat.operators.push(scfn.commands.date); // something else, save date info
         thisformat.operands.push(indate);
         sectioninfo.hasdate=1;
         indate = "";
         }
      if (ampmstr) {
         ampmstr += ch;
         part=ampmstr.toLowerCase();
         if (part!="am/pm".substring(0,part.length) && part!="a/p".substring(0,part.length)) {
            ampstr="";
            }
         else if (part=="am/pm" || part=="a/p") {
            thisformat.operators.push(scfn.commands.date);
            thisformat.operands.push(ampmstr);
            ampmstr = "";
            }
         continue;
         }
      if (ch=="#" || ch=="0" || ch=="?") { // placeholder
         if (integerpart) {
            sectioninfo.integerdigits++;
            if (sectioninfo.commas) { // comma inside of integer placeholders
               sectioninfo.thousandssep = 1; // any number is thousands separator
               sectioninfo.commas = 0; // reset count of "thousand" factors
               }
            lastwasinteger = 1;
            thisformat.operators.push(scfn.commands.integer_placeholder);
            thisformat.operands.push(ch);
            }
         else {
            sectioninfo.fractiondigits++;
            thisformat.operators.push(scfn.commands.fraction_placeholder);
            thisformat.operands.push(ch);
            }
         }
      else if (ch==".") { // decimal point
         lastwasinteger = 0;
         thisformat.operators.push(scfn.commands.decimal);
         thisformat.operands.push(ch);
         integerpart = 0;
         }
      else if (ch=='$') { // currency char
         lastwasinteger = 0;
         thisformat.operators.push(scfn.commands.currency);
         thisformat.operands.push(ch);
         }
      else if (ch==",") {
         if (lastwasinteger) {
            sectioninfo.commas++;
            }
         else {
            thisformat.operators.push(scfn.commands.copy);
            thisformat.operands.push(ch);
            }
         }
      else if (ch=="%") {
         lastwasinteger = 0;
         sectioninfo.percent++;
         thisformat.operators.push(scfn.commands.copy);
         thisformat.operands.push(ch);
         }
      else if (ch=='"') {
         lastwasinteger = 0;
         inquote = 1;
         quotestr = "";
         }
      else if (ch=='[') {
         lastwasinteger = 0;
         inbracket = 1;
         bracketstr = "";
         }
      else if (ch=='\\') {
         lastwasslash = 1;
         lastwasinteger = 0;
         }
      else if (ch=='*') {
         lastwasasterisk = 1;
         lastwasinteger = 0;
         }
      else if (ch=='_') {
         lastwasunderscore = 1;
         lastwasinteger = 0;
         }
      else if (ch==";") {
         section++; // start next section
         thisformat.sectioninfo[section] = {}; // create a new section
         sectioninfo = thisformat.sectioninfo[section]; // get reference to info for current section
         sectioninfo.sectionstart = 1 + thisformat.operators.length; // remember where it starts
         sectioninfo.integerdigits = 0; // number of integer-part placeholders
         sectioninfo.fractiondigits = 0; // fraction placeholders
         sectioninfo.commas = 0; // commas encountered, to handle scaling
         sectioninfo.percent = 0; // times to scale by 100
         integerpart = 1; // reset for new section
         lastwasinteger = 0;
         thisformat.operators.push(scfn.commands.section);
         thisformat.operands.push(ch);
         }
      else if (ch.toLowerCase()=="g") {
         ingeneral = 1;
         lastwasinteger = 0;
         }
      else if (ch.toLowerCase()=="a") {
         ampmstr = ch;
         lastwasinteger = 0;
         }
      else if ("dmyhHs".indexOf(ch)>=0) {
         indate = ch;
         }
      else {
         lastwasinteger = 0;
         thisformat.operators.push(scfn.commands.copy);
         thisformat.operands.push(ch);
         }
      }

   if (indate) { // last char was part of unsaved date placeholder
      thisformat.operators.push(scfn.commands.date);
      thisformat.operands.push(indate);
      sectioninfo.hasdate = 1;
      }

   return;

   }


/* *******************

 bracketdata = SocialCalc.FormatNumber.parse_format_bracket(bracketstr)

 Takes a bracket contents (e.g., "RED", ">10") and returns an operator and operand

 bracketdata->{}
    .operator
    .operand

************************* */

SocialCalc.FormatNumber.parse_format_bracket = function(bracketstr) {

   var scfn = SocialCalc.FormatNumber;
   var scc = SocialCalc.Constants;

   var bracketdata={};
   var parts;

   if (bracketstr.charAt(0)=='$') { // currency
      bracketdata.operator = scfn.commands.currency;
      parts=bracketstr.match(/^\$(.+?)(\-.+?){0,1}$/);
      if (parts) {
         bracketdata.operand = parts[1] || scc.FormatNumber_defaultCurrency || '$';
         }
      else {
         bracketdata.operand = bracketstr.substring(1) || scc.FormatNumber_defaultCurrency || '$';
         }
      }
   else if (bracketstr=='?$') {
      bracketdata.operator = scfn.commands.currency;
      bracketdata.operand = '[?$]';
      }
   else if (scfn.allowedcolors[bracketstr.toUpperCase()]) {
      bracketdata.operator = scfn.commands.color;
      bracketdata.operand = scfn.allowedcolors[bracketstr.toUpperCase()];
      }
   else if (parts=bracketstr.match(/^style=([^"]*)$/)) { // [style=...]
      bracketdata.operator = scfn.commands.style;
      bracketdata.operand = parts[1];
      }
   else if (bracketstr==",") {
      bracketdata.operator = scfn.commands.separator;
      bracketdata.operand = bracketstr;
      }
   else if (scfn.alloweddates[bracketstr.toUpperCase()]) {
      bracketdata.operator = scfn.commands.date;
      bracketdata.operand = scfn.alloweddates[bracketstr.toUpperCase()];
      }
   else if (parts=bracketstr.match(/^[<>=]/)) { // comparison operator
      parts=bracketstr.match(/^([<>=]+)(.+)$/); // split operator and value
      bracketdata.operator = scfn.commands.comparison;
      bracketdata.operand = parts[1]+":"+parts[2];
      }
   else { // unknown bracket
      bracketdata.operator = scfn.commands.copy;
      bracketdata.operand = "["+bracketstr+"]";
      }

   return bracketdata;

   }

/* *******************

 juliandate = SocialCalc.FormatNumber.convert_date_gregorian_to_julian(year, month, day)

 From: http://aa.usno.navy.mil/faq/docs/JD_Formula.html
 Uses: Fliegel, H. F. and van Flandern, T. C. (1968). Communications of the ACM, Vol. 11, No. 10 (October, 1968).
 Translated from the FORTRAN

      I= YEAR
      J= MONTH
      K= DAY
C
      JD= K-32075+1461*(I+4800+(J-14)/12)/4+367*(J-2-(J-14)/12*12)
     2    /12-3*((I+4900+(J-14)/12)/100)/4

************************* */

SocialCalc.FormatNumber.convert_date_gregorian_to_julian = function(year, month, day) {

   var juliandate;

   juliandate = day-32075+SocialCalc.intFunc(1461*(year+4800+SocialCalc.intFunc((month-14)/12))/4);
   juliandate += SocialCalc.intFunc(367*(month-2-SocialCalc.intFunc((month-14)/12)*12)/12);
   juliandate = juliandate - SocialCalc.intFunc(3*SocialCalc.intFunc((year+4900+SocialCalc.intFunc((month-14)/12))/100)/4);

   return juliandate;

   }


/* *******************

 ymd = SocialCalc.FormatNumber.convert_date_julian_to_gregorian(juliandate)

 ymd->{}
    .year
    .month
    .day

 From: http://aa.usno.navy.mil/faq/docs/JD_Formula.html
 Uses: Fliegel, H. F. and van Flandern, T. C. (1968). Communications of the ACM, Vol. 11, No. 10 (October, 1968).
 Translated from the FORTRAN

************************* */

SocialCalc.FormatNumber.convert_date_julian_to_gregorian = function(juliandate) {

   var L, N, I, J, K;

   L = juliandate+68569;
   N = Math.floor(4*L/146097);
   L = L-Math.floor((146097*N+3)/4);
   I = Math.floor(4000*(L+1)/1461001);
   L = L-Math.floor(1461*I/4)+31;
   J = Math.floor(80*L/2447);
   K = L-Math.floor(2447*J/80);
   L = Math.floor(J/11);
   J = J+2-12*L;
   I = 100*(N-49)+I+L;

   return {year:I, month:J, day:K};

   }

SocialCalc.intFunc = function(n) {
   if (n < 0) {
      return -Math.floor(-n);
      }
   else {
      return Math.floor(n);
      }
   }

