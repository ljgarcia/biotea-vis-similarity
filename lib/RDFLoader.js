var jQuery = require('jquery');
var _ = require('underscore');
var EventController = require('./EventController');

var RDFLoader = function() {
    var myDispatcher = new EventController().getDispatcher();
    return {
        get: function(path, queryId, relatedId, alternative, altId) {
            return jQuery.ajax({
                url: path + queryId + '_' + relatedId + '.json',
                dataType: 'json'
            }).done(function(d) {
                d.data = {};
                terms = [];
                _.each(d['@graph'], function(elem) {
                    if (elem['@type'] === 'biotea:Biolink') {
                        d.data = {
                            relatedId: relatedId,
                            altId: (alternative === true) ? altId : '',
                            score: elem['biotea:score'],
                            terms: []
                        };
                    } else if (elem['@type'] === 'biotea:SemanticAnnotation') {
                        terms.push(elem['references']);
                    }
                });
                d.data.terms = terms;
                myDispatcher.ready({
                    request: path + queryId + '_' + relatedId + '.json',
                    data: d.data
                });
                return d;
            }).fail(function(e) {
                console.log('Error loading: ' + queryId + '-' + relatedId);
                myDispatcher.failed({
                    request: path + queryId + '_' + relatedId + '.json',
                });
                return e;
            });
        }
    };
}();

module.exports = RDFLoader;
