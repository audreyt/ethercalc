//
//
/*
// SocialCalc Spreadsheet Formula Library
//
// Part of the SocialCalc package
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
                                     // In any case, requires SocialCalc.Constants.

SocialCalc.Formula = {};
SocialCalc.TriggerIoAction = {}; // eddy

//
// Formula constants for parsing:
//

   SocialCalc.Formula.ParseState = {num: 1, alpha: 2, coord: 3, string: 4, stringquote: 5, numexp1: 6, numexp2: 7, alphanumeric: 8, specialvalue:9};

   SocialCalc.Formula.TokenType = {num: 1, coord: 2, op: 3, name: 4, error: 5, string: 6, space: 7};

   SocialCalc.Formula.CharClass = {num: 1, numstart: 2, op: 3, eof: 4, alpha: 5, incoord: 6, error: 7, quote: 8, space: 9, specialstart: 10};
 
   SocialCalc.Formula.CharClassTable = {
      " ": 9, "!": 3, '"': 8, "'": 8, "#": 10, "$":6, "%":3, "&":3, "(": 3, ")": 3, "*": 3, "+": 3, ",": 3, "-": 3, ".": 2, "/": 3,
       "0": 1, "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 1, "7": 1, "8": 1, "9": 1,
       ":": 3, "<": 3, "=": 3, ">": 3,
       "A": 5, "B": 5, "C": 5, "D": 5, "E": 5, "F": 5, "G": 5, "H": 5, "I": 5, "J": 5, "K": 5, "L": 5, "M": 5, "N": 5,
       "O": 5, "P": 5, "Q": 5, "R": 5, "S": 5, "T": 5, "U": 5, "V": 5, "W": 5, "X": 5, "Y": 5, "Z": 5,
       "^": 3, "_": 5,
       "a": 5, "b": 5, "c": 5, "d": 5, "e": 5, "f": 5, "g": 5, "h": 5, "i": 5, "j": 5, "k": 5, "l": 5, "m": 5, "n": 5,
       "o": 5, "p": 5, "q": 5, "r": 5, "s": 5, "t": 5, "u": 5, "v": 5, "w": 5, "x": 5, "y": 5, "z": 5
       };

   SocialCalc.Formula.UpperCaseTable = {
       "a": "A", "b": "B", "c": "C", "d": "D", "e": "E", "f": "F", "g": "G", "h": "H", "i": "I", "j": "J", "k": "K", "l": "L", "m": "M",
       "n": "N", "o": "O", "p": "P", "q": "Q", "r": "R", "s": "S", "t": "T", "u": "U", "v": "V", "w": "W", "x": "X", "y": "Y", "z": "Z",
       "A": "A", "B": "B", "C": "C", "D": "D", "E": "E", "F": "F", "G": "G", "H": "H", "I": "I", "J": "J", "K": "K", "L": "L", "M": "M",
       "N": "N", "O": "O", "P": "P", "Q": "Q", "R": "R", "S": "S", "T": "T", "U": "U", "V": "V", "W": "W", "X": "X", "Y": "Y", "Z": "Z"
       }

   SocialCalc.Formula.SpecialConstants = { // names that turn into constants for name lookup
      "#NULL!": "0,e#NULL!", "#NUM!": "0,e#NUM!", "#DIV/0!": "0,e#DIV/0!", "#VALUE!": "0,e#VALUE!",
      "#REF!": "0,e#REF!", "#NAME?": "0,e#NAME?"};


   // Operator Precedence table
   //
   // 1- !, 2- : ,, 3- M P, 4- %, 5- ^, 6- * /, 7- + -, 8- &, 9- < > = G(>=) L(<=) N(<>),
   // Negative value means Right Associative

   SocialCalc.Formula.TokenPrecedence = {
      "!": 1,
      ":": 2, ",": 2,
      "M": -3, "P": -3,
      "%": 4,
      "^": 5,
      "*": 6, "/": 6,
      "+": 7, "-": 7,
      "&": 8,
      "<": 9, ">": 9, "G": 9, "L": 9, "N": 9
      };

   // Convert one-char token text to input text:

   SocialCalc.Formula.TokenOpExpansion = {'G': '>=', 'L': '<=', 'M': '-', 'N': '<>', 'P': '+'};

   //
   // Information about the resulting value types when doing operations on values (used by LookupResultType)
   //
   // Each object entry is an object with specific types with result type info as follows:
   //
   //    'type1a': '|type2a:resulta|type2b:resultb|...
   //    Type of t* or n* matches any of those types not listed
   //    Results may be a type or the numbers 1 or 2 specifying to return type1 or type2
   

   SocialCalc.Formula.TypeLookupTable = {
       unaryminus: { 'n*': '|n*:1|', 'e*': '|e*:1|', 't*': '|t*:e#VALUE!|', 'b': '|b:n|'},
       unaryplus: { 'n*': '|n*:1|', 'e*': '|e*:1|', 't*': '|t*:e#VALUE!|', 'b': '|b:n|'},
       unarypercent: { 'n*': '|n:n%|n*:n|', 'e*': '|e*:1|', 't*': '|t*:e#VALUE!|', 'b': '|b:n|'},
       plus: {
                'n%': '|n%:n%|nd:n|nt:n|ndt:n|n$:n|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|',
                'nd': '|n%:n|nd:nd|nt:ndt|ndt:ndt|n$:n|n:nd|n*:n|b:n|e*:2|t*:e#VALUE!|',
                'nt': '|n%:n|nd:ndt|nt:nt|ndt:ndt|n$:n|n:nt|n*:n|b:n|e*:2|t*:e#VALUE!|',
                'ndt': '|n%:n|nd:ndt|nt:ndt|ndt:ndt|n$:n|n:ndt|n*:n|b:n|e*:2|t*:e#VALUE!|',
                'n$': '|n%:n|nd:n|nt:n|ndt:n|n$:n$|n:n$|n*:n|b:n|e*:2|t*:e#VALUE!|',
                'nl': '|n%:n|nd:n|nt:n|ndt:n|n$:n|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|',
                'n': '|n%:n|nd:nd|nt:nt|ndt:ndt|n$:n$|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|',
                'b': '|n%:n%|nd:nd|nt:nt|ndt:ndt|n$:n$|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|',
                't*': '|n*:e#VALUE!|t*:e#VALUE!|b:e#VALUE!|e*:2|',
                'e*': '|e*:1|n*:1|t*:1|b:1|'
               },
       concat: {
                't': '|t:t|th:th|tw:tw|tl:t|tr:tr|t*:2|e*:2|',
                'th': '|t:th|th:th|tw:t|tl:th|tr:t|t*:t|e*:2|',
                'tw': '|t:tw|th:t|tw:tw|tl:tw|tr:tw|t*:t|e*:2|',
                'tl': '|t:tl|th:th|tw:tw|tl:tl|tr:tr|t*:t|e*:2|',
                't*': '|t*:t|e*:2|',
                'e*': '|e*:1|n*:1|t*:1|'
               },
       oneargnumeric: { 'n*': '|n*:n|', 'e*': '|e*:1|', 't*': '|t*:e#VALUE!|', 'b': '|b:n|'},
       twoargnumeric: { 'n*': '|n*:n|t*:e#VALUE!|e*:2|', 'e*': '|e*:1|n*:1|t*:1|', 't*': '|t*:e#VALUE!|n*:e#VALUE!|e*:2|'},
       propagateerror: { 'n*': '|n*:2|e*:2|', 'e*': '|e*:2|', 't*': '|t*:2|e*:2|', 'b': '|b:2|e*:2|'}
      };

/* *******************

 parseinfo = SocialCalc.Formula.ParseFormulaIntoTokens(line)

 Parses a text string as if it was a spreadsheet formula

 This uses a simple state machine run on each character in turn.
 States remember whether a number is being gathered, etc.
 The result is parseinfo which is an array with one entry for each token:
   parseinfo[i] = {
     text: "the characters making up the parsed token",
     type: the type of the token (a number),
     opcode: a single character version of an operator suitable for use in the
                  precedence table and distinguishing between unary and binary + and -.

************************* */

SocialCalc.Formula.ParseFormulaIntoTokens = function(line) {

   var i, ch, cclass, haddecimal, last_token, last_token_type, last_token_text, t;

   var scf = SocialCalc.Formula;
   var scc = SocialCalc.Constants;
   var parsestate = scf.ParseState;
   var tokentype = scf.TokenType;
   var charclass = scf.CharClass;
   var charclasstable = scf.CharClassTable;
   var uppercasetable = scf.UpperCaseTable; // much faster than toUpperCase function
   var pushtoken = scf.ParsePushToken;
   var coordregex = /^\$?[A-Z]{1,2}\$?[1-9]\d*$/i;

   var parseinfo = [];
   var str = "";
   var state = 0;
   var haddecimal = false;

  for (i=0; i<=line.length; i++) {
      if (i<line.length) {
         ch = line.charAt(i);
         cclass = charclasstable[ch];
         }
      else {
         ch = "";
         cclass = charclass.eof;
         }

      if (state == parsestate.num) {
         if (cclass == charclass.num) {
            str += ch;
            }
         else if (cclass == charclass.numstart && !haddecimal) {
            haddecimal = true;
            str += ch;
            }
         else if (ch == "E" || ch == "e") {
            str += ch;
            haddecimal = false;
            state = parsestate.numexp1;
            }
         else { // end of number - save it
            pushtoken(parseinfo, str, tokentype.num, 0);
            haddecimal = false;
            state = 0;
            }
         }

      if (state == parsestate.numexp1) {
         if (cclass == parsestate.num) {
            state = parsestate.numexp2;
            }
         else if ((ch == '+' || ch == '-') && (uppercasetable[str.charAt(str.length-1)] == 'E')) {
            str += ch;
            }
         else if (ch == 'E' || ch == 'e') {
            ;
            }
         else {
            pushtoken(parseinfo, scc.s_parseerrexponent, tokentype.error, 0);
            state = 0;
            }
         }

      if (state == parsestate.numexp2) {
         if (cclass == charclass.num) {
            str += ch;
            }
         else { // end of number - save it
            pushtoken(parseinfo, str, tokentype.num, 0);
            state = 0;
            }
         }

      if (state == parsestate.alpha) {
         if (cclass == charclass.num) {
            state = parsestate.coord;
            }
         else if (cclass == charclass.alpha || ch == ".") { // alpha may be letters, numbers, "_", or "."
            str += ch;
            }
         else if (cclass == charclass.incoord) {
            state = parsestate.coord;
            }
         else if (cclass == charclass.op || cclass == charclass.numstart
                || cclass == charclass.space || cclass == charclass.eof) {
            pushtoken(parseinfo, str.toUpperCase(), tokentype.name, 0);
            state = 0;
            }
         else {
            pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
            state = 0;
            }
         }

      if (state == parsestate.coord) {
         if (cclass == charclass.num) {
            str += ch;
            }
         else if (cclass == charclass.incoord) {
            str += ch;
            }
         else if (cclass == charclass.alpha) {
            state = parsestate.alphanumeric;
            }
         else if (cclass == charclass.op || cclass == charclass.numstart ||
                  cclass == charclass.eof || cclass == charclass.space) {
            if (coordregex.test(str)) {
               t = tokentype.coord;
               }
            else {
               t = tokentype.name;
               }
            pushtoken(parseinfo, str.toUpperCase(), t, 0);
            state = 0;
            }
         else {
            pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
            state = 0;
           }
         }


      if (state == parsestate.alphanumeric) {
         if (cclass == charclass.num || cclass == charclass.alpha) {
            str += ch;
            }
         else if (cclass == charclass.op || cclass == charclass.numstart
                || cclass == charclass.space || cclass == charclass.eof) {
            pushtoken(parseinfo, str.toUpperCase(), tokentype.name, 0);
            state = 0;
            }
         else {
            pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
            state = 0;
            }
         }

      if (state == parsestate.string) {
         if (cclass == charclass.quote) {
            state = parsestate.stringquote; // got quote in string: is it doubled (quote in string) or by itself (end of string)?
            }
         else if (cclass == charclass.eof) {
            pushtoken(parseinfo, scc.s_parseerrstring, tokentype.error, 0);
            state = 0;
            }
         else {
            str += ch;
            }
         }
      else if (state == parsestate.stringquote) { // note else if here
         if (cclass == charclass.quote) {
            str += ch;
            state = parsestate.string; // double quote: add one then continue getting string
            }
         else { // something else -- end of string
            pushtoken(parseinfo, str, tokentype.string, 0);
            state = 0; // drop through to process
            }
         }

      else if (state == parsestate.specialvalue) { // special values like #REF!
         if (str.charAt(str.length-1) == "!") { // done - save value as a name
            pushtoken(parseinfo, str, tokentype.name, 0);
            state = 0; // drop through to process
            }
         else if (cclass == charclass.eof) {
            pushtoken(parseinfo, scc.s_parseerrspecialvalue, tokentype.error, 0);
            state = 0;
            }
         else {
            str += ch;
            }
         }

      if (state == 0) {
         if (cclass == charclass.num) {
            str = ch;
            state = parsestate.num;
            }
         else if (cclass == charclass.numstart) {
            str = ch;
            haddecimal = true;
            state = parsestate.num;
            }
         else if (cclass == charclass.alpha || cclass == charclass.incoord) {
            str = ch;
            state = parsestate.alpha;
            }
         else if (cclass == charclass.specialstart) {
            str = ch;
            state = parsestate.specialvalue;
            }
         else if (cclass == charclass.op) {
            str = ch;
            if (parseinfo.length>0) {
               last_token = parseinfo[parseinfo.length-1];
               last_token_type = last_token.type;
               last_token_text = last_token.text;
               if (last_token_type == charclass.op) {
                  if (last_token_text == '<' || last_token_text == ">") {
                     str = last_token_text + str;
                     parseinfo.pop();
                     if (parseinfo.length>0) {
                        last_token = parseinfo[parseinfo.length-1];
                        last_token_type = last_token.type;
                        last_token_text = last_token.text;
                        }
                     else {
                        last_token_type = charclass.eof;
                        last_token_text = "EOF";
                        }
                     }
                  }
               }
            else {
               last_token_type = charclass.eof;
               last_token_text = "EOF";
               }
            t = tokentype.op;
            if ((parseinfo.length == 0)
                || (last_token_type == charclass.op && last_token_text != ')' && last_token_text != '%')) { // Unary operator
               if (str == '-') { // M is unary minus
                  str = "M";
                  ch = "M";
                  }
               else if (str == '+') { // P is unary plus
                  str = "P";
                  ch = "P";
                  }
               else if (str == ')' && last_token_text == '(') { // null arg list OK
                  ;
                  }
               else if (str != '(') { // binary-op open-paren OK, others no
                  t = tokentype.error;
                  str = scc.s_parseerrtwoops;
                  }
               }
            else if (str.length > 1) {
               if (str == '>=') { // G is >=
                  str = "G";
                  ch = "G";
                  }
               else if (str == '<=') { // L is <=
                  str = "L";
                  ch = "L";
                  }
               else if (str == '<>') { // N is <>
                  str = "N";
                  ch = "N";
                  }
               else {
                  t = tokentype.error;
                  str = scc.s_parseerrtwoops;
                  }
               }
            pushtoken(parseinfo, str, t, ch);
            state = 0;
            }
         else if (cclass == charclass.quote) { // starting a string
            str = "";
            state = parsestate.string;
            }
         else if (cclass == charclass.space) { // store so can reconstruct spacing
            //pushtoken(parseinfo, " ", tokentype.space, 0);
            }
         else if (cclass == charclass.eof) { // ignore -- needed to have extra loop to close out other things
            }
         else { // unknown class - such as unknown char
            pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
            }
         }
      }

   return parseinfo;

   }

SocialCalc.Formula.ParsePushToken = function(parseinfo, ttext, ttype, topcode) {

   parseinfo.push({text: ttext, type: ttype, opcode: topcode});

   }

/* *******************

 result = SocialCalc.Formula.evaluate_parsed_formula(parseinfo, sheet, allowrangereturn)

 Does the calculation expressed in a parsed formula, returning a value, its type, and error info
 returns: {value: value, type: valuetype, error: errortext}.

 If allowrangereturn is present and true, can return a range (e.g., "A1:A10" - translated from "A1|A10|")

************************* */

SocialCalc.Formula.evaluate_parsed_formula = function(parseinfo, sheet, allowrangereturn) {

   var result;

   var scf = SocialCalc.Formula;
   var tokentype = scf.TokenType;

   var revpolish;
   var parsestack = [];

   var errortext = "";

   revpolish = scf.ConvertInfixToPolish(parseinfo); // result is either an array or a string with error text

   result = scf.EvaluatePolish(parseinfo, revpolish, sheet, allowrangereturn);

   return result;

}

//
// revpolish = SocialCalc.Formula.ConvertInfixToPolish(parseinfo)
//
// Convert infix to reverse polish notation
//
// Returns revpolish array with a sequence of references to tokens by number if successful.
// Errors return a string with the error.
//
// Based upon the algorithm shown in Wikipedia "Reverse Polish notation" article
// and then enhanced for additional spreadsheet things
//

SocialCalc.Formula.ConvertInfixToPolish = function(parseinfo) {

   var scf = SocialCalc.Formula;
   var scc = SocialCalc.Constants;
   var tokentype = scf.TokenType;
   var token_precedence = scf.TokenPrecedence;

   var revpolish = [];
   var parsestack = [];

   var errortext = "";

   var function_start = -1;

   var i, pii, ttype, ttext, tprecedence, tstackprecedence;

   for (i=0; i<parseinfo.length; i++) {
      pii = parseinfo[i];
      ttype = pii.type;
      ttext = pii.text;
      if (ttype == tokentype.num || ttype == tokentype.coord || ttype == tokentype.string) {
         revpolish.push(i);
         }
      else if (ttype == tokentype.name) {
         parsestack.push(i);
         revpolish.push(function_start);
         }
      else if (ttype == tokentype.space) { // ignore
         continue;
         }
      else if (ttext == ',') {
         while (parsestack.length && parseinfo[parsestack[parsestack.length-1]].text != "(") {
            revpolish.push(parsestack.pop());
            }
         if (parsestack.length == 0) { // no ( -- error
            errortext = scc.s_parseerrmissingopenparen;
            break;
            }
         }
      else if (ttext == '(') {
         parsestack.push(i);
         }
      else if (ttext == ')') {
         while (parsestack.length && parseinfo[parsestack[parsestack.length-1]].text != "(") {
            revpolish.push(parsestack.pop());
            }
         if (parsestack.length == 0) { // no ( -- error
            errortext = scc.s_parseerrcloseparennoopen;
            break;
            }
         parsestack.pop();
         if (parsestack.length && parseinfo[parsestack[parsestack.length-1]].type == tokentype.name) {
            revpolish.push(parsestack.pop());
            }
         }
      else if (ttype == tokentype.op) {
         if (parsestack.length && parseinfo[parsestack[parsestack.length-1]].type == tokentype.name) {
            revpolish.push(parsestack.pop());
            }
         while (parsestack.length && parseinfo[parsestack[parsestack.length-1]].type == tokentype.op
                && parseinfo[parsestack[parsestack.length-1]].text != '(') {
            tprecedence = token_precedence[pii.opcode];
            tstackprecedence = token_precedence[parseinfo[parsestack[parsestack.length-1]].opcode];
            if (tprecedence >= 0 && tprecedence < tstackprecedence) {
               break;
               }
            else if (tprecedence < 0) {
               tprecedence = -tprecedence;
               if (tstackprecedence < 0) tstackprecedence = -tstackprecedence;
               if (tprecedence <= tstackprecedence) {
                  break;
                  }
               }
            revpolish.push(parsestack.pop());
            }
         parsestack.push(i);
         }
      else if (ttype == tokentype.error) {
         errortext = ttext;
         break;
         }
      else {
         errortext = "Internal error while processing parsed formula. ";
         break;
         }
      }
   while (parsestack.length>0) {
      if (parseinfo[parsestack[parsestack.length-1]].text == '(') {
         errortext = scc.s_parseerrmissingcloseparen;
         break;
         }
      revpolish.push(parsestack.pop());
      }

   if (errortext) {
      return errortext;
      }

   return revpolish;

   }


// DebugLog
// display logged objects in the audit tab of the spreadsheet control
if(typeof SocialCalc.debug_log === 'undefined') SocialCalc.debug_log = [];

SocialCalc.DebugLog = function(logObject) {	
//	SocialCalc.debug_log.push(logObject);
}


//
// result = SocialCalc.Formula.EvaluatePolish(parseinfo, revpolish, sheet, allowrangereturn)
//
// Execute reverse polish representation of formula
//
// Operand values are objects in the operand array with a "type" and an optional "value".
// Type can have these values (many are type and sub-type as two or more letters):
//    "tw", "th", "t", "n", "nt", "coord", "range", "start", "eErrorType", "b" (blank)
// The value of a coord is in the form A57 or A57!sheetname
// The value of a range is coord|coord|number where number starts at 0 and is
// the offset of the next item to fetch if you are going through the range one by one
// The number starts as a null string ("A1|B3|")
//

SocialCalc.Formula.EvaluatePolish = function(parseinfo, revpolish, sheet, allowrangereturn) {

   var scf = SocialCalc.Formula;
   var scc = SocialCalc.Constants;
   var tokentype = scf.TokenType;
   var lookup_result_type = scf.LookupResultType;
   var typelookup = scf.TypeLookupTable;
   var operand_as_number = scf.OperandAsNumber;
   var operand_as_text = scf.OperandAsText;
   var operand_value_and_type = scf.OperandValueAndType;
   var operands_as_coord_on_sheet = scf.OperandsAsCoordOnSheet;
   var format_number_for_display = SocialCalc.format_number_for_display || function(v, t, f) {return v+"";};

   var errortext = "";
   var function_start = -1;
   var missingOperandError = {value: "", type: "e#VALUE!", error: scc.s_parseerrmissingoperand};

   var operand = [];
   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   var i, rii, prii, ttype, ttext, value1, value2, tostype, tostype2, resulttype, valuetype, cond, vmatch, smatch;

   if (!parseinfo.length || (! (revpolish instanceof Array))) {
      return ({value: "", type: "e#VALUE!", error: (typeof revpolish == "string" ? revpolish : "")});
      }

	  
	  // eddy EvaluatePolish { 
    //    SocialCalc.DebugLog({ revpolish: revpolish});
    //    SocialCalc.DebugLog({ revpolish: revpolish});
	  // }

	// eddy EvaluatePolish {
	
	// e.g parameterInfo: [ {'text':'E1','type':2,'opcode':0}, ... ] 
    var parameterInfo = [];
    // }	
	  
	  
   for (i=0; i<revpolish.length; i++) {
      rii = revpolish[i];
      if (rii == function_start) { // Remember the start of a function argument list
         PushOperand("start", 0);
         continue;
         }

      prii = parseinfo[rii];
      ttype = prii.type;
      ttext = prii.text;
	  // eddy EvaluatePolish {
	  parameterInfo.push(prii);
	  // }
	  
      if (ttype == tokentype.num) {
         PushOperand("n", ttext-0);
         }

      else if (ttype == tokentype.coord) {
         PushOperand("coord", ttext);
		 
         }

      else if (ttype == tokentype.string) {
         PushOperand("t", ttext);
         }

      else if (ttype == tokentype.op) {
         if (operand.length <= 0) { // Nothing on the stack...
            return missingOperandError;
            break; // done
            }

         // Unary minus

         if (ttext == 'M') {
            value1 = operand_as_number(sheet, operand);
            resulttype = lookup_result_type(value1.type, value1.type, typelookup.unaryminus);
            PushOperand(resulttype, -value1.value);
            }

         // Unary plus

         else if (ttext == 'P') {
            value1 = operand_as_number(sheet, operand);
            resulttype = lookup_result_type(value1.type, value1.type, typelookup.unaryplus);
            PushOperand(resulttype, value1.value);
            }

         // Unary % - percent, left associative

         else if (ttext == '%') {
            value1 = operand_as_number(sheet, operand);
            resulttype = lookup_result_type(value1.type, value1.type, typelookup.unarypercent);
            PushOperand(resulttype, 0.01*value1.value);
            }

         // & - string concatenate

         else if (ttext == '&') {
            if (operand.length <= 1) { // Need at least two things on the stack...
               return missingOperandError;
               }
            value2 = operand_as_text(sheet, operand);
            value1 = operand_as_text(sheet, operand);
            resulttype = lookup_result_type(value1.type, value1.type, typelookup.concat);
            PushOperand(resulttype, value1.value + value2.value);
            }

         // : - Range constructor

         else if (ttext == ':') {
            if (operand.length <= 1) { // Need at least two things on the stack...
               return missingOperandError;
               }
            value1 = scf.OperandsAsRangeOnSheet(sheet, operand); // get coords even if use name on other sheet
            if (value1.error) { // not available
               errortext = errortext || value1.error;
               }
            PushOperand(value1.type, value1.value); // push sheetname with range on that sheet
            }

         // ! - sheetname!coord

         else if (ttext == '!') {
            if (operand.length <= 1) { // Need at least two things on the stack...
               return missingOperandError;
               }
            value1 = operands_as_coord_on_sheet(sheet, operand); // get coord even if name on other sheet
            if (value1.error) { // not available
               errortext = errortext || value1.error;
               }
            PushOperand(value1.type, value1.value); // push sheetname with coord or range on that sheet
            }

         // Comparison operators: < L = G > N (< <= = >= > <>)

         else if (ttext == "<" || ttext == "L" || ttext == "=" || ttext == "G" || ttext == ">" || ttext == "N") {
            if (operand.length <= 1) { // Need at least two things on the stack...
               errortext = scc.s_parseerrmissingoperand; // remember error
               break;
               }
            value2 = operand_value_and_type(sheet, operand);
            value1 = operand_value_and_type(sheet, operand);
            if (value1.type.charAt(0) == "n" && value2.type.charAt(0) == "n") { // compare two numbers
               cond = 0;
               if (ttext == "<") { cond = value1.value < value2.value ? 1 : 0; }
               else if (ttext == "L") { cond = value1.value <= value2.value ? 1 : 0; }
               else if (ttext == "=") { cond = value1.value == value2.value ? 1 : 0; }
               else if (ttext == "G") { cond = value1.value >= value2.value ? 1 : 0; }
               else if (ttext == ">") { cond = value1.value > value2.value ? 1 : 0; }
               else if (ttext == "N") { cond = value1.value != value2.value ? 1 : 0; }
               PushOperand("nl", cond);
               }
            else if (value1.type.charAt(0) == "e") { // error on left
               PushOperand(value1.type, 0);
               }               
            else if (value2.type.charAt(0) == "e") { // error on right
               PushOperand(value2.type, 0);
               }               
            else { // text maybe mixed with numbers or blank
               tostype = value1.type.charAt(0);
               tostype2 = value2.type.charAt(0);
               if (tostype == "n") {
                  value1.value = format_number_for_display(value1.value, "n", "");
                  }
               else if (tostype == "b") {
                  value1.value = "";
                  }
               if (tostype2 == "n") {
                  value2.value = format_number_for_display(value2.value, "n", "");
                  }
               else if (tostype2 == "b") {
                  value2.value = "";
                  }
               cond = 0;
               value1.value = value1.value.toLowerCase(); // ignore case
               value2.value = value2.value.toLowerCase();
               if (ttext == "<") { cond = value1.value < value2.value ? 1 : 0; }
               else if (ttext == "L") { cond = value1.value <= value2.value ? 1 : 0; }
               else if (ttext == "=") { cond = value1.value == value2.value ? 1 : 0; }
               else if (ttext == "G") { cond = value1.value >= value2.value ? 1 : 0; }
               else if (ttext == ">") { cond = value1.value > value2.value ? 1 : 0; }
               else if (ttext == "N") { cond = value1.value != value2.value ? 1 : 0; }
               PushOperand("nl", cond);
               }
            }

         // Normal infix arithmethic operators: +, -. *, /, ^

         else { // what's left are the normal infix arithmetic operators
            if (operand.length <= 1) { // Need at least two things on the stack...
               errortext = scc.s_parseerrmissingoperand; // remember error
               break;
               }
            value2 = operand_as_number(sheet, operand);
            value1 = operand_as_number(sheet, operand);
            if (ttext == '+') {
               resulttype = lookup_result_type(value1.type, value2.type, typelookup.plus);
               PushOperand(resulttype, value1.value + value2.value);
               }
            else if (ttext == '-') {
               resulttype = lookup_result_type(value1.type, value2.type, typelookup.plus);
               PushOperand(resulttype, value1.value - value2.value);
               }
            else if (ttext == '*') {
               resulttype = lookup_result_type(value1.type, value2.type, typelookup.plus);
               PushOperand(resulttype, value1.value * value2.value);
               }
            else if (ttext == '/') {
               if (value2.value != 0) {
                  PushOperand("n", value1.value / value2.value); // gives plain numeric result type
                  }
               else {
                  PushOperand("e#DIV/0!", 0);
                  }
               }
            else if (ttext == '^') {
               value1.value = Math.pow(value1.value, value2.value);
               value1.type = "n"; // gives plain numeric result type
               if (isNaN(value1.value)) {
                  value1.value = 0;
                  value1.type = "e#NUM!";
                  }
               PushOperand(value1.type, value1.value);
               }
            }
         }

      // function or name

      else if (ttype == tokentype.name) {
	  
//         errortext = scf.CalculateFunction(ttext, operand, sheet);
         errortext = scf.CalculateFunction(ttext, operand, sheet, parseinfo.coord); // eddy also pass the cell id
		 
         if (errortext) break;
		 
		 
         }

		 
      else {
         errortext = scc.s_InternalError+"Unknown token "+ttype+" ("+ttext+"). ";
         break;
         }
      }

   // look at final value and handle special cases

   value = operand[0] ? operand[0].value : "";
   tostype = operand[0] ? operand[0].type : "";

   if (tostype == "name") { // name - expand it
      value1 = SocialCalc.Formula.LookupName(sheet, value);
      value = value1.value;
      tostype = value1.type;
      errortext = errortext || value1.error;
      }

   if (tostype == "coord") { // the value is a coord reference, get its value and type
      value1 = operand_value_and_type(sheet, operand);
      value = value1.value;
      tostype = value1.type;
      if (tostype == "b") {
         tostype = "n";
         value = 0;
         }
      }

   if (operand.length > 1 && !errortext) { // something left - error
      errortext += scc.s_parseerrerrorinformula;
      }

   // set return type

   valuetype = tostype;

   if (tostype.charAt(0) == "e") { // error value
      errortext = errortext || tostype.substring(1) || scc.s_calcerrerrorvalueinformula;
      }
   else if (tostype == "range") {
      vmatch = value.match(/^(.*)\|(.*)\|/);
      smatch = vmatch[1].indexOf("!");
      if (smatch>=0) { // swap sheetname
         vmatch[1] = vmatch[1].substring(smatch+1) + "!" + vmatch[1].substring(0, smatch).toUpperCase();
         }
      else {
         vmatch[1] = vmatch[1].toUpperCase();
         }
      value = vmatch[1] + ":" + vmatch[2].toUpperCase();
      if (!allowrangereturn) {
         errortext = scc.s_formularangeresult+" "+value;
         }
      }

   if (errortext && valuetype.charAt(0) != "e") {
      value = errortext;
      valuetype = "e";
     }

   // look for overflow

   if (valuetype.charAt(0) == "n" && (isNaN(value) || !isFinite(value))) {
      value = 0;
      valuetype = "e#NUM!";
      errortext = isNaN(value) ? scc.s_calcerrnumericnan: scc.s_calcerrnumericoverflow;
      }

   return ({value: value, type: valuetype, error: errortext});

   }


/*
#
# resulttype = SocialCalc.Formula.LookupResultType(type1, type2, typelookup);
#
# typelookup has values of the following form:
#
#    typelookup{"typespec1"} = "|typespec2A:resultA|typespec2B:resultB|..."
#
# First type1 is looked up. If no match, then the first letter (major type) of type1 plus "*" is looked up
# resulttype is type1 if result is "1", type2 if result is "2", otherwise the value of result.
#
*/

SocialCalc.Formula.LookupResultType = function(type1, type2, typelookup) {

   var pos1, pos2, result;

   var table1 = typelookup[type1];

   if (!table1) {
      table1 = typelookup[type1.charAt(0)+'*'];
      if (!table1) {
         return "e#VALUE! (internal error, missing LookupResultType "+type1.charAt(0)+"*)"; // missing from table -- please add it
         }
      }
   pos1 = table1.indexOf("|"+type2+":");
   if (pos1 >= 0) {
      pos2 = table1.indexOf("|", pos1+1);
      if (pos2<0) return "e#VALUE! (internal error, incorrect LookupResultType "+table1+")";
      result = table1.substring(pos1+type2.length+2, pos2);
      if (result == "1") return type1;
      if (result == "2") return type2;
      return result;
      }
   pos1 = table1.indexOf("|"+type2.charAt(0)+"*:");
   if (pos1 >= 0) {
      pos2 = table1.indexOf("|", pos1+1);
      if (pos2<0) return "e#VALUE! (internal error, incorrect LookupResultType "+table1+")";
      result = table1.substring(pos1+4, pos2);
      if (result == "1") return type1;
      if (result == "2") return type2;
      return result;
      }
   return "e#VALUE!";

   }

/*
#
# operandinfo = SocialCalc.Formula.TopOfStackValueAndType(sheet, operand)
#
# Returns top of stack value and type and then pops the stack.
# The result is {value: value, type: type, error: "only if bad error"}
#
*/

SocialCalc.Formula.TopOfStackValueAndType = function(sheet, operand) {

   var cellvtype, cell, pos, coordsheet;
   var scf = SocialCalc.Formula;

   var result = {type: "", value: ""};

   var stacklen = operand.length;

   if (!stacklen) { // make sure something is there
      result.error = SocialCalc.Constants.s_InternalError+"no operand on stack";
      return result;
      }

   result.value = operand[stacklen-1].value; // get top of stack
   result.type = operand[stacklen-1].type;
   operand.pop(); // we have data - pop stack

   if (result.type == "name") {
      result = scf.LookupName(sheet, result.value);
      }

   return result;

   }


/*
#
# operandinfo = OperandAsNumber(sheet, operand)
#
# Uses operand_value_and_type to get top of stack and pops it.
# Returns numeric value and type.
# Text values are treated as 0 if they can't be converted somehow.
#
*/

SocialCalc.Formula.OperandAsNumber = function(sheet, operand) {

   var t, valueinfo;
   var operandinfo = SocialCalc.Formula.OperandValueAndType(sheet, operand);

   t = operandinfo.type.charAt(0);

   if (t == "n") {
      operandinfo.value = operandinfo.value-0;
      }
   else if (t == "b") { // blank cell
      operandinfo.type = "n";
      operandinfo.value = 0;
      }
   else if (t == "e") { // error
      operandinfo.value = 0;
      }
   else {
      valueinfo = SocialCalc.DetermineValueType ? SocialCalc.DetermineValueType(operandinfo.value) :
                                                    {value: operandinfo.value-0, type: "n"}; // if without rest of SocialCalc
      if (valueinfo.type.charAt(0) == "n") {
         operandinfo.value = valueinfo.value-0;
         operandinfo.type = valueinfo.type;
         }
      else {
         operandinfo.value = 0;
         operandinfo.type = valueinfo.type;
         }
      }

   return operandinfo;

   }

/*
#
# operandinfo = OperandAsText(sheet, operand)
#
# Uses operand_value_and_type to get top of stack and pops it.
# Returns text value, preserving sub-type.
#
*/

SocialCalc.Formula.OperandAsText = function(sheet, operand) {

   var t, valueinfo;
   var operandinfo = SocialCalc.Formula.OperandValueAndType(sheet, operand);

   t = operandinfo.type.charAt(0);

   if (t ==  "t") { // any flavor of text returns as is
      ;
      }
   else if (t == "n") {
      operandinfo.value = SocialCalc.format_number_for_display ?
                             SocialCalc.format_number_for_display(operandinfo.value, operandinfo.type, "") :
                             operandinfo.value = operandinfo.value+"";
      operandinfo.type = "t";
      }
   else if (t == "b") { // blank
      operandinfo.value = "";
      operandinfo.type = "t";
      }
   else if (t == "e") { // error
      operandinfo.value = "";
      }
   else {
      operand.value = operandinfo.value + "";
      operand.type = "t";
      }

   return operandinfo;

   }

/*
#
# result = SocialCalc.Formula.OperandValueAndType(sheet, operand)
#
# Pops the top of stack and returns it, following a coord reference if necessary.
# The result is {value: value, type: type, error: "only if bad error"}
# Ranges are returned as if they were pushed onto the stack first coord first
# Also sets type with "t", "n", "th", etc., as appropriate
#
*/

SocialCalc.Formula.OperandValueAndType = function(sheet, operand) {

   var cellvtype, cell, pos, coordsheet;
   var scf = SocialCalc.Formula;

   var result = {type: "", value: ""};

   var stacklen = operand.length;

   if (!stacklen) { // make sure something is there
      result.error = SocialCalc.Constants.s_InternalError+"no operand on stack";
      return result;
      }

   result.value = operand[stacklen-1].value; // get top of stack
   result.type = operand[stacklen-1].type;
   operand.pop(); // we have data - pop stack

   if (result.type == "name") {
      result = scf.LookupName(sheet, result.value);
      }

   if (result.type == "range") {
      result = scf.StepThroughRangeDown(operand, result.value);
      }

   if (result.type == "coord") { // value is a coord reference
      coordsheet = sheet;
      pos = result.value.indexOf("!");
      if (pos != -1) { // sheet reference
         coordsheet = scf.FindInSheetCache(result.value.substring(pos+1)); // get other sheet
         if (coordsheet == null) { // unavailable
            result.type = "e#REF!";
            result.error = SocialCalc.Constants.s_sheetunavailable+" "+result.value.substring(pos+1);
            result.value = 0;
            return result;
            }
         result.value = result.value.substring(0, pos); // get coord part
         }

      if (coordsheet) {
         cell = coordsheet.cells[SocialCalc.Formula.PlainCoord(result.value)];
         if (cell) {
            cellvtype = cell.valuetype; // get type of value in the cell it points to
            result.value = cell.datavalue;
            }
         else {
            cellvtype = "b";
            }
         }
      else {
         cellvtype = "e#N/A";
         result.value = 0;
         }
      result.type = cellvtype || "b";
      if (result.type == "b") { // blank
         result.value = 0;
         }
      }

   return result;

   }

/*
#
# operandinfo = SocialCalc.Formula.OperandAsCoord(sheet, operand)
#
# Gets top of stack and pops it.
# Returns coord value. All others are treated as an error.
#
*/


SocialCalc.Formula.OperandAsCoord = function(sheet, operand) {
	return SocialCalc.Formula.OperandAsType(sheet, operand, "coord");
}


/*
#
# operandinfo = SocialCalc.Formula.OperandAsRange(sheet, operand)
#
# Gets top of stack and pops it.
# Returns coord value. All others are treated as an error.
#
*/

SocialCalc.Formula.OperandAsRange = function(sheet, operand) {
	return SocialCalc.Formula.OperandAsType(sheet, operand, "range");
}

/*
#
# operandinfo = SocialCalc.Formula.OperandAsType(sheet, operand, operandtype)
#
# Gets top of stack and pops it.
# Returns operandtype value. All others are treated as an error.
#
*/
SocialCalc.Formula.OperandAsType = function(sheet, operand, operandtype) {

   var scf = SocialCalc.Formula;

   var result = {type: "", value: ""};

   var stacklen = operand.length;

   result.value = operand[stacklen-1].value; // get top of stack
   result.type = operand[stacklen-1].type;
   operand.pop(); // we have data - pop stack
   if (result.type == "name") {
      result = SocialCalc.Formula.LookupName(sheet, result.value);
      }
   if (result.type == operandtype) { // value is a coord reference
      return result;
      }
   else {
      result.value = SocialCalc.Constants.s_calcerrcellrefmissing;
      result.type = "e#REF!";
      return result;
      }
}


/*
#
# result = SocialCalc.Formula.OperandsAsCoordOnSheet(sheet, operand)
#
# Gets 2 at top of stack and pops them, treating them as sheetname!coord-or-name.
# Returns stack-style coord value (coord!sheetname, or coord!sheetname|coord|) with
# a type of coord or range. All others are treated as an error.
# If sheetname not available, sets result.error.
#
*/

SocialCalc.Formula.OperandsAsCoordOnSheet = function(sheet, operand) {

   var sheetname, othersheet, pos1, pos2;
   var value1 = {};
   var result = {};
   var scf = SocialCalc.Formula;

   var stacklen = operand.length;
   value1.value = operand[stacklen-1].value; // get top of stack - coord or name
   value1.type = operand[stacklen-1].type;
   operand.pop(); // we have data - pop stack

   sheetname = scf.OperandAsSheetName(sheet, operand); // get sheetname as text
   othersheet = scf.FindInSheetCache(sheetname.value);
   if (othersheet == null) { // unavailable
      result.type = "e#REF!";
      result.value = 0;
      result.error = SocialCalc.Constants.s_sheetunavailable+" "+sheetname.value;
      return result;
      }

   if (value1.type == "name") {
      value1 = scf.LookupName(othersheet, value1.value);
      }
   result.type = value1.type;
   if (value1.type == "coord") { // value is a coord reference
      result.value = value1.value + "!" + sheetname.value; // return in the format as used on stack
      }
   else if (value1.type == "range") { // value is a range reference
      pos1 = value1.value.indexOf("|");
      pos2 = value1.value.indexOf("|", pos1+1);
      result.value = value1.value.substring(0, pos1) + "!" + sheetname.value +
                    "|" + value1.value.substring(pos1+1, pos2) + "|";
      }
   else if (value1.type.charAt(0)=="e") {
      result.value = value1.value;
      }
   else {
      result.error = SocialCalc.Constants.s_calcerrcellrefmissing;
      result.type = "e#REF!";
      result.value = 0;
      }
   return result;
   
   }

/*
#
# result = SocialCalc.Formula.OperandsAsRangeOnSheet(sheet, operand)
#
# Gets 2 at top of stack and pops them, treating them as coord2-or-name:coord1.
# Name is evaluated on sheet of coord1.
# Returns result with "value" of stack-style range value (coord!sheetname|coord|) and
# "type" of "range". All others are treated as an error.
#
*/

SocialCalc.Formula.OperandsAsRangeOnSheet = function(sheet, operand) {

   var value1, othersheet, pos1, pos2;
   var value2 = {};
   var scf = SocialCalc.Formula;
   var scc = SocialCalc.Constants;

   var stacklen = operand.length;
   value2.value = operand[stacklen-1].value; // get top of stack - coord or name for "right" side
   value2.type = operand[stacklen-1].type;
   operand.pop(); // we have data - pop stack

   value1 = scf.OperandAsCoord(sheet, operand); // get "left" coord
   if (value1.type != "coord") { // not a coord, which it must be
      return {value: 0, type: "e#REF!"};
      }

   othersheet = sheet;
   pos1 = value1.value.indexOf("!");
   if (pos1 != -1) { // sheet reference
      pos2 = value1.value.indexOf("|", pos1+1);
      if (pos2 < 0) pos2 = value1.value.length;
      othersheet = scf.FindInSheetCache(value1.value.substring(pos1+1,pos2)); // get other sheet
      if (othersheet == null) { // unavailable
         return {value: 0, type: "e#REF!", errortext: scc.s_sheetunavailable+" "+value1.value.substring(pos1+1,pos2)};
         }
      }

   if (value2.type == "name") { // coord:name is allowed, if name is just one cell
      value2 = scf.LookupName(othersheet, value2.value, "end");
      }

   if (value2.type == "coord") { // value is a coord reference, so return the combined range
      return {value: value1.value+"|"+value2.value+"|", type: "range"}; // return range in the format as used on stack
      }
   else { // bad form
      return {value: scc.s_calcerrcellrefmissing, type: "e#REF!"};
      }
   }


/*
#
# result = SocialCalc.Formula.OperandAsSheetName(sheet, operand)
#
# Gets top of stack and pops it.
# Returns sheetname value. All others are treated as an error.
# Accepts text, cell reference, and named value which is one of those two.
#
*/

SocialCalc.Formula.OperandAsSheetName = function(sheet, operand) {

   var nvalue, cell;

   var scf = SocialCalc.Formula;

   var result = {type: "", value: ""};

   var stacklen = operand.length;

   result.value = operand[stacklen-1].value; // get top of stack
   result.type = operand[stacklen-1].type;
   operand.pop(); // we have data - pop stack
   if (result.type == "name") {
      nvalue = SocialCalc.Formula.LookupName(sheet, result.value);
      if (!nvalue.value) { // not a known name - return bare name as the name value
         return result;
         }
      result.value = nvalue.value;
      result.type = nvalue.type;
      }
   if (result.type == "coord") { // value is a coord reference, follow it to find sheet name
      cell = sheet.cells[SocialCalc.Formula.PlainCoord(result.value)];
      if (cell) {
         result.value = cell.datavalue;
         result.type = cell.valuetype;
         }
      else {
         result.value = "";
         result.type = "b";
         }
      }
   if (result.type.charAt(0) == "t") { // value is a string which could be a sheet name
      return result;
      }
   else {
      result.value = "";
      result.error = SocialCalc.Constants.s_calcerrsheetnamemissing;
      return result;
      }

   }

//
// value = SocialCalc.Formula.LookupName(sheet, name)
//
// Returns value and type of a named value
// Names are case insensitive
// Names may have a definition which is a coord (A1), a range (A1:B7), or a formula (=OFFSET(A1,0,0,5,1))
// Note: The range must not have sheet names ("!") in them.
//

SocialCalc.Formula.LookupName = function(sheet, name, isEnd) {

   var pos, specialc, parseinfo;
   var names = sheet.names;
   var value = {};
   var startedwalk = false;

   if (names[name.toUpperCase()]) { // is name defined?

      value.value = names[name.toUpperCase()].definition; // yes

      if (value.value.charAt(0) == "=") { // formula
         if (!sheet.checknamecirc) { // are we possibly walking the name tree?
            sheet.checknamecirc = {}; // not yet
            startedwalk = true; // remember we are the reference that started it
            }
         else {
            if (sheet.checknamecirc[name]) { // circular reference
               value.type = "e#NAME?";
               value.error = SocialCalc.Constants.s_circularnameref+' "' + name + '".';
               return value;
               }
            }
         sheet.checknamecirc[name] = true;

         parseinfo = SocialCalc.Formula.ParseFormulaIntoTokens(value.value.substring(1));
         value = SocialCalc.Formula.evaluate_parsed_formula(parseinfo, sheet, 1); // parse formula, allowing range return

         delete sheet.checknamecirc[name]; // done with us
         if (startedwalk) {
            delete sheet.checknamecirc; // done with walk
            }

         if (value.type != "range") {
            return value;
            }
         }

      pos = value.value.indexOf(":");
      if (pos != -1) { // range
         value.type = "range";
         value.value = value.value.substring(0, pos) + "|" + value.value.substring(pos+1)+"|";
         value.value = value.value.toUpperCase();
         }
      else {
         value.type = "coord";
         value.value = value.value.toUpperCase();
         }
      return value;
      }
   else if (specialc=SocialCalc.Formula.SpecialConstants[name.toUpperCase()]) { // special constant, like #REF!
      pos = specialc.indexOf(",");
      value.value = specialc.substring(0,pos)-0;
      value.type = specialc.substring(pos+1);
      return value;
      }
   else if (/^[a-zA-Z][a-zA-Z]?$/.test(name)) {
      value.type = "coord";
      value.value = name.toUpperCase() + (isEnd ? sheet.attribs.lastrow : 1);
      return value;
   }
   else {
      value.value = "";
      value.type = "e#NAME?";
      value.error = SocialCalc.Constants.s_calcerrunknownname+' "'+name+'"';
      return value;
      }
   }

/*
#
# coord = SocialCalc.Formula.StepThroughRangeDown(operand, rangevalue)
#
# Returns next coord in a range, keeping track on the operand stack
# Goes from upper left across and down to bottom right.
#
*/

SocialCalc.Formula.StepThroughRangeDown = function(operand, rangevalue) {

   var value1, value2, sequence, pos1, pos2, sheet1, rp, c, r, count;
   var scf = SocialCalc.Formula;

   pos1 = rangevalue.indexOf("|");
   pos2 = rangevalue.indexOf("|", pos1+1);
   value1 = rangevalue.substring(0, pos1);
   value2 = rangevalue.substring(pos1+1, pos2);
   sequence = rangevalue.substring(pos2+1) - 0;

   pos1 = value1.indexOf("!");
   if (pos1 != -1) {
      sheet1 = value1.substring(pos1);
      value1 = value1.substring(0, pos1);
      }
   else {
      sheet1 = "";
      }
   pos1 = value2.indexOf("!");
   if (pos1 != -1) {
      value2 = value2.substring(0, pos1);
      }

   rp = scf.OrderRangeParts(value1, value2);
   
   count = 0;
   for (r=rp.r1; r<=rp.r2; r++) {
      for (c=rp.c1; c<=rp.c2; c++) {
         count++;
         if (count > sequence) {
            if (r!=rp.r2 || c!=rp.c2) { // keep on stack until done
               scf.PushOperand(operand, "range", value1+sheet1+"|"+value2+"|"+count);
               }
            return {value: SocialCalc.crToCoord(c, r)+sheet1, type: "coord"};
            }
         }
      }
   }

/*
#
# result = SocialCalc.Formula.DecodeRangeParts(sheetdata, range)
#
# Returns sheetdata for the sheet where the range is, as well as
# the number of the first column in the range, the number of columns,
# and equivalent row information:
#
# {sheetdata: sheet, sheetname: name-or-"", col1num: n, ncols: n, row1num: n, nrows: n}
#
# If any errors, a null result is returned.
#
*/

SocialCalc.Formula.DecodeRangeParts = function(sheetdata, range) {

   var value1, value2, pos1, pos2, sheet1, coordsheetdata, rp;

   var scf = SocialCalc.Formula;

   pos1 = range.indexOf("|");
   pos2 = range.indexOf("|", pos1+1);
   value1 = range.substring(0, pos1);
   value2 = range.substring(pos1+1, pos2);

   pos1 = value1.indexOf("!");
   if (pos1 != -1) {
      sheet1 = value1.substring(pos1+1);
      value1 = value1.substring(0, pos1);
      }
   else {
      sheet1 = "";
      }
   pos1 = value2.indexOf("!");
   if (pos1 != -1) {
      value2 = value2.substring(0, pos1);
      }

   coordsheetdata = sheetdata;
   if (sheet1) { // sheet reference
      coordsheetdata = scf.FindInSheetCache(sheet1);
      if (coordsheetdata == null) { // unavailable
         return null;
         }
      }

   rp = scf.OrderRangeParts(value1, value2);

   return {sheetdata: coordsheetdata, sheetname: sheet1, col1num: rp.c1, ncols: rp.c2-rp.c1+1, row1num: rp.r1, nrows: rp.r2-rp.r1+1}

   }



//*********************
//
// Function Handling
//
//*********************

// List of functions -- Define after functions are defined
//
// SocialCalc.Formula.FunctionList["function_name"] = [function_subroutine, number_of_arguments, arg_def, func_def, func_class, cell_html, io_parameters]
//   function_subroutine takes arguments (fname, operand, foperand, sheet), returns
//      errortext or null, pushing result on operand stack.
//   number_of_arguments is:
//      0 = no arguments
//      >0 = exactly that many arguments
//      <0 = that many arguments (abs value) or more
//      100 = don't check
//
//   arg_def, if present, is the name of the element in SocialCalc.Formula.FunctionArgDefs.
//   func_def, if present, is a string explaining the function. If not, looked up in SocialCalc.Constants.
//   func_class, if present, is the comma-separated names of the elements in SocialCalc.Formula.FunctionClasses.
//   cell_html, if present, is the HTML to display in the cell. will find and replace these <%=cell_reference%>, <%=displayvalue%> see SocialCalc.FormatValueForDisplay
//   io_parameters, if present, 
//        "ParameterList" is used with =CopyValue() etc, used to collect parameters of the formula, for use trigger/action formulas, 
//        "EventTree" is used with =Button() etc, used to store trigger cell lookup table
//        "Input" store copy of value in formdata sheet -- for input style GUI widgets - textbox/radio buttons etc - 
//
// To add a function, just add it to this object.

   if (!SocialCalc.Formula.FunctionList) { // make sure it is defined (could have been in another module)
      SocialCalc.Formula.FunctionList = {};
      }

   // FunctionClasses[classname] = {name: full-name-string, items: [sorted list of function names]};
   // filled in by SocialCalc.Formula.FillFunctionInfo

   SocialCalc.Formula.FunctionClasses = null; // start null to say needs filling in

   // FunctionArgDef[argname] = explicit-string-for-arg-list;
   // filled in by SocialCalc.Formula.FillFunctionInfo

   SocialCalc.Formula.FunctionArgDefs = {};


   

/*
#
# SocialCalc.Formula.StoreIoEventFormula(function_name, coord, operand_reverse, sheet, io_parameters)
# 
# store forumla parameters of io event formulas
#
# enable lookup of ioForumalas when a trigger formula is activated 
# store formula details in sheet.ioEventTree  and sheet.ioParameterList 
#
*/
// eddy StoreIoEventFormula
SocialCalc.Formula.StoreIoEventFormula = function(function_name, coord, operand_reverse, sheet, io_parameters) {
	var operand = [];
	SocialCalc.Formula.Clone(operand,operand_reverse);
    operand.reverse(); // normal parameter order
    if(operand.length == 0) return;
	
	

  if(typeof sheet.ioEventTree === 'undefined') sheet.ioEventTree = {};	// action formulas - e.g. COPYVALUE, COPYFORMULA  - these action formulas are triggered by a trigger formula 
  if(typeof sheet.ioParameterList === 'undefined') sheet.ioParameterList = {}; // widget parameters - e.g. BUTTON, TEXTBOX - this is updated when the widget state changes
  if(typeof sheet.ioTimeTriggerList === 'undefined') sheet.ioTimeTriggerList = {}; // 
  if(typeof sheet.radioGroupList === 'undefined') sheet.radioGroupList = {}; // 

  // store parameters of each action formulas 
  if(typeof sheet.ioParameterList[coord] === 'undefined') sheet.ioParameterList[coord] = {};
  sheet.ioParameterList[coord] = operand;
  sheet.ioParameterList[coord].function_name = function_name;
  
  // add radio buttons to list - so radio group can be updated
//  if(function_name == "RADIOBUTTON") {
//    
//    if(operand.length > 1) {
//      if (sheet.radioGroupList[]) {
//        sheet.radioGroup.push()
//      } else {
//        
//      } 
//    }
//  }

  
  // send trigger times to server if changed
  if(io_parameters == "TimeTrigger") { // timer trigger formula exists   
    // function to push cell time into array
    var PushTriggerTime = function(list, coordA1, sheetData) {
      var cell = sheetData.cells[coordA1];   
      if (typeof cell !== 'undefined' && cell.valuetype.charAt(0) == "n") { // if not blank and is number
        list.push(cell.datavalue);
      }
    };

    var triggerTimeCellId = SocialCalc.Formula.PlainCoord(operand[0].value); // strip dollar signs
    
    var currentTriggerTimeList = [];
    
    if(operand[0].type == "range" )  {      
      var rangeinfo = SocialCalc.Formula.DecodeRangeParts(sheet, triggerTimeCellId);
      for (var i=0; i<rangeinfo.ncols; i++) {
        for (var j=0; j<rangeinfo.nrows; j++) {
          var cellCoord = SocialCalc.crToCoord(rangeinfo.col1num + i, rangeinfo.row1num + j);
          PushTriggerTime(currentTriggerTimeList, cellCoord, sheet);
        }
      }
    }
    
    if(operand[0].type == "coord" ) {      
      PushTriggerTime(currentTriggerTimeList, triggerTimeCellId, sheet);
    }
    
    if (operand[0].type.charAt(0) == "n") {
      currentTriggerTimeList.push(operand[0].value);      
    }

    // if time triggers changed then set changed times in ioTimeTrigger and schedule      
    if(typeof sheet.ioTimeTriggerList[coord] === 'undefined' || SocialCalc.Formula.ArrayValuesEqual(sheet.ioTimeTriggerList[coord], currentTriggerTimeList) == false) {
      // set the time+cell in ioTimeTrigger
      sheet.ioTimeTriggerList[coord] = currentTriggerTimeList;
      // schedule the set Time Trigger // sheet.ScheduleSheetCommands('...    
      var timeZoneOffsetMins = (new Date()).getTimezoneOffset();
      var start_1_1_1970 = 25569; // Day number of 1/1/1970 starting with 1/1/1900 as 1      
      var triggerUTCTimeList = []; /// EPOCH in Mins - Mins since 1/1/1970 GMT
      for(var index = 0; index < currentTriggerTimeList.length; ++index) triggerUTCTimeList[index] = Math.floor(((currentTriggerTimeList[index] - start_1_1_1970 ) *24 * 60) + timeZoneOffsetMins);
      sheet.ScheduleSheetCommands('settimetrigger '+coord+' '+triggerUTCTimeList.toString());       
    }
  }
  
	// store trigger lookup table
  if(io_parameters == "EventTree"	&& (operand[0].type == "coord" || operand[0].type == "range")) { // trigger cell exists   
  	// create a list of action formulas for each trigger cell  
    var triggerCellId = operand[0].value.replace(/\$/g,''); // strip dollar signs
    var PushTriggerCord = function(list, index, v) {
        if(typeof list[index] === 'undefined') list[index] = {};
        list[index][v] = v;
    };


    if(operand[0].type == "range" )  {      
	      var rangeinfo = SocialCalc.Formula.DecodeRangeParts(sheet, triggerCellId);
      for (var i=0; i<rangeinfo.ncols; i++) {
         for (var j=0; j<rangeinfo.nrows; j++) {
            var cellcr = SocialCalc.crToCoord(rangeinfo.col1num + i, rangeinfo.row1num + j);
                          PushTriggerCord(sheet.ioEventTree, cellcr, coord); 
                          
         }
      }
    }
    if(operand[0].type == "coord" ) {
        PushTriggerCord(sheet.ioEventTree, triggerCellId, coord); 
    }                
  }

  
  //IF GUI widget is "Input"
  if(io_parameters == "Input" ) {
    var formDataViewer = (SocialCalc.CurrentSpreadsheetControlObject != null) 
          ? SocialCalc.CurrentSpreadsheetControlObject.formDataViewer 
          : SocialCalc.CurrentSpreadsheetViewerObject.formDataViewer;
    
    if(formDataViewer != null && formDataViewer.loaded == true) {
      
      // IF formFields  not loaded - load formFields  
      if( formDataViewer.formFields == null) SocialCalc.Formula.LoadFormFields();
      //  get formFieldName
      var formFieldName = (function_name+coord).toLowerCase();
      //  if formFieldName not in formFields  
      var sheetCmd = null;
      if(formDataViewer.formFields[formFieldName] == null) {
        //    store formFieldName of gui input widget 
        //    add formFieldName  to formFields  
        var col = formDataViewer.formFields[formFieldName] = formDataViewer.formFieldsLength++ + 2;
        //    add formFieldName to next empty cell (starting with B1)
        var headerCoord = SocialCalc.crToCoord(col, 1);
        sheetCmd = "set "+headerCoord+" text t "+SocialCalc.encodeForSave(function_name.toLowerCase()+coord);
      }
      if(operand[0].type.charAt(0) == "t" || operand[0].type.charAt(0) == "n") {       
        var valueCoord = SocialCalc.crToCoord(formDataViewer.formFields[formFieldName], 2);
        if(formDataViewer.sheet.cells[valueCoord] == null ||  formDataViewer.sheet.cells[valueCoord].datavalue != operand[0].value) {
          var sheetCmdTwo = "set "+valueCoord+" text t "+SocialCalc.encodeForSave(operand[0].value);
          if (sheetCmd != null) sheetCmd = sheetCmd + "\n" + sheetCmdTwo; else sheetCmd = sheetCmdTwo;        
        }
  
      }
      if (sheetCmd != null) formDataViewer.sheet.ScheduleSheetCommands(sheetCmd, false);    
    }    
  }    
        

	SocialCalc.DebugLog({ ioEventTree: sheet.ioEventTree});
	SocialCalc.DebugLog({ ioParameterList: sheet.ioParameterList});
}   
   

/**
 * ArrayValuesEqual
 * 
 * Warning - nested vales are NOT tested.
 * returns true if both arrays contain the same values
 */    
SocialCalc.Formula.ArrayValuesEqual = function(a, b) {
  var i = a.length;
  if (i != b.length) return false;
  while (i--) {
      if (a[i] !== b[i]) return false;
  }
  return true;
};

SocialCalc.Formula.Clone =   function(destination, source) {
        for (var property in source) {
            if (typeof source[property] === "object" && source[property] !== null && destination[property]) { 
                SocialCalc.Formula.Clone(destination[property], source[property]);
            } else {
                destination[property] = source[property];
            }
        }
    };   

/**
 * LoadFormFields
 * 
 * Load the fieldNames of the form 
 *  Cell A1 contains "FieldName:" and cells B1 to n contain field names
 *  Cell A2 contains "Pending" - pending data row. The pending row is moved to row 3 by inseting a new row 2 onSubmit 
 *  Put the fieldNames into an array for fast lookup and position information
 */    
    
SocialCalc.Formula.LoadFormFields =   function() {
  var formDataViewer = (SocialCalc.CurrentSpreadsheetControlObject != null) 
    ? SocialCalc.CurrentSpreadsheetControlObject.formDataViewer 
    : SocialCalc.CurrentSpreadsheetViewerObject.formDataViewer;

  formDataViewer.formFields = {};

  
  //IF cell A1 is blank - Adds "FieldName:" to A1
  if(formDataViewer.sheet.cells.A1 == null ) {
    formDataViewer.sheet.ScheduleSheetCommands("set A1 text t "+SocialCalc.encodeForSave("FieldName:"), false);       
  }
  
  if(formDataViewer.sheet.cells.A2 == null ) {
    formDataViewer.sheet.ScheduleSheetCommands("set A2 text t "+SocialCalc.encodeForSave("Pending:"), false);       
  }

  
  //  For each cell in row 1, from B1 to 1st blank cell
  var col = 2;
  while(true) {
    var coord = SocialCalc.crToCoord(col, 1);
    var cell=formDataViewer.sheet.cells[coord];
    if (!cell) break;
    //    Put cell value into formFields  
    formDataViewer.formFields[cell.datavalue.toLowerCase()] = col;
    col ++;
  }
  formDataViewer.formFieldsLength = col -2;

}    
   
/*
#
# errortext = SocialCalc.Formula.CalculateFunction(fname, operand, sheet)
#
# Dispatches for function fname.
#
*/

SocialCalc.Formula.CalculateFunction = function(fname, operand, sheet, coord) {

   var fobj, foperand, ffunc, argnum, ttext;
   var scf = SocialCalc.Formula;
   var ok = 1;
   var errortext = "";

   fobj = scf.FunctionList[fname];

   if (fobj) {
   

      foperand = [];
      ffunc = fobj[0];
      argnum = fobj[1];
      scf.CopyFunctionArgs(operand, foperand);

	  // eddy CalculateFunction {
   if(fobj[6] && fobj[6] != "") {	  
	   SocialCalc.DebugLog("action:"+fname);		
		 scf.StoreIoEventFormula(fname, coord, foperand, sheet, fobj[6]);
		
	  }
	  // }
	  
      if (argnum != 100) {
         if (argnum < 0) {
            if (foperand.length < -argnum) {
               errortext = scf.FunctionArgsError(fname, operand);
               return errortext;
               }
            }
         else {
            if (foperand.length != argnum) {
               errortext = scf.FunctionArgsError(fname, operand);
               return errortext;
               }
            }
         }

		 
	  
      errortext = ffunc(fname, operand, foperand, sheet, coord);
      }

   else {
         ttext = fname;

         if (operand.length && operand[operand.length-1].type == "start") { // no arguments - name or zero arg function
            operand.pop();
            scf.PushOperand(operand, "name", ttext);
            }

         else {
            errortext = SocialCalc.Constants.s_sheetfuncunknownfunction+" " + ttext +". ";
            }
      }

   return errortext;

}

//
// SocialCalc.Formula.PushOperand(operand, t, v)
//
// Pushes the type and value onto the operand stack
//

SocialCalc.Formula.PushOperand = function(operand, t, v) {

   operand.push({type: t, value: v});

   }

//
// SocialCalc.Formula.CopyFunctionArgs(operand, foperand)
//
// Pops operands from operand and pushes on foperand up to function start
// reversing order in the process.
//

SocialCalc.Formula.CopyFunctionArgs = function(operand, foperand) {

   var fobj, foperand, ffunc, argnum;
   var scf = SocialCalc.Formula;
   var ok = 1;
   var errortext = null;

   while (operand.length>0 && operand[operand.length-1].type != "start") { // get each arg
      foperand.push(operand.pop()); // copy it
      }
   operand.pop(); // get rid of "start"

   return;

   }

//
// errortext = SocialCalc.Formula.FunctionArgsError(fname, operand)
//
// Pushes appropriate error on operand stack and returns errortext, including fname
//

SocialCalc.Formula.FunctionArgsError = function(fname, operand) {

   var errortext = SocialCalc.Constants.s_calcerrincorrectargstofunction+" " + fname + ". ";
   SocialCalc.Formula.PushOperand(operand, "e#VALUE!", errortext);

   return errortext;

   }


//
// errortext = SocialCalc.Formula.FunctionSpecificError(fname, operand, errortype, errortext)
//
// Pushes specified error and text on operand stack.
//

SocialCalc.Formula.FunctionSpecificError = function(fname, operand, errortype, errortext) {

   SocialCalc.Formula.PushOperand(operand, errortype, errortext);

   return errortext;

   }

//
// haserror = SocialCalc.Formula.CheckForErrorValue(operand, v)
//
// If v.type is an error, push it on operand stack and return true, otherwise return false.
//

SocialCalc.Formula.CheckForErrorValue = function(operand, v) {

   if (v.type.charAt(0) == "e") {
      operand.push(v);
      return true;
      }
   else {
      return false;
      }

   }

/////////////////////////
//
// FUNCTION INFORMATION ROUTINES
//

//
// SocialCalc.Formula.FillFunctionInfo()
//
// Goes through function definitions and fills out FunctionArgDefs and FunctionClasses.
// Execute this after any changes to SocialCalc.Constants but before UI is used.
//

SocialCalc.Formula.FillFunctionInfo = function() {

   var scf = SocialCalc.Formula;
   var scc = SocialCalc.Constants;

   var fname, f, classes, cname, i;

   if (scf.FunctionClasses) { // only do once
      return;
      }

   for (fname in scf.FunctionList) {
      f = scf.FunctionList[fname];
      if (f[2]) { // has an arg def
         scf.FunctionArgDefs[f[2]] = scc["s_farg_"+f[2]] || ""; // get it from constants
         }
      if (!f[3]) { // no text def, see if in constants
         if (scc["s_fdef_"+fname]) {
            scf.FunctionList[fname][3] = scc["s_fdef_"+fname];
            }
         }
      }

   scf.FunctionClasses = {};
 
   for (i=0; i<scc.function_classlist.length; i++) {
      cname = scc.function_classlist[i];
      scf.FunctionClasses[cname] = {name: scc["s_fclass_"+cname], items: []};
      }

   for (fname in scf.FunctionList) {
      f = scf.FunctionList[fname];
      classes = f[4] ? f[4].split(",") : []; // get classes
      classes.push("all");
      for (i=0; i<classes.length; i++) {
         cname = classes[i];
         scf.FunctionClasses[cname].items.push(fname);
         }
      }
   for (cname in scf.FunctionClasses) {
      scf.FunctionClasses[cname].items.sort();
      }

   }

//
// str = SocialCalc.Formula.FunctionArgString(fname)
//
// Returns a string representing the arguments to function fname.
//

SocialCalc.Formula.FunctionArgString = function(fname) {

   var scf = SocialCalc.Formula;
   var fdata = scf.FunctionList[fname];
   var nargs, i, str;

   var adef = fdata[2];

   if (!adef) {
      nargs = fdata[1];
      if (nargs == 0) {
         adef = " ";
         }
      else if (nargs > 0) {
         str = "v1";
         for (i=2; i<=nargs; i++) {
            str += ", v"+i;
            }
         return str;
         }
      else if (nargs < 0) {
         str = "v1";
         for (i=2; i<-nargs; i++) {
            str += ", v"+i;
            }
         return str+", ...";
         }
      else {
         return "nargs: "+nargs;
         }
      }

   str = scf.FunctionArgDefs[adef] || adef;

   return str;

   }


/////////////////////////
//
// FUNCTION DEFINITIONS
//
// The standard function definitions follow.
//
// Note that some need SocialCalc.DetermineValueType to be defined.
//

/*
#
# AVERAGE(v1,c1:c2,...)
# COUNT(v1,c1:c2,...)
# COUNTA(v1,c1:c2,...)
# COUNTBLANK(v1,c1:c2,...)
# MAX(v1,c1:c2,...)
# MIN(v1,c1:c2,...)
# PRODUCT(v1,c1:c2,...)
# STDEV(v1,c1:c2,...)
# STDEVP(v1,c1:c2,...)
# SUM(v1,c1:c2,...)
# VAR(v1,c1:c2,...)
# VARP(v1,c1:c2,...)
#
# Calculate all of these and then return the desired one (overhead is in accessing not calculating)
# If this routine is changed, check the dseries_functions, too.
#
*/

SocialCalc.Formula.SeriesFunctions = function(fname, operand, foperand, sheet) {

   var value1, t, v1;

   var scf = SocialCalc.Formula;
   var operand_value_and_type = scf.OperandValueAndType;
   var lookup_result_type = scf.LookupResultType;
   var typelookupplus = scf.TypeLookupTable.plus;

   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   var sum = 0;
   var resulttypesum = "";
   var count = 0;
   var counta = 0;
   var countblank = 0;
   var product = 1;
   var maxval;
   var minval;
   var mk, sk, mk1, sk1; // For variance, etc.: M sub k, k-1, and S sub k-1
                         // as per Knuth "The Art of Computer Programming" Vol. 2 3rd edition, page 232

   while (foperand.length > 0) {
      value1 = operand_value_and_type(sheet, foperand);
      t = value1.type.charAt(0);
      if (t == "n") count += 1;
      if (t != "b") counta += 1;
      if (t == "b") countblank += 1;

      if (t == "n") {
         v1 = value1.value-0; // get it as a number
         sum += v1;
         product *= v1;
         maxval = (maxval!=undefined) ? (v1 > maxval ? v1 : maxval) : v1;
         minval = (minval!=undefined) ? (v1 < minval ? v1 : minval) : v1;
         if (count == 1) { // initialize with first values for variance used in STDEV, VAR, etc.
            mk1 = v1;
            sk1 = 0;
            }
         else { // Accumulate S sub 1 through n as per Knuth noted above
            mk = mk1 + (v1 - mk1) / count;
            sk = sk1 + (v1 - mk1) * (v1 - mk);
            sk1 = sk;
            mk1 = mk;
            }
         resulttypesum = lookup_result_type(value1.type, resulttypesum || value1.type, typelookupplus);
         }
      else if (t == "e" && resulttypesum.charAt(0) != "e") {
         resulttypesum = value1.type;
         }
      }

   resulttypesum = resulttypesum || "n";

   switch (fname) {
      case "SUM":
         PushOperand(resulttypesum, sum);
         break;

      case "PRODUCT": // may handle cases with text differently than some other spreadsheets
         PushOperand(resulttypesum, product);
         break;

      case "MIN":
         PushOperand(resulttypesum, minval || 0);
         break;

      case "MAX":
         PushOperand(resulttypesum, maxval || 0);
         break;

      case "COUNT":
         PushOperand("n", count);
         break;

      case "COUNTA":
         PushOperand("n", counta);
         break;

      case "COUNTBLANK":
         PushOperand("n", countblank);
         break;

      case "AVERAGE":
         if (count > 0) {
            PushOperand(resulttypesum, sum/count);
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "STDEV":
         if (count > 1) {
            PushOperand(resulttypesum, Math.sqrt(sk / (count - 1))); // sk is never negative according to Knuth
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "STDEVP":
         if (count > 1) {
            PushOperand(resulttypesum, Math.sqrt(sk / count));
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "VAR":
         if (count > 1) {
            PushOperand(resulttypesum, sk / (count - 1));
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "VARP":
         if (count > 1) {
            PushOperand(resulttypesum, sk / count);
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;
      }

   return null;

   }

//*********************
//
// Docs see - Function Handling - ~line 1560
// 
//*********************

// Add to function list
SocialCalc.Formula.FunctionList["AVERAGE"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["COUNT"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["COUNTA"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["COUNTBLANK"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["MAX"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["MIN"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["PRODUCT"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["STDEV"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["STDEVP"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["SUM"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["VAR"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["VARP"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];

/*
#
# SUMPRODUCT(range1, range2, ...)
#
*/

SocialCalc.Formula.SumProductFunction = function(fname, operand, foperand, sheet) {
  
   var range, products = [], sum = 0;
   var scf = SocialCalc.Formula;
   var ncols = 0, nrows = 0;

   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   while (foperand.length > 0) {
      range = scf.TopOfStackValueAndType(sheet, foperand);
      if (range.type != "range") {
         PushOperand("e#VALUE!", 0);
         return;
         }
      rangeinfo = scf.DecodeRangeParts(sheet, range.value);
      if (!ncols) ncols = rangeinfo.ncols;
      else if (ncols != rangeinfo.ncols) {
         PushOperand("e#VALUE!", 0);
         return;
         }
      if (!nrows) nrows = rangeinfo.nrows;
      else if (nrows != rangeinfo.nrows) {
         PushOperand("e#VALUE!", 0);
         return;
         }
      for (i=0; i<rangeinfo.ncols; i++) {
         for (j=0; j<rangeinfo.nrows; j++) {
            k = i * rangeinfo.nrows + j;
            cellcr = SocialCalc.crToCoord(rangeinfo.col1num + i, rangeinfo.row1num + j);
            cell = rangeinfo.sheetdata.GetAssuredCell(cellcr);
            value = cell.valuetype == "n" ? cell.datavalue : 0;
            products[k] = ((typeof products[k] !== 'undefined')? products[k] : 1) * value;
            }
         }
      }
   for (i=0; i<products.length; i++) {
      sum += products[i];
      }
   PushOperand("n", sum);

   return;

   }

SocialCalc.Formula.FunctionList["SUMPRODUCT"] = [SocialCalc.Formula.SumProductFunction, -1, "rangen", "", "stat"];

/*
#
# DAVERAGE(databaserange, fieldname, criteriarange)
# DCOUNT(databaserange, fieldname, criteriarange)
# DCOUNTA(databaserange, fieldname, criteriarange)
# DGET(databaserange, fieldname, criteriarange)
# DMAX(databaserange, fieldname, criteriarange)
# DMIN(databaserange, fieldname, criteriarange)
# DPRODUCT(databaserange, fieldname, criteriarange)
# DSTDEV(databaserange, fieldname, criteriarange)
# DSTDEVP(databaserange, fieldname, criteriarange)
# DSUM(databaserange, fieldname, criteriarange)
# DVAR(databaserange, fieldname, criteriarange)
# DVARP(databaserange, fieldname, criteriarange)
#
# Calculate all of these and then return the desired one (overhead is in accessing not calculating)
# If this routine is changed, check the series_functions, too.
#
*/

SocialCalc.Formula.DSeriesFunctions = function(fname, operand, foperand, sheet) {

   var value1, tostype, cr, dbrange, fieldname, criteriarange, dbinfo, criteriainfo;
   var fieldasnum, targetcol, i, j, k, cell, criteriafieldnums;
   var testok, criteriacr, criteria, testcol, testcr;
   var t;

   var scf = SocialCalc.Formula;
   var operand_value_and_type = scf.OperandValueAndType;
   var lookup_result_type = scf.LookupResultType;
   var typelookupplus = scf.TypeLookupTable.plus;

   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   var value1 = {};

   var sum = 0;
   var resulttypesum = "";
   var count = 0;
   var counta = 0;
   var countblank = 0;
   var countmatches = 0;   
   var product = 1;
   var maxval;
   var minval;
   var mk, sk, mk1, sk1; // For variance, etc.: M sub k, k-1, and S sub k-1
                         // as per Knuth "The Art of Computer Programming" Vol. 2 3rd edition, page 232

   dbrange = scf.TopOfStackValueAndType(sheet, foperand); // get a range
   fieldname = scf.OperandValueAndType(sheet, foperand); // get a value
   criteriarange = scf.TopOfStackValueAndType(sheet, foperand); // get a range

   if (dbrange.type != "range" || criteriarange.type != "range") {
      return scf.FunctionArgsError(fname, operand);
      }

   dbinfo = scf.DecodeRangeParts(sheet, dbrange.value);
   criteriainfo = scf.DecodeRangeParts(sheet, criteriarange.value);

   fieldasnum = scf.FieldToColnum(dbinfo.sheetdata, dbinfo.col1num, dbinfo.ncols, dbinfo.row1num, fieldname.value, fieldname.type);
   if (fieldasnum <= 0) {
      PushOperand("e#VALUE!", 0);
      return;
      }

   targetcol = dbinfo.col1num + fieldasnum - 1;
   criteriafieldnums = [];

   for (i=0; i<criteriainfo.ncols; i++) { // get criteria field colnums
      cell = criteriainfo.sheetdata.GetAssuredCell(SocialCalc.crToCoord(criteriainfo.col1num + i, criteriainfo.row1num));
      criterianum = scf.FieldToColnum(dbinfo.sheetdata, dbinfo.col1num, dbinfo.ncols, dbinfo.row1num, cell.datavalue, cell.valuetype);
      if (criterianum <= 0) {
         PushOperand("e#VALUE!", 0);
         return;
         }
      criteriafieldnums.push(dbinfo.col1num + criterianum - 1);
      }

   for (i=1; i<dbinfo.nrows; i++) { // go through each row of the database
      testok = false;
CRITERIAROW:
      for (j=1; j<criteriainfo.nrows; j++) { // go through each criteria row
         for (k=0; k<criteriainfo.ncols; k++) { // look at each column
            criteriacr = SocialCalc.crToCoord(criteriainfo.col1num + k, criteriainfo.row1num + j); // where criteria is
            cell = criteriainfo.sheetdata.GetAssuredCell(criteriacr);
            criteria = cell.datavalue;
            if (typeof criteria == "string" && criteria.length == 0) continue; // blank items are OK
            testcol = criteriafieldnums[k];
            testcr = SocialCalc.crToCoord(testcol, dbinfo.row1num + i); // cell to check
            cell = criteriainfo.sheetdata.GetAssuredCell(testcr);
            if (!scf.TestCriteria(cell.datavalue, cell.valuetype || "b", criteria)) {
               continue CRITERIAROW; // does not meet criteria - check next row
               }
            }
         testok = true; // met all the criteria
         break CRITERIAROW;
         }
      if (!testok) {
         continue;
         }

      cr = SocialCalc.crToCoord(targetcol, dbinfo.row1num + i); // get cell of this row to do the function on
      cell = dbinfo.sheetdata.GetAssuredCell(cr);

      value1.value = cell.datavalue;
      value1.type = cell.valuetype;
      t = value1.type.charAt(0);
      countmatches += 1;
      if (t == "n") count += 1;
      if (t != "b") counta += 1;
      if (t == "b") countblank += 1;

      if (t == "n") {
         v1 = value1.value-0; // get it as a number
         sum += v1;
         product *= v1;
         maxval = (maxval!=undefined) ? (v1 > maxval ? v1 : maxval) : v1;
         minval = (minval!=undefined) ? (v1 < minval ? v1 : minval) : v1;
         if (count == 1) { // initialize with first values for variance used in STDEV, VAR, etc.
            mk1 = v1;
            sk1 = 0;
            }
         else { // Accumulate S sub 1 through n as per Knuth noted above
            mk = mk1 + (v1 - mk1) / count;
            sk = sk1 + (v1 - mk1) * (v1 - mk);
            sk1 = sk;
            mk1 = mk;
            }
         resulttypesum = lookup_result_type(value1.type, resulttypesum || value1.type, typelookupplus);
         }
      else if (t == "e" && resulttypesum.charAt(0) != "e") {
         resulttypesum = value1.type;
         }
      }

   resulttypesum = resulttypesum || "n";

   switch (fname) {
      case "DSUM":
         PushOperand(resulttypesum, sum);
         break;

      case "DPRODUCT": // may handle cases with text differently than some other spreadsheets
         PushOperand(resulttypesum, product);
         break;

      case "DMIN":
         PushOperand(resulttypesum, minval || 0);
         break;

      case "DMAX":
         PushOperand(resulttypesum, maxval || 0);
         break;

      case "DCOUNT":
         PushOperand("n", count);
         break;

      case "DCOUNTA":
         PushOperand("n", counta);
         break;

      case "DAVERAGE":
         if (count > 0) {
            PushOperand(resulttypesum, sum/count);
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "DSTDEV":
         if (count > 1) {
            PushOperand(resulttypesum, Math.sqrt(sk / (count - 1))); // sk is never negative according to Knuth
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "DSTDEVP":
         if (count > 1) {
            PushOperand(resulttypesum, Math.sqrt(sk / count));
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "DVAR":
         if (count > 1) {
            PushOperand(resulttypesum, sk / (count - 1));
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "DVARP":
         if (count > 1) {
            PushOperand(resulttypesum, sk / count);
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "DGET":
         if (countmatches == 1) {
            PushOperand(value1.type, value1.value);
            }
         else if (countmatches == 0) {
            PushOperand("e#VALUE!", 0);
            }
         else {
            PushOperand("e#NUM!", 0);
            }
         break;

      }

   return;

   }

//*********************
//
// Docs see - Function Handling - ~line 1560
// 
//*********************

SocialCalc.Formula.FunctionList["DAVERAGE"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DCOUNT"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DCOUNTA"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DGET"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DMAX"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DMIN"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DPRODUCT"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DSTDEV"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DSTDEVP"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DSUM"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DVAR"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DVARP"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];

/*
#
# colnum = SocialCalc.Formula.FieldToColnum(sheet, col1num, ncols, row1num, fieldname, fieldtype)
#
# If fieldname is a number, uses it, otherwise looks up string in cells in row to find field number
#
# If not found, returns 0.
#
*/

SocialCalc.Formula.FieldToColnum = function(sheet, col1num, ncols, row1num, fieldname, fieldtype) {

   var colnum, cell, value;

   if (fieldtype.charAt(0) == "n") { // number - return it if legal
      colnum = fieldname - 0; // make sure a number
      if (colnum <= 0 || colnum > ncols) {
         return 0;
         }
      return Math.floor(colnum);
      }

   if (fieldtype.charAt(0) != "t") { // must be text otherwise
      return 0;
      }

   fieldname = fieldname ? fieldname.toLowerCase() : "";

   for (colnum=0; colnum < ncols; colnum++) { // look through column headers for a match
      cell = sheet.GetAssuredCell(SocialCalc.crToCoord(col1num+colnum, row1num));
      value = cell.datavalue;
      value = (value+"").toLowerCase(); // ignore case
      if (value == fieldname) { // match
         return colnum+1;
         }         
      }
   return 0; // looked at all and no match

   }


/*
#
# HLOOKUP(value, range, row, [rangelookup])
# VLOOKUP(value, range, col, [rangelookup])
# MATCH(value, range, [rangelookup])
#
*/

SocialCalc.Formula.LookupFunctions = function(fname, operand, foperand, sheet) {

   var lookupvalue, range, offset, rangelookup, offsetvalue, rangeinfo;
   var c, r, cincr, rincr, previousOK, csave, rsave, cell, value, valuetype, cr, lookupvalue;

   var scf = SocialCalc.Formula;
   var operand_value_and_type = scf.OperandValueAndType;
   var lookup_result_type = scf.LookupResultType;
   var typelookupplus = scf.TypeLookupTable.plus;

   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   lookupvalue = operand_value_and_type(sheet, foperand);
   if (typeof lookupvalue.value == "string") {
      lookupvalue.value = lookupvalue.value.toLowerCase();
      }

   range = scf.TopOfStackValueAndType(sheet, foperand);

   rangelookup = 1; // default to true or 1
   if (fname == "MATCH") {
      if (foperand.length) {
         rangelookup = scf.OperandAsNumber(sheet, foperand);
         if (rangelookup.type.charAt(0) != "n") {
            PushOperand("e#VALUE!", 0);
            return;
            }
         if (foperand.length) {
            scf.FunctionArgsError(fname, operand);
            return 0;
            }
         rangelookup = rangelookup.value - 0;
         }
      }
   else {
      offsetvalue = scf.OperandAsNumber(sheet, foperand);
      if (offsetvalue.type.charAt(0) != "n") {
         PushOperand("e#VALUE!", 0);
         return;
         }
      offsetvalue = Math.floor(offsetvalue.value);
      if (foperand.length) {
         rangelookup = scf.OperandAsNumber(sheet, foperand);
         if (rangelookup.type.charAt(0) != "n") {
            PushOperand("e#VALUE!", 0);
            return;
            }
         if (foperand.length) {
            scf.FunctionArgsError(fname, operand);
            return 0;
            }
         rangelookup = rangelookup.value ? 1 : 0; // convert to 1 or 0
         }
      }
   lookupvalue.type = lookupvalue.type.charAt(0); // only deal with general type
   if (lookupvalue.type == "n") { // if number, make sure a number
      lookupvalue.value = lookupvalue.value - 0;
      }

   if (range.type != "range") {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }

   rangeinfo = scf.DecodeRangeParts(sheet, range.value, range.type);
   if (!rangeinfo) {
      PushOperand("e#REF!", 0);
      return;
      }

   c = 0;
   r = 0;
   cincr = 0;
   rincr = 0;
   if (fname == "HLOOKUP") {
      cincr = 1;
      if (offsetvalue > rangeinfo.nrows) {
         PushOperand("e#REF!", 0);
         return;
         }
      }
   else if (fname == "VLOOKUP") {
      rincr = 1;
      if (offsetvalue > rangeinfo.ncols) {
         PushOperand("e#REF!", 0);
         return;
         }
      }
   else if (fname == "MATCH") {
      if (rangeinfo.ncols > 1) {
         if (rangeinfo.nrows > 1) {
            PushOperand("e#N/A", 0);
            return;
            }
         cincr = 1;
         }
      else {
         rincr = 1;
         }
      }
   else {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }
   if (offsetvalue < 1 && fname != "MATCH") {
      PushOperand("e#VALUE!", 0);
      return 0;
      }

   previousOK; // if 1, previous test was <. If 2, also this one wasn't

   while (1) {
      cr = SocialCalc.crToCoord(rangeinfo.col1num + c, rangeinfo.row1num + r);
      cell = rangeinfo.sheetdata.GetAssuredCell(cr);
      value = cell.datavalue;
      valuetype = cell.valuetype ? cell.valuetype.charAt(0) : "b"; // only deal with general types
      if (valuetype == "n") {
         value = value - 0; // make sure number
         }
      if (rangelookup) { // rangelookup type 1 or -1: look for within brackets for matches
         if (lookupvalue.type == "n" && valuetype == "n") {
            if (lookupvalue.value == value) { // match
               break;
               }
            if ((rangelookup > 0 && lookupvalue.value > value)
                || (rangelookup < 0 && lookupvalue.value < value)) { // possible match: wait and see
               previousOK = 1;
               csave = c; // remember col and row of last OK
               rsave = r;
               }
            else if (previousOK) { // last one was OK, this one isn't
               previousOK = 2;
               break;
               }
            }

         else if (lookupvalue.type == "t" && valuetype == "t") {
            value = typeof value == "string" ? value.toLowerCase() : "";
            if (lookupvalue.value == value) { // match
               break;
               }
            if ((rangelookup > 0 && lookupvalue.value > value)
                || (rangelookup < 0 && lookupvalue.value < value)) { // possible match: wait and see
               previousOK = 1;
               csave = c;
               rsave = r;
               }
            else if (previousOK) { // last one was OK, this one isn't
               previousOK = 2;
               break;
               }
            }
         }
      else { // exact value matches
         if (lookupvalue.type == "n" && valuetype == "n") {
            if (lookupvalue.value == value) { // match
               break;
               }
            }
         else if (lookupvalue.type == "t" && valuetype == "t") {
            value = typeof value == "string" ? value.toLowerCase() : "";
            if (lookupvalue.value == value) { // match
               break;
               }
            }
         }

      r += rincr;
      c += cincr;
      if (r >= rangeinfo.nrows || c >= rangeinfo.ncols) { // end of range to check, no exact match
         if (previousOK) { // at least one could have been OK
            previousOK = 2;
            break;
            }
         PushOperand("e#N/A", 0);
         return;
         }
      }

   if (previousOK == 2) { // back to last OK
      r = rsave;
      c = csave;
      }

   if (fname == "MATCH") {
      value = c + r + 1; // only one may be <> 0
      valuetype = "n";
      }
   else {
      cr = SocialCalc.crToCoord(rangeinfo.col1num+c+(fname == "VLOOKUP" ? offsetvalue-1 : 0), rangeinfo.row1num+r+(fname == "HLOOKUP" ? offsetvalue-1 : 0));
      cell = rangeinfo.sheetdata.GetAssuredCell(cr);
      value = cell.datavalue;
      valuetype = cell.valuetype;
      }
   PushOperand(valuetype, value);

   return;

   }

SocialCalc.Formula.FunctionList["HLOOKUP"] = [SocialCalc.Formula.LookupFunctions, -3, "hlookup", "", "lookup"];
SocialCalc.Formula.FunctionList["MATCH"] = [SocialCalc.Formula.LookupFunctions, -2, "match", "", "lookup"];
SocialCalc.Formula.FunctionList["VLOOKUP"] = [SocialCalc.Formula.LookupFunctions, -3, "vlookup", "", "lookup"];

/*
#
# INDEX(range, rownum, colnum)
#
*/

SocialCalc.Formula.IndexFunction = function(fname, operand, foperand, sheet) {

   var range, sheetname, indexinfo, rowindex, colindex, result, resulttype;

   var scf = SocialCalc.Formula;

   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   range = scf.TopOfStackValueAndType(sheet, foperand); // get range
   if (range.type != "range") {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }
   indexinfo = scf.DecodeRangeParts(sheet, range.value, range.type);
   if (indexinfo.sheetname) {
      sheetname = "!" + indexinfo.sheetname;
      }
   else {
      sheetname = "";
      }

   rowindex = {value:0};
   colindex = {value:0};

   if (foperand.length) { // look for row number
      rowindex = scf.OperandAsNumber(sheet, foperand);
      if (rowindex.type.charAt(0) != "n" || rowindex.value < 0) {
         PushOperand("e#VALUE!", 0);
         return;
         }
      if (foperand.length) { // look for col number
         colindex = scf.OperandAsNumber(sheet, foperand);
         if (colindex.type.charAt(0) != "n" || colindex.value < 0) {
            PushOperand("e#VALUE!", 0);
            return;
            }
         if (foperand.length) {
            scf.FunctionArgsError(fname, operand);
            return 0;
            }
         }
      else { // col number missing
         if (indexinfo.nrows == 1) { // if only one row, then rowindex is really colindex
            colindex.value = rowindex.value;
            rowindex.value = 0;
            }
         }
      }

   if (rowindex.value > indexinfo.nrows || colindex.value > indexinfo.ncols) {
      PushOperand("e#REF!", 0);
      return;
      }

   if (rowindex.value == 0) {
      if (colindex.value == 0) {
         if (indexinfo.nrows == 1 && indexinfo.ncols == 1) {
            result = SocialCalc.crToCoord(indexinfo.col1num, indexinfo.row1num) + sheetname;
            resulttype = "coord";
            }
         else {
            result = SocialCalc.crToCoord(indexinfo.col1num, indexinfo.row1num) + sheetname + "|" +
                     SocialCalc.crToCoord(indexinfo.col1num+indexinfo.ncols-1, indexinfo.row1num+indexinfo.nrows-1) + 
                     "|";
            resulttype = "range";
            }
         }
      else {
         if (indexinfo.nrows == 1) {
            result = SocialCalc.crToCoord(indexinfo.col1num+colindex.value-1, indexinfo.row1num) + sheetname;
            resulttype = "coord";
            }
         else {
            result = SocialCalc.crToCoord(indexinfo.col1num+colindex.value-1, indexinfo.row1num) + sheetname + "|" +
                     SocialCalc.crToCoord(indexinfo.col1num+colindex.value-1, indexinfo.row1num+indexinfo.nrows-1) +
                     "|";
            resulttype = "range";
            }
         }
      }
   else {
      if (colindex.value == 0) {
         if (indexinfo.ncols == 1) {
            result = SocialCalc.crToCoord(indexinfo.col1num, indexinfo.row1num+rowindex.value-1) + sheetname;
            resulttype = "coord";
            }
         else {
            result = SocialCalc.crToCoord(indexinfo.col1num, indexinfo.row1num+rowindex.value-1) + sheetname + "|" +
                     SocialCalc.crToCoord(indexinfo.col1num+indexinfo.ncols-1, indexinfo.row1num+rowindex.value-1) +
                     "|";
            resulttype = "range";
            }
         }
      else {
         result = SocialCalc.crToCoord(indexinfo.col1num+colindex.value-1, indexinfo.row1num+rowindex.value-1) + sheetname;
         resulttype = "coord";
         }
      }

   PushOperand(resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["INDEX"] = [SocialCalc.Formula.IndexFunction, -1, "index", "", "lookup"];

/*
#
# COUNTIF(c1:c2,"criteria")
# SUMIF(c1:c2,"criteria",[range2])
#
*/

SocialCalc.Formula.CountifSumifFunctions = function(fname, operand, foperand, sheet) {

   var range, criteria, sumrange, f2operand, result, resulttype, value1, value2;
   var sum = 0;
   var resulttypesum = "";
   var count = 0;

   var scf = SocialCalc.Formula;
   var operand_value_and_type = scf.OperandValueAndType;
   var lookup_result_type = scf.LookupResultType;
   var typelookupplus = scf.TypeLookupTable.plus;

   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   range = scf.TopOfStackValueAndType(sheet, foperand); // get range or coord
   criteria = scf.OperandAsText(sheet, foperand); // get criteria
   if (fname == "SUMIF") {
      if (foperand.length == 1) { // three arg form of SUMIF
         sumrange = scf.TopOfStackValueAndType(sheet, foperand);
         }
      else if (foperand.length == 0) { // two arg form
         sumrange = {value: range.value, type: range.type};
         }
      else {
         scf.FunctionArgsError(fname, operand);
         return 0;
         }
      }
   else {
      sumrange = {value: range.value, type: range.type};
      }

   if (criteria.type.charAt(0) == "n") {
      criteria.value = criteria.value + ""; // make text
      }
   else if (criteria.type.charAt(0) == "e") { // error
      criteria.value = null;
      }
   else if (criteria.type.charAt(0) == "b") { // blank here is undefined
      criteria.value = null;
      }

   if (range.type != "coord" && range.type != "range") {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }

   if (fname == "SUMIF" && sumrange.type != "coord" && sumrange.type != "range") {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }

   foperand.push(range);
   f2operand = []; // to allow for 3 arg form
   f2operand.push(sumrange);

   while (foperand.length) {
      value1 = operand_value_and_type(sheet, foperand);
      value2 = operand_value_and_type(sheet, f2operand);
      if (!scf.TestCriteria(value1.value, value1.type, criteria.value)) {
         continue;
         }

      count += 1;

      if (value2.type.charAt(0) == "n") {
         sum += value2.value-0;
         resulttypesum = lookup_result_type(value2.type, resulttypesum || value2.type, typelookupplus);
         }
      else if (value2.type.charAt(0) == "e" && resulttypesum.charAt(0) != "e") {
         resulttypesum = value2.type;
         }
      }

   resulttypesum = resulttypesum || "n";

   if (fname == "SUMIF") {
      PushOperand(resulttypesum, sum);
      }
   else if (fname == "COUNTIF") {
      PushOperand("n", count);
      }

   return;

   }

SocialCalc.Formula.FunctionList["COUNTIF"] = [SocialCalc.Formula.CountifSumifFunctions, 2, "rangec", "", "stat"];
SocialCalc.Formula.FunctionList["SUMIF"] = [SocialCalc.Formula.CountifSumifFunctions, -2, "sumif", "", "stat"];

/*
#
# IF(cond,truevalue,falsevalue)
#
*/

SocialCalc.Formula.IfFunction = function(fname, operand, foperand, sheet) {

   var cond, t;

   cond = SocialCalc.Formula.OperandValueAndType(sheet, foperand);
   t = cond.type.charAt(0);
   if (t != "n" && t != "b") {
      operand.push({type: "e#VALUE!", value: 0});
      return;
      }

   var op1, op2;

   op1 = foperand.pop();
   if (foperand.length == 1) {
      op2 = foperand.pop();
      }
   else if (foperand.length == 0) {
      op2 = {type: "n", value: 0};
      }
   else {
      scf.FunctionArgsError(fname, operand);
      return;
   }

   operand.push(cond.value ? op1 : op2);

   }

// Add to function list
SocialCalc.Formula.FunctionList["IF"] = [SocialCalc.Formula.IfFunction, -2, "iffunc", "", "test"];

/*
#
# DATE(year,month,day)
#
*/

SocialCalc.Formula.DateFunction = function(fname, operand, foperand, sheet) {

   var scf = SocialCalc.Formula;
   var result = 0;
   var year = scf.OperandAsNumber(sheet, foperand);
   var month = scf.OperandAsNumber(sheet, foperand);
   var day = scf.OperandAsNumber(sheet, foperand);
   var resulttype = scf.LookupResultType(year.type, month.type, scf.TypeLookupTable.twoargnumeric);
   resulttype = scf.LookupResultType(resulttype, day.type, scf.TypeLookupTable.twoargnumeric);
   if (resulttype.charAt(0) == "n") {
      result = SocialCalc.FormatNumber.convert_date_gregorian_to_julian(
                  Math.floor(year.value), Math.floor(month.value), Math.floor(day.value)
                  ) - SocialCalc.FormatNumber.datevalues.julian_offset;
      resulttype = "nd";
      }
   scf.PushOperand(operand, resulttype, result);
   return;

   }

SocialCalc.Formula.FunctionList["DATE"] = [SocialCalc.Formula.DateFunction, 3, "date", "", "datetime"];

/*
#
# TIME(hour,minute,second)
#
*/

SocialCalc.Formula.TimeFunction = function(fname, operand, foperand, sheet) {

   var scf = SocialCalc.Formula;
   var result = 0;
   var hours = scf.OperandAsNumber(sheet, foperand);
   var minutes = scf.OperandAsNumber(sheet, foperand);
   var seconds = scf.OperandAsNumber(sheet, foperand);
   var resulttype = scf.LookupResultType(hours.type, minutes.type, scf.TypeLookupTable.twoargnumeric);
   resulttype = scf.LookupResultType(resulttype, seconds.type, scf.TypeLookupTable.twoargnumeric);
   if (resulttype.charAt(0) == "n") {
      result = ((hours.value * 60 * 60) + (minutes.value * 60) + seconds.value) / (24*60*60);
      resulttype = "nt";
      }
   scf.PushOperand(operand, resulttype, result);
   return;

   }

SocialCalc.Formula.FunctionList["TIME"] = [SocialCalc.Formula.TimeFunction, 3, "hms", "", "datetime"];

/*
#
# DAY(date)
# MONTH(date)
# YEAR(date)
# WEEKDAY(date, [type])
#
*/

SocialCalc.Formula.DMYFunctions = function(fname, operand, foperand, sheet) {

   var ymd, dtype, doffset;
   var scf = SocialCalc.Formula;
   var result = 0;

   var datevalue = scf.OperandAsNumber(sheet, foperand);
   var resulttype = scf.LookupResultType(datevalue.type, datevalue.type, scf.TypeLookupTable.oneargnumeric);

   if (resulttype.charAt(0) == "n") {
      ymd = SocialCalc.FormatNumber.convert_date_julian_to_gregorian(
               Math.floor(datevalue.value + SocialCalc.FormatNumber.datevalues.julian_offset));
      switch (fname) {
         case "DAY":
            result = ymd.day;
            break;

         case "MONTH":
            result = ymd.month;
            break;

         case "YEAR":
            result = ymd.year;
            break;

         case "WEEKDAY":
            dtype = {value: 1};
            if (foperand.length) { // get type if present
               dtype = scf.OperandAsNumber(sheet, foperand);
               if (dtype.type.charAt(0) != "n" || dtype.value < 1 || dtype.value > 3) {
                  scf.PushOperand(operand, "e#VALUE!", 0);
                  return;
                  }
               if (foperand.length) { // extra args
                  scf.FunctionArgsError(fname, operand);
                  return;
                  }
               }
            doffset = 6;
            if (dtype.value > 1) {
               doffset -= 1;
               }
            result = Math.floor(datevalue.value+doffset) % 7 + (dtype.value < 3 ? 1 : 0);
            break;
         }
      }

   scf.PushOperand(operand, resulttype, result);
   return;

   }

SocialCalc.Formula.FunctionList["DAY"] = [SocialCalc.Formula.DMYFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList["MONTH"] = [SocialCalc.Formula.DMYFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList["YEAR"] = [SocialCalc.Formula.DMYFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList["WEEKDAY"] = [SocialCalc.Formula.DMYFunctions, -1, "weekday", "", "datetime"];

/*
#
# HOUR(datetime)
# MINUTE(datetime)
# SECOND(datetime)
#
*/

SocialCalc.Formula.HMSFunctions = function(fname, operand, foperand, sheet) {

   var hours, minutes, seconds, fraction;
   var scf = SocialCalc.Formula;
   var result = 0;

   var datetime = scf.OperandAsNumber(sheet, foperand);
   var resulttype = scf.LookupResultType(datetime.type, datetime.type, scf.TypeLookupTable.oneargnumeric);

   if (resulttype.charAt(0) == "n") {
      if (datetime.value < 0) {
         scf.PushOperand(operand, "e#NUM!", 0); // must be non-negative
         return;
         }
      fraction = datetime.value - Math.floor(datetime.value); // fraction of a day
      fraction *= 24;
      hours = Math.floor(fraction);
      fraction -= Math.floor(fraction);
      fraction *= 60;
      minutes = Math.floor(fraction);
      fraction -= Math.floor(fraction);
      fraction *= 60;
      seconds = Math.floor(fraction + (datetime.value >= 0 ? 0.5: -0.5));
      if (fname == "HOUR") {
         result = hours;
         }
      else if (fname == "MINUTE") {
         result = minutes;
         }
      else if (fname == "SECOND") {
         result = seconds;
         }
      }

   scf.PushOperand(operand, resulttype, result);
   return;

   }

SocialCalc.Formula.FunctionList["HOUR"] = [SocialCalc.Formula.HMSFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList["MINUTE"] = [SocialCalc.Formula.HMSFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList["SECOND"] = [SocialCalc.Formula.HMSFunctions, 1, "v", "", "datetime"];

/*
#
# EXACT(v1,v2)
#
*/

SocialCalc.Formula.ExactFunction = function(fname, operand, foperand, sheet) {

   var scf = SocialCalc.Formula;
   var result = 0;
   var resulttype = "nl";

   var value1 = scf.OperandValueAndType(sheet, foperand);
   var v1type = value1.type.charAt(0);
   var value2 = scf.OperandValueAndType(sheet, foperand);
   var v2type = value2.type.charAt(0);

   if (v1type == "t") {
      if (v2type == "t") {
         result = value1.value == value2.value ? 1 : 0;
         }
      else if (v2type == "b") {
         result = value1.value.length ? 0 : 1;
         }
      else if (v2type == "n") {
         result = value1.value == value2.value+"" ? 1 : 0;
         }
      else if (v2type == "e") {
         result = value2.value;
         resulttype = value2.type;
         }
      else {
         result = 0;
         }
      }
   else if (v1type == "n") {
      if (v2type == "n") {
         result = value1.value-0 == value2.value-0 ? 1 : 0;
         }
      else if (v2type == "b") {
         result = 0;
         }
      else if (v2type == "t") {
         result = value1.value+"" == value2.value ? 1 : 0;
         }
      else if (v2type == "e") {
         result = value2.value;
         resulttype = value2.type;
         }
      else {
         result = 0;
         }
      }
   else if (v1type == "b") {
      if (v2type == "t") {
         result = value2.value.length ? 0 : 1;
         }
      else if (v2type == "b") {
         result = 1;
         }
      else if (v2type == "n") {
         result = 0;
         }
      else if (v2type == "e") {
         result = value2.value;
         resulttype = value2.type;
         }
      else {
         result = 0;
         }
      }
   else if (v1type == "e") {
      result = value1.value;
      resulttype = value1.type;
      }

   scf.PushOperand(operand, resulttype, result);
   return;

   }

SocialCalc.Formula.FunctionList["EXACT"] = [SocialCalc.Formula.ExactFunction, 2, "", "", "text"];

/*
#
# FIND(key,string,[start])
# LEFT(string,[length])
# LEN(string)
# LOWER(string)
# MID(string,start,length)
# PROPER(string)
# REPLACE(string,start,length,new)
# REPT(string,count)
# RIGHT(string,[length])
# SUBSTITUTE(string,old,new,[which])
# TRIM(string)
# HEXCODE(string)
# UPPER(string)
#
*/

// SocialCalc.Formula.ArgList has an array for each function, one entry for each possible arg (up to max).
// Min args are specified in SocialCalc.Formula.FunctionList.
// If array element is 1 then it's a text argument, if it's 0 then it's numeric, if -1 then just get whatever's there
// Text values are manipulated as UTF-8, converting from and back to byte strings

SocialCalc.Formula.ArgList = {
                FIND: [1, 1, 0],
                LEFT: [1, 0],
                LEN: [1],
                LOWER: [1],
                MID: [1, 0, 0],
                PROPER: [1],
                REPLACE: [1, 0, 0, 1],
                REPT: [1, 0],
                RIGHT: [1, 0],
                SUBSTITUTE: [1, 1, 1, 0],
                TRIM: [1],
                HEXCODE: [1],
                UPPER: [1]
               };

SocialCalc.Formula.StringFunctions = function(fname, operand, foperand, sheet) {

   var i, value, offset, len, start, count;
   var scf = SocialCalc.Formula;
   var result = 0;
   var resulttype = "e#VALUE!";

   var numargs = foperand.length;
   var argdef = scf.ArgList[fname];
   var operand_value = [];
   var operand_type = [];

   for (i=1; i <= numargs; i++) { // go through each arg, get value and type, and check for errors
      if (i > argdef.length) { // too many args
         scf.FunctionArgsError(fname, operand);
         return;
         }
      if (argdef[i-1] == 0) {
         value = scf.OperandAsNumber(sheet, foperand);
         }
      else if (argdef[i-1] == 1) {
         value = scf.OperandAsText(sheet, foperand);
         }
      else if (argdef[i-1] == -1) {
         value = scf.OperandValueAndType(sheet, foperand);
         }
      operand_value[i] = value.value;
      operand_type[i] = value.type;
      if (value.type.charAt(0) == "e") {
         scf.PushOperand(operand, value.type, result);
         return;
         }
      }

   switch (fname) {
      case "FIND":
         offset = operand_type[3] ? operand_value[3]-1 : 0;
         if (offset < 0) {
            result = "Start is before string"; // !! not displayed, no need to translate
            }
         else {
            result = operand_value[2].indexOf(operand_value[1], offset); // (null string matches first char)
            if (result >= 0) {
               result += 1;
               resulttype = "n";
               }
            else {
               result = "Not found"; // !! not displayed, error is e#VALUE!
               }
            }
         break;

      case "LEFT":
         len = operand_type[2] ? operand_value[2]-0 : 1;
         if (len < 0) {
            result = "Negative length";
            }
         else {
            result = operand_value[1].substring(0, len);
            resulttype = "t";
            }
         break;

      case "LEN":
         result = operand_value[1].length;
         resulttype = "n";
         break;

      case "LOWER":
         result = operand_value[1].toLowerCase();
         resulttype = "t";
         break;

      case "MID":
         start = operand_value[2]-0;
         len = operand_value[3]-0;
         if (len < 1 || start < 1) {
            result = "Bad arguments";
            }
         else {
            result = operand_value[1].substring(start-1, start+len-1);
            resulttype = "t";
            }
         break;

      case "PROPER":
         result = operand_value[1].replace(/\b\w+\b/g, function(word) {
                     return word.substring(0,1).toUpperCase() + 
                        word.substring(1);
                     }); // uppercase first character of words (see JavaScript, Flanagan, 5th edition, page 704)
         resulttype = "t";
         break;

      case "REPLACE":
         start = operand_value[2]-0;
         len = operand_value[3]-0;
         if (len < 0 || start < 1) {
            result = "Bad arguments";
            }
         else {
            result = operand_value[1].substring(0, start-1) + operand_value[4] + 
               operand_value[1].substring(start-1+len);
            resulttype = "t";
            }
         break;

      case "REPT":
         count = operand_value[2]-0;
         if (count < 0) {
            result = "Negative count";
            }
         else {
            result = "";
            for (; count > 0; count--) {
               result += operand_value[1];
               }
            resulttype = "t";
            }
         break;

      case "RIGHT":
         len = operand_type[2] ? operand_value[2]-0 : 1;
         if (len < 0) {
            result = "Negative length";
            }
         else {
            result = operand_value[1].slice(-len);
            resulttype = "t";
            }
         break;

      case "SUBSTITUTE":
         fulltext = operand_value[1];
         oldtext = operand_value[2];
         newtext = operand_value[3];
         if (operand_value[4] != null) {
            which = operand_value[4]-0;
            if (which <= 0) {
               result = "Non-positive instance number";
               break;
               }
            }
         else {
            which = 0;
            }
         count = 0;
         oldpos = 0;
         result = "";
         while (true) {
            pos = fulltext.indexOf(oldtext, oldpos);
            if (pos >= 0) {
               count++; //!!!!!! old test just in case: if (count>1000) {alert(pos); break;}
               result += fulltext.substring(oldpos, pos);
               if (which==0) {
                  result += newtext; // substitute
                  }
               else if (which==count) {
                  result += newtext + fulltext.substring(pos+oldtext.length);
                  break;
                  }
               else {
                  result += oldtext; // leave as was
                  }
               oldpos = pos + oldtext.length;
               }
            else { // no more
               result += fulltext.substring(oldpos);
               break;
               }
            }
         resulttype = "t";
         break;

      case "TRIM":
         result = operand_value[1];
         result = result.replace(/^ */, "");
         result = result.replace(/ *$/, "");
         result = result.replace(/ +/g, " ");
         resulttype = "t";
         break;

      case "HEXCODE":
         result = String(operand_value[1]);
         var code = result.charCodeAt(0);
         if (0xD800 <= code && code <= 0xDBFF) {
             var next = result.charCodeAt(1);
             if (0xDC00 <= next && next <= 0xDFFF) {
                 code = ((code - 0xD800) * 0x400) + (next - 0xDC00) + 0x10000;
             }
         }
         result = code.toString(16).toUpperCase();
         resulttype = "t";
         break;

      case "UPPER":
         result = operand_value[1].toUpperCase();
         resulttype = "t";
         break;

      }

   scf.PushOperand(operand, resulttype, result);
   return;

   }

SocialCalc.Formula.FunctionList["FIND"] = [SocialCalc.Formula.StringFunctions, -2, "find", "", "text"];
SocialCalc.Formula.FunctionList["LEFT"] = [SocialCalc.Formula.StringFunctions, -2, "tc", "", "text"];
SocialCalc.Formula.FunctionList["LEN"] = [SocialCalc.Formula.StringFunctions, 1, "txt", "", "text"];
SocialCalc.Formula.FunctionList["LOWER"] = [SocialCalc.Formula.StringFunctions, 1, "txt", "", "text"];
SocialCalc.Formula.FunctionList["MID"] = [SocialCalc.Formula.StringFunctions, 3, "mid", "", "text"];
SocialCalc.Formula.FunctionList["PROPER"] = [SocialCalc.Formula.StringFunctions, 1, "v", "", "text"];
SocialCalc.Formula.FunctionList["REPLACE"] = [SocialCalc.Formula.StringFunctions, 4, "replace", "", "text"];
SocialCalc.Formula.FunctionList["REPT"] = [SocialCalc.Formula.StringFunctions, 2, "tc", "", "text"];
SocialCalc.Formula.FunctionList["RIGHT"] = [SocialCalc.Formula.StringFunctions, -1, "tc", "", "text"];
SocialCalc.Formula.FunctionList["SUBSTITUTE"] = [SocialCalc.Formula.StringFunctions, -3, "subs", "", "text"];
SocialCalc.Formula.FunctionList["TRIM"] = [SocialCalc.Formula.StringFunctions, 1, "v", "", "text"];
SocialCalc.Formula.FunctionList["HEXCODE"] = [SocialCalc.Formula.StringFunctions, 1, "v", "", "text"];
SocialCalc.Formula.FunctionList["UPPER"] = [SocialCalc.Formula.StringFunctions, 1, "v", "", "text"];

/*
#
# is_functions:
#
# ISBLANK(value)
# ISERR(value)
# ISERROR(value)
# ISLOGICAL(value)
# ISNA(value)
# ISNONTEXT(value)
# ISNUMBER(value)
# ISTEXT(value)
#
*/

SocialCalc.Formula.IsFunctions = function(fname, operand, foperand, sheet) {

   var scf = SocialCalc.Formula;
   var result = 0;
   var resulttype = "nl";

   var value = scf.OperandValueAndType(sheet, foperand);
   var t = value.type.charAt(0);

   switch (fname) {

      case "ISBLANK":
         result = value.type == "b" ? 1 : 0;
         break;

      case "ISERR":
         result = t == "e" ? (value.type == "e#N/A" ? 0 : 1) : 0;
         break;

      case "ISERROR":
         result = t == "e" ? 1 : 0;
         break;

      case "ISLOGICAL":
         result = value.type == "nl" ? 1 : 0;
         break;

      case "ISNA":
         result = value.type == "e#N/A" ? 1 : 0;
         break;

      case "ISNONTEXT":
         result = t == "t" ? 0 : 1;
         break;

      case "ISNUMBER":
         result = t == "n" ? 1 : 0;
         break;

      case "ISTEXT":
         result = t == "t" ? 1 : 0;
         break;
      }

   scf.PushOperand(operand, resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["ISBLANK"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList["ISERR"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList["ISERROR"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList["ISLOGICAL"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList["ISNA"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList["ISNONTEXT"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList["ISNUMBER"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList["ISTEXT"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];

/*
#
# ntv_functions:
#
# N(value)
# T(value)
# VALUE(value)
#
*/

SocialCalc.Formula.NTVFunctions = function(fname, operand, foperand, sheet) {

   var scf = SocialCalc.Formula;
   var result = 0;
   var resulttype = "e#VALUE!";

   var value = scf.OperandValueAndType(sheet, foperand);
   var t = value.type.charAt(0);

   switch (fname) {

      case "N":
         result = t == "n" ? value.value-0 : 0;
         resulttype = "n";
         break;

      case "T":
         result = t == "t" ? value.value+"" : "";
         resulttype = "t";
         break;

      case "VALUE":
         if (t == "n" || t == "b") {
            result = value.value || 0;
            resulttype = "n";
            }
         else if (t == "t") {
            value = SocialCalc.DetermineValueType(value.value);
            if (value.type.charAt(0) != "n") {
               result = 0;
               resulttype = "e#VALUE!";
               }
            else {
               result = value.value-0;
               resulttype = "n";
               }
            }
         break;
      }

   if (t == "e") { // error trumps
      resulttype = value.type;
      }

   scf.PushOperand(operand, resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["N"] = [SocialCalc.Formula.NTVFunctions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["T"] = [SocialCalc.Formula.NTVFunctions, 1, "v", "", "text"];
SocialCalc.Formula.FunctionList["VALUE"] = [SocialCalc.Formula.NTVFunctions, 1, "v", "", "text"];

/*
#
# ABS(value)
# ACOS(value)
# ASIN(value)
# ATAN(value)
# COS(value)
# DEGREES(value)
# EVEN(value)
# EXP(value)
# FACT(value)
# INT(value)
# LN(value)
# LOG10(value)
# ODD(value)
# RADIANS(value)
# SIN(value)
# SQRT(value)
# TAN(value)
#
*/

SocialCalc.Formula.Math1Functions = function(fname, operand, foperand, sheet) {

   var v1, value, f;
   var result = {};

   var scf = SocialCalc.Formula;

   v1 = scf.OperandAsNumber(sheet, foperand);
   value = v1.value;
   result.type = scf.LookupResultType(v1.type, v1.type, scf.TypeLookupTable.oneargnumeric);

   if (result.type == "n") {
      switch (fname) {
         case "ABS":
            value = Math.abs(value);
            break;

         case "ACOS":
            if (value >= -1 && value <= 1) {
               value = Math.acos(value);
               }
            else {
               result.type = "e#NUM!";
               }
            break;

         case "ASIN":
            if (value >= -1 && value <= 1) {
               value = Math.asin(value);
               }
            else {
               result.type = "e#NUM!";
               }
            break;

         case "ATAN":
            value = Math.atan(value);
            break;

         case "COS":
            value = Math.cos(value);
            break;

         case "DEGREES":
            value = value * 180/Math.PI;
            break;

         case "EVEN":
            value = value < 0 ? -value : value;
            if (value != Math.floor(value)) {
               value = Math.floor(value + 1) + (Math.floor(value + 1) % 2);
               }
            else { // integer
               value = value + (value % 2);
               }
            if (v1.value < 0) value = -value;
            break;

         case "EXP":
            value = Math.exp(value);
            break;

         case "FACT":
            f = 1;
            value = Math.floor(value);
            for (;value>0;value--) {
               f *= value;
               }
            value = f;
            break;

         case "INT":
            value = Math.floor(value); // spreadsheet INT is floor(), not int()
            break;

         case "LN":
            if (value <= 0) {
               result.type = "e#NUM!";
               result.error = SocialCalc.Constants.s_sheetfunclnarg;
               }
            value = Math.log(value);
            break;

         case "LOG10":
            if (value <= 0) {
               result.type = "e#NUM!";
               result.error = SocialCalc.Constants.s_sheetfunclog10arg;
               }
            value = Math.log(value)/Math.log(10);
            break;

         case "ODD":
            value = value < 0 ? -value : value;
            if (value != Math.floor(value)) {
               value = Math.floor(value + 1) + (1 - (Math.floor(value + 1) % 2));
               }
            else { // integer
               value = value + (1 - (value % 2));
               }
            if (v1.value < 0) value = -value;
            break;

         case "RADIANS":
            value = value * Math.PI/180;
            break;

         case "SIN":
            value = Math.sin(value);
            break;

         case "SQRT":
            if (value >= 0) {
               value = Math.sqrt(value);
               }
            else {
               result.type = "e#NUM!";
               }
            break;

         case "TAN":
            if (Math.cos(value) != 0) {
               value = Math.tan(value);
               }
            else {
               result.type = "e#NUM!";
               }
            break;
         }
      }

   result.value = value;
   operand.push(result);

   return null;

   }

// Add to function list
SocialCalc.Formula.FunctionList["ABS"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["ACOS"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["ASIN"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["ATAN"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["COS"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["DEGREES"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["EVEN"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["EXP"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["FACT"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["INT"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["LN"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["LOG10"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["ODD"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["RADIANS"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["SIN"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["SQRT"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["TAN"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];


/*
#
# ATAN2(x, y)
# MOD(a, b)
# POWER(a, b)
# TRUNC(value, precision)
#
*/

SocialCalc.Formula.Math2Functions = function(fname, operand, foperand, sheet) {

   var xval, yval, value, quotient, decimalscale, i;
   var result = {};

   var scf = SocialCalc.Formula;

   xval = scf.OperandAsNumber(sheet, foperand);
   yval = scf.OperandAsNumber(sheet, foperand);
   value = 0;
   result.type = scf.LookupResultType(xval.type, yval.type, scf.TypeLookupTable.twoargnumeric);

   if (result.type == "n") {
      switch (fname) {
         case "ATAN2":
            if (xval.value == 0 && yval.value == 0) {
               result.type = "e#DIV/0!";
               }
            else {
               result.value = Math.atan2(yval.value, xval.value);
               }
            break;

         case "POWER":
            result.value = Math.pow(xval.value, yval.value);
            if (isNaN(result.value)) {
               result.value = 0;
               result.type = "e#NUM!";
               }
            break;

         case "MOD": // en.wikipedia.org/wiki/Modulo_operation, etc.
            if (yval.value == 0) {
               result.type = "e#DIV/0!";
               }
            else {
               quotient = xval.value/yval.value;
               quotient = Math.floor(quotient);
               result.value = xval.value - (quotient * yval.value);
               }
            break;

         case "TRUNC":
            decimalscale = 1; // cut down to required number of decimal digits
            if (yval.value >= 0) {
               yval.value = Math.floor(yval.value);
               for (i=0; i<yval.value; i++) {
                  decimalscale *= 10;
                  }
               result.value = Math.floor(Math.abs(xval.value) * decimalscale) / decimalscale;
               }
            else if (yval.value < 0) {
               yval.value = Math.floor(-yval.value);
               for (i=0; i<yval.value; i++) {
                  decimalscale *= 10;
                  }
               result.value = Math.floor(Math.abs(xval.value) / decimalscale) * decimalscale;
               }
            if (xval.value < 0) {
               result.value = -result.value;
               }
            }
         }
 
   operand.push(result);

   return null;

   }

// Add to function list
SocialCalc.Formula.FunctionList["ATAN2"] = [SocialCalc.Formula.Math2Functions, 2, "xy", "", "math"];
SocialCalc.Formula.FunctionList["MOD"] = [SocialCalc.Formula.Math2Functions, 2, "", "", "math"];
SocialCalc.Formula.FunctionList["POWER"] = [SocialCalc.Formula.Math2Functions, 2, "", "", "math"];
SocialCalc.Formula.FunctionList["TRUNC"] = [SocialCalc.Formula.Math2Functions, 2, "valpre", "", "math"];

/*
#
# LOG(value,[base])
#
*/

SocialCalc.Formula.LogFunction = function(fname, operand, foperand, sheet) {

   var value, value2;
   var result = {};

   var scf = SocialCalc.Formula;

   result.value = 0;

   value = scf.OperandAsNumber(sheet, foperand);
   result.type = scf.LookupResultType(value.type, value.type, scf.TypeLookupTable.oneargnumeric);
   if (foperand.length == 1) {
      value2 = scf.OperandAsNumber(sheet, foperand);
      if (value2.type.charAt(0) != "n" || value2.value <= 0) {
         scf.FunctionSpecificError(fname, operand, "e#NUM!", SocialCalc.Constants.s_sheetfunclogsecondarg);
         return 0;
         }
      }
   else if (foperand.length != 0) {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }
   else {
      value2 = {value: Math.E, type: "n"};
      }

   if (result.type == "n") {
      if (value.value <= 0) {
         scf.FunctionSpecificError(fname, operand, "e#NUM!", SocialCalc.Constants.s_sheetfunclogfirstarg);
         return 0;
         }
      result.value = Math.log(value.value)/Math.log(value2.value);
      }

   operand.push(result);

   return;

   }

SocialCalc.Formula.FunctionList["LOG"] = [SocialCalc.Formula.LogFunction, -1, "log", "", "math"];


/*
#
# ROUND(value,[precision])
#
*/

SocialCalc.Formula.RoundFunction = function(fname, operand, foperand, sheet) {

   var value2, decimalscale, scaledvalue, i;

   var scf = SocialCalc.Formula;
   var result = 0;
   var resulttype = "e#VALUE!";

   var value = scf.OperandValueAndType(sheet, foperand);
   var resulttype = scf.LookupResultType(value.type, value.type, scf.TypeLookupTable.oneargnumeric);

   if (foperand.length == 1) {
      value2 = scf.OperandValueAndType(sheet, foperand);
      if (value2.type.charAt(0) != "n") {
         scf.FunctionSpecificError(fname, operand, "e#NUM!", SocialCalc.Constants.s_sheetfuncroundsecondarg);
         return 0;
         }
      }
   else if (foperand.length != 0) {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }
   else {
      value2 = {value: 0, type: "n"}; // if no second arg, assume 0 for simple round
      }

   if (resulttype == "n") {
      value2.value = value2.value-0;
      if (value2.value == 0) {
         result = Math.round(value.value);
         }
      else if (value2.value > 0) {
         decimalscale = 1; // cut down to required number of decimal digits
         value2.value = Math.floor(value2.value);
         for (i=0; i<value2.value; i++) {
            decimalscale *= 10;
            }
         scaledvalue = Math.round(value.value * decimalscale);
         result = scaledvalue / decimalscale;
         }
      else if (value2.value < 0) {
         decimalscale = 1; // cut down to required number of decimal digits
         value2.value = Math.floor(-value2.value);
         for (i=0; i<value2.value; i++) {
            decimalscale *= 10;
            }
         scaledvalue = Math.round(value.value / decimalscale);
         result = scaledvalue * decimalscale;
         }
      }

   scf.PushOperand(operand, resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["ROUND"] = [SocialCalc.Formula.RoundFunction, -1, "vp", "", "math"];

/*
#
# CEILING(value, [significance])
# FLOOR(value, [significance])
#
*/

SocialCalc.Formula.CeilingFloorFunctions = function(fname, operand, foperand, sheet) {

   var scf = SocialCalc.Formula;
   var val, sig, t;

   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   val = scf.OperandValueAndType(sheet, foperand);
   t = val.type.charAt(0);
   if (t != "n") {
      PushOperand("e#VALUE!", 0);
      return;
      }
   if (val.value == 0) {
      PushOperand("n", 0);
      return;
      }

   if (foperand.length == 1) {
      sig = scf.OperandValueAndType(sheet, foperand);
      t = val.type.charAt(0);
      if (t != "n") {
         PushOperand("e#VALUE!", 0);
         return;
         }
      }
   else if (foperand.length == 0) {
      sig = {type: "n", value: val.value > 0 ? 1 : -1};
      }
   else {
      PushOperand("e#VALUE!", 0);
      return;
      }
   if (sig.value == 0) {
      PushOperand("n", 0);
      return;
      }
   if (sig.value * val.value < 0) {
      PushOperand("e#NUM!", 0);
      return;
      }

   switch (fname) {
      case "CEILING":
         PushOperand("n", Math.ceil(val.value / sig.value) * sig.value);
         break;
      case "FLOOR":
         PushOperand("n", Math.floor(val.value / sig.value) * sig.value);
         break;
      }

   return;

   }

SocialCalc.Formula.FunctionList["CEILING"] = [SocialCalc.Formula.CeilingFloorFunctions, -1, "vsig", "", "math"];
SocialCalc.Formula.FunctionList["FLOOR"] = [SocialCalc.Formula.CeilingFloorFunctions, -1, "vsig", "", "math"];

/*
#
# AND(v1,c1:c2,...)
# OR(v1,c1:c2,...)
#
*/

SocialCalc.Formula.AndOrFunctions = function(fname, operand, foperand, sheet) {

   var value1, result;

   var scf = SocialCalc.Formula;
   var resulttype = "";

   if (fname == "AND") {
      result = 1;
      }
   else if (fname == "OR") {
      result = 0;
      }

   while (foperand.length) {
      value1 = scf.OperandValueAndType(sheet, foperand);
      if (value1.type.charAt(0) == "n") {
         value1.value = value1.value-0;
         if (fname == "AND") {
            result = value1.value != 0 ? result : 0;
            }
         else if (fname == "OR") {
            result = value1.value != 0 ? 1 : result;
            }
         resulttype = scf.LookupResultType(value1.type, resulttype || "nl", scf.TypeLookupTable.propagateerror);
         }
      else if (value1.type.charAt(0) == "e" && resulttype.charAt(0) != "e") {
         resulttype = value1.type;
         }
      }
   if (resulttype.length < 1) {
      resulttype = "e#VALUE!";
      result = 0;
      }

   scf.PushOperand(operand, resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["AND"] = [SocialCalc.Formula.AndOrFunctions, -1, "vn", "", "test"];
SocialCalc.Formula.FunctionList["OR"] = [SocialCalc.Formula.AndOrFunctions, -1, "vn", "", "test"];

/*
#
# NOT(value)
#
*/

SocialCalc.Formula.NotFunction = function(fname, operand, foperand, sheet) {

   var result = 0;
   var scf = SocialCalc.Formula;
   var value = scf.OperandValueAndType(sheet, foperand);
   var resulttype = scf.LookupResultType(value.type, value.type, scf.TypeLookupTable.propagateerror);

   if (value.type.charAt(0) == "n" || value.type == "b") {
      result = value.value-0 != 0 ? 0 : 1; // do the "not" operation
      resulttype = "nl";
      }
   else if (value.type.charAt(0) == "t") {
      resulttype = "e#VALUE!";
      }

   scf.PushOperand(operand, resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["NOT"] = [SocialCalc.Formula.NotFunction, 1, "v", "", "test"];

/*
#
# CHOOSE(index,value1,value2,...)
#
*/

SocialCalc.Formula.ChooseFunction = function(fname, operand, foperand, sheet) {

   var resulttype, count, value1;
   var result = 0;
   var scf = SocialCalc.Formula;

   var cindex = scf.OperandAsNumber(sheet, foperand);

   if (cindex.type.charAt(0) != "n") {
      cindex.value = 0;
      }
   cindex.value = Math.floor(cindex.value);

   count = 0;
   while (foperand.length) {
      value1 = scf.TopOfStackValueAndType(sheet, foperand);
      count += 1;
      if (cindex.value == count) {
         result = value1.value;
         resulttype = value1.type;
         break;
         }
      }
   if (resulttype) { // found something
      scf.PushOperand(operand, resulttype, result);
      }
   else {
      scf.PushOperand(operand, "e#VALUE!", 0);
      }

   return;

   }

SocialCalc.Formula.FunctionList["CHOOSE"] = [SocialCalc.Formula.ChooseFunction, -2, "choose", "", "lookup"];

/*
#
# COLUMNS(c1:c2)
# ROWS(c1:c2)
#
*/

SocialCalc.Formula.ColumnsRowsFunctions = function(fname, operand, foperand, sheet) {

   var resulttype, rangeinfo;
   var result = 0;
   var scf = SocialCalc.Formula;

   var value1 = scf.TopOfStackValueAndType(sheet, foperand);

   if (value1.type == "coord") {
      result = 1;
      resulttype = "n";
      }

   else if (value1.type == "range") {
      rangeinfo = scf.DecodeRangeParts(sheet, value1.value);
      if (fname == "COLUMNS") {
         result = rangeinfo.ncols;
         }
      else if (fname == "ROWS") {
         result = rangeinfo.nrows;
         }
      resulttype = "n";
      }
   else {
      result = 0;
      resulttype = "e#VALUE!";
      }

   scf.PushOperand(operand, resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["COLUMNS"] = [SocialCalc.Formula.ColumnsRowsFunctions, 1, "range", "", "lookup"];
SocialCalc.Formula.FunctionList["ROWS"] = [SocialCalc.Formula.ColumnsRowsFunctions, 1, "range", "", "lookup"];


/*
#
# FALSE()
# NA()
# NOW()
# PI()
# TODAY()
# TRUE()
#
*/

SocialCalc.Formula.ZeroArgFunctions = function(fname, operand, foperand, sheet) {

   var startval, tzoffset, start_1_1_1970, seconds_in_a_day, nowdays;
   var result = {value: 0};
   
   switch (fname) {
      case "FALSE":
         result.type = "nl";
         result.value = 0;
         break;

      case "NA":
         result.type = "e#N/A";
         break;

      case "NOW":
         startval = new Date();
         tzoffset = startval.getTimezoneOffset();
         startval = startval.getTime() / 1000; // convert to seconds
         start_1_1_1970 = 25569; // Day number of 1/1/1970 starting with 1/1/1900 as 1
         seconds_in_a_day = 24 * 60 * 60;
         nowdays = start_1_1_1970 + startval / seconds_in_a_day - tzoffset/(24*60);
         result.value = nowdays;
         result.type = "ndt";
         SocialCalc.Formula.FreshnessInfo.volatile.NOW = true; // remember
         break;

      case "PI":
         result.type = "n";
         result.value = Math.PI;
         break;

      case "TODAY":
         startval = new Date();
         tzoffset = startval.getTimezoneOffset();
         startval = startval.getTime() / 1000; // convert to seconds
         start_1_1_1970 = 25569; // Day number of 1/1/1970 starting with 1/1/1900 as 1
         seconds_in_a_day = 24 * 60 * 60;
         nowdays = start_1_1_1970 + startval / seconds_in_a_day - tzoffset/(24*60);
         result.value = Math.floor(nowdays);
         result.type = "nd";
         SocialCalc.Formula.FreshnessInfo.volatile.TODAY = true; // remember
         break;

      case "TRUE":
         result.type = "nl";
         result.value = 1;
         break;

      }

   operand.push(result);

   return null;

}

// Add to function list
SocialCalc.Formula.FunctionList["FALSE"] = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "test"];
SocialCalc.Formula.FunctionList["NA"] = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "test"];
SocialCalc.Formula.FunctionList["NOW"] = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "datetime"];
SocialCalc.Formula.FunctionList["PI"] = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "math"];
SocialCalc.Formula.FunctionList["TODAY"] = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "datetime"];
SocialCalc.Formula.FunctionList["TRUE"] = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "test"];

//
// * * * * * FINANCIAL FUNCTIONS * * * * *
//

/*
#
# DDB(cost,salvage,lifetime,period,[method])
#
# Depreciation, method defaults to 2 for double-declining balance
# See: http://en.wikipedia.org/wiki/Depreciation
#
*/

SocialCalc.Formula.DDBFunction = function(fname, operand, foperand, sheet) {

   var method, depreciation, accumulateddepreciation, i;
   var scf = SocialCalc.Formula;

   var cost = scf.OperandAsNumber(sheet, foperand);
   var salvage = scf.OperandAsNumber(sheet, foperand);
   var lifetime = scf.OperandAsNumber(sheet, foperand);
   var period = scf.OperandAsNumber(sheet, foperand);

   if (scf.CheckForErrorValue(operand, cost)) return;
   if (scf.CheckForErrorValue(operand, salvage)) return;
   if (scf.CheckForErrorValue(operand, lifetime)) return;
   if (scf.CheckForErrorValue(operand, period)) return;

   if (lifetime.value < 1) {
      scf.FunctionSpecificError(fname, operand, "e#NUM!", SocialCalc.Constants.s_sheetfuncddblife);
      return 0;
      }

   method = {value: 2, type: "n"};
   if (foperand.length > 0 ) {
      method = scf.OperandAsNumber(sheet, foperand);
      }
   if (foperand.length != 0) {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }
   if (scf.CheckForErrorValue(operand, method)) return;

   depreciation = 0; // calculated for each period
   accumulateddepreciation = 0; // accumulated by adding each period's

   for (i=1; i<=period.value-0 && i<=lifetime.value; i++) { // calculate for each period based on net from previous
      depreciation = (cost.value - accumulateddepreciation) * (method.value / lifetime.value);
      if (cost.value - accumulateddepreciation - depreciation < salvage.value) { // don't go lower than salvage value
         depreciation = cost.value - accumulateddepreciation - salvage.value;
         }
      accumulateddepreciation += depreciation;
      }

   scf.PushOperand(operand, 'n$', depreciation);

   return;

   }

SocialCalc.Formula.FunctionList["DDB"] = [SocialCalc.Formula.DDBFunction, -4, "ddb", "", "financial"];

/*
#
# SLN(cost,salvage,lifetime)
#
# Depreciation for each period by straight-line method
# See: http://en.wikipedia.org/wiki/Depreciation
#
*/

SocialCalc.Formula.SLNFunction = function(fname, operand, foperand, sheet) {

   var depreciation;
   var scf = SocialCalc.Formula;

   var cost = scf.OperandAsNumber(sheet, foperand);
   var salvage = scf.OperandAsNumber(sheet, foperand);
   var lifetime = scf.OperandAsNumber(sheet, foperand);

   if (scf.CheckForErrorValue(operand, cost)) return;
   if (scf.CheckForErrorValue(operand, salvage)) return;
   if (scf.CheckForErrorValue(operand, lifetime)) return;

   if (lifetime.value < 1) {
      scf.FunctionSpecificError(fname, operand, "e#NUM!", SocialCalc.Constants.s_sheetfuncslnlife);
      return 0;
      }

   depreciation = (cost.value - salvage.value) / lifetime.value;

   scf.PushOperand(operand, 'n$', depreciation);

   return;

   }

SocialCalc.Formula.FunctionList["SLN"] = [SocialCalc.Formula.SLNFunction, 3, "csl", "", "financial"];

/*
#
# SYD(cost,salvage,lifetime,period)
#
# Depreciation by Sum of Year's Digits method
#
*/

SocialCalc.Formula.SYDFunction = function(fname, operand, foperand, sheet) {

   var depreciation, sumperiods;
   var scf = SocialCalc.Formula;

   var cost = scf.OperandAsNumber(sheet, foperand);
   var salvage = scf.OperandAsNumber(sheet, foperand);
   var lifetime = scf.OperandAsNumber(sheet, foperand);
   var period = scf.OperandAsNumber(sheet, foperand);

   if (scf.CheckForErrorValue(operand, cost)) return;
   if (scf.CheckForErrorValue(operand, salvage)) return;
   if (scf.CheckForErrorValue(operand, lifetime)) return;
   if (scf.CheckForErrorValue(operand, period)) return;

   if (lifetime.value < 1 || period.value <= 0) {
      scf.PushOperand(operand, "e#NUM!", 0);
      return 0;
      }

   sumperiods = ((lifetime.value + 1) * lifetime.value)/2; // add up 1 through lifetime
   depreciation = (cost.value - salvage.value) * (lifetime.value - period.value + 1) / sumperiods; // calc depreciation

   scf.PushOperand(operand, 'n$', depreciation);

   return;

   }

SocialCalc.Formula.FunctionList["SYD"] = [SocialCalc.Formula.SYDFunction, 4, "cslp", "", "financial"];

/*
#
# FV(rate, n, payment, [pv, [paytype]])
# NPER(rate, payment, pv, [fv, [paytype]])
# PMT(rate, n, pv, [fv, [paytype]])
# PV(rate, n, payment, [fv, [paytype]])
# RATE(n, payment, pv, [fv, [paytype, [guess]]])
#
# Following the Open Document Format formula specification:
#
#    PV = - Fv - (Payment * Nper) [if rate equals 0]
#    Pv*(1+Rate)^Nper + Payment * (1 + Rate*PaymentType) * ( (1+Rate)^nper -1)/Rate + Fv = 0
#
# For each function, the formulas are solved for the appropriate value (transformed using
# basic algebra).
#
*/

SocialCalc.Formula.InterestFunctions = function(fname, operand, foperand, sheet) {

   var resulttype, result, dval, eval, fval;
   var pv, fv, rate, n, payment, paytype, guess, part1, part2, part3, part4, part5;
   var olddelta, maxloop, tries, deltaepsilon, rate, oldrate, m;

   var scf = SocialCalc.Formula;

   var aval = scf.OperandAsNumber(sheet, foperand);
   var bval = scf.OperandAsNumber(sheet, foperand);
   var cval = scf.OperandAsNumber(sheet, foperand);

   resulttype = scf.LookupResultType(aval.type, bval.type, scf.TypeLookupTable.twoargnumeric);
   resulttype = scf.LookupResultType(resulttype, cval.type, scf.TypeLookupTable.twoargnumeric);
   if (foperand.length) { // optional arguments
      dval = scf.OperandAsNumber(sheet, foperand);
      resulttype = scf.LookupResultType(resulttype, dval.type, scf.TypeLookupTable.twoargnumeric);
      if (foperand.length) { // optional arguments
         eval = scf.OperandAsNumber(sheet, foperand);
         resulttype = scf.LookupResultType(resulttype, eval.type, scf.TypeLookupTable.twoargnumeric);
         if (foperand.length) { // optional arguments
            if (fname != "RATE") { // only rate has 6 possible args
               scf.FunctionArgsError(fname, operand);
               return 0;
               }
            fval = scf.OperandAsNumber(sheet, foperand);
            resulttype = scf.LookupResultType(resulttype, fval.type, scf.TypeLookupTable.twoargnumeric);
            }
         }
      }

   if (resulttype == "n") {
      switch (fname) {
         case "FV": // FV(rate, n, payment, [pv, [paytype]])
            rate = aval.value;
            n = bval.value;
            payment = cval.value;
            pv = dval!=null ? dval.value : 0; // get value if present, or use default
            paytype = eval!=null ? (eval.value ? 1 : 0) : 0;
            if (rate == 0) { // simple calculation if no interest
               fv = -pv - (payment * n);
               }
            else {
               fv = -(pv*Math.pow(1+rate,n) + payment * (1 + rate*paytype) * ( Math.pow(1+rate,n) -1)/rate);
               }
            result = fv;
            resulttype = 'n$';
            break;

         case "NPER": // NPER(rate, payment, pv, [fv, [paytype]])
            rate = aval.value;
            payment = bval.value;
            pv = cval.value;
            fv = dval!=null ? dval.value : 0;
            paytype = eval!=null ? (eval.value ? 1 : 0) : 0;
            if (rate == 0) { // simple calculation if no interest
               if (payment == 0) {
                  scf.PushOperand(operand, "e#NUM!", 0);
                  return;
                  }
               n = (pv + fv)/(-payment);
               }
            else {
               part1 = payment * (1 + rate * paytype) / rate;
               part2 = pv + part1;
               if (part2 == 0 || rate <= -1) {
                  scf.PushOperand(operand, "e#NUM!", 0);
                  return;
                  }
               part3 = (part1 - fv) / part2;
               if (part3 <= 0) {
                  scf.PushOperand(operand, "e#NUM!", 0);
                  return;
                  }
               part4 = Math.log(part3);
               part5 = Math.log(1 + rate); // rate > -1
               n = part4/part5;
               }
            result = n;
            resulttype = 'n';
            break;

         case "PMT": // PMT(rate, n, pv, [fv, [paytype]])
            rate = aval.value;
            n = bval.value;
            pv = cval.value;
            fv = dval!=null ? dval.value : 0;
            paytype = eval!=null ? (eval.value ? 1 : 0) : 0;
            if (n == 0) {
               scf.PushOperand(operand, "e#NUM!", 0);
               return;
               }
            else if (rate == 0) { // simple calculation if no interest
               payment = (fv - pv)/n;
               }
            else {
               payment = (0 - fv - pv*Math.pow(1+rate,n))/((1 + rate*paytype) * ( Math.pow(1+rate,n) -1)/rate);
               }
            result = payment;
            resulttype = 'n$';
            break;

         case "PV": // PV(rate, n, payment, [fv, [paytype]])
            rate = aval.value;
            n = bval.value;
            payment = cval.value;
            fv = dval!=null ? dval.value : 0;
            paytype = eval!=null ? (eval.value ? 1 : 0) : 0;
            if (rate == -1) {
               scf.PushOperand(operand, "e#DIV/0!", 0);
               return;
               }
            else if (rate == 0) { // simple calculation if no interest
               pv = -fv - (payment * n);
               }
            else {
               pv = (-fv - payment * (1 + rate*paytype) * ( Math.pow(1+rate,n) -1)/rate)/(Math.pow(1+rate,n));
               }
            result = pv;
            resulttype = 'n$';
            break;

            case "RATE": // RATE(n, payment, pv, [fv, [paytype, [guess]]])
               n = aval.value;
               payment = bval.value;
               pv = cval.value;
               fv = dval!=null ? dval.value : 0;
               paytype = eval!=null ? (eval.value ? 1 : 0) : 0;
               guess = fval!=null ? fval.value : 0.1;

               // rate is calculated by repeated approximations
               // The deltas are used to calculate new guesses

               maxloop = 100;
               tries = 0;
               delta = 1;
               epsilon = 0.0000001; // this is close enough
               rate = guess || 0.00000001; // zero is not allowed
               while ((delta >= 0 ? delta : -delta) > epsilon && (rate != oldrate)) {
                  delta = fv + pv*Math.pow(1+rate,n) + payment * (1 + rate*paytype) * ( Math.pow(1+rate,n) -1)/rate;
                  if (olddelta!=null) {
                     m = (delta - olddelta)/(rate - oldrate) || .001; // get slope (not zero)
                     oldrate = rate;
                     rate = rate - delta / m; // look for zero crossing
                     olddelta = delta;
                     }
                  else { // first time - no old values
                     oldrate = rate;
                     rate = 1.1 * rate;
                     olddelta = delta;
                     }
                  tries++;
                  if (tries >= maxloop) { // didn't converge yet
                     scf.PushOperand(operand, "e#NUM!", 0);
                     return;
                     }
                  }
               result = rate;
               resulttype = 'n%';
               break;
         }
      }
 
   scf.PushOperand(operand, resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["FV"] = [SocialCalc.Formula.InterestFunctions, -3, "fv", "", "financial"];
SocialCalc.Formula.FunctionList["NPER"] = [SocialCalc.Formula.InterestFunctions, -3, "nper", "", "financial"];
SocialCalc.Formula.FunctionList["PMT"] = [SocialCalc.Formula.InterestFunctions, -3, "pmt", "", "financial"];
SocialCalc.Formula.FunctionList["PV"] = [SocialCalc.Formula.InterestFunctions, -3, "pv", "", "financial"];
SocialCalc.Formula.FunctionList["RATE"] = [SocialCalc.Formula.InterestFunctions, -3, "rate", "", "financial"];

/*
#
# NPV(rate,v1,v2,c1:c2,...)
#
*/

SocialCalc.Formula.NPVFunction = function(fname, operand, foperand, sheet) {

   var resulttypenpv, rate, sum, factor, value1;

   var scf = SocialCalc.Formula;

   var rate = scf.OperandAsNumber(sheet, foperand);
   if (scf.CheckForErrorValue(operand, rate)) return;

   sum = 0;
   resulttypenpv = "n";
   factor = 1;

   while (foperand.length) {
      value1 = scf.OperandValueAndType(sheet, foperand);
      if (value1.type.charAt(0) == "n") {
         factor *= (1 + rate.value);
         if (factor == 0) {
            scf.PushOperand(operand, "e#DIV/0!", 0);
            return;
            }
         sum += value1.value / factor;
         resulttypenpv = scf.LookupResultType(value1.type, resulttypenpv || value1.type, scf.TypeLookupTable.plus);
         }
      else if (value1.type.charAt(0) == "e" && resulttypenpv.charAt(0) != "e") {
         resulttypenpv = value1.type;
         break;
         }
      }

   if (resulttypenpv.charAt(0) == "n") {
      resulttypenpv = 'n$';
      }

   scf.PushOperand(operand, resulttypenpv, sum);

   return;

   }

SocialCalc.Formula.FunctionList["NPV"] = [SocialCalc.Formula.NPVFunction, -2, "npv", "", "financial"];

/*
#
# IRR(c1:c2,[guess])
#
*/

SocialCalc.Formula.IRRFunction = function(fname, operand, foperand, sheet) {

   var value1, guess, oldsum, maxloop, tries, epsilon, rate, oldrate, m, sum, factor, i;
   var rangeoperand = [];
   var cashflows = [];

   var scf = SocialCalc.Formula;

   rangeoperand.push(foperand.pop()); // first operand is a range

   while (rangeoperand.length) { // get values from range so we can do iterative approximations
      value1 = scf.OperandValueAndType(sheet, rangeoperand);
      if (value1.type.charAt(0) == "n") {
         cashflows.push(value1.value);
         }
      else if (value1.type.charAt(0) == "e") {
         scf.PushOperand(operand, "e#VALUE!", 0);
         return;
         }
      }

   if (!cashflows.length) {
      scf.PushOperand(operand, "e#NUM!", 0);
      return;
      }

   guess = {value: 0};

   if (foperand.length) { // guess is provided
      guess = scf.OperandAsNumber(sheet, foperand);
      if (guess.type.charAt(0) != "n" && guess.type.charAt(0) != "b") {
         scf.PushOperand(operand, "e#VALUE!", 0);
         return;
         }
      if (foperand.length) { // should be no more args
         scf.FunctionArgsError(fname, operand);
         return;
         }
      }

   guess.value = guess.value || 0.1;

   // rate is calculated by repeated approximations
   // The deltas are used to calculate new guesses

   maxloop = 20;
   tries = 0;
   epsilon = 0.0000001; // this is close enough
   rate = guess.value;
   sum = 1;

   while ((sum >= 0 ? sum : -sum) > epsilon && (rate != oldrate)) {
      sum = 0;
      factor = 1;
      for (i=0; i<cashflows.length; i++) {
         factor *= (1 + rate);
         if (factor == 0) {
            scf.PushOperand(operand, "e#DIV/0!", 0);
            return;
            }
         sum += cashflows[i] / factor;
         }

      if (oldsum!=null) {
         m = (sum - oldsum)/(rate - oldrate); // get slope
         oldrate = rate;
         rate = rate - sum / m; // look for zero crossing
         oldsum = sum;
         }
      else { // first time - no old values
         oldrate = rate;
         rate = 1.1 * rate;
         oldsum = sum;
         }
      tries++;
      if (tries >= maxloop) { // didn't converge yet
         scf.PushOperand(operand, "e#NUM!", 0);
         return;
         }
      }

   scf.PushOperand(operand, 'n%', rate);

   return;

   }

SocialCalc.Formula.FunctionList["IRR"] = [SocialCalc.Formula.IRRFunction, -1, "irr", "", "financial"];



// -----------------------------------------
// eddy  BUTTON COPYVALUE COPYFORMULA {
// -----------------------------------------

/*
#
# BUTTON(string) // 
# IMAGEBUTTON(string) 
# TEXTBOX(string) // 
# AUTOCOMPLETE(string, range)
# SELECT(string, range [,size [,multiple]])
# CHECKBOX(string) // 
# RADIOBUTTON(string,groupname)
# COPYVALUE(range, destinationCell, value_or_range) // 
# COPYFORMULA(range, destinationCell, formula_range)) // 
# INSERT(trigger_cell, destination_range [,formula_range,value_range,formula_range, ...])
# DELETEIF(trigger_cell, criteria , test_range) 
# COMMAND(trigger_cell, commands)
# COMMANDIF(trigger_cell, condition, commands) 
# PANEL(indices_or_csv, panel1_range [, panel2_range , ...])  
#
*/


SocialCalc.Formula.IoFunctions = function(fname, operand, foperand, sheet, coord) {

  
// ArgList has an array for each function, one entry for each possible arg (up to max).
// Min args are specified in SocialCalc.Formula.FunctionList.
// Minus values are repeated parameters
//  -1 to -15  - repeated parameters
//  -1 - [number, ...]  - e.g. [2,-1,-2]  means (text, [number, text, number, text, ... ] - repeated parameters
//  1 - number 
//  2 - text 
//  3 - text | number 
//  4 - coord 
//  5 - coord | number 
//  6 - coord | text 
//  7 - coord | text | number 
//  8 - range 
//  9 - range | number 
//  10 - range | text 11 - range | text | number 
//  12 - range | coord 
//  13 - range | coord | number 
//  14 - range | coord | text 
//  15 - range | coord | text | number 



   var argList = {
				 BUTTON: [2]
        ,IMAGEBUTTON: [2]
   			,EMAIL: [14, 14, 14, 14]
				,EMAILIF: [13, 14, 14, 14, 14]
				,EMAILONEDIT: [14, 14, 14, 14, 14]
				,EMAILAT: [13, 14, 14, 14, 14]
				,EMAILONEDITIF: [14, 13, 14, 14, 14, 14]
				,EMAILATIF: [13, 13, 14, 14, 14, 14]
        ,SUBMIT: [2]
        ,TEXTBOX: [2]
        ,AUTOCOMPLETE: [2, 14]
        ,SELECT: [2, 14, 1, 1]   // # SELECT(string, range [,size [,multiple]])
        ,CHECKBOX: [3]
        ,RADIOBUTTON: [2, 2]
				,COPYVALUE: [4, 12, 15]
				,COPYFORMULA: [4, 12, 12]
        ,INSERT: [4, 8, -12, -15]  // change code to allow unlimited 
        ,DELETEIF: [4,7,8]
        ,COMMAND: [4, 14]
        ,COMMANDIF: [4, 13, 14]
        ,PANEL:[15, -12] // # PANEL(indices_or_csv, panel1_range [, panel2_range , ...])  
   };
   
   var i, parameter, offset, len, start, count;
   var scf = SocialCalc.Formula;
   var result = 0;
   var resulttype = "e#VALUE!";

   var numargs = foperand.length;
   var argdef = argList[fname];
   var operand_value = [];
   var operand_type = [];

   var repeatCount = -1;  // number of repeated parameters
   var repeatIndex;  // index of begining of repeated parameters
   var wantedType;
   
   for (i=1; i <= numargs; i++) { // go through each arg, get value and type, and check for errors
      //   IF started repeat parameters section 
      if(repeatCount != -1) {
        //     SET typeWanted = get type - adjust for repeted parameters
        wantedType = Math.abs(argdef[ repeatIndex + (( (i-1) - repeatIndex) % repeatCount) ]);
      } else {
        
        if (i > argdef.length) { // too many args
          scf.FunctionArgsError(fname, operand);
          return;
          }
        
        //     typeWanted = type wanted list [ parameterIndex ]
        wantedType = argdef[i-1];
        
        //     IF typeWanted < 0 && repeatCount == -1
        if(wantedType < 0 ) {
          //       SET repeatCount = wanted list length - parameterIndex
          repeatCount = argdef.length - (i-1);
          //       SET repeatIndex =  parameterIndex
          repeatIndex = (i-1);
          //       wantedType = Math.abs(wantedType )          
          wantedType = Math.abs(wantedType );
        }  //     END IF
      
      } //   END IF

      if(wantedType == 1) { // 1 - number 
        parameter = scf.OperandAsNumber(sheet, foperand);
        
      } else if(wantedType == 2) { // 2 - text 
        parameter = scf.OperandAsText(sheet, foperand);
      } else if(wantedType == 3) { // 3 - text | number 
        parameter = scf.OperandValueAndType(sheet, foperand);
      } else { //  typeWanted > 3  && < 16  - else invalid        
        //        SET parameterType = type
        var parameterType = foperand[foperand.length -1].type; // param is end of stack
        
        //        SET validType = false  
        var validParameterType = false;
        
        //        IF type = number && wanted type == number || type = text && wanted type == text THEN
        //                  1 - number   2 - text 
        if( (parameterType.charAt(0) == "n" && (wantedType & 1) != 0) || (parameterType.charAt(0) == "t" && (wantedType & 2) != 0)) {
          //           valid
          validParameterType = true;
          //           get number type and value 
          parameter = scf.OperandValueAndType(sheet, foperand);
        }  //        END IF
        
        //        IF type = coord && wanted type == coord THEN
        if( parameterType == "coord" && (wantedType & 4) != 0) {  //  4 - coord 
          //          valid
          validParameterType = true;
          parameter = scf.OperandAsCoord(sheet, foperand);
          parameter.value = SocialCalc.Formula.PlainCoord(parameter.value); // remove absolute reference
        } //        END IF
        //        IF type = range && wanted type == range THEN
        if( parameterType == "range" && (wantedType & 8) != 0) { // 8 - range 
          //           valid
          validParameterType = true;
          // get range
          parameter = scf.OperandAsRange(sheet, foperand);          
          parameter.value = SocialCalc.Formula.PlainCoord(parameter.value);  // remove absolute reference
        } //        END IF
        
        //        IF invalid param type
        if(validParameterType == false) {
          scf.FunctionArgsError(fname, operand);
          return;          
        }  //        END IF
        
      }
      
      
      // value or range, e.g. "C9|C11"
      operand_value[i] = parameter.value;
      // type e.g. "t", "range"
      operand_type[i] = parameter.type;
      if (parameter.type.charAt(0) == "e") {
         scf.PushOperand(operand, parameter.type, result);
         return;
      }
   }

   
   switch (fname) {
     case "SELECT":  // # SELECT(string, range [,size [,multiple]])
         var parameters = sheet.ioParameterList[coord];
         var optionSource = SocialCalc.Formula.getStandardizedList(sheet, parameters[1]);
         
         parameters.html = [];        
         parameters.html[0] = (operand_value[4] == true) ? "multiple" : ""
         parameters.html[1] = (operand_value[3]) ? ""+operand_value[3] : "1"
         if(optionSource.length > 0 ) {
           var options = "<option>" + optionSource.join("</option><option>") + "</option>";
           var optionRegExp = new RegExp("<option>"+operand_value[1],'');
           parameters.html[2] = options.replace(optionRegExp, "<option selected>"+operand_value[1] ); // select default, if any
         }
         result = operand_value[1];
         resulttype = "ti"+fname;
         break;
     case "SUBMIT":
       result = "Submit";
     case "BUTTON":
     case "IMAGEBUTTON":
     case "TEXTBOX":
     case "AUTOCOMPLETE":
         if (numargs>0) result = operand_value[1];
         resulttype = "ti"+fname; // (t)ext value with (i)nterface (BUTTON,IMAGEBUTTON,TEXTBOX,AUTOCOMPLETE, SELECT) 
         break;

      case "EMAIL":
      case "EMAILIF":
          resulttype = "ti"+fname; // (t)ext value with (i)nterface (,) 
          result = "Send";
          break;
      case "EMAILONEDIT":
      case "EMAILONEDITIF":
//    	  sheet.editEventCells === 'undefined') return;	
//    	  if(typeof sheet.ioParameterList === 'undefined') return;

    	  
      case "EMAILAT":
      case "EMAILATIF":
          resulttype = "ti"+fname; // (t)ext value with (i)nterface (,) 
          result = "Send Now";
          break;
		 
      case "CHECKBOX":
      case "RADIOBUTTON":
	     if(operand_type[1].charAt(0) == 't') {
			result = (operand_value[1].toUpperCase() == 'TRUE') ? 1 : 0;
			} else {
			result = (operand_value[1] == 0) ? 0 : 1;
			}
		//result = "true"; 
         resulttype = "ni"+fname; // (n)umber value with (i)nterface (CHECKBOX, RADIOBUTTON)

         break;
		 
		 
      case "COPYVALUE":
      case "COPYFORMULA":
      case "INSERT":
      case "DELETEIF":
      case "COMMAND":
      case "COMMANDIF":
         var cell = sheet.cells[operand_value[1]];
         if(typeof cell === 'undefined') break; // invalid trigger cell, return error
         result = cell.datavalue; // get trigger cell value
         
         result = String(result).split("/");  // Clean up - if image button trigger then show only image name 
         result = result[result.length-1]; 
         resulttype = "t";
         break;
      case "PANEL":
        //  - code to show/hide panel
        //  --- get list of panels to show - "showindex_or_csv" 
        //  --- get param details 
        var showindices = SocialCalc.Formula.getStandardizedList(sheet, {value: operand_value[1], type: operand_type[1]});
        
        //  --- SET list of showrows TO empty
        //  --- SET list of showcols TO empty
        result = "Panels:"+ showindices; 
        resulttype = "t";
        if(SocialCalc._app) { // panel only works in live app
          var showrows = [], showcols = [];
          //  --- FOR each panel to show
          for (var parameterIndex = 2; parameterIndex < operand_value.length; ++parameterIndex) { 
            // show panel if its index is in the showindices list 
            var showPanelFound = false;
            for(var showIndex in showindices ) { 
              if (showindices[showIndex] == parameterIndex-1) {
                showPanelFound = true;
                break;
              }
            }
            if(showPanelFound === false) continue;
            
          
            //  ----- get panel range rows & cols only
            var panelCoordData = SocialCalc.Formula.getStandardizedCoords(sheet, {value: operand_value[parameterIndex], type: operand_type[parameterIndex]});
            //  ----- FOR each row/col -- create function to do the loop
            for (var i=0; i<panelCoordData.ncols; i++) {
              //  ------- set showrows/col row/col to true
              showcols[panelCoordData.col1num + i] = true;
            }  //  ----- END FOR                        
            for (var j=0; j<panelCoordData.nrows; j++) {
              //  ------- set showrows/col row/col to true
              showrows[panelCoordData.row1num + j] = true;
            }
          }   //  --- END FOR
          
          var spreadsheet =  window.spreadsheet;
          if (spreadsheet == null) spreadsheet = window.ss

          var forceRender = false;
          var showGridDimension =  function(sheet, lastIndex, sheetHideList, showList, getIndexOf) {
            //  --- hide all rows/col    up to sheet.attribs.lastrow/col         
            //  --- FOR each row/col -- create function to do the loop          
            for(var arrayIndex = 1; arrayIndex <= lastIndex; arrayIndex ++ ) { // start at col/row 1
              //  ----- IF row hide/show state need updating
              var sheetHideIndex = getIndexOf(arrayIndex); // gets col name if col
              if(typeof sheetHideList[sheetHideIndex] == 'undefined') { 
                // row/col is visible
                if(showList[arrayIndex] !== true) { // if hide
                  //  ------- SET the row state  
                  sheetHideList[sheetHideIndex] ="yes";                
                  //  ------- SET repaint flag
                  forceRender = true;
                }
              } else {
                // row/col is hidden 
                if(showList[arrayIndex] === true) { // if show 
                  //  ------- SET the row state  
                  delete sheetHideList[sheetHideIndex];                
                  //  ------- SET repaint flag
                  forceRender = true;
                }
              }              
              
            }            
          };

          
          var getRowIndex = function(row) { return row };
          showGridDimension(sheet,  sheet.attribs.lastrow,  sheet.rowattribs.hide, showrows, getRowIndex);
          showGridDimension(sheet,  sheet.attribs.lastcol,  sheet.colattribs.hide, showcols, SocialCalc.rcColname );
          
          if(forceRender) {
            sheet.renderneeded = true;
            sheet.widgetsClean = false; //  force widgets to repaint - update cell reference in widget HTML    
            spreadsheet.editor.context.rowpanes[0].first = 1; // reset scroll bar to first row  
            spreadsheet.editor.FitToEditTable();
          }
          
        }
         
      }

   scf.PushOperand(operand, resulttype, result);
   return;

   }

//*********************
//
// Docs see - Function Handling - ~line 1560
// 
//*********************



SocialCalc.Formula.FunctionList["BUTTON"] = [SocialCalc.Formula.IoFunctions, 1, "label", "", "gui", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Button('<%=cell_reference%>');\"><%=formated_value%></button>" ];
SocialCalc.Formula.FunctionList["IMAGEBUTTON"] = [SocialCalc.Formula.IoFunctions, 1, "imageurl", "", "gui", "<input type='image' src='<%=display_value%>' alt='Submit' onclick=\"SocialCalc.TriggerIoAction.Button('<%=cell_reference%>');\">" ];
SocialCalc.Formula.FunctionList["EMAIL"] = [SocialCalc.Formula.IoFunctions, -3, "to_range subject_range, body_range", "", "action", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Email('<%=cell_reference%>');\"><%=formated_value%></button>", "ParameterList" ];
SocialCalc.Formula.FunctionList["EMAILIF"] = [SocialCalc.Formula.IoFunctions, -4, "condition_range, to_range subject_range, body_range", "", "action", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Email('<%=cell_reference%>');\"><%=formated_value%></button>", "ParameterList" ];
SocialCalc.Formula.FunctionList["EMAILONEDIT"] = [SocialCalc.Formula.IoFunctions, -4, "editRange, to_range subject_range, body_range", "", "action", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Email('<%=cell_reference%>');\"><%=formated_value%></button>", "EventTree"];
SocialCalc.Formula.FunctionList["EMAILAT"] = [SocialCalc.Formula.IoFunctions, -4, "datetime_value, to_range subject_range, body_range", "", "action", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Email('<%=cell_reference%>');\"><%=formated_value%></button>", "TimeTrigger" ];
SocialCalc.Formula.FunctionList["EMAILONEDITIF"] = [SocialCalc.Formula.IoFunctions, -5, "editRange, condition, to_range subject_range, body_range", "", "action", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Email('<%=cell_reference%>');\"><%=formated_value%></button>", "EventTree" ];
SocialCalc.Formula.FunctionList["EMAILATIF"] = [SocialCalc.Formula.IoFunctions, -5, "datetime_value, condition, to_range subject_range, body_range", "", "action", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Email('<%=cell_reference%>');\"><%=formated_value%></button>", "TimeTrigger" ];
SocialCalc.Formula.FunctionList["SUBMIT"] = [SocialCalc.Formula.IoFunctions, 100, "[label]", "", "action", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Submit('<%=cell_reference%>');\"><%=formated_value%></button>", "ParameterList" ];
SocialCalc.Formula.FunctionList["TEXTBOX"] = [SocialCalc.Formula.IoFunctions, 1, "value", "", "gui", "<input type='text' id='TEXTBOX_<%=cell_reference%>' onblur='SocialCalc.CmdGotFocus(null);' oninput=\"SocialCalc.TriggerIoAction.TextBox('<%=cell_reference%>')\" value='<%=display_value%>' >", "Input" ];
SocialCalc.Formula.FunctionList["AUTOCOMPLETE"] = [SocialCalc.Formula.IoFunctions, 2, "value, range or csv_text", "", "gui", "<input type='text' id='AUTOCOMPLETE_<%=cell_reference%>' onfocus=\"SocialCalc.TriggerIoAction.AddAutocomplete('<%=cell_reference%>');\" onblur='SocialCalc.CmdGotFocus(null);' value='<%=display_value%>' >", "Input" ];
SocialCalc.Formula.FunctionList["SELECT"] = [SocialCalc.Formula.IoFunctions, -2, "value, range or csv_text [,size]", "", "gui", "<select size='<%=html1_value%>' id='SELECT_<%=cell_reference%>' onchange=\"SocialCalc.TriggerIoAction.SelectList('<%=cell_reference%>')\" <%=html0_value%>><%=html2_value%></select>", "Input" ];
SocialCalc.Formula.FunctionList["CHECKBOX"] = [SocialCalc.Formula.IoFunctions, 1, "value", "", "gui", "<input type='checkbox' id='CHECKBOX_<%=cell_reference%>' <%=checked%> onblur='SocialCalc.CmdGotFocus(null);' onchange=\"SocialCalc.TriggerIoAction.CheckBox('<%=cell_reference%>')\" >", "Input" ];
SocialCalc.Formula.FunctionList["RADIOBUTTON"] = [SocialCalc.Formula.IoFunctions, 2, "value, groupname", "", "gui", "<input type='radio' value='<%=cell_reference%>' id='RADIOBUTTON_<%=cell_reference%>' <%=checked%> name='<%=parameter1_value%>' onblur=\"SocialCalc.CmdGotFocus(null);\" onclick=\"SocialCalc.TriggerIoAction.RadioButton('<%=parameter1_value%>');\" >", "Input" ];

SocialCalc.Formula.FunctionList["COPYVALUE"] = [SocialCalc.Formula.IoFunctions, 3, "trigger_cell, destinationCell, value_or_range", "", "action", "", "EventTree"];
SocialCalc.Formula.FunctionList["COPYFORMULA"] = [SocialCalc.Formula.IoFunctions, 3, "trigger_cell, destinationCell, formula_range", "", "action", "", "EventTree"];
SocialCalc.Formula.FunctionList["INSERT"] = [SocialCalc.Formula.IoFunctions, -2, "trigger_cell, destination_range [,formula_range,value_or_range,formula_range, ...]", "", "action", "", "EventTree"];
SocialCalc.Formula.FunctionList["DELETEIF"] = [SocialCalc.Formula.IoFunctions, -1, "trigger_cell, criteria , test_range", "", "action", "", "EventTree"];
SocialCalc.Formula.FunctionList["COMMAND"] = [SocialCalc.Formula.IoFunctions, -1, "trigger_cell, commands", "", "action", "", "EventTree"];
SocialCalc.Formula.FunctionList["COMMANDIF"] = [SocialCalc.Formula.IoFunctions, -1, "trigger_cell, conditions, commands", "", "action", "", "EventTree"];

SocialCalc.Formula.FunctionList["PANEL"] = [SocialCalc.Formula.IoFunctions, -1, "showindices_range_or_csv, panel1_range [, panel2_range , ...]", "", "action", "", "EventTree"];

// on enter input box refresh the auto complete list
SocialCalc.TriggerIoAction.AddAutocomplete = function(triggerCellId) {
  var spreadsheet =  window.spreadsheet;
  if (spreadsheet == null) spreadsheet = window.ss
  var sheet = spreadsheet.sheet;
  var scf = SocialCalc.Formula; 
  
  var parameters = sheet.ioParameterList[triggerCellId];
  if(typeof parameters === 'undefined') return;
  
  var autocompleteSource = SocialCalc.Formula.getStandardizedList(sheet, parameters[1])

  //Overrides the default autocomplete filter function to search only from the beginning of the string
  $.ui.autocomplete.filter = function (array, term) {
    var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(term), "i");
    return $.grep(array, function (value) {
        return matcher.test(value.label || value.value || value);
    });
  };

  
  $("#AUTOCOMPLETE_"+triggerCellId).autocomplete({
    source: autocompleteSource,
    minLength: 1,
    autoFocus: true,
    select: function(event, ui) {
      $(this).val(ui.item.label);
      SocialCalc.TriggerIoAction.AutoComplete(triggerCellId);
    },
    change: function (event, ui) {
      if (ui.item === null) {
          $(this).val('');
      }
      SocialCalc.TriggerIoAction.AutoComplete(triggerCellId);
    }
  });  
}
// Event triggered, e.g. button/imagebutton clicked. - call linked action formulas 
// eddy TriggerIoAction {
SocialCalc.TriggerIoAction.Button = function(triggerCellId) {
 var spreadsheet =  window.spreadsheet;
 if (spreadsheet == null) spreadsheet = window.ss
 var sheet = spreadsheet.sheet;
 var scf = SocialCalc.Formula; 
 //spreadsheet.editor.EditorScheduleSheetCommands('set A2 value n 10',  true, false);
 
 //spreadsheet.editor.EditorScheduleSheetCommands('sendemail to eddy.nihon',  false, false); 
 
 if(typeof sheet.ioEventTree === 'undefined') return;	
 if(typeof sheet.ioParameterList === 'undefined') return;
 if( sheet.ioEventTree[triggerCellId] === 'undefined' ) return;
 
 for(var actionCellId in sheet.ioEventTree[triggerCellId]) {
 
	var parameters = sheet.ioParameterList[actionCellId];
	var conditionsParameter = null;
	
	switch(parameters.function_name) {
	  
	  case "COPYVALUE" :	    
	    var parameterdata = SocialCalc.Formula.getStandardizedValues(sheet, parameters[2]);

      // get row and col of dest cell
   	  var destcr = SocialCalc.coordToCr(parameters[1].value);
   	  
   	  var sheetCommandList = SocialCalc.TriggerIoAction.CopyValueToRange(parameterdata, destcr);
   	  spreadsheet.editor.EditorScheduleSheetCommands(sheetCommandList,  true, false);   	  
   	 
	    break;
	  case "COPYFORMULA" : 
      var parameterdata = SocialCalc.Formula.getStandardizedValues(sheet, parameters[2]);

      // get row and col of dest cell
      var destcr = SocialCalc.coordToCr(parameters[1].value);
      
      var sheetCommandList = SocialCalc.TriggerIoAction.CopyFormulaToRange(parameterdata, destcr);
        
      spreadsheet.editor.EditorScheduleSheetCommands(sheetCommandList,  true, false);
      break;
    case "INSERT" :  
      //       # INSERT(trigger_cell, destination_range ,formula_range,value_range,formula_range, ...) // 
      //       insertrow A1      
      //       insertcol A1
      var parameterdata = SocialCalc.Formula.getStandardizedValues(sheet, parameters[1]); // destination_range
      if(parameterdata.type != "range") break; // invalid insert, requires range
      var insertCommand;
      var colOffset, rowOffset;
      if (parameterdata.ncols > 1) {  // insert column
        colOffset = 1;
        rowOffset = 0;
        insertCommand = "insertcol";
      }
      if (parameterdata.nrows > 1) {  // insert row
        colOffset = 0;
        rowOffset = 1;
        insertCommand = "insertrow";
      }
      var insertcellCoord = parameterdata.cellcoord[colOffset][rowOffset];
      var sheetCommandList = insertCommand + " " + insertcellCoord;
      var destcr = SocialCalc.coordToCr(insertcellCoord);
      var sourceDataIndex = 2; 
      while(sourceDataIndex < parameters.length ) {
        
        if(parameters[sourceDataIndex].type == "range" || parameters[sourceDataIndex].type == "coord" || sourceDataIndex % 2 == 1) {
          copyCellRange = SocialCalc.Formula.getStandardizedValues(sheet, parameters[sourceDataIndex]); // formulas to insert
          
          if (sourceDataIndex % 2 == 0) {
            sheetCommandList = sheetCommandList + "\n" + SocialCalc.TriggerIoAction.CopyFormulaToRange(copyCellRange, destcr);
          } else {
            sheetCommandList = sheetCommandList + "\n" + SocialCalc.TriggerIoAction.CopyValueToRange(copyCellRange, destcr);            
          }
          if (parameterdata.nrows > 1) destcr.col += copyCellRange.ncols;
          if (parameterdata.ncols > 1) destcr.row += copyCellRange.nrows;
          
        }        
        sourceDataIndex ++;
        
      }
      spreadsheet.editor.EditorScheduleSheetCommands(sheetCommandList,  true, false);        
      
   		 break;
    case "DELETEIF" :  //     # DELETEIF(trigger_cell, criteria , test_range) // 
      var criteriaParameter = SocialCalc.Formula.getStandardizedValues(sheet, parameters[1]); // criteria 
      var testRangeParameter = SocialCalc.Formula.getStandardizedValues(sheet, parameters[2]); // test_range - ignore first and last, as it would produce ref error

      // set command list to empty
      var sheetCommandList = "";

      var colOffset, rowOffset, deleteCommand;
      if (testRangeParameter.ncols > 1 && testRangeParameter.nrows > 1) return; // error invalid range, only one cell wide/high
      if (testRangeParameter.ncols > 1) {  // delete column
        colOffset = 1;
        rowOffset = 0;
        deleteCommand = "deletecol";
      }
      if (testRangeParameter.nrows > 1) {  // delete row
        colOffset = 0;
        rowOffset = 1;
        deleteCommand = "deleterow";
      }
      
      var criteriaValue = criteriaParameter.celldata[0][0].datavalue;
      // FOR each source cell
      for (var i=(testRangeParameter.ncols - colOffset) - 1; i>=colOffset; i--) {  // ignore first and last cell, as it would produce ref error
        for (var j=(testRangeParameter.nrows - rowOffset) -1 ; j>=rowOffset; j--) {
          
          // IF after first source cell THEN  add new line to command list
      
          var cell = testRangeParameter.celldata[i][j];
          if(SocialCalc.Formula.TestCriteria(cell.datavalue, cell.valuetype, criteriaValue) == true) {
            if (sheetCommandList != "" ) sheetCommandList = sheetCommandList + "\n";
            sheetCommandList = sheetCommandList + deleteCommand + " " + testRangeParameter.cellcoord[i][j]; // Note cell.coord becomes invalid when row/coll are inserted/deleted
          }
        }
      }
      
      if (sheetCommandList != "" ) spreadsheet.editor.EditorScheduleSheetCommands(sheetCommandList,  true, false);        
      
      break;
    case "COMMANDIF" :  //    # COMMANDIF(trigger_cell, condition, commands) 
      conditionsParameter = SocialCalc.Formula.getStandardizedValues(sheet, parameters[1]); // commands 

      
    case "COMMAND" :  // COMMAND(trigger_cell, commands) 
      var commandsParameter;
      // set command list to empty
      var sheetCommandList = "";
      if( conditionsParameter != null) {
        var commandsParameter = SocialCalc.Formula.getStandardizedValues(sheet, parameters[2]); // commands 
        if (conditionsParameter.ncols != commandsParameter.ncols || conditionsParameter.nrows != commandsParameter.nrows) break;
      } else {
        commandsParameter = SocialCalc.Formula.getStandardizedValues(sheet, parameters[1]); // commands         
      }
      
      for (var i=0; i<commandsParameter.ncols; i++) {
        for (var j=0; j<commandsParameter.nrows; j++) {

          if( conditionsParameter != null) {
            var conditionCell = conditionsParameter.celldata[i][j];
            if(conditionCell.datavalue == false) continue;
          }
          if (sheetCommandList != "" ) sheetCommandList = sheetCommandList + "\n";
          var cellCommand = commandsParameter.celldata[i][j];  
          sheetCommandList = sheetCommandList + cellCommand.datavalue.toString().trim();
          
        }
      }
      if (sheetCommandList != "" ) spreadsheet.editor.EditorScheduleSheetCommands(sheetCommandList,  true, false);        

      break;
      
  }

 } 

}


/******************************
 * CopyFormulaToRange
 *   copy a range of cells to a destination. Copy the formulas, adjusting any cell references
 * 
 * @destcr col and row - destcr = { col:n, row:n }
 * @sourceData  range data - datatype of param must match getStandardizedParameter() return type
 * @return commands to execute to do the copy.  - String of sheet commands, \n between each command -  
 *   
 ******************************/

/*
 * set B8 text t william              ... coord: "B8",  datavalue: "william",     datatype: "t", formula: "",          valuetype: "t"
 * set B10 constant nd 41307 2013/2/2 ... coord: "B10", datavalue: 41307,         datatype: "c", formula: "2013/2/2",  valuetype: "nd"
 * set B11 value n 1                  ... coord: "B11", datavalue: 1,             datatype: "v", formula: "",          valuetype: "n"
 *
 * set B7 formula "test"&B3   ... coord: "B7",  datavalue: "testwilliam", datatype: "f", formula: ""test"&B3", valuetype: "t"
 * set C8 formula B8       ... coord: "C8",  datavalue: "william",     datatype: "f", formula: "B8",        valuetype: "t"
 * set C10 formula B10     ... coord: "C10", datavalue: 41307,         datatype: "f", formula: "B10",       valuetype: "nd"
 * set C11 formula B11     ... coord: "C11", datavalue: 1,             datatype: "f", formula: "B11",       valuetype: "n"
 *  set B3  formula TEXTBOX("")             ... coord: "B3", datavalue: "william", datatype: "f", formula: "TEXTBOX("william")", valuetype: "tiTEXTBOX"
 */

SocialCalc.TriggerIoAction.CopyFormulaToRange = function(formulaData, destcr) {

  // set command list to empty
  var sheetCommandList = "";
  var sheetCommand;
  
  // FOR each source cell
  for (var i=0; i<formulaData.ncols; i++) {
    for (var j=0; j<formulaData.nrows; j++) {
  
      var cell = formulaData.celldata[i][j];
      // destination cell coord
      var destCellCoord = SocialCalc.crToCoord(destcr.col + i, destcr.row + j);
  
  
      // IF after first source cell THEN  add new line to command list
      if (i != 0 || j != 0 ) sheetCommandList = sheetCommandList + "\n";
  
  
      if (typeof cell !== 'undefined' && cell.valuetype != 'b') { // if not blank get cell data
        var cellDataType = cell.datatype;
        var cellValueType = cell.valuetype;     
        var cellDataValue = cell.datavalue;   
        var cellFormula = cell.formula;
        
        if(cellDataType == 'f') {
          cellFormula = SocialCalc.OffsetFormulaCoords(cellFormula, destcr.col -  formulaData.col1num, destcr.row -  formulaData.row1num);
          cellDataValue = "";
          cellValueType = "";  
        } else { 
          if(cellDataType != "c") cellFormula = "";  // clear text and number types   but not constant type like date/time      
        }
        
        sheetCommand = 'set '+destCellCoord+ ' ' + SocialCalc.Constants.cellDataType[cellDataType] + ' ' +cellValueType + ' '+ SocialCalc.encodeForSave(cellDataValue) + ' ' + cellFormula;            
      } else { 
        sheetCommand = 'set '+destCellCoord+ ' empty';        
      }          
      sheetCommandList += sheetCommand.trim();
    }
  }

  return sheetCommandList;

}

/******************************
 * CopyValueToRange
 *   copy a range of cells to a destination. Copy only the values
 * 
 * @destcr col and row - destcr = { col:n, row:n }
 * @sourceData  range data - datatype of param must match getStandardizedParameter() return type
 * @return commands to execute to do the copy.  - String of sheet commands, \n between each command -  
 *   
 ******************************/
SocialCalc.TriggerIoAction.CopyValueToRange = function(sourceData, destcr) {


    //----------------------
    // set command list to empty
    var sheetCommandList = "";
    var sheetCommand;
    
    // FOR each source cell
    for (var i=0; i<sourceData.ncols; i++) {
      for (var j=0; j<sourceData.nrows; j++) {
    
        var cell = sourceData.celldata[i][j];
        // destination cell coord
        var destCellCoord = SocialCalc.crToCoord(destcr.col + i, destcr.row + j);
    
    
        // IF after first source cell THEN  add new line to command list
        if (i != 0 || j != 0 ) sheetCommandList = sheetCommandList + "\n";
    
    
        // copyvalue to set command
        // take the cell from copyvalue source and convert it to a set command to set the destination
        // e.g. set D3 text t push me 
        // e.g. set D3 value v 10   
        // e.g. set D5 constant n% 0.1 10%
        // e.g. set D6 constant nd 41922 10/10/2014
        if (typeof cell !== 'undefined' && cell.valuetype != 'b') { // if not blank get cell data
          var cellDataType = cell.datatype;
          var cellValueType = cell.valuetype;     
          var cellDataValue = cell.datavalue;   
          var cellFormula = cell.formula;
          
          if(cellDataType == 'f') {
            cellFormula = "";
            cellDataType = cellValueType;
            if(cellValueType != "n" && cellValueType.charAt(0) != "t") {
              cellDataType = "c"; // for Date type etc 
              cellFormula = cell.displaystring;
            }
            if(cellValueType.charAt(0) == "t") cellDataType = "t";          
          } else {
            if(cellDataType != "c") cellFormula = "";  // clear text and number types   but not constant type like date/time      
          }
          
    
          sheetCommand = 'set '+destCellCoord+ ' ' + SocialCalc.Constants.cellDataType[cellDataType] + ' ' +cellValueType + ' '+ SocialCalc.encodeForSave(cellDataValue) + ' ' + cellFormula;
          
      } else { 
        sheetCommand = 'set '+destCellCoord+ ' empty';        
      }
      sheetCommandList += sheetCommand.trim();
    }
  }
  
  return sheetCommandList;  

}
//----------------------


// optionalTriggerCellId - edited cell - used by EMAILONEDIT and EMAILONEDITIF
//onClick=EMAIL 
SocialCalc.TriggerIoAction.Email = function(emailFormulaCellId, optionalTriggerCellId) {
     optionalTriggerCellId = typeof optionalTriggerCellId !== 'undefined' ? optionalTriggerCellId : null;
	 var scf = SocialCalc.Formula;	
	 var spreadsheet =  window.spreadsheet;
	 if (spreadsheet == null) spreadsheet = window.ss

	 var sheet = spreadsheet.sheet;
	 var cell = sheet.cells[emailFormulaCellId];
	 
	 if(typeof sheet.ioParameterList === 'undefined') return;
	 
	 var parameters = sheet.ioParameterList[emailFormulaCellId];
   if(typeof parameters === 'undefined') return;
   //var debugLog = "debug TriggerIoAction.Email\n"; //eddy

	 //spreadsheet.editor.EditorScheduleSheetCommands('sendemail to eddy.nihon',  false, false); 
	 // grab array for TO, SUBJECT and BODY 
	 var parameterValues = [];
	 var parameterCellRefs = []; // OnEdit uses to workout what row/col was edited
	 var maxRangeSize = 1;
	 for(var index=0; index < parameters.length; index ++) {
		 if(parameters[index].type.charAt(0) == 't') {
			 parameterValues[index] = [String(parameters[index].value).replace(/ /g, "%20")];
		 }
		 if(parameters[index].type == 'coord') {
			 parameterValues[index] = [String(sheet.GetAssuredCell(parameters[index].value).datavalue).replace(/ /g, "%20")];

		 }
		 if(parameters[index].type == 'range') {
		      var rangeinfo = scf.DecodeRangeParts(sheet, parameters[index].value);
		      parameterValues[index] = [];
		      parameterCellRefs[index] = [];
		      var rangeSizeCounter = 0;
		      for (var i=0; i<rangeinfo.ncols; i++) {
		         for (var j=0; j<rangeinfo.nrows; j++) {

		            var cellcr = SocialCalc.crToCoord(rangeinfo.col1num + i, rangeinfo.row1num + j);
		            var cell = rangeinfo.sheetdata.GetAssuredCell(cellcr);
		            parameterValues[index].push(cell.datavalue.toString().replace(/ /g, "%20"));
		            parameterCellRefs[index].push(cellcr);
		            rangeSizeCounter++;
		         }
		      }
		      if(rangeSizeCounter > maxRangeSize) maxRangeSize = rangeSizeCounter;			 
		 }
	 }

	 
    var conditionIndex = -1; // check if email formula is conditional, -1 = not conditional 
    var toAddressParamOffset = 0;
    switch (parameters.function_name) {

      case "EMAILIF":
    	  conditionIndex = 0;
      case "EMAILAT":
      case "EMAILONEDIT":
    	  toAddressParamOffset = 1;
    	  break;
      case "EMAILONEDITIF":
      case "EMAILATIF":
       	  conditionIndex = 1;
    	  toAddressParamOffset = 2;
    	  break;
    	  
      case "EMAIL":
    	  break;
    }	 

    
    switch (parameters.function_name) {
        case "EMAILONEDIT":
        case "EMAILONEDITIF":
	       if(optionalTriggerCellId && parameters[0].type == 'coord' && parameters[0].value == optionalTriggerCellId ) optionalTriggerCellId = null;
	       break;
	   default :
		   optionalTriggerCellId = null;
    }

     var setStatusBarMessage = false;

   var emailContentsList = [];

	 for(var rangeIndex = maxRangeSize -1; rangeIndex > -1; rangeIndex-- ) {
		 
		 // if email formula is conditional && condition is false then skip 
		 if(conditionIndex != -1) {
			 var conditionRangeIndex = (rangeIndex >= parameterValues[conditionIndex].length) ? 0 : rangeIndex;
			 if(parameterValues[conditionIndex][conditionRangeIndex] == false) continue;			 
		 }

		 if(optionalTriggerCellId && optionalTriggerCellId != parameterCellRefs[0][rangeIndex]) continue;
		 // send: to, subject, body to server 		 
		 var toaddressRangeIndex = (rangeIndex >= parameterValues[toAddressParamOffset].length) ? 0 : rangeIndex;
		 var subjectsRangeIndex = (rangeIndex >= parameterValues[toAddressParamOffset+1].length) ? 0 : rangeIndex;
		 var bodyRangeIndex = (rangeIndex >= parameterValues[toAddressParamOffset+2].length) ? 0 : rangeIndex;
		 
		 var emailContents = parameterValues[toAddressParamOffset][toaddressRangeIndex]+' '+parameterValues[toAddressParamOffset+1][subjectsRangeIndex]+' '+parameterValues[toAddressParamOffset+2][bodyRangeIndex];
		 setStatusBarMessage = true;
		 sheet.ScheduleSheetCommands('sendemail '+emailContents,  false); 
		 // cron job email - ignores ScheduleSheetCommands so send via return value
		 emailContentsList.push([parameterValues[toAddressParamOffset][toaddressRangeIndex], parameterValues[toAddressParamOffset+1][subjectsRangeIndex], parameterValues[toAddressParamOffset+2][bodyRangeIndex]]);
		 //debugLog = debugLog + "emailContents "+emailContents+"\n"; //eddy
		 
	 }
	 //console.log( "log formula1.js Email");
	 // update status bar to indicate email is being sent
	 if(setStatusBarMessage) SocialCalc.EditorSheetStatusCallback(null, "emailing", null, spreadsheet.editor);	 
   return emailContentsList; // cron job email

}

/*
 * creates command on form: submitform \rtimestamp\rB2value\rC2value ...
 */

SocialCalc.TriggerIoAction.Submit = function(triggerCellId) {
  var formDataViewer = (SocialCalc.CurrentSpreadsheetControlObject != null) 
  ? SocialCalc.CurrentSpreadsheetControlObject.formDataViewer 
  : SocialCalc.CurrentSpreadsheetViewerObject.formDataViewer;

  if(formDataViewer != null && formDataViewer.loaded == true) {

    var spreadsheet =  window.spreadsheet;
    if (spreadsheet == null) spreadsheet = window.ss
    var sheet = spreadsheet.sheet;
    
    
    var date = new Date();
    var formDataValues = ""+date.getFullYear()  + "-" + (date.getMonth() +1 )    + "-" +  date.getDate() 
       + " " +  date.getHours()     + ":" +  date.getMinutes()     + ":" +  date.getSeconds();
    
    for(var colIndex = 2; colIndex <= formDataViewer.formFieldsLength +1 ; colIndex++) {
      var valueCoord = SocialCalc.crToCoord(colIndex, 2);
      formDataValues += "\r" + formDataViewer.sheet.cells[valueCoord].datavalue;
    }  
    
    sheet.ScheduleSheetCommands('submitform \r'+formDataValues,  false);
  }
}

//onChange=select tag (combobox) 
SocialCalc.TriggerIoAction.SelectList = function(selectListCellId) {
  var getHTMLselectListCellValue = function( selectListWidget ) { return selectListWidget.value; };
  var function_name = "SELECT";
  SocialCalc.TriggerIoAction.updateInputWidgetFormula(function_name, selectListCellId, getHTMLselectListCellValue );
}

//onKeyUp=AutoComplete
SocialCalc.TriggerIoAction.AutoComplete = function(autoCompleteCellId) {
  var getHTMLAutoCompleteCellValue = function( autoCompleteWidget ) { return autoCompleteWidget.value; };
  var function_name = "AUTOCOMPLETE";
  SocialCalc.TriggerIoAction.updateInputWidgetFormula(function_name, autoCompleteCellId, getHTMLAutoCompleteCellValue );
}

// onKeyUp=TextBox 
SocialCalc.TriggerIoAction.TextBox = function(textBoxCellId) {
  var getHTMLTextBoxCellValue = function( textBoxWidget ) { return textBoxWidget.value; };
  var function_name = "TEXTBOX";
  SocialCalc.TriggerIoAction.updateInputWidgetFormula(function_name, textBoxCellId, getHTMLTextBoxCellValue );
}

//onKeyUp=CheckBox 
SocialCalc.TriggerIoAction.CheckBox = function(checkBoxCellId) {
  var getHTMLCheckBoxCellValue = function( checkBoxWidget ) { return (checkBoxWidget.checked ? "TRUE" : "FALSE") };
  var function_name = "CHECKBOX"
  SocialCalc.TriggerIoAction.updateInputWidgetFormula(function_name, checkBoxCellId, getHTMLCheckBoxCellValue );
}

//Radio Button state changed
// onclick when selected
// update true/false in formula param
SocialCalc.TriggerIoAction.RadioButton = function(radioButtonGroupName) {
  var getHTMLRadioButtonValue = function( radioButtonWidget ) { return (radioButtonWidget.checked ? "TRUE" : "FALSE") };
  var function_name = "RADIOBUTTON"
  // for each radio button in group
  $('input[name="'+radioButtonGroupName+'"]').each(function () {
     SocialCalc.TriggerIoAction.updateInputWidgetFormula(function_name,  $(this).attr('id').replace(/RADIOBUTTON_/,''), getHTMLRadioButtonValue );
  });
}


SocialCalc.TriggerIoAction.updateInputWidgetFormula = function(function_name, widgetCellId, getHTMLWidgetCellValue ) {

 var spreadsheet =  window.spreadsheet;
 if (spreadsheet == null) spreadsheet = window.ss
 var sheet = spreadsheet.sheet;
 var cell = sheet.cells[widgetCellId];
 var parameters = sheet.ioParameterList[widgetCellId];
 if(typeof parameters === 'undefined') return;
 
 var cell_widget=document.getElementById(function_name+'_'+widgetCellId);
 var inputValue = getHTMLWidgetCellValue(cell_widget);
 inputValue = SocialCalc.encodeForSave(inputValue);

 var sheetCommand = 'set '+widgetCellId+ ' formula '+ function_name+'("' +inputValue+'"';
 for(var paramIndex = 1; paramIndex < parameters.length; paramIndex++) {
   if(parameters[paramIndex].type.charAt(0) == 'n') {
     sheetCommand += ',' + parameters[paramIndex].value;
   }
   if(parameters[paramIndex].type.charAt(0) == 't') {
     sheetCommand += ',"' + parameters[paramIndex].value + '"';
   }
   if(parameters[paramIndex].type == 'range') {
     // convert:     E5!TO0DB4GSXZJ3|E8|   -> TO0DB4GSXZJ3!E5:E8
     // convert:     E5|E8|   -> E5:E8
     sheetCommand += ',' + parameters[paramIndex].value.toString().replace(/([A-Z]+[0-9]+)([!]?)([^|]*)[|]([A-Z]+[0-9]+)[|]/i,"$3$2$1:$4"); ;
   }
   if(parameters[paramIndex].type == 'coord') {
     sheetCommand += ',' + parameters[paramIndex].value;
   }   
 }

   // for(var parseIndex = 3; parseIndex < cell.parseinfo.length -1; parseIndex++) {
//   if(cell.parseinfo[parseIndex].type == 6)   sheetCommand += '"' + cell.parseinfo[parseIndex].text + '"';
//   else sheetCommand +=  cell.parseinfo[parseIndex].text ;
// }
 sheetCommand += ')';
 //SocialCalc.CmdGotFocus(cell_widget);

 spreadsheet.editor.EditorScheduleSheetCommands(sheetCommand,  true, false);
 
 SocialCalc.TriggerIoAction.UpdateFormDataSheet(function_name, widgetCellId, inputValue);
}

// On edit of Form Input widget - Update form data sheet 
SocialCalc.TriggerIoAction.UpdateFormDataSheet = function(function_name, formCellId, inputValue) {
  var formDataViewer = (SocialCalc.CurrentSpreadsheetControlObject != null) 
       ? SocialCalc.CurrentSpreadsheetControlObject.formDataViewer 
       : SocialCalc.CurrentSpreadsheetViewerObject.formDataViewer; 
  if (formDataViewer == null) return;

  var formFieldName = (function_name+formCellId).toLowerCase();
  if(formDataViewer.formFields[formFieldName] != null) {       
    var valueCoord = SocialCalc.crToCoord(formDataViewer.formFields[formFieldName], 2);
    formDataViewer.sheet.ScheduleSheetCommands("set "+valueCoord+" text t "+inputValue, false);    
  }
}



//getStandardizedValues(parameterData)  
// gets cell data of range/coord OR param value as cell data - also get coord data as cell.coord is invalid when rows deleted
// CALL getProcessedParameter  with request for values 
SocialCalc.Formula.getStandardizedValues = function(sheet, parameterData) {
  return SocialCalc.Formula.getStandardizedParameter(sheet, parameterData, true, true);
}  


// getStandardizedCoords(parameterData)  // gets coord(s) of range/coord
// CALL getProcessedParameter  with request for coord info
SocialCalc.Formula.getStandardizedCoords = function(sheet, parameterData) {
  return SocialCalc.Formula.getStandardizedParameter(sheet, parameterData, true, false);
}  

/***************
 * getStandardizedList
 * @sheet spreadsheet sheet
 * @listParameter csv or array or single value - convert into single array
 * @return array of values - one dimension
 ****************/
SocialCalc.Formula.getStandardizedList = function(sheet, listParameter) {
  
  var listValues = [];
  var parameterdata = SocialCalc.Formula.getStandardizedValues(sheet, listParameter);
  
  if(parameterdata.ncols == 1 && parameterdata.nrows == 1) {
    listValues = String(parameterdata.celldata[0][0].datavalue).split(',');
  } else {
    for (var i=0; i<parameterdata.ncols; i++) {
      for (var j=0; j<parameterdata.nrows; j++) {
         var cell = parameterdata.celldata[i][j];
         listValues.push(cell.datavalue.toString());
      }
   }    
  }
  return listValues;
}

/**************************
 * getStandardizedParameter(parameterData, includeCellCoord, includeCellData)
 *
 * Convert formula parameter to standard data structure and return it.
 * 
 * Formula parameters can be value/string/coord/range
 * value/string: convert to celldata:  [[coord:A1, datatype:t/c/v/f, valuetype:t/nd/n/b, datavalue:string/value , formula:"test"&B3]] 
 * coord/range: get celldata from cell
 * 
 *  return:
 ******  data structure returned
  { 
     value:A1:B2/A1/string/value,
     type:range/coord/t/n/b/eErrorType,
     celldata: [][] = {coord:invalid, datatype:t/c/v/f, valuetype:t/nd/n/b, datavalue:string/value , formula:"sum(A1)"},  // coord is invalid after insert/delete row/col
     cellcoord: [][] = A1,   // if requested
     ncols:n,
     nrows:n
     col1num:n
     row1num:n
   }

 *
 * ------------------- type ----------------- 
 * From docs for SocialCalc.Formula.EvaluatePolish  
 * type: can have these values (many are type and sub-type as two or more letters):
 *   "tw", "th", "t", "n", "nt", "coord", "range", "eErrorType", "b" (blank) - removed: "start"
 * valuetype: is set to type if the parameter is constant and not a cell reference
 * ------------------------------------------
 *
 *
 *******************************/
SocialCalc.Formula.getStandardizedParameter = function(sheet, parameterData, includeCellCoord, includeCellData) {
  
  //SET result = {}
  //SET store param values in result (.value .type)
  var result = { type: parameterData.type, value:parameterData.value};
  if(includeCellData) result.celldata = [];
           
  //IF parameter is not a cell reference i.e.  type is: "tw", "th", "t", "n", "nt"  THEN    
  if(parameterData.type != 'coord' && parameterData.type != 'range') {
    // Setup dummy cell reference information
    // SET rows and cols to 1 cell   
    result.ncols = 1;
    result.nrows = 1;
    result.col1num = 1;
    result.row1num = 1;
    
    // IF requested: cell coord value THEN
    if(includeCellCoord) {
      // SET coord to default empty value - 
      result.cellcoord = null; 
    } // END IF
    
    // IF requested: cell data  THEN
    if(includeCellData) {
      // SET data values to dummy cell data using parameter 
      // result.celldata = [[ 
      //   coord to default null value - as illegal request
      //   datatype  - t/v  - const can only have 2 value types
      //   valuetype (n/b/e/t)  - set to same as parameterData.type - check date/time types don't cause issue
      //   datavalue set to parameterData.type 
      //   formula set to empty -  because not range/coord
      // ] ] 
      result.celldata[0] = [];
      var constantDatatype = (parameterData.type=="n") ? "v" : ((parameterData.type=="t") ? parameterData.type : "c");
      result.celldata[0][0] = {coord:null,datatype:constantDatatype,valuetype: parameterData.type,datavalue:parameterData.value };
    } // END IF
    
  } else {
    // param type is "coord" or "range" 

    var scf = SocialCalc.Formula; 
    
    var sourcerangeinfo;
    if(parameterData.type == 'coord') { 
      var sourceCoord = SocialCalc.Formula.PlainCoord(parameterData.value);
      sourcerangeinfo = scf.DecodeRangeParts(sheet, sourceCoord + "|"+ sourceCoord +"|" );
    }
    
    if(parameterData.type == 'range') {
      sourcerangeinfo = scf.DecodeRangeParts(sheet, parameterData.value);
    }
    
    // if coords requested,  init coord array
    if(includeCellCoord) result.cellcoord = []; 
    
    for (var i=0; i<sourcerangeinfo.ncols; i++) {
        for (var j=0; j<sourcerangeinfo.nrows; j++) {
          var cellcoord = SocialCalc.crToCoord(sourcerangeinfo.col1num + i, sourcerangeinfo.row1num + j);
           // IF requested: cell coord value THEN
          if(includeCellCoord) {           
             // SET coord in array to coord of cell
            if(typeof result.cellcoord[i] === 'undefined') result.cellcoord[i] = [];            
            result.cellcoord[i][j] = cellcoord;            
          } // END IF

          // IF requested: cell data  THEN
          if(includeCellData) {
          
            // SET get cell from sheet and store values 
            if(typeof result.celldata[i] === 'undefined') result.celldata[i] = [];                        
            var cell = sourcerangeinfo.sheetdata.GetAssuredCell(cellcoord);
            result.celldata[i][j] = cell; 
          } // END IF
        }
    }
    // SET rows and cols to range - i.e. sourcerangeinfo -   ncols:n,       nrows:n       col1num:n      row1num:n
    result.ncols = sourcerangeinfo.ncols;
    result.nrows = sourcerangeinfo.nrows;
    result.col1num = sourcerangeinfo.col1num;
    result.row1num = sourcerangeinfo.row1num;
    
  }  //END IF
    
  //RETURN 
  return result;
}






// -----------------------------------------
// }
// -----------------------------------------




//
// SHEET CACHE
//

SocialCalc.Formula.SheetCache = {

   // Sheet data: Attributes are each sheet in the cache with values of an object with:
   //
   //    sheet: sheet-obj (or null, meaning not found)
   //    recalcstate: constants.asloaded = as loaded
   //                 constants.recalcing = being recalced now
   //                 constants.recalcdone = recalc done
   //    name: name of sheet (in case just have object and don't know name)
   //

   sheets: {},

   // Waiting for loading:
   // If sheet is not in cache, this is set to the sheetname being loaded
   // so it can be tested in the recalc loop to start load and then wait until restarted.
   // Reset to null before restarting.

   waitingForLoading: null,

   // Constants to use for setting sheets[*].recalcstate:

   constants: {asloaded: 0, recalcing: 1, recalcdone: 2},

   loadsheet: null // (deprecated - use SocialCalc.RecalcInfo.LoadSheet)

   };

//
// othersheet = SocialCalc.Formula.FindInSheetCache(sheetname)
//
// Returns a SocialCalc.Sheet object corresponding to string sheetname
// or null if the sheet is not available or in error.
//
// Each sheet is loaded only once and then stored in a cache.
// Loading is handled elsewhere, e.g., in the recalc loop.
//

SocialCalc.Formula.FindInSheetCache = function(sheetname) {

   var str;
   var sfsc = SocialCalc.Formula.SheetCache;

   var nsheetname = SocialCalc.Formula.NormalizeSheetName(sheetname); // normalize different versions

   if (sfsc.sheets[nsheetname]) { // a sheet by that name is in the cache already
      return sfsc.sheets[nsheetname].sheet; // return it
      }

   if (sfsc.waitingForLoading) { // waiting already - only queue up one
      return null; // return not found
      }

   if (sfsc.loadsheet) { // Deprecated old format synchronous callback
alert("Using SocialCalc.Formula.SheetCache.loadsheet - deprecated");
      return SocialCalc.Formula.AddSheetToCache(nsheetname, sfsc.loadsheet(nsheetname));
      }

   sfsc.waitingForLoading = nsheetname; // let recalc loop know that we have a sheet to load

   return null; // return not found

   }

//
// newsheet = SocialCalc.Formula.AddSheetToCache(sheetname, str, live)
//
// Adds a new sheet to the sheet cache.
// Returns the sheet object filled out with the str (a saved sheet).
//

SocialCalc.Formula.AddSheetToCache = function(sheetname, str, live) {

   var newsheet = null;
   var sfsc = SocialCalc.Formula.SheetCache;
   var sfscc = sfsc.constants;
   var newsheetname = SocialCalc.Formula.NormalizeSheetName(sheetname);

   if (str) {
      newsheet = new SocialCalc.Sheet();
      newsheet.ParseSheetSave(str);
      }

   sfsc.sheets[newsheetname] = {sheet: newsheet, recalcstate: sfscc.asloaded, name: newsheetname};

   SocialCalc.Formula.FreshnessInfo.sheets[newsheetname] = (typeof(live) == "undefined" || live === false);

   return newsheet;

   }

//
// nsheet = SocialCalc.Formula.NormalizeSheetName(sheetname)
//

SocialCalc.Formula.NormalizeSheetName = function(sheetname) {

   if (SocialCalc.Callbacks.NormalizeSheetName) {
      return SocialCalc.Callbacks.NormalizeSheetName(sheetname);
      }
   else {
      return sheetname.toLowerCase();
      }
   }

//
// REMOTE FUNCTION INFO
//

SocialCalc.Formula.RemoteFunctionInfo = {

   // Waiting for server:
   // If waiting for an XHR response from the server, this is set to some non-blank status text
   // so it can be tested in the recalc loop to start load and then wait until restarted.
   // Reset to null before restarting.

   waitingForServer: null

   };

//
// FRESHNESS INFO
//
// This information is generated during recalc.
// It may be used to help determine when the recalc data in a spreadsheet
// may be out of date.
// For example, it may be used to display a message like:
// "Dependent on sheet 'FOO' which was updated more recently than this printout"

SocialCalc.Formula.FreshnessInfo = {

   // For each external sheet referenced successfully an attribute of that name with value true to keep the sheet cached.
   // Value false means the sheet is reloaded at each recalc.

   sheets: {},

   // For each volatile function that is called an attribute of that name with value true.

   volatile: {},

   // Set to false when started and true when recalc completes

   recalc_completed: false

   };

SocialCalc.Formula.FreshnessInfoReset = function() {

   var scffi = SocialCalc.Formula.FreshnessInfo;
   var scfsc = SocialCalc.Formula.SheetCache;

   // Loop through sheets freshness, deleting cached sheets that should be reloaded.

   for (var sheet in scffi.sheets) {
      if (scffi.sheets[sheet] === false) {
         delete scfsc.sheets[sheet];
         }
      }
   
   // Reset freshness info.

   scffi.sheets = {};
   scffi.volatile = {};
   scffi.recalc_completed = false;

   }

//
// MISC ROUTINES
//

//
// result = SocialCalc.Formula.PlainCoord(coord)
//
// Returns: coord without any $'s
//

SocialCalc.Formula.PlainCoord = function(coord) {

   if (coord.indexOf("$") == -1) return coord;

   return coord.replace(/\$/g, ""); // remove any $'s

   }

//
// result = SocialCalc.Formula.OrderRangeParts(coord1, coord2)
//
// Returns: {c1: col, r1: row, c2: col, r2 = row} with c1/r1 upper left
//

SocialCalc.Formula.OrderRangeParts = function(coord1, coord2) {

   var cr1, cr2;
   var result = {};

   cr1 = SocialCalc.coordToCr(coord1);
   cr2 = SocialCalc.coordToCr(coord2);
   if (cr1.col > cr2.col) { result.c1 = cr2.col; result.c2 = cr1.col; }
   else { result.c1 = cr1.col; result.c2 = cr2.col; }
   if (cr1.row > cr2.row) { result.r1 = cr2.row; result.r2 = cr1.row; }
   else { result.r1 = cr1.row; result.r2 = cr2.row; }

   return result;

   }

//
// cond = SocialCalc.Formula.TestCriteria(value, type, criteria)
//
// Determines whether a value/type meets the criteria.
// A criteria can be a numeric value, text beginning with <, <=, =, >=, >, <>, text by itself is start of text to match.
// Used by a variety of functions, including the "D" functions (DSUM, etc.).
//
// Returns true or false
//

SocialCalc.Formula.TestCriteria = function(value, type, criteria) {

   var comparitor, basestring, basevalue, cond, testvalue;

   if (criteria == null) { // undefined (e.g., error value) is always false
      return false;
      }

   criteria = criteria + "";
   comparitor = criteria.charAt(0); // look for comparitor
   if (comparitor == "=" || comparitor == "<" || comparitor == ">") {
      basestring = criteria.substring(1);
      }
   else {
      // check for '*' or '?' in search string - wildcard
      if (criteria.search(/([^~]\*|^\*)/) != -1 || criteria.search(/([^~]\?|^\?)/) != -1) {
         comparitor = "regex";
         if (criteria == "*") {
            // "*" means cell contains 'anything'
            basestring = ".+";
         } else {
             // convert Excel syntax to regex syntax. * -> .*    ? -> .?    ~* -> \*    ~? -> \?
             // there are no negative lookbehinds in Javascript. Reverse the string and do negative lookaheads on ~? and ~*
             basestring = criteria.split("").reverse().join("");
             basestring = basestring.replace(/\?(?=[^~])|\?$/g, "?.").replace(/\?~/g, "?\\").replace(/\*(?=[^~])|\*$/g, "*.").replace(/\*~/, "*\\");
             basestring = basestring.split("").reverse().join("");
         }
         basestring = "^" + basestring + "$";
      } else {
          comparitor = criteria.substring(0,2);
          if (comparitor == "<=" || comparitor == "<>" || comparitor == ">=") {
             basestring = criteria.substring(2);
          } else {
             comparitor = "none";
             basestring = criteria;
          }
      }
   }

   basevalue = SocialCalc.DetermineValueType(basestring); // get type of value being compared
   if (!basevalue.type) { // no criteria base value given
      if (comparitor == "none") { // blank criteria matches nothing
         return false;
         }
      if (type.charAt(0) == "b") { // comparing to empty cell
         if (comparitor == "=") { // empty equals empty
            return true;
            }
         }
      else {
         if (comparitor == "<>") { // "something" does not equal empty
            return true;
            }
         }
      return false; // otherwise false
      }

   cond = false;

   if (basevalue.type.charAt(0) == "n" && type.charAt(0) == "t") { // criteria is number, but value is text
      testvalue = SocialCalc.DetermineValueType(value);
      if (testvalue.type.charAt(0) == "n") { // could be number - make it one
         value = testvalue.value;
         type = testvalue.type;
         }
      }

   if (type.charAt(0) == "n" && basevalue.type.charAt(0) == "n") { // compare two numbers
      value = value - 0; // make sure numbers
      basevalue.value = basevalue.value - 0;
      switch (comparitor) {
         case "<":
            cond = value < basevalue.value;
            break;

         case "<=":
            cond = value <= basevalue.value;
            break;

         case "=":
         case "none":
            cond = value == basevalue.value;
            break;

         case ">=":
            cond = value >= basevalue.value;
            break;

         case ">":
            cond = value > basevalue.value;
            break;

         case "<>":
            cond = value != basevalue.value;
            break;
         }
      }

   else if (type.charAt(0) == "e") { // error on left
      cond = false;
      }

   else if (basevalue.type.charAt(0) == "e") { // error on right
      cond = false;
      }

   else { // text, maybe mixed with number or blank
      if (type.charAt(0) == "n") {
         value = SocialCalc.format_number_for_display(value, "n", "");
         }
      if (basevalue.type.charAt(0) == "n") {
         return false; // if number and didn't match already, isn't a match
         }

      value = value ? value.toLowerCase() : "";
      basevalue.value = basevalue.value ? basevalue.value.toLowerCase() : "";

      switch (comparitor) {
         case "<":
            cond = value < basevalue.value;
            break;

         case "<=":
            cond = value <= basevalue.value;
            break;

         case "=":
            cond = value == basevalue.value;
            break;

         case "none":
            cond = value.substring(0, basevalue.value.length) == basevalue.value;
            break;

         case ">=":
            cond = value >= basevalue.value;
            break;

         case ">":
            cond = value > basevalue.value;
            break;

         case "<>":
            cond = value != basevalue.value;
            break;

         case "regex":
            try {
              cond = value.search(new RegExp(basevalue.value)) != -1;
            } catch(e) {
              cond = false; // regex invalid (e.g., error value) is always false
            }
            break;
         }
      }

   return cond;

   }
