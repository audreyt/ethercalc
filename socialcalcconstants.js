//
/*
// The module of the SocialCalc package with customizable constants, strings, etc.
// This is where most of the common localizations are done.
//
// (c) Copyright 2008, 2009, 2010 Socialtext, Inc.
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
if (!SocialCalc) SocialCalc = {};

// *************************************
//
// TO LEARN HOW TO LOCALIZE OR CUSTOMIZE SOCIALCALC, PLEASE READ THIS:
//
// The constants are all properties of the SocialCalc.Constants object.
// They are grouped here by what they are for, which module uses them, etc.
//
// Properties whose names start with "s_" are strings, or arrays of strings,
// that are good candidates for translation from the English.
//
// Other properties relate to visual settings, localization parameters, etc.
//
// These values are not used when SocialCalc modules are first loaded.
// They may be modified before the first use of the routines that use them,
// e.g., before creating SocialCalc objects.
//
// The exceptions are:
//    TooltipOffsetX and TooltipOffsetY, as described with their definitions.
//
// SocialCalc IS NOT DESIGNED FOR USE WITH A TRANSLATION FUNCTION each time a string
// is used. Instead, language translations may be done by modifying this object.
//
// To customize SocialCalc, you may either replace this file with a modified version
// or you can overwrite the values before use. An example would be to
// iterate over all the properties looking for names that start with "s_" and
// use some other mechanism to obtain a localized string and replace the values
// here with those translated values.
//
// There is also a function, SocialCalc.ConstantsSetClasses, that may be used
// to easily switch SocialCalc from using explicit CSS styles for many things
// to using CSS classes. See the function, below, for more information.
//
// *************************************

SocialCalc.Constants = {};

// Default classnames for use with SocialCalc.ConstantsSetClasses:

SocialCalc.ConstantsDefaultClasses = {
   defaultComment: "",
   defaultCommentNoGrid: "",
   defaultHighlightTypeCursor: "",
   defaultHighlightTypeRange: "",
   defaultColname: "",
   defaultSelectedColname: "",
   defaultRowname: "",
   defaultSelectedRowname: "", 
   defaultUpperLeft: "",
   defaultSkippedCell: "",
   defaultPaneDivider: "",
   cteGriddiv: "", // this one has no Style version with it
   defaultInputEcho: {classname: "", style: "filter:alpha(opacity=90);opacity:.9;"}, // so FireFox won't show warning
   TCmain: "",
   TCendcap: "",
   TCpaneslider: "",
   TClessbutton: "",
   TCmorebutton: "",
   TCscrollarea: "",
   TCthumb: "",
   TCPStrackingline: "",
   TCTDFSthumbstatus: "",
   TDpopupElement: ""
   };

//
// SocialCalc.ConstantsSetClasses(prefix)
//
// This routine goes through all of the xyzClass/xyzStyle pairs and sets the Class to a default and
// turns off the Style, if present. The prefix is put before each default.
// The list of items to set is in SocialCalc.ConstantsDefaultClasses. The names there
// correspond to the "xyz" parts. If there is a value, it is the default to set. If the
// default is a null, no change is made. If the default is the null string (""), the
// name of the item is used (e.g., "defaultComment" would use the classname "defaultComment").
// If the default is an object, then it expects {classname: classname, style: stylestring} - this
// lets you combine both.
//

SocialCalc.ConstantsSetClasses = function(prefix) {

   var defaults = SocialCalc.ConstantsDefaultClasses;
   var scc = SocialCalc.Constants;
   var item;

   prefix = prefix || "";

   for (item in defaults) {
      if (typeof defaults[item] == "string") {
         scc[item+"Class"] = prefix + (defaults[item] || item);
         if (scc[item+"Style"] !== undefined) {
            scc[item+"Style"] = "";
            }
         }
      else if (typeof defaults[item] == "object") {
         scc[item+"Class"] = prefix + (defaults[item].classname || item);
         scc[item+"Style"] = defaults[item].style;
         }
      }
   }

// Set the image prefix on all images.

SocialCalc.ConstantsSetImagePrefix = function(imagePrefix) {

   var scc = SocialCalc.Constants;

   for (var item in scc) {
      if (typeof scc[item] == "string") {
         scc[item] = scc[item].replace(scc.defaultImagePrefix, imagePrefix);
         }
      }
   scc.defaultImagePrefix = imagePrefix;

   }

