(function() {
  var OptionParser, argv, coffeekup, compile, fs, handle_error, options, path, puts, switches, usage, write;
  coffeekup = require('./coffeekup');
  fs = require('fs');
  path = require('path');
  puts = console.log;
  OptionParser = require('coffee-script/lib/optparse').OptionParser;
  argv = process.argv.slice(2);
  options = null;
  handle_error = function(err) {
    if (err) {
      return console.log(err.stack);
    }
  };
  compile = function(input_path, output_directory, js, namespace) {
    if (namespace == null) {
      namespace = 'templates';
    }
    return fs.readFile(input_path, 'utf-8', function(err, contents) {
      var ext, func, name, output;
      handle_error(err);
      name = path.basename(input_path, path.extname(input_path));
      if (!js) {
        output = coffeekup.render(contents, options);
        ext = '.html';
      } else {
        func = coffeekup.compile(contents, options);
        output = "(function(){ \n  this." + namespace + " || (this." + namespace + " = {});\n  this." + namespace + "[" + (JSON.stringify(name)) + "] = " + func + ";\n}).call(this);";
        ext = '.js';
      }
      return write(input_path, name, output, output_directory, ext);
    });
  };
  write = function(input_path, name, contents, output_directory, ext) {
    var dir, filename;
    filename = name + ext;
    dir = output_directory || path.dirname(input_path);
    return path.exists(dir, function(exists) {
      var output_path;
      if (!exists) {
        fs.mkdirSync(dir, 0777);
      }
      output_path = path.join(dir, filename);
      if (contents.length <= 0) {
        contents = ' ';
      }
      return fs.writeFile(output_path, contents, function(err) {
        handle_error(err);
        if (options.print) {
          puts(contents);
        }
        if (options.watch) {
          return puts("Compiled " + input_path);
        }
      });
    });
  };
  usage = 'Usage:\n  coffeekup [options] path/to/template.coffee';
  switches = [['--js', 'compile template to js function'], ['-n', '--namespace [name]', 'global object holding the templates (default: "templates")'], ['-w', '--watch', 'watch templates for changes, and recompile'], ['-o', '--output [dir]', 'set the directory for compiled html'], ['-p', '--print', 'print the compiled html to stdout'], ['-f', '--format', 'apply line breaks and indentation to html output'], ['-u', '--utils', 'add helper locals (currently only "render")'], ['-v', '--version', 'display CoffeeKup version'], ['-h', '--help', 'display this help message']];
  this.run = function() {
    var args, file, parser, _ref;
    parser = new OptionParser(switches, usage);
    options = parser.parse(argv);
    args = options.arguments;
    delete options.arguments;
    if (options.help || argv.length === 0) {
      puts(parser.help());
    }
    if (options.version) {
      puts(coffeekup.version);
    }
    if (options.utils) {
      if ((_ref = options.locals) == null) {
        options.locals = {};
      }
      options.locals.render = function(file) {
        var contents;
        contents = fs.readFileSync(file, 'utf-8');
        return coffeekup.render(contents, options);
      };
    }
    if (args.length > 0) {
      file = args[0];
      if (options.watch) {
        fs.watchFile(file, {
          persistent: true,
          interval: 500
        }, function(curr, prev) {
          if (curr.size === prev.size && curr.mtime.getTime() === prev.mtime.getTime()) {
            return;
          }
          return compile(file, options.output, options.js, options.namespace);
        });
      }
      return compile(file, options.output, options.js, options.namespace);
    }
  };
}).call(this);
