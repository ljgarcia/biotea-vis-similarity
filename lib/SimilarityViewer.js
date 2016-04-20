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

var callForce = function(viewer, graph) {
    var maxScore = _.max(viewer.data.relations, function(d) {return d.score}).score;
    var minScore = _.min(viewer.data.relations, function(d) {return d.score}).score;
    var strength = d3.scale.pow().exponent(1).domain([minScore, maxScore]).range([0.1, 1]);

    viewer.force = d3.layout.force().charge(-200).linkDistance(50)
        .size([viewer.options.width, viewer.options.height])
        .linkStrength(function(link) {
            return strength(link.value);
        })
    ;

    viewer.force.nodes(viewer.nodes).links(viewer.data.links).start();

    graph.node.call(viewer.force.drag);

    viewer.force.on("tick", function() {
        graph.link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        graph.node.attr("transform", function(d) {
            var left = d.x < graph.node[0][0].__data__.x ? true : false;
            if (left) {
                var textWidth = this.childNodes[1].getBBox().width;
                var shiftX = -graph.radius(d.score) - 15 - textWidth;
                this.childNodes[1].setAttribute("transform", "translate(" + shiftX + ", 0)");
            } else {
                this.childNodes[1].setAttribute("transform", "translate(0, 0)");
            }
            return "translate(" + d.x + "," + d.y + ")";
        });
    });
};

var SimilarityViewer = function(opts){
    var viewer = this;
    viewer.init(opts);
};

SimilarityViewer.prototype.load = function() {
    var viewer = this;
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

SimilarityViewer.prototype.display = function() {
    var viewer = this;
    viewer.nodes = [{
        queryNode: true,
        relatedId: viewer.options.db + ':' + viewer.data.queryId,
        score: 1,
        terms: []
    }].concat(viewer.data.relations);

    var radius = d3.scale.pow().exponent(1).domain([0, 1]).range([5, 15]);

    var link = viewer.svg.selectAll('.link')
        .data(viewer.data.links)
        .enter().append('line')
        .classed('biotea_link', true);

    var node = viewer.svg.selectAll('.node')
        .data(viewer.nodes)
        .enter().append('g')
        .attr('class', function(d) {
            return d.queryNode ? 'biotea_query_node' : 'biotea_node';
        })
        .attr('title', function(d) { return d.score; })
        .on('mouseover', function(d) {
            var self = this;
            EventController.dispatcher.hover({elem: self, datum: d});
        })
        .on('click', function(d) {
            var self = this;
            EventController.dispatcher.selected({elem: self, datum: d});
        });

    node.append('circle')
        .attr('x', -8)
        .attr('y', -8)
        .attr('r', function(d) {
            return radius(d.score);
        });

    node.append('text')
        .attr('dx', 15)
        .attr('dy', '.35em')
        .text(function(d) {return d.queryNode ? '' : d.relatedId});

    return {node: node, link: link, radius: radius};
};

SimilarityViewer.prototype.render = function() {
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
                var graph = viewer.display();
                callForce(viewer, graph);
            }
        );
    } else {
        viewer.svg.append('text').text('No path, query document or related documents provided in the input');
    }
};

SimilarityViewer.prototype.init = function(opts) {
    var viewer = this;
    viewer.loaders = [];
    viewer.data = {
        queryId: opts.queryId,
        relations: []
    };
    viewer.options = _.extend({}, defaultOpts, opts);
    viewer.margin = {left: 10, bottom: 10};
    viewer.svg = undefined;

    d3.select(viewer.options.el).selectAll('*').remove();
    d3.select(viewer.options.el).html('');
    viewer.svg = d3.select(viewer.options.el).append('svg')
        .attr('width', viewer.options.width - viewer.margin.left*2)
        .attr('height', viewer.options.height - viewer.margin.bottom*2);

    viewer.render();
};

SimilarityViewer.prototype.setPath = function(path) {
    this.options.path = path;
};

SimilarityViewer.prototype.getDispatcher = function() {
    return EventController.dispatcher;
};

SimilarityViewer.prototype.stopForce = function() {
    this.force.stop();
};

module.exports = SimilarityViewer;
