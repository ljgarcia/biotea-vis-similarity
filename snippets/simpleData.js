// if you don't specify a html file, the sniper will generate a div
var app = require("biotea-vis-similarity");

var data = [{"queryId":"117238","relatedId":"55328","terms":[],"score":0.11559054286271038}];
var instance = new app({
    el: yourDiv,
    data: data,
    queryId: 117238,
    prefixId: 'PMC'
});

instance.getDispatcher().on('ready', function(d) {
    console.log('ready');
    console.log(d);
});
