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
            relatedId: viewer.options.db + ':' + viewer.data.queryId,
            score: 1,
            terms: [],
        }].concat(viewer.data.relations);
console.log(nodes);
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
            .classed('link', true)
            .style('stroke-width', function(d) {
                return d.value + 10;
            });

        var node = viewer.svg.selectAll('.node')
            .data(nodes)
            .enter().append('circle')
            .classed('node', true)
            .attr('r', function(d) {
                return d.score + 10;
            })
            .style('fill', 'black')
            .call(force.drag);

        node.append('title')
            .text(function(d) { return d.relatedId; });

        force.on("tick", function() {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

          node.attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; });
        });

        var forceValue = d3.scale.pow()
            .exponent(0.001)
            .domain([0, 1])
            .range([5, 10]);
    }

    viewer.render = function() {
        var viewer = this;
        if (viewer.options.path && viewer.options.queryId && (viewer.options.relatedIds.length !== 0)) {
            viewer.load();
            jQuery.when(viewer.loaders)
                .done(viewer.data.links = _.map(viewer.data.relations, function(node, index) {
                                              return {
                                                  source: 0,
                                                  target: index+1,
                                                  value: node.score
                                              };
                                          });
                                          console.log(viewer.data););
            //viewer.display();
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