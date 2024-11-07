<div class="loading">Loading</div>

<style>
	.loading {
		font-size: 30px;
		text-align: start;
	}

	.loading::after {
		content: '';
		animation: loading 2s infinite linear alternate;
	}

	@keyframes loading {
		0% {
			content: '';
		}
		33% {
			content: '.';
		}
		66% {
			content: '..';
		}

		100% {
			content: '...';
		}
	}
</style>
