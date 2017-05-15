function login(user, pass) {
var client = new HttpClient();
var serverUrl = "https://cit-i-zen.herokuapp.com:443/user";
var params = "/";
params += user;
params += "/"
params += pass;
console.log(params);
client.get(serverUrl + params, function(err, data) {
if(err)
{
console.log(err);
}
else
{
console.log("successful login!");
console.log(data);
for(var prop in data.docs[0])
window.localStorage.setItem(prop, data.docs[0][prop])
window.location.replace("index.html");
}
})
}

var HttpClient = function() {
this.get = function(aUrl, callback) {
var xhr = new XMLHttpRequest();
xhr.open("GET", aUrl, true);
xhr.responseType = 'json';
xhr.onload = function() {
var status = xhr.status;
if (status == 200) {
callback(null, xhr.response);
} else {
callback(status);
}
};
xhr.send();
}
}

$(document).ready(function() {
	$('#login').on('click',function(e){
		login($('#username').val(), $('#password').val())
	})
});