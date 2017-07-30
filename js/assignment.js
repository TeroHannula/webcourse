// JS for scroll and mouseover events in projects page

// turns on the "scroll" text while scrolling the projects page
var scrolled = function() {
	document.getElementById("scrolled").style.color="rgb(130,130,130)";
	window.setTimeout(scrolledOff, 200);
}

// turns off the "scroll" text while scrolling stops the projects page
var scrolledOff = function() {
	document.getElementById("scrolled").style.color="rgb(210,210,210)";
}

// turns on the "first" text when mouse goes over the first project in the list
var firstprojectIn = function() {
	document.getElementById("first").style.color="rgb(130,130,130)";
}

// turns off the "first" text when mouse goes off the first project in the list
 var firstprojectOut = function() {
	document.getElementById("first").style.color="rgb(210,210,210)";
}
 