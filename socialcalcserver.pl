#!/usr/bin/perl

#
# SocialCalc Server
#
# This is a simple Perl CGI server that uses SocialCalc in the browser
# to edit files stored on the server or a regular personal computer.
#

   use strict;
   use CGI qw(:standard);
   use URI;
   use HTTP::Daemon;
   use HTTP::Status;
   use HTTP::Response;
   use Socket;
   use CGI::Cookie;
   use LWP::UserAgent;

#   use SocialCalcServersideUtilities;

   # Defaults

   my $settingsfile = "socialcalcserversettings.txt"; # file with values for the following
   my $datadir = "se2-data/"; # The subdirectory of where the code is that holds the socialcalc data files
   my $versionstr = "0.2.3";
   my $titlestr = "SocialCalc Server $versionstr";
   my $jsdir = "/sgi/scjs/"; # The subdirectory of the server home page (when run thru CGI)
                                 # where the .js files are, and ./images/ subdirectory.
   my $imagedir = "/images/sc-";

#
# This whole first section lets this code run either as a CGI script on a server
# or standalone on the desktop run from the Perl command line.
#
# The main processing starts with process_request.
#

   if ($ENV{REQUEST_METHOD}) { # being run as a CGI on a server
     print "Content-type: text/html\n\n";
      my $q = new CGI;
      print process_request($q);
      exit;
      }

   # running locally - do mini-server

   my $d = HTTP::Daemon->new (
                    LocalPort => 6557,
                    Reuse => 1);

   if (!$d) {
      print "simpleedit could not start on 127.0.0.1:6557\n";
      exit;
      }

   print "socialcalcserver\nAccess at: http://127.0.0.1:6557/\n";

   while (my $c = $d->accept) {

      # Make sure the request is from our machine

      if ($c) {
         my ($port, $host) = sockaddr_in(getpeername($c));
         if ($host ne inet_aton("127.0.0.1")) {
            $c->close;  # no - ignore request completely
            undef($c);
            next;
            }
         }

      # Process the request

      while ((defined $c) && (my $r = $c->get_request)) {
         if ($r->method eq 'POST' || $r->method eq 'GET') {
            $c->force_last_request;
            my $uri = $r->uri;
            if ($uri =~ /favicon/) {   # if this is a request for favicon.ico, ignore
               $c->send_error(RC_NOT_FOUND);
               next;
               }
            if ($uri =~ /\/quit$/) {
               $c->send_file_response("quitmessage.html");
               $c->close;
               undef($c);
               exit;
               }
            if ($uri =~ /\/([a-z\-0-9]+)\.(gif|js|css|png)(\?.*)*$/) { # ok request
               $uri = "$1.$2";
               $uri = "images/$uri" if ($2 eq "gif" || $2 eq "png");
#               if ($2 eq "js") {
#                  $res->content_type("text/html; charset=UTF-8");
#                  }
               $c->send_file_response($uri);
               next;
               }

            my $resp="";
            if ($r->method eq 'POST') {
               my $q = new CGI($r->content());
               $resp = process_request($q)
               }
            else {
               my $q = new CGI($r->uri->query());
               $resp = process_request($q)
               }
            my $res = new HTTP::Response(200);
            $res->content_type("text/html; charset=UTF-8");
            $res->expires("-1d");
            $res->content($resp);
            $c->send_response($res);
            }

         else {
            $c->send_error(RC_FORBIDDEN);
            }
         }

      $c->close;
      undef($c);
      }

#
# Main routine starts here:
#

sub process_request {

   my ($request) = @_;
   my $q = new CGI($request);

   my $response;

   my ($statusmessage);

   if (-e $settingsfile) {
      open (SETTINGSFILE, $settingsfile);
      while (my $line = <SETTINGSFILE>) {
         chomp $line; $line =~ s/\r//g;
         my @sline = split /\:/, $line;
         $datadir = $sline[1] if ($sline[0] eq "datadir");
         $jsdir = $sline[1] if ($sline[0] eq "jsdir");
         }
      close SETTINGSFILE;
      }
   else {
      if ($q->param('setup')) { # got settings - do this once
         $datadir = $q->param('datadir');
         $jsdir = $q->param('jsdir');
         open (SETTINGSFILE, ">$settingsfile");
         print SETTINGSFILE <<"EOF";
# SocialcalcServer settings
version:1.0
datadir:$datadir
jsdir:$jsdir
EOF
         close SETTINGSFILE;
         mkdir $datadir;
         }
      else {
         $response = <<"EOF";
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"
 "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
<META http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>$titlestr</title>
<style>
body, td, input, texarea
 {font-family:verdana,helvetica,sans-serif;font-size:small;}
 .smaller {font-size:smaller;}
</style>
</head>
<body>
<form action="" method="POST">
<div style="padding:6px;background-color:#80A9F3;">
<div style="font-weight:bold;color:white;">SIMPLE SYSTEM FOR EDITING SOCIALCALC FILES</div>
<div style="color:#FDD;font-weight:bold;">Initial Setup</div>
<div style="padding:6px;background-color:#80A9F3;">
Name of subdirectory of where the code is to hold spreadsheet data files:
<input name="datadir" type="text" value="scdata/"><br>
Name of subdirectory of server home page that has the JavaScript files and the images subdirectory
(only needed if running on Apache, etc., not when running standalone from the
command line in Perl): <input name="jsdir" type="text" value="/sgi/scjs/"><br>
<input type="submit" name="setup" value="Save">
</div>
<br>
</form>
</div>
<br>
</body>
</html>
EOF

         return $response;
        }

      }

   my $pagename = $q->param('pagename');

   if ($q->param('newpage')) {
      $pagename = $q->param('newpagename');
      }

   $pagename =~ s/[^a-zA-Z0-9_\-\.]*//g;
   if (!$pagename) {
      $pagename = "[None]";
      return do_displaypage($q, $pagename, $statusmessage);
      }

   if ($q->param("editpage") || $q->param("editrawpage")) { # when one of the "editpage" buttons is pressed
      return do_editpage($q, $pagename, $statusmessage);
      }

   if ($q->param("edit")) { # "edit" pressed
      return start_editsheet($pagename, $q, $statusmessage);
      }
   if ($q->param("view")) { # "view" pressed
      return start_viewsheet($pagename, $q, $statusmessage);
      }

   if ($q->param('savespreadsheet')) { # save the edited spreadsheet
      my $pagestr = $q->param('newstr');

      open (PAGEFILEOUT, ">$datadir$pagename");
      print PAGEFILEOUT $pagestr;
      close PAGEFILEOUT;
      $statusmessage =
          "Saved updated '$pagename'.<br>";
      }

   if ($q->param('filecontents')) { # return contents of file
      my $fileurl = $q->param('filecontents');

      open (PAGEFILEIN, "$fileurl");
      my $filestr;
      while (my $line = <PAGEFILEIN>) {
         $filestr .= $line;
         }
      close PAGEFILEIN;
print $filestr;
      return $filestr;

      }

   $response = do_displaypage($q, $pagename, $statusmessage); # Otherwise, display page

   return $response;

   }

#
# $response = do_displaypage($q, $pagename, $statusmessage) - Display page
#

sub do_displaypage {

   my ($q, $pagename, $statusmessage) = @_;
   my $response;

   $response = <<"EOF";
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"
 "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
<META http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>$titlestr</title>
<style>
body, td, input, texarea
 {font-family:verdana,helvetica,sans-serif;font-size:small;}
 .smaller {font-size:smaller;}
</style>
<script>
function doedit(p) {
   document.getElementById("pagename").value = p;
   document.getElementById("edit").value = "yes";
   }

function doview(p) {
   document.getElementById("pagename").value = p;
   document.getElementById("view").value = "yes";
   }

</script>
</head>
<body>
<form action="" method="POST">
<div style="padding:6px;background-color:#80A9F3;">
<div style="font-weight:bold;color:white;">SIMPLE SYSTEM FOR EDITING SOCIALCALC FILES</div>
<div style="color:#FDD;font-weight:bold;">$statusmessage &nbsp;</div>
<div style="padding:6px;background-color:#80A9F3;">
<div style="font-weight:bold;font-size:smaller;">Pages:</div>
<div>
EOF

   my @pagefiles = glob("$datadir*"); # Get list of all pages
   for (my $pnum=0; $pnum <= $#pagefiles; $pnum++) {
      $pagefiles[$pnum] =~ m/^(?:.*\/){0,1}(.*)$/;
      $response .= qq!<span style="font-size:smaller;">$1</span> <input class="smaller" type="submit" value="Edit" onclick="doedit('$1');"> !;
      $response .= qq! <input class="smaller" type="submit" value="View" onclick="doview('$1');"><br>!;
      }

   $response .= <<"EOF";
<input id="pagename" name="pagename" type="hidden" value="">
<input id="edit" name="edit" type="hidden" value="">
<input id="view" name="view" type="hidden" value="">
</div>
<br>
</form>
<form action="" method="POST">
<input type="text" name="newpagename" value="">
<input type="submit" name="newpage" value="Create New Page">
<input type="hidden" name="edit" value="yes">
</form>
</div>
<br>
</body>
</html>
EOF

   return $response;
   }



#
# start_editsheet($pagename, $q, $statusmessage)
#    - render initial editing display
#

sub start_editsheet {

   my ($pagename, $q, $statusmessage) = @_;

   my ($response, $sheetstr);

   open (PAGEFILEIN, "$datadir$pagename");

   while (my $line = <PAGEFILEIN>) {
      $sheetstr .= $line;
      }
   $sheetstr = special_chars($sheetstr);

   close PAGEFILEIN;

   $response = <<"EOF"; # output page with edit JS code
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
<META http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>$titlestr - $pagename</title>
<script type="text/javascript" src="${jsdir}socialcalcconstants.js"></script>
<script type="text/javascript" src="${jsdir}socialcalc-3.js"></script>
<script type="text/javascript" src="${jsdir}socialcalctableeditor.js"></script>
<script type="text/javascript" src="${jsdir}formatnumber2.js"></script>
<script type="text/javascript" src="${jsdir}formula1.js"></script>
<script type="text/javascript" src="${jsdir}socialcalcpopup.js"></script>
<script type="text/javascript" src="${jsdir}socialcalcspreadsheetcontrol.js"></script>
<style>
body, td, input, texarea
 {font-family:verdana,helvetica,sans-serif;font-size:small;}
 .smaller {font-size:smaller;}
</style>
</head>
<body>
<form name="f0" action="" method="POST">
<div style="padding:6px;background-color:#80A9F3;">
<div style="font-weight:bold;color:white;">SIMPLE SYSTEM FOR EDITING SOCIALCALC FILES</div>
<div style="color:#FDD;font-weight:bold;">$statusmessage &nbsp;</div>
<div style="margin-bottom:6px;">Editing page: <span style="font-style:italic;font-weight:bold;">$pagename</span></div>
<input class="smaller" type="submit" name="savespreadsheet" value="Save" onclick="dosave();">
<input class="smaller" type="submit" name="cancelspreadsheet" value="Cancel">
<textarea name="savestr" id="sheetdata" style="display:none;">$sheetstr</textarea>
<input type="hidden" name="newstr" id="newdata" value="">
<input type="hidden" name="pagename" value="$pagename">
</div>
</form>
<div id="tableeditor" style="margin:8px 0px 10px 0px;">editor goes here</div>
<script>

function dosave() {
   var sheetstr = spreadsheet.CreateSpreadsheetSave();
   document.getElementById("newdata").value = sheetstr;
   }

// start everything

   SocialCalc.Constants.defaultImagePrefix = "$jsdir$imagedir";
   SocialCalc.Popup.imagePrefix = "$jsdir$imagedir";

   var spreadsheet = new SocialCalc.SpreadsheetControl();
   spreadsheet.InitializeSpreadsheetControl("tableeditor", 0, 0, 0);

   SocialCalc.SheetCommandInfo.CmdExtensionCallbacks.docmd = {func:docmdext, data:spreadsheet};
   SocialCalc.SheetCommandInfo.CmdExtensionCallbacks.loadclipboard = {func:doloadclipboardext, data:spreadsheet};

   var savestr = document.getElementById("sheetdata").value;
   var parts = spreadsheet.DecodeSpreadsheetSave(savestr);
   if (parts) {
      if (parts.sheet) {
         spreadsheet.sheet.ResetSheet();
         spreadsheet.ParseSheetSave(savestr.substring(parts.sheet.start, parts.sheet.end));
         }
      if (parts.edit) {
         spreadsheet.editor.LoadEditorSettings(savestr.substring(parts.edit.start, parts.edit.end));
         }
      if (parts.startupmacro) {
         spreadsheet.editor.EditorScheduleSheetCommands(savestr.substring(parts.startupmacro.start, parts.startupmacro.end), false, true);
         }
      }
   if (spreadsheet.sheet.attribs.recalc=="off") {
      spreadsheet.sheet.attribs.needsrecalc = "yes"; // default turn it on
      spreadsheet.ExecuteCommand('redisplay', '');
      }
   else {
      spreadsheet.ExecuteCommand('recalc', '');
      }

function docmdext (name, data, sheet, cmd, saveundo) {

   var cmdstr = cmd.RestOfString();
   data.editor.EditorScheduleSheetCommands(cmdstr, false, false);
   SocialCalc.SheetCommandInfo.cmdextensionbusy = "Do Cmd Ext "+cmdstr;

   window.setTimeout(function(){SocialCalc.ResumeFromCmdExtension();}, 100);

   }

function doloadclipboardext (name, data, sheet, cmd, saveundo) {

   var cmdstr = cmd.RestOfString();
   SocialCalc.SheetCommandInfo.cmdextensionbusy = "Load Clipboard Ext "+cmdstr;

   loaddata(cmdstr);

//   window.setTimeout(function(){SocialCalc.ResumeFromCmdExtension();}, 100);
//   SocialCalc.ResumeFromCmdExtension();
   }

var loaddatatimerobj;

function loaddata(url) {

   var loadscript = document.createElement("script");
   loadscript.type = "text/javascript";
   loadscript.src = url+"?"+((new Date()).getTime()+'0');
   document.body.appendChild(loadscript);

   loaddatatimerobj = window.setTimeout(loaddatatimeout, 4000);

   }

function doloaddataload(val) {

   if (loaddatatimerobj) {
      window.clearTimeout(loaddatatimerobj);
      loaddatatimerobj = null;
      }

   var sview = SocialCalc.GetSpreadsheetControlObject();
   parts = sview.DecodeSpreadsheetSave(val);
   if (parts) {
      if (parts.sheet) {
         SocialCalc.Clipboard.clipboard = SocialCalc.decodeFromSave(val.substring(parts.sheet.start, parts.sheet.end));
         }
      }
//   window.setTimeout(function(){SocialCalc.ResumeFromCmdExtension();}, 100);
   SocialCalc.ResumeFromCmdExtension();
   }

function loaddatatimeout() {

   if (loaddatatimerobj) {
      window.clearTimeout(loaddatatimerobj);
      loaddatatimerobj = null;
      }

   window.setTimeout(function(){SocialCalc.ResumeFromCmdExtension();}, 10);

   }

// Remote data lookup demo code

var loadtimerobj;

function loadsheet(sheetname) {

   var matches = sheetname.match(/^\\{scdata\\:\\s+(.+?)\\}\$/); // {scdata: URL w/o http://)

   if (!matches) {
      return false;
      }

   var loadscript = document.createElement("script");
   loadscript.type = "text/javascript";
   loadscript.src = "http://"+matches[1]+"?"+((new Date()).getTime()+'0');
   document.body.appendChild(loadscript);

   loadtimerobj = window.setTimeout(loadframetimeout, 4000);

   return true;
   }

SocialCalc.RecalcInfo.LoadSheet = loadsheet;

function doloadframeload(val) {

   if (loadtimerobj) {
      window.clearTimeout(loadtimerobj);
      loadtimerobj = null;
      }

   var sview = SocialCalc.GetSpreadsheetControlObject();
   parts = sview.DecodeSpreadsheetSave(val);
   if (parts) {
      if (parts.sheet) {
         SocialCalc.RecalcLoadedSheet(null, val.substring(parts.sheet.start, parts.sheet.end), true); // notify recalc loop
         }
      }
   if (val=="") {
      SocialCalc.RecalcLoadedSheet(null, "", true); // notify recalc loop that it's not available, but that we tried
      }
   }

function loadframetimeout() {

   if (loadtimerobj) {
      window.clearTimeout(loadtimerobj);
      loadtimerobj = null;
      }

   SocialCalc.RecalcLoadedSheet(null, "", true); // notify recalc loop that it's not available, but that we tried

   }

</script>
</body>
</html>
EOF

   return $response;

   }


#
# start_viewsheet($pagename, $q, $statusmessage)
#    - render sheet
#

sub start_viewsheet {

   my ($pagename, $q, $statusmessage) = @_;

   my ($response, $sheetstr);

   open (PAGEFILEIN, "$datadir$pagename");

   while (my $line = <PAGEFILEIN>) {
      $sheetstr .= $line;
      }
   $sheetstr = special_chars($sheetstr);

   $response = <<"EOF"; # output page with JS code to render
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
<META http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>$titlestr - $pagename</title>
<script type="text/javascript" src="${jsdir}socialcalcconstants.js"></script>
<script type="text/javascript" src="${jsdir}socialcalc-3.js"></script>
<script type="text/javascript" src="${jsdir}socialcalctableeditor.js"></script>
<script type="text/javascript" src="${jsdir}formatnumber2.js"></script>
<script type="text/javascript" src="${jsdir}formula1.js"></script>
<script type="text/javascript" src="${jsdir}socialcalcpopup.js"></script>
<script type="text/javascript" src="${jsdir}socialcalcspreadsheetcontrol.js"></script>
<style>
body, td, input, texarea
 {font-family:verdana,helvetica,sans-serif;font-size:small;}
 .smaller {font-size:smaller;}
</style>
</head>
<body>
EOF

   if (!$q->param('print')) {
      $response .= <<"EOF";
<div style="padding:6px;background-color:#80A9F3;">
<div style="font-weight:bold;color:white;">SIMPLE SYSTEM FOR EDITING SOCIALCALC FILES</div>
<div style="color:#FDD;font-weight:bold;">$statusmessage &nbsp;</div>
<div style="margin-bottom:6px;">Editing page: <span style="font-style:italic;font-weight:bold;">$pagename</span></div>
<form name="f0" action="" method="POST">
<input class="smaller" type="submit" name="doneview" value="Done">
</form>
<a href="?pagename=$pagename&view=yes&print=yes" target="_blank">Printer-friendly</a>
</div>
EOF
      }

   $response .= <<"EOF";
<textarea name="savestr" id="sheetdata" style="display:none;">$sheetstr</textarea>
<div id="main">Sheet goes here</div>
<script>

// start everything

   var spreadsheet = new SocialCalc.SpreadsheetControl();

   SocialCalc.Constants.defaultImagePrefix = "$jsdir$imagedir";
   SocialCalc.Popup.imagePrefix = "$jsdir$imagedir";

   var savestr = document.getElementById("sheetdata").value;
   var parts = spreadsheet.DecodeSpreadsheetSave(savestr);
   if (parts) {
      if (parts.sheet) {
         spreadsheet.sheet.ResetSheet();
         spreadsheet.ParseSheetSave(savestr.substring(parts.sheet.start, parts.sheet.end));
         }
      }

   var html = spreadsheet.CreateSheetHTML();
   document.getElementById("main").innerHTML = html;

</script>
</body>
</html>
EOF

   return $response;

   }


# # # # # # # # # #
# special_chars($string)
#
# Returns $estring where &, <, >, " are HTML escaped
# 

sub special_chars {
   my $string = shift @_;

   $string =~ s/&/&amp;/g;
   $string =~ s/</&lt;/g;
   $string =~ s/>/&gt;/g;
   $string =~ s/"/&quot;/g;

   return $string;
}


#
# decode_from_ajax($string) - Returns a string with 
#       \n, \b, and \c escaped to \n, \, and :
#

sub decode_from_ajax {
   my $string = shift @_;

   $string =~ s/\\n/\n/g;
   $string =~ s/\\c/:/g;
   $string =~ s/\\b/\\/g;

   return $string;
}


#
# encode_for_ajax($string) - Returns a string with 
#       \n, \, :, and ]]> escaped to \n, \b, \c, and \e
#

sub encode_for_ajax {
   my $string = shift @_;

   $string =~ s/\\/\\b/g;
   $string =~ s/\n/\\n/g;
   $string =~ s/\r//g;
   $string =~ s/:/\\c/g;
   $string =~ s/]]>/\\e/g;

   return $string;
}

