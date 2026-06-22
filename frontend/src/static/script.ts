{
	function enhanceDates(): void {
		for (const element of document.querySelectorAll('time')) {
			const date = new Date(element.dateTime);
			element.textContent = date.toLocaleString();
		}
	}

	enhanceDates();
}
