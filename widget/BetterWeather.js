var kVersion						= "1.0.2.0.7";
var kBackgroundCollapsedHeight		= 101;
var kBackgroundHeightWithLows		= 212;
var kBackgroundHeightWithoutLows	= 192;
var kMiddleHeightWithLows 			= 156;
var kMiddleHeightWithoutLows 		= 136;
var kUpdateAppCastURL				= "https://dl.dropbox.com/u/360304/BetterWeather/appCast.xml";
var kUpdateURL						= "http://rectanglicle.com/projects/BetterWeather";
var kAshURL							= "http://ashic.us";

function goToAshSite(event) {
	if(window.widget) {
		widget.openURL(kAshURL);
	}
}

function checkForUpdates() {
	var url = kUpdateAppCastURL;
	var xml_request = new XMLHttpRequest();
	xml_request.onload = function(e) {
		if(xml_request.responseXML) {
			var channelElement = xml_request.responseXML.getElementsByTagName("channel")[0];
			var itemElement = channelElement.getElementsByTagName("item")[0];
			var version = itemElement.getElementsByTagName("title")[0].firstChild.data.replace(/\./g, "");
			
			if(parseInt(version, 10) > parseInt(kVersion.replace(/\./g, ""), 10)) {
				showUpdatePrompt();
			}
		}
	};
	xml_request.overrideMimeType("text/xml");
	xml_request.open("GET", url);
	xml_request.setRequestHeader("Content-type", "text/xml");
	xml_request.setRequestHeader("Cache-Control", "no-cache");
	xml_request.send();
}

function showUpdatePrompt() {
	var update_button = new AppleGlassButton(document.getElementById('update-button'), getLocalizedString('Get Latest Version'), openUpdateURL);
	document.getElementById("update-available").style.display = "block";
}

function openUpdateURL() {
	if(window.widget) {
		widget.openURL(kUpdateURL);
	}
}

var __specialFirstLoad = window.specialFirstLoad;
window.specialFirstLoad = function() {
	__specialFirstLoad();
	
	document.getElementById('ashLogo').src = hidpiPath('Images/ash.png');
	
	checkForUpdates();
};

var __loadPreferences = window.loadPreferences;
window.loadPreferences = function() {
	__loadPreferences();
	
	if(window.widget) {
		if(!isCollapsed) {
			document.getElementById('middle').style.height = (showLows ? kMiddleHeightWithLows : kMiddleHeightWithoutLows) + "px";
		}
	}
};

var __lowChanged = window.lowChanged;
window.lowChanged = function() {
	__lowChanged();
	
	if(!isCollapsed) {
		document.getElementById('middle').style.height = (showLows ? kMiddleHeightWithLows : kMiddleHeightWithoutLows) + "px";
	}
};

var __resizeForCurrentCollapsedState = window.resizeForCurrentCollapsedState;
window.resizeForCurrentCollapsedState = function(isSyncing) {
	// __resizeForCurrentCollapsedState(isSyncing);
	
	var midDiv = document.getElementById("middle");
	var timeNow = new Date().getTime();
	var multiplier = ((event && event.shiftKey) ? 10 : 1); // enable slo-mo
	var startingSize = parseInt(midDiv.clientHeight,10);

	resizeAnimation.element = midDiv;
	if (resizeAnimation.timer != null) // it is moving... change to new size
	{
		clearInterval(resizeAnimation.timer);
		resizeAnimation.timer = null;
		resizeAnimation.duration -= (timeNow - resizeAnimation.startTime);
		resizeAnimation.positionFrom = resizeAnimation.positionNow;
	}
	else
	{
		resizeAnimation.duration = 250 * multiplier;
		resizeAnimation.positionFrom = startingSize;
	}
	
	var resizeTo = isCollapsed ? 15 : (showLows ? kMiddleHeightWithLows : kMiddleHeightWithoutLows);
	totalWidgetHeight = calculateBackgroundHeight();
	if (!isCollapsed && window.widget)
		window.resizeTo (calculateBackgroundWidth(), totalWidgetHeight);

	resizeAnimation.positionTo = parseInt(resizeTo); // lots of hard coding, yum...
	resizeAnimation.startTime = timeNow - 13; // set it back one frame.
	resizeAnimation.onfinished = function(){animFinished(isSyncing);};
	
	resizeAnimation.element.style.height = startingSize + "px";
	resizeAnimation.timer = setInterval (animate, 13);
	animate();
};

var __calculateBackgroundHeight = window.calculateBackgroundHeight;
window.calculateBackgroundHeight = function() {
	var height = __calculateBackgroundHeight();
	
	if (isCollapsed)
		height = kBackgroundCollapsedHeight;
	else
		height = showLows ? kBackgroundHeightWithLows : kBackgroundHeightWithoutLows;
		
	height +=  topOffset;
	if(height < maxImageHeight) {
		height = maxImageHeight; // make sure there is enough room for icon;
	}
		
	return height;
};

var __handleDataFetched = window.handleDataFetched;
window.handleDataFetched = function(object) {
	__handleDataFetched(object);
	lastResults[0].lastUpdate = object.time;
	lastResults[0].windChill = object.windChill;
	
	document.getElementById('high').innerText = getLocalizedString('%@º').replace('%@', convertToCelcius(object.hi)) + " / " + getLocalizedString('%@º').replace('%@', convertToCelcius(object.lo));
	document.getElementById('lo').innerText = object.time.to12HourTime();
	document.getElementById('sunrise').innerText = "Sunrise: " + object.sunrise.to12HourTime();
	document.getElementById('sunset').innerText = "Sunset: " + object.sunset.to12HourTime();
	
	// wind stuffs
	document.getElementById('feels-like').innerText = "Feels like " + convertToCelcius(object.windChill) + "º";
	if(parseInt(object.windSpeed)) {
		document.getElementById('wind').innerText = object.windSpeed + " mph " + object.windDirection.toDirection();
	} else {
		document.getElementById('wind').innerText = "No wind";
	}
};

var __updateValuesUnitsChanged = window.updateValuesUnitsChanged;
window.updateValuesUnitsChanged = function() {
	__updateValuesUnitsChanged();
	
	if (lastResults != null)
	{
		var c = lastResults.length;
		
		if (c > 0)
		{
			var object = lastResults[0];
			
			// high & low
			document.getElementById('high').innerText = getLocalizedString('%@º').replace('%@', convertToCelcius(object.hi)) + " / " + getLocalizedString('%@º').replace('%@', convertToCelcius(object.lo));
			document.getElementById('lo').innerText = lastResults[0].lastUpdate.to12HourTime();
			
			// wind
			document.getElementById('feels-like').innerText = "Feels like " + convertToCelcius(object.windChill) + "º";
		}
	}
};

String.prototype.to12HourTime = function () {
	var result = this;
	
    if(this.match(/^[0-9]+$/)) {
		var hour = this.substr(0, 2);
		var minutes = this.substr(this.length - 2, 2);
		var am = (hour < 12);
		
		if(hour > 12) {
			hour -= 12;
		}
		
		if(hour == 0) {
			hour = 12;
		}
		
		result = parseInt(hour, 10) + ":" + minutes + (am ? "am" : "pm");
	}
	
	return result;
};

String.prototype.toDirection = function () {
	var wd = this;
	
	if(wd >= 0 && wd <= 11.25) {
		var dir = "N";
	}
	if(wd > 348.75 && wd <= 360) {
		var dir = "N";
	}
	if(wd > 11.25 && wd <= 33.75) {
		var dir = "NNE";
	}
	if(wd > 33.75 && wd <= 56.25) {
		var dir = "NE";
	}
	if(wd > 56.25 && wd <= 78.75) {
		var dir = "ENE";
	}
	if(wd > 78.75 && wd <= 101.25) {
		var dir = "E";
	}
	if(wd > 101.25 && wd <= 123.75) {
		var dir = "ESE";
	}
	if(wd > 123.75 && wd <= 146.25) {
		var dir = "SE";
	}
	if(wd > 146.25 && wd <= 168.75) {
		var dir = "SSE";
	}
	if(wd > 168.75 && wd <= 191.25) {
		var dir = "S";
	}
	if(wd > 191.25 && wd <= 213.75) {
		var dir = "SSW";
	}
	if(wd > 213.75 && wd <= 236.25) {
		var dir = "SW";
	}
	if(wd > 236.25 && wd <= 258.75) {
		var dir = "WSW";
	}
	if(wd > 258.75 && wd <= 281.25) {
		var dir = "W";
	}
	if(wd > 281.25 && wd <= 303.75) {
		var dir = "WNW";
	}
	if(wd > 303.75 && wd <= 326.25) {
		var dir = "NW";
	}
	if(wd > 326.25 && wd <= 348.75) {
		var dir = "NNW";
	}
	
	return dir;
};