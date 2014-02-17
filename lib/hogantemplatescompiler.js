#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var util = require("util");
var cheerio = require("cheerio");
var hogan = require("hogan.js");
var readdirp = require("readdirp");

var cliDefs = {
    h: {
        alias: 'help',
        describe: 'Show this help'
    },
    s: {
        alias: 'source',
        describe: 'Templates folder (required)'
    },
    o: {
        alias: 'output',
        describe: 'Output folder. Default: the same as source'
    },
    t:{
        alias: 'template',
        describe: 'Extension of files containing templates. Default: .templates.html',
        'default': '.templates.html'
    },
    e:{
        alias: 'extension',
        describe: 'Extension for javascript files with compiled templates. Default: .temaplates.js',
        'default': '.templates.js'
    }
};

var optimist = require('optimist').options(cliDefs);
var argv = optimist.argv;

var ParseFile = function (source, output, destination)
{
    var template = fs.readFileSync(source, "utf8");
    if (output && !fs.existsSync(output))
    {
        fs.mkdirSync(output);
    }

    var outputFile = path.resolve(output + destination);

    if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
    }

    $ = cheerio.load(template);

    $('script[type="text/html"]').each(function () {
        ParseAndCompileTemplate($(this).text(), $(this).attr('id'), outputFile)
    });
}

var ParseAndCompileTemplate = function (template, name, outputFile) {
    var tplFuncString = hogan.compile(template, {asString: true});
    var outputFormat = "var %s = new Hogan.Template(%s);";
    tplFuncString = util.format(outputFormat, name, tplFuncString);

    fs.appendFileSync(outputFile, tplFuncString + "\n");
    util.log("Compiled template function \"" + name + "\" written to: " + outputFile);
};

if (argv.source && !argv.help) {

    readdirp({ root: argv.source, directoryFilter: [ '!.*' ], fileFilter: [ '*' + argv.template ] })
        .on('data', function (entry) {
            util.log(entry.path);
            ParseFile(path.resolve(entry.fullPath),
                argv.output
                    ? argv.output + entry.path.replace(entry.name, '')
                    : entry.fullPath.replace(entry.name, ''),
                entry.name.replace(argv.template, argv.extension));
        });

} else {
    optimist.showHelp();
}

