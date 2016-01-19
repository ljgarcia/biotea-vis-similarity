// if you don't specify a html file, the sniper will generate a div
var app = require("biotea-vis-similarity");
var instance = new app({
    el: yourDiv,
    path: 'http://localhost:9090/snippets/data/',
    queryId: 55328,
    db: 'PMC',
    relatedIds: [59472]
});

instance.getDispatcher().on('ready', function(d) {
    console.log('ready');
    console.log(d);
});