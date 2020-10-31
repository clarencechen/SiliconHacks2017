var isToggled = false;
function toggle() {
	console.log(isToggled)
	if (isToggled) {
		isToggled = false;
		document.getElementById("sidebar").style.right = "-100%";
	} else {
		isToggled = true;
		document.getElementById("sidebar").style.right = "0";
	}
}
