function enhanceDates() {
	for (const element of document.querySelectorAll('time')) {
		element.textContent = new Date(element.dateTime).toLocaleString();
	}
}

enhanceDates();
