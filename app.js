//Lets require/import the HTTP module
var http = require('http');
var dispatcher = require('httpdispatcher');
var request = require('request');
var url = require('url');

//Configuration file [Not stored in Git]
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

//Route for static files' folder
dispatcher.setStatic('resources');

// Get Homepage
dispatcher.onGet("/", function(req, res) {
    res.writeHead(200);
    res.write("<!DOCTYPE html><html><body>"+
    	"<style>body{text-align: center;}a{color: #000000;border: 1px solid black;padding: 10px 30px;text-decoration: none;margin-top: 10em;display: inline-block;font-size: 20px;transition: all .5s;}"+
    	"a:hover{background-color: black;color: white;}"+
    	"</style>"+
    	"<a href='login'>Login!</a></body></html>");
    res.end();
});    

//Redirect to login url on GitHub
dispatcher.onGet("/login", function(req, res) {
  var url = 'https://github.com/login/oauth/authorize'
  + '?client_id=' + GitHubConfig.client_id
  + (GitHubConfig.scope ? '&scope=' + GitHubConfig.scope : '')
  + '&state=' + GitHubConfig.state;

  res.setHeader('location', url);
  res.statusCode = 302;
  res.end();
});    

//Get 'em callbacks!
dispatcher.onGet("/callback", function(req, res) {
  var query = url.parse(req.url, true).query;
  if (query.state == GitHubConfig.state){
    //No XSS Attack!
    payload = {
      'code':       	query.code,
      'client_id':     	GitHubConfig.client_id,
      'client_secret': 	GitHubConfig.secret
    }
    console.log(payload);
    request.post({
      url: 'https://github.com/login/oauth/access_token', 
      formData: payload, 
      headers: {'Accept': 'application/json'}
      }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
              var token = JSON.parse(body).access_token;
              res.statusCode = 302;
              authorized(res, token);
            }
      }
    );

  };
});

var authorized = function(res, token){
  request.get({
    url: "https://api.github.com/user", 
    headers: {'Authorization': 'token '+token, 'User-Agent': 'Mozilla/5.0'}}, 
    function(error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            var user = body.login;
            res.end("<!DOCTYPE html><html><body>"+
            	"<style>.key{font-size:18px; color:blue;font-weight:bold;}.string,.number,.boolean,.null{font-size:18px;}</style>"+
            	"<pre>"+syntaxHighlight(JSON.stringify(body,null,2))+
            	"</pre></body></html>"
            );
        } else {
            console.log(body);
            res.end(body);
        }
    }
  );
};

//Lets use our dispatcher
function handleRequest(request, response){
    try {
        console.log(request.url);
        dispatcher.dispatch(request, response);
    } catch(err) {
        console.log(err);
    }
}

var syntaxHighlight = function(json) {
    if (typeof json != 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}
//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});