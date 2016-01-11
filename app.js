//Lets require/import the HTTP module
var http = require('http');
var dispatcher = require('httpdispatcher');
var config = require('./config.js');

const HOST = 'localhost';
const PORT=8080; 

var GitHubConfig = {
	'client_id'   : config['client_id'],
	'secret'      : config['secret'],
	'redirect_uri': '',
	'scope'       : '',
	'state'       : Math.round(Math.random()*10)
}

//For all your static (js/css/images/etc.) set the directory name (relative path).
dispatcher.setStatic('resources');

//A sample GET request    
dispatcher.onGet("/", function(req, res) {
    res.writeHead(200);
    res.write("<!DOCTYPE html><html><body><a href='login'>Login!</a></body></html>");
    res.end();
});    

dispatcher.onGet("/login", function(req, res) {
  var url = 'https://github.com/login/oauth/authorize'
  + '?client_id=' + GitHubConfig.client_id
  + (GitHubConfig.scope ? '&scope=' + GitHubConfig.scope : '')
  + '&state=' + GitHubConfig.state;

  res.setHeader('location', url);
  res.statusCode = 302;
  res.end();
});    


dispatcher.onGet("/callback", function(req, res) {
  res.write("Lolipop");
  res.end();
});


//A sample POST request
dispatcher.onPost("/a", function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Got Post Data');
});

//Lets use our dispatcher
function handleRequest(request, response){
    try {
        //log the request on console
        console.log(request.url);
        //Disptach
        dispatcher.dispatch(request, response);
    } catch(err) {
        console.log(err);
    }
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});