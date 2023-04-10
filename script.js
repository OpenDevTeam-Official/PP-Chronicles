const eventsPath = "https://api.opendevteam.com/articles"
const tlContainer = document.getElementsByClassName("tl-container")[0]
const isMobile = window.matchMedia("only screen and (max-width: 768px)").matches;

if (location.hostname == "localhost") {
	let title = document.title
	document.title = "(DEV) " + title
}

function genEvents(path) {
	fetch(path,)
		.then(response => response.json())
		.then(data => {
			if (data.length == 0) {
				placeOHOH("Api returned no results.")
				return;
			}
			let year = data[0][3].split("-")[0]
			for (let eventIndex = 0; eventIndex < data.length; eventIndex++) {
				event = data[eventIndex]
				// Place first year mark
				console.log(event)
				if (event == data[0]) {placeYear(tlContainer,event[3])}
				// check if year changed if yes create a year Stamp
				if (event[3].split("-")[0] != year) {
					year = event[3].split("-")[0]
					placeYear(tlContainer,year)
				}
				// gen event
				placeEvent(tlContainer,event,eventIndex)
			}
		}
	)
}

function placeOHOH(message) {
	downContainer = document.createElement("div")
	downContainer.classList.add("downContainer")
	downH2 = document.createElement("h2")
	downH2.classList.add("downText")
	downH2.textContent = message
	downContainer.appendChild(downH2)
	tlContainer.appendChild(downContainer)
}

function placeEvent(tlContainer, event, index) {
	mainContainer = document.createElement("div")
	mainContainer.classList.add("mainContainer")

	dateContainer = document.createElement("div")
	dateContainer.classList.add("dateContainer")
	dateStamp = document.createElement("h2")
	dateStamp.textContent = event[1]
	dateStamp.classList.add = "dateStamp"
	dateContainer.appendChild(dateStamp)

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


	if (isMobile) {
		mainContainer.appendChild(iconContainer)
		mainContainer.appendChild(eventContainer)
		eventContainer.appendChild(dateContainer)
	} else {
		if ((index + 1) % 2 == 0) {
			mainContainer.classList.add("right");
			eventContainer.classList.add("right");
			dateContainer.classList.add("right")
			mainContainer.appendChild(dateContainer)
			mainContainer.appendChild(iconContainer)
			mainContainer.appendChild(eventContainer)
		} else {
			mainContainer.classList.add("left");
			eventContainer.classList.add("left");
			dateContainer.classList.add("left")
			mainContainer.appendChild(eventContainer)
			mainContainer.appendChild(iconContainer)
			mainContainer.appendChild(dateContainer)
		}
	}
	tlContainer.appendChild(mainContainer);
}

function placeYear(tlContainer, year) {
	const [yearText] = year.split("-");
	const textH2 = document.createElement("h2");
	const yearStamp = document.createElement("div");
	textH2.textContent = yearText;
	yearStamp.appendChild(textH2);
	textH2.classList.add("yearStamp");
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