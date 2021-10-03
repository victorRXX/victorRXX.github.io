

// returns the contents of the file, synchronously
function readTextFile(file)
{
	var res = "";
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                console.log("loaded file: ", file);
                res = allText;
            }
        }
    }
    rawFile.send(null);
    return res;
}

function addExamplePlacemark(placemarkLayerObj)
{
	var placemarkAttributes = new WorldWind.PlacemarkAttributes(null);

	placemarkAttributes.imageOffset = new WorldWind.Offset(
	    WorldWind.OFFSET_FRACTION, 0.3,
	    WorldWind.OFFSET_FRACTION, 0.0);

	placemarkAttributes.labelAttributes.offset = new WorldWind.Offset(
	    WorldWind.OFFSET_FRACTION, 0.5,
	    WorldWind.OFFSET_FRACTION, 1.0);

	placemarkAttributes.imageSource = WorldWind.configuration.baseUrl + "images/pushpins/plain-red.png";

	var position = new WorldWind.Position(55.0, -106.0, 100.0);
	var placemark = new WorldWind.Placemark(position, false, placemarkAttributes);

	// test
	var str = "";
	placemark.label = "Placemark\n" +
	    "Lat " + placemark.position.latitude.toPrecision(4).toString() + "\n" +
	    "Lon " + placemark.position.longitude.toPrecision(5).toString() + "  " + str;
	placemark.alwaysOnTop = true;

	placemarkLayerObj.addRenderable(placemark);
}

function processAndAddPoint(iterNumber, placemarkLayerObj, line1, line2, sceneDate, imageName)
{
	const satrec = satellite.twoline2satrec(line1.trim(), line2.trim());

	// Get the position of the satellite at the given date
	const positionAndVelocity = satellite.propagate(satrec, sceneDate);
	const gmst = satellite.gstime(sceneDate);
	const position = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

	//console.log(position.longitude);// in radians
	//console.log(position.latitude);// in radians
	//console.log(position.height);// in km

	var longitudeDeg = satellite.degreesLong(position.longitude);
    var latitudeDeg  = satellite.degreesLat(position.latitude);
    var heightInMeters = position.height * 1000;
	var positionDeg = new WorldWind.Position(latitudeDeg, longitudeDeg, heightInMeters);

	var placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
	placemarkAttributes.imageScale = 5; //0.0625;
	placemarkAttributes.depthTest = true;
	placemarkAttributes.drawLeaderLine = false;
	//placemarkAttributes.imageSource = imageName;

	// colors
	var colorId = (iterNumber / 3) % 3;
	if (colorId == 1)
		placemarkAttributes.imageColor = WorldWind.Color.RED;
	else if (colorId == 2)
		placemarkAttributes.imageColor = WorldWind.Color.GREEN;
	else if (colorId == 0)
		placemarkAttributes.imageColor = WorldWind.Color.BLUE;

	var placemark = new WorldWind.Placemark(positionDeg, false, placemarkAttributes);
	placemark.alwaysOnTop = true;

	placemarkLayerObj.addRenderable(placemark);
}

function addTheDebris(placemarkLayerObj, sceneDate, fileName)
{
	var fileData = readTextFile(fileName);
	const dataArr = fileData.split("\n");

	for (var i = 0; i+2 < dataArr.length; i+=3) 
	{ 
		//console.log("item = " + i);
		//console.log(dataArr[i+1]);
		//console.log(dataArr[i+2]);
		
		processAndAddPoint(i, placemarkLayerObj, dataArr[i+1], dataArr[i+2], sceneDate, "red-point-128.png");
	}
}

// Create a WorldWindow for the canvas.
var wwd = new WorldWind.WorldWindow("canvasOne");

//wwd.addLayer(new WorldWind.BMNGOneImageLayer());
wwd.addLayer(new WorldWind.BMNGLayer());
wwd.addLayer(new WorldWind.BMNGLandsatLayer());

// Add atmosphere layer on top of base imagery layer.
wwd.addLayer(new WorldWind.AtmosphereLayer());

wwd.addLayer(new WorldWind.CompassLayer());
wwd.addLayer(new WorldWind.CoordinatesDisplayLayer(wwd));
wwd.addLayer(new WorldWind.ViewControlsLayer(wwd));



// the debris layer
var placemarkLayer = new WorldWind.RenderableLayer();
wwd.addLayer(placemarkLayer);

// Add a placemark (Pin)
addExamplePlacemark(placemarkLayer);

const initialDate = new Date();
addTheDebris(placemarkLayer, initialDate);

var logError = function (jqXhr, text, exception) {
    console.log("There was a failure retrieving the capabilities document: " +
        text +
    " exception: " + exception);
};

var timerSeconds = 0;
setInterval(function() {
	timerSeconds++;
	console.log("seconds =" + timerSeconds); 
	console.log("initialDate =" + initialDate); 

	//var newDate = initialDate;
	var speedSeconds = 10; // update 
	initialDate.setTime(initialDate.getTime() + (speedSeconds*1000));


	placemarkLayer.removeAllRenderables();

	//var fileData = readTextFile("http://127.0.0.1:8000/cosmos-2251-debris.txt");

	addTheDebris(placemarkLayer, initialDate, "http://127.0.0.1:8000/1999-025.txt");
	addTheDebris(placemarkLayer, initialDate, "http://127.0.0.1:8000/2019-006.txt");
	addTheDebris(placemarkLayer, initialDate, "http://127.0.0.1:8000/cosmos-2251-debris.txt");
	addTheDebris(placemarkLayer, initialDate, "http://127.0.0.1:8000/iridium-33-debris.txt");

	wwd.redraw();

}, 100); // 1000 == 1 second

//$.get(serviceAddress).done(createLayer).fail(logError);
