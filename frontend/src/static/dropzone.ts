{
	const uploadVisual = document.querySelector<HTMLElement>('#dropzone')!;
	const fileInput = document.querySelector<HTMLInputElement>('#file')!;

	function handleDrop(event: DragEvent) {
		const files = event.dataTransfer!.files;
		if (files.length > 0) {
			fileInput.files = files;
			uploadVisual.classList.remove('shown');
			event.preventDefault();
		}
	}

	function handleDragEnter(event: DragEvent) {
		if (!event.dataTransfer!.types.includes('Files')) {
			return;
		}

		uploadVisual.classList.add('shown');
		event.preventDefault();
	}

	function handleDragLeave(event: DragEvent) {
		uploadVisual.classList.remove('shown');
		event.preventDefault();
	}

	addEventListener('dragover', handleDragEnter);
	addEventListener('drop', handleDrop);
	addEventListener('dragleave', handleDragLeave);
}
