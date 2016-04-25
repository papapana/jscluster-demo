/*eslint no-undef: "error" */
/*eslint-env node */
/*jshint node: true */
/*jslint node: true */
/*jslint plusplus: false */
/*jshint plusplus: false */
/*eslint-disable no-console */
var chai = require("chai");
var path = require("path");
var sinon = require("sinon");
var should = chai.should();
var expect = chai.expect;
var fs = require("fs");
var asqCodeClustering = require("../asq-code-clustering.js");
var compare = asqCodeClustering.compare;
var compare_src = asqCodeClustering.compare_src;
var compare_array_of_sources = asqCodeClustering.compare_array_of_sources;

describe("compare", function () {
    "use strict";
    var json_data3;
    var json_data2;
    var json_data1;
    before(function () {
        "use strict";
        try {
            json_data1 = JSON.parse(fs.readFileSync('fixtures/code1.json', 'utf8'));
            json_data2 = JSON.parse(fs.readFileSync('fixtures/code2.json', 'utf8'));
            json_data3 = JSON.parse(fs.readFileSync('fixtures/code3.json', 'utf8'));
        } catch (err) {
            process.stderr.write(err.stack);
            process.exit();
        }
    });
    it("should detect equivalent pieces of code", function () {
        var eq = compare(json_data1, json_data1);
        expect(eq).to.deep.equal({levels: 13, difference: {}});
    });

    it("should detect difference in declaring variable in for loop", function () {
        "use strict";
        var mydiff = compare(json_data1, json_data2);
        expect(mydiff).to.deep.equal({
            "difference": {
                "AssignmentExpression,VariableDeclaration": 2
            },
            "levels": 9
        });
    });

    it("should detect difference += instead of normal +", function () {
        "use strict";
        var mydiff = compare(json_data1, json_data3);
        expect(mydiff).to.deep.equal({
            "difference": {
                "+=,=": 2
            },
            "levels": 10
        });
    });

    it("should detect order to use for cluster name", function () {
        "use strict";
        var mydiff = compare(json_data1, json_data3);
        expect(mydiff).to.deep.equal({
            "difference": {
                "+=,=": 2
            },
            "levels": 10
        });

        mydiff = compare(json_data3, json_data1);
        expect(mydiff).to.deep.equal({
            "difference": {
                "+=,=": 1
            },
            "levels": 10
        });
    });

});

describe("compare_src", function () {
    "use strict";
    it("should compare 2 different source files", function () {
        try {
            var file1 = fs.readFileSync('fixtures/code_inspect1.js', 'utf8');
            var file2 = fs.readFileSync('fixtures/code_inspect2.js', 'utf8');
            var mydiff = compare_src(file1, file2);
            expect(mydiff).to.deep.equal({levels: 10, difference: {'+=,=': 2}});
        } catch (err) {
            process.stderr.write(err.stack);
            process.exit();
        }
    });

});

describe("compare_array_of_sources", function () {
    "use strict";
    it("should find the correct clusters", function () {
        // Use only javascript files
        var jsfiles = [];
        var dir = path.resolve(__dirname, "../student_submissions")
        var files = fs.readdirSync(dir);
        for (var i = 0; i < files.length; i++) {
            if (path.extname(files[i]) === ".js") {
                jsfiles.push(path.resolve(dir, files[i]));
            }
        }

        var clusters = compare_array_of_sources(jsfiles);
        //console.log("clusters: " + JSON.stringify(clusters));
        expect(clusters).to.deep.equal([1, 2, 3]);

    });

});
