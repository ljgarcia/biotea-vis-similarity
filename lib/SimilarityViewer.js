/*jslint node: true */
/*jslint node: true */
/*jshint laxbreak: true */
'use strict';
/*
 * Licensed under the Apache 2 license.
 */
var d3 = require('d3');
var _ = require('underscore');
var RDFLoader = require('./RDFLoader');
var EventController = require('./EventController');
var jQuery = require('jquery');

/**
 * Private Methods
 */
var defaultOpts = {
    width: 600,
    height: 400,
    path: undefined,
    queryId: undefined,
    db: 'PMC',
    relatedIds: []
};

var SimilarityViewer = function(opts){
    var viewer = this;
    viewer.loaders = [];
    viewer.data = {
        queryId: opts.queryId,
        relations: []
    };
    viewer.options = _.extend({}, defaultOpts, opts);

    viewer.margin = {left: 10, bottom: 10};

    d3.select(viewer.options.el).selectAll('*').remove();
    viewer.svg = d3.select(viewer.options.el).append('svg')
        .attr('width', viewer.options.width - viewer.margin.left*2)
        .attr('height', viewer.options.height - viewer.margin.bottom*2);

    viewer.load = function() {
        _.each(viewer.options.relatedIds, function(id) {
            var loader = RDFLoader.get(viewer.options.path, viewer.options.queryId, id, viewer.options.db);
            viewer.loaders.push(loader);
            loader.done(function(loadedData) {
                viewer.data.relations.push(loadedData.data);
            }).fail( function(e) {
                viewer.data.relations.push({
                    relatedId: 'unload:' + id,
                    score: 0,
                    terms: []
                });
                console.log(e);
            });
        });
    };

    viewer.display = function() {
        var nodes = [{
            queryNode: true,
            relatedId: viewer.options.db + ':' + viewer.data.queryId,
            score: 1,
            terms: []
        }].concat(viewer.data.relations);

        var radius = d3.scale.pow()
            .exponent(1)
            .domain([0, 1])
            .range([5, 15]);

        var force = d3.layout.force()
            .charge(-120)
            .linkDistance(30)
            .size([viewer.options.width, viewer.options.height]);

        force.nodes(nodes)
            .links(viewer.data.links)
            .start();

        var link = viewer.svg.selectAll('.link')
            .data(viewer.data.links)
            .enter().append('line')
            .classed('biotea_link', true);

        var node = viewer.svg.selectAll('.node')
            .data(nodes)
            .enter().append('g')
            .attr('class', function(d) {
                return d.queryNode ? 'biotea_query_node' : 'biotea_node';
            })
            .on('mouseover', function(d) {
                var self = this;
                EventController.dispatcher.hover({elem: self, datum: d});
            })
            .on('click', function(d) {
                var self = this;
                EventController.dispatcher.selected({elem: self, datum: d});
            })
            .call(force.drag);

        node.append('circle')
            .attr('x', -8)
            .attr('y', -8)
            .attr('r', function(d) {
                return radius(d.score);
            });

        node.append('text')
            .attr('dx', 12)
            .attr('dy', '.35em')
            .text(function(d) {return d.relatedId});

        force.on("tick", function() {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        });
    };

    viewer.render = function() {
        var viewer = this;
        if (viewer.options.path && viewer.options.queryId && (viewer.options.relatedIds.length !== 0)) {
            viewer.load();
            jQuery.when.apply(null, viewer.loaders)
                .then(function() {
                    viewer.data.links = _.map(viewer.data.relations, function(node, index) {
                        return {
                            source: 0,
                            target: index+1,
                            value: node.score
                        };
                    });
                    viewer.display();
                }
            );
        } else {
            viewer.svg.append('text').text('No path, query document or related documents provided in the input');
        }
    };

    viewer.setPath = function(path) {
        this.options.path = path;
    };

    viewer.getDispatcher = function() {
        return EventController.dispatcher;
    };

    viewer.render();
};

module.exports = SimilarityViewer;
