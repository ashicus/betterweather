// returns an anonymous object like so
// object
//		error: 	Boolean false for success
//		errorString: failure string
//		hi:		Fahrenheit
//		lo: 		Fahrenheit
//		temp: 	Fahrenheit
//		icon	:	icon code
//		icons:	our icons to display
//		description:	description
//		city:	City (first caps)
//		time:	time 24 hours(nn:nn)
//		sunset:	time 24 hours (nn:nn)
//		sunrise: time 24 hours (nn:nn)
//		phases: array[7] of integers; -1 means no phase data 1-24
//		forcast: array[6] of anonymous objects like so
//			object
//				hi:			Fahrenheit
//				lo: 		Fahrenheit
//				icon:		icon code
//				ouricon:	our icon code to display
//				description: description
//				daycode:	(MON/TUE/WED/THU/FRI/SAT/SUN)

function fetchWeatherData (callback, zip)
{
	var uid = getUID();
	
	var url = 'http://iphone-wu.apple.com/dgw?imei=' + uid + '&apptype=weather&t=' + numRequests++;

	var body = '<?xml version="1.0" encoding="utf-8"?><request devtype="' + gDevtype + '" deployver="' + gDeployver + '" app="' + gApp + '" appver="' + gAppver + '" api="' + gAPI + '" apiver="' + gAPIver + '" acknotification="0000">' 
				+ '<query id="0" timestamp="'
				+ new Date().getTime() + '" type="getforecastbylocationid"><list>'
				+ '<id>' + zip + '</id></list><unit>f</unit></query></request>';		

	var xml_request = new XMLHttpRequest();
	xml_request.onload = function(e) {xml_loaded(e, xml_request, callback);}
	xml_request.overrideMimeType("text/xml");
	xml_request.open("POST", url);
	xml_request.setRequestHeader("Content-type", "text/xml");
	xml_request.setRequestHeader("X-Client-ID", "IMSI=" + uid);
	xml_request.setRequestHeader("Cache-Control", "no-cache");
	xml_request.send(body);
	
	return xml_request;
}

function xml_loaded (event, request, callback)
{
	var obj = {	error:false,
				errorString: null, 
				time: null, 
				city: null, 
				temp: null, 
				description: null, 
				icon: null, 
				icons: null, 
				sunset: null, 
				sunrise: null, 
				phases: null,
				hi: null, 
				lo: null, 
				forecast: null, 
				link: null,
				windChill: null,
				windDirection: null,
				windSpeed: null
				}
	
	if (request.responseXML)
	{
		var obj = {error:false, errorString:null};

		var responseElement = findChild (request.responseXML, "response");
		if (responseElement == null) {callback(constructError("no <response>")); return;}

		var resultElement = findChild (responseElement, "result");
		if (resultElement == null) {callback(constructError("no <result>")); return;}

		var listElement = findChild (resultElement, "list");
		if (listElement == null) {callback(constructError("no <list>")); return;}

		var itemElement = findChild (listElement, "item"); //could be a list, but this gets the first one
		if (itemElement == null) {callback(constructError("no <item>")); return;}

		var location = findChild (itemElement, "location");

			obj.city = location.getAttribute("city");
			obj.country = location.getAttribute("countryname");

		var wind = findChild(itemElement, "wind");
		
			obj.windChill = wind.getAttribute("chill");
			obj.windDirection = wind.getAttribute("direction");
			obj.windSpeed = wind.getAttribute("speed");
		
		var condition = findChild(itemElement, "condition");

			obj.time = condition.getAttribute("time"); //TODO need to parse differently
			obj.temp = condition.getAttribute("temp");
			obj.description = condition.getAttribute("text");

		var astronomy = findChild(itemElement, "astronomy");

			obj.sunrise = astronomy.getAttribute("sunrise");
			obj.sunset = astronomy.getAttribute("sunset");
			obj.phase = astronomy.getAttribute("moonphase");

		var link = findChild(itemElement, "link");

			obj.link = link.firstChild.data;

		obj.forecast = new Array;
		var Forecasts = itemElement.getElementsByTagName("forecast");
		if (Forecasts == null || Forecasts.length == 0) {callback(constructError("no Forecasts")); return;}


		for(j=0; j < Forecasts.length; j++)
		{
			var foreElement = Forecasts.item(j);

			var foreobj = {description:null, hi:0, lo:0, icon:-1};

			foreobj.description = foreElement.getAttribute("text");
			foreobj.hi = foreElement.getAttribute("high");
			foreobj.lo = foreElement.getAttribute("low");
			foreobj.daycode = parseDayCode(foreElement.getAttribute("dayofweek"));
			foreobj.icon = foreElement.getAttribute("code");
			foreobj.ouricon = yahooWeatherTypes[foreobj.icon];

			obj.forecast.push(foreobj);

			if(j == 0) //the first day is today
			{
				obj.hi = foreobj.hi;
				obj.lo = foreobj.lo;
				
				if (condition.getAttribute("code") == "3200")
				{
					condition.setAttribute("code", foreobj.icon);
					condition.setAttribute("text", foreobj.description);
				}
			}
		}
		
		obj.icon = condition.getAttribute("code");
		if (obj.icon < 0 || obj.icon > 47) {callback(constructError("icon code invalid, out of range (0-47) " + obj.icon)); return;}
		obj.icons = yahooWeatherTypes[obj.icon];
		
		callback (obj);
		
	}
	else
	{
		callback ({error:true, errorString:"XML request failed. no responseXML"});
	}
}