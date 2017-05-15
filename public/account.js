var isToggled = false;
function toggle() {
	console.log(isToggled)
	if (isToggled)
	{
		isToggled = false;
		document.getElementById("sidebar").style.right = "-100%";
	}
	else
	{
		isToggled = true;
		document.getElementById("sidebar").style.right = "0";
	}
}
function advance() {
	$('#account').toggle(600);
	$('#background').toggle(600);
}
$(document).ready(function() {
	var user = '';
	var pass = '';
	$('#advance').on('click', function(event) {
		user = $("#username").val()
		pass = $('#password').val()
		advance();
	});
	$('#bginfo').submit(function(e){
		e.preventDefault();
		var a = $('#age').prop('value');
		var l = $('#language').prop('value');
		var r = $('#religion').prop('value');
		var g = $('#gender').prop('value');
		var o = $('#orientation').prop('value');
		var c = '';
		$('#ethnicity').find('input').each(function(index, el) {
			if($(el).prop('checked'))
				c += $(el).prop('value') + ', ';
		});
		c = c.slice(0, -2);
		var t = $('#twitter').prop('value');
		if(t.substring(0, 1) !== "@")
		{
			t = "@" +t;
		}
		var data =   
			{"username": user,
			"password": pass,
			"twitter": t,
			"language": l,
			"Ethnicity": c,
			"Gender": g,
			"Age": a,
			"Religion": r,
			"Sexual Orientation": o}
		console.log(data)
		$.ajax({
		type: 'POST',
		url: 'https://cit-i-zen.herokuapp.com:443/new_user/',
		data:{
		  data
		},
		success: function(data){
			login(user, pass)
		},
		error: function(err){
			console.log(err);
			alert("Database Error")
			window.location.replace("login.html");
		}
		});
	})
});