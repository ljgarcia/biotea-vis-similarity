/*jslint node: true */
/*jshint laxbreak: true */
'use strict';

var d3 = require('d3');

var EventController = function() {
    return {
        dispatcher: d3.dispatch('ready', 'failed', 'selected', 'hover')
    }
}();

module.exports = EventController;