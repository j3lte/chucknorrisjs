/* global next */
'use strict';
// Based on https://github.com/neilkod/chucknorrisfacts/blob/master/chuck_norris_facts.py

// REQUIRES
var request = require('request'),
    cheerio = require('cheerio'),
    async = require('async'),
    _ = require('underscore'),
    fs = require('fs');

// VARIABLES
var _facts = [],
    done = 0,
    last = 0,
    outputFilename = 'chucknorris.json',
    CONCURRENT_REQUESTS = 20;

// INITIALIZE
getLastPageNumber(getPages);

/**
 * Get the last page number
 *
 * @param {callback} Callback used (getPages)
 */

function getLastPageNumber (callback) {
    request('http://www.chucknorrisfacts.com/all-chuck-norris-facts?page=1', function(err, resp, body) {
        if (err) {
            throw err;
        }

        var $ = cheerio.load(body),
            lastPageNum = parseInt($('a','.pager-last.last').attr('href').split('=')[1]);

        if (!isNaN(lastPageNum)){
            console.log('PAGES: ' + lastPageNum);
            callback(lastPageNum);
        }

    });
}

/**
 * Get all the pages from 1 to limit
 *
 * @param {limit} maximum limit of pages, 100 means page 1 to 100
 */
function getPages (limit) {
    // create numbered range from 1 to limit
    var numrange = _.range(1,limit+1);
    last = limit;
    // start querying, limiting the concurrent requests
    async.eachLimit(numrange, CONCURRENT_REQUESTS, getPage, function (err) {
        if (err) {
            return next(err);
        }
        // output length
        console.log('Number of entries: ' + _facts.length);
        if (_facts.length > 0) {
            // sort array, filter duplicates
            var facts = {
                quotes : sortedUnique(_facts)
            };
            console.log('Number of unique quotes: ' + facts.quotes.length);
            writeFile(facts,function () {
                console.log('JSON saved to ' + outputFilename);
            });
        }
    });
}

var sortedUnique = _.compose(_.uniq, function (array) {
    return _.sortBy(array, _.identity);
});


/**
 * Get's the page from ChuckNorrisFacts.com
 *
 * @param {pagenum} pagenumber from chucknorrisfacts.com
 * @param {callback} callback function used by async
 */
function getPage (pagenum, callback) {
    request('http://www.chucknorrisfacts.com/all-chuck-norris-facts?page=' + pagenum, function(err, resp, body) {
        if (err) {
            console.log(' error :');
            console.log(err);
        }

        var $ = cheerio.load(body);

        $('.views-row').each(function () {
            var $t = $(this),
                    _quote = $t.find('.createYourOwn').text().trim();
            if (_quote !== ''){
                _facts.push(_quote);
            }
        });

        done++;
        console.log('DONE : ' + ((done / last) * 100).toFixed(2) + ' % || Processed page: ' + pagenum);
        callback();

    });
}

/**
 * Writes an object to the specified filename
 *
 * @param {obj} Object that will be written
 * @param {cb} callback function
 */
function writeFile(obj,cb) {
    fs.writeFile(outputFilename, JSON.stringify(obj, null, 2), function (err) {
        if (err) {
            console.log(err);
        } else {
            if (typeof cb === 'function'){
                cb();
            }
        }
    });
}

