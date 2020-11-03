$(document).ready(function() {
	$('#login').on('click', (e) => {
		$.ajax({
			type: 'POST',
			url: 'https://cit-i-zen.herokuapp.com:443/login',
			data: {
				username: $('#username').val(),
				password: $('#password').val()
			},
			success: (res) => {
				if(res.success)
					window.location.replace("/")
				else
					alert('Incorrect username or password.')
			},
			error: console.error
		})
	})
})