/*eslint no-undef: "error" */
/*eslint-env node */
/*jshint node: true */
/*jslint node: true */
/*jslint plusplus: false */
/*jshint plusplus: false */
/*eslint-disable no-console */

var fs;
fs = require("fs");
var esprima = require("esprima");


/**
 * Compares ASTs and returns the maximum depth examined and the difference
 * @param astobject1 - AST as object
 * @param astobject2 - AST as object
 * @returns {{levels: number, difference: {}}}
 */
function compare(astobject1, astobject2) {
    "use strict";
    var levels = 1,
        difference = {},
        ignore_properties = {
            "name": 1
        };

    /**
     * Compares ast1, ast2 recursively
     * @param ast1 ast1 as json object
     * @param ast2 ast2 as json object
     * @param lvl Current level of depth
     * @returns {boolean}
     */
    function compare_helper(ast1, ast2, lvl) {
        var prop,
            ret,
            key;
        if (lvl > levels) {
            levels = lvl;
        }
        for (prop in ast1) {
            if (ast1.hasOwnProperty(prop) && !(ignore_properties.hasOwnProperty(prop))) {
                if (!ast2.hasOwnProperty(prop)) {
                    difference[ast1[prop]] = 1;
                    return true;
                }

                if (typeof ast1[prop] === "object" && typeof ast2[prop] === "object") {
                    ret = compare_helper(ast1[prop], ast2[prop], lvl + 1);
                    if (ret === false) {
                        return false;
                    }
                } else {
                    if (ast1[prop] !== ast2[prop]) {
                        if (ast1[prop] < ast2[prop]) {
                            key = ast1[prop] + "," + ast2[prop];
                            difference[key] = 1;
                        } else {
                            key = ast2[prop] + "," + ast1[prop];
                            difference[key] = 2;
                        }
                        return false;
                    }
                }
            }
        }
        //console.log("End level " + lvl)
        return true;
    }

    compare_helper(astobject1, astobject2, 1);
    return {"levels": levels, "difference": difference};
}
var CLUSTER = {};
CLUSTER.data = {};
CLUSTER.differences = {};

/**
 * Compares 2 source files and returns the difference
 * @param src1 string with first source
 * @param src2 string with second source
 * @param names is an optional argument for the names of the asts used
 * @returns object with the differences
 */
function compare_src(src1, src2, names) {
    "use strict";
    if (names === undefined) {
        names = "";
    }
    var src1json = esprima.parse(src1),
        src2json = esprima.parse(src2),
        mydiff = compare(src1json, src2json),
        diff = Object.keys(mydiff.difference),
        cluster_name,
        filename,
        diff_str;
    if (diff.length < 1) {
        return mydiff;
    }
    diff_str = diff[0];
    if (CLUSTER.differences.hasOwnProperty(diff_str)) {
        CLUSTER.differences[diff_str].push(names);
    } else {
        CLUSTER.differences[diff_str] = [];
    }
    // Split diff in its components
    cluster_name = diff_str.split(",");
    filename = names.split(",");
    if (cluster_name.length === 2) {
        // Respect the order
        var first_file = filename[0],
            second_file = filename[1];
        // TODO: When enabling the below, duplicates are not removed!
        if (mydiff.difference[diff_str] === 2) {
            first_file = filename[1];
            second_file = filename[0];
        }
        if (CLUSTER.data.hasOwnProperty(cluster_name[0])) {
            if (CLUSTER.data[cluster_name[0]].find(function (x) {
                    return (x === first_file);
                }) === undefined) {
                CLUSTER.data[cluster_name[0]].push(first_file);
            }
        } else {
            CLUSTER.data[cluster_name[0]] = [];
        }

        if (CLUSTER.data.hasOwnProperty(cluster_name[1])) {
            if (CLUSTER.data[cluster_name[1]].find(function (x) {
                    return (x === second_file);
                }) === undefined) {
                CLUSTER.data[cluster_name[1]].push(second_file);
            }
        } else {
            CLUSTER.data[cluster_name[1]] = [];
        }
    }
    return mydiff;
}

/**
 * Reads files and returns an array of sources
 * @param array_src an array of source filenames
 * @returns {Array} of sources
 */
function read_files(array_src) {
    var file,
        src_file = [];
    for (var i = 0; i < array_src.length; i += 1) {
        try {
            file = fs.readFileSync(array_src[i], "utf8");
            src_file.push(file);
        } catch (e) {
            console.log(e);
        }
    }
    return src_file;
}

/**
 *
 * @param src_file an array of sources
 * @returns the data cluster
 */
function compare_array_of_sources(src_file) {
    "use strict";
    var i,
        j,
        len,
        names;
    len = src_file.length;
    for (i = 0; i < len; i += 1) {
        for (j = i; j < len; j += 1) {
            names = i + "," + j;
            compare_src(src_file[i], src_file[j], names);
        }
    }
    return CLUSTER.data;
}


module.exports = {
    compare: compare,
    compare_src: compare_src,
    compare_array_of_sources: compare_array_of_sources,
    read_files: read_files,
    cluster_data: CLUSTER.data
};


// Polyfill

if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
        "use strict";
        if (this === null) {
            throw new TypeError("Array.prototype.find called on null or undefined");
        }
        if (typeof predicate !== "function") {
            throw new TypeError("predicate must be a function");
        }
        var list = Object(this),
            length = list.length >>> 0,
            thisArg = arguments[1],
            value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}