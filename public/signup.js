$(document).ready(function() {
	let user = '';
	let pass = '';
	$('#advance').on('click', (event) => {
		$('#account').toggle(600)
		$('#background').toggle(600)
		user = $("#username").val()
		pass = $('#password').val()
	});
	$('#bginfo').submit((e) => {
		e.preventDefault();
		const c = $('#ethnicity').find('input')
			.map((i, el) => $(el).prop('checked') * (1 << i))

		var t = $('#twitter').prop('value')
		if(t.substring(0, 1) !== "@")
			t = "@" + t
		const data = {
			id: user,
			pwd: pass,
			tw: t,
			lang: $('#language').prop('value'),
			dmgs: {
				ethnicity: Array.prototype.reduce.call(c, (a, b) => a + b),
				gender: $('#gender').prop('value'),
				age: $('#age').prop('value'),
				religion: $('#religion').prop('value'),
				orientation: $('#orientation').prop('value')
			}
		}
		$.ajax({
			type: 'POST',
			url: 'https://cit-i-zen.herokuapp.com:443/signup',
			data: data,
			success: (res) => {
				if(res.success)
					window.location.replace("chat.html")
				else
					alert(res.reason || 'Could not create account, please try again.')
			},
			error: (err) => {console.log(JSON.stringify(err))}
		})
	})
})