// get json (via request later) from tseting.json
const eventsPath = "tseting.json"

// get .tl-container element

function genEvents(path) {
	fetch(path)
		.then(response => response.json())
		.then(data => {
			for (let eventIndex = 0; eventIndex < data.events.length; eventIndex++) {
				console.log(data["events"][eventIndex])
				// if its the 1st event create a year Stamp
				// gen event
				// check if year changed if yes create a year Stamp
				// add event to thing
			}
		}
		)
}

genEvents(eventsPath)

// finally, set the background of .tl-container to smth that will be the actual line. use height of element for shits


// Almos if you read this, your mom