const eventsPath = "https://api.opendevteam.com/articles"
const tlContainer = document.getElementsByClassName("tl-container")[0]

function genEvents(path) {
	fetch(path,)
		.then(response => response.json())
		.then(data => {
			let year = data[0][3].split("-")[0]
			for (let eventIndex = 0; eventIndex < data.length; eventIndex++) {
				event = data[eventIndex]
				// Place first year mark
				if (event[0] == 1) {placeYear(tlContainer,event[3])}
				// check if year changed if yes create a year Stamp
				if (event[3].split("-")[0] != year) {
					year = event[3].split("-")[0]
					placeYear(tlContainer,year)
				}
				// gen event
				placeEvent(tlContainer,event)
			}
		}
	)
}

function placeEvent(tlContainer, event) {
	mainContainer = document.createElement("div")
	mainContainer.classList.add("mainContainer")
	
	iconContainer = document.createElement("div")
	iconContainer.classList.add("iconImage")
	iconImage = document.createElement("img")
	iconImage.src = "icons/" + event[5] +".svg"
	iconImage.classList.add("imgSVG")
	iconContainer.appendChild(iconImage)
	
	eventContainer = document.createElement("div")
	eventContainer.classList.add("eventContainer")
	
	titleText = document.createElement("h2")
	titleText.classList.add("eventTitle")
	titleText.textContent = event[1]
	
	description = document.createElement("h3")
	description.classList.add("eventdescription")
	description.textContent = event[2]
	
	thumbnailImage = document.createElement("img")
	thumbnailImage.classList.add("eventthumbnail")
	thumbnailImage.src = event[4]
	
	eventContainer.appendChild(thumbnailImage)
	eventContainer.appendChild(titleText)
	eventContainer.appendChild(description)
	
	eventContainer.setAttribute('title', "Read more")

	eventContainer.addEventListener('click', function (thing) {
		window.open(event[8])
	});

	if (event[0] % 2 == 0) {
		mainContainer.classList.add("right");
		mainContainer.appendChild(iconContainer)
		mainContainer.appendChild(eventContainer)
	} else {
		mainContainer.classList.add("left");
		mainContainer.appendChild(eventContainer)
		mainContainer.appendChild(iconContainer)
	}
	tlContainer.appendChild(mainContainer);
}

function placeYear(tlContainer, year) {
	const [yearText] = year.split("-");
	const textH2 = document.createElement("h2");
	const yearStamp = document.createElement("div");
	textH2.textContent = yearText;
	yearStamp.appendChild(textH2);
	yearStamp.classList.add("yearStamp");
	tlContainer.appendChild(yearStamp);
}

genEvents(eventsPath)


// finally, set the background of .tl-container to smth that will be the actual line. use height of element for shits


// ""Docs""
// 0: 1        ID
// 1: "2020 begins"       title
// 2: "Oh, we really weren't prepared for what was about to come."       description
// 3: "2020-01-01"        date
// 4: "https://cdn.who.int/media/images/default-source/mca/mca-covid-19/coronavirus-2.tmb-479v.jpg?sfvrsn=4dba955c_12%20479w" thumbnail
// 5: "emergency"                 icon -> parse and choose local file for whichever it is
// 6: "#ffffff"                   color
// 7: 1                           importance
// 8: "https://en.wikipedia.org/wiki/%22Yo_mama%22_joke"       link to wiki shits aka detaiöed apage