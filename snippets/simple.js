// if you don't specify a html file, the sniper will generate a div
var app = require("biotea-vis-similarity");
var instance = new app({
    el: yourDiv,
    path: 'http://localhost:9090/snippets/data/',
    queryId: 117238,
    db: 'PMC',
    relatedIds: [55328, 59472, 64840, 115224, 115254, 126238, 126242, 126873, 130049, 133446, 151173, 153502, 165429,
        166151, 194174, 200968, 212256, 222958]
});

instance.getDispatcher().on('ready', function(d) {
    console.log('ready');
    console.log(d);
});
