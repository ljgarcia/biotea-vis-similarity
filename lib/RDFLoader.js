var jQuery = require('jquery');
var _ = require('underscore');
var EventController = require('./EventController');

var RDFLoader = function() {
    return {
        get: function(path, queryId, relatedId, db) {
            return jQuery.ajax({
                url: path + queryId + '_' + relatedId + '.json',
                dataType: 'json'
            }).done(function(d) {
                d.data = {};
                terms = [];
                _.each(d['@graph'], function(elem) {
                    if (elem['@type'] === 'biotea:Biolink') {
                        d.data = {
                            relatedId: db + ':' + relatedId,
                            score: elem['biotea:score'],
                            terms: [],
                        };
                    } else if (elem['@type'] === 'biotea:SemanticAnnotation') {
                        terms.push(elem['references']);
                    }
                });
                d.data.terms = terms;
                EventController.dispatcher.ready({
                    request: path + queryId + '_' + relatedId + '.json',
                    data: d.data
                });
                return d;
            }).fail(function(e) {
                console.log('Error loading: ' + queryId + '-' + relatedId);
                EventController.dispatcher.failed({
                    request: path + queryId + '_' + relatedId + '.json',
                });
                return e;
            });
        }
    };
}();

module.exports = RDFLoader;