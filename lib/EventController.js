/*jslint node: true */
/*jshint laxbreak: true */
'use strict';

var d3 = require('d3');

var EventController = function() {
    this.dispatcher = d3.dispatch('ready', 'failed', 'selected', 'hover');

    this.getDispatcher = function() {
        return this.dispatcher;
    };
};

module.exports = EventController;