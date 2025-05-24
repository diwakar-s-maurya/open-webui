<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { portal } from '$lib/actions/portal';
	const dispatch = createEventDispatcher();

	export let editor: any;
	let isDragging = false;
	let currentX: number;
	let currentY: number;
	let initialX: number;
	let initialY: number;
	let xOffset = 0;
	let yOffset = 0;
	let dragTimeout: any;

	function handleAction(action: string) {
		if (!editor) return;
		
		// Store current scroll position
		const scrollPosition = window.scrollY;
		
		switch (action) {
			case 'addColumnBefore':
				editor.chain().focus().addColumnBefore().run();
				break;
			case 'addColumnAfter':
				editor.chain().focus().addColumnAfter().run();
				break;
			case 'deleteColumn':
				editor.chain().focus().deleteColumn().run();
				break;
			case 'addRowBefore':
				editor.chain().focus().addRowBefore().run();
				break;
			case 'addRowAfter':
				editor.chain().focus().addRowAfter().run();
				break;
			case 'deleteRow':
				editor.chain().focus().deleteRow().run();
				break;
			case 'mergeCells':
				editor.chain().focus().mergeCells().run();
				break;
			case 'splitCell':
				editor.chain().focus().splitCell().run();
				break;
			case 'toggleHeaderColumn':
				editor.chain().focus().toggleHeaderColumn().run();
				break;
			case 'toggleHeaderRow':
				editor.chain().focus().toggleHeaderRow().run();
				break;
			case 'deleteTable':
				editor.chain().focus().deleteTable().run();
				break;
		}

		// Restore scroll position after a short delay to ensure DOM updates are complete
		requestAnimationFrame(() => {
			window.scrollTo(0, scrollPosition);
		});
	}

	function dragStart(e: MouseEvent) {
		// Only start drag if clicking the drag handle
		const target = e.target as HTMLElement;
		const dragHandle = target.closest('.drag-handle');
		if (!dragHandle) return;
		
		// Prevent text selection
		e.preventDefault();
		
		// Get initial position from current computed style
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		initialX = e.clientX - rect.left;
		initialY = e.clientY - rect.top;

		isDragging = true;
		const toolbar = e.currentTarget as HTMLElement;
		toolbar.style.transition = 'none';
		toolbar.style.right = 'auto';

		// Add global event listeners
		document.addEventListener('mousemove', drag);
		document.addEventListener('mouseup', dragEnd);
	}

	function dragEnd(e: MouseEvent) {
		isDragging = false;
		
		// Remove global event listeners
		document.removeEventListener('mousemove', drag);
		document.removeEventListener('mouseup', dragEnd);

		// Use requestAnimationFrame to ensure smooth transition
		requestAnimationFrame(() => {
			const toolbar = document.querySelector('.table-toolbar') as HTMLElement;
			if (toolbar) {
				toolbar.style.transition = 'transform 0.2s ease-in-out';
			}
		});
	}

	function drag(e: MouseEvent) {
		if (!isDragging) return;
		
		e.preventDefault();

		// Use requestAnimationFrame for smoother dragging
		requestAnimationFrame(() => {
			const toolbar = document.querySelector('.table-toolbar') as HTMLElement;
			if (!toolbar) return;

			// Calculate new position
			const newX = e.clientX - initialX;
			const newY = e.clientY - initialY;

			// Keep toolbar within viewport bounds
			const rect = toolbar.getBoundingClientRect();
			const maxX = window.innerWidth - rect.width;
			const maxY = window.innerHeight - rect.height;

			// Update position with bounds checking
			xOffset = Math.min(Math.max(0, newX), maxX);
			yOffset = Math.min(Math.max(0, newY), maxY);

			// Update position using transform for better performance
			toolbar.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
		});
	}
</script>

{#if true}
	<div 
		class="table-toolbar flex items-center gap-1 p-2 bg-white/95 dark:bg-gray-850/95 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl backdrop-blur-md transition-all duration-200 ease-in-out select-none"
		style="position: fixed; right: 20px; top: 20px; z-index: 10000; pointer-events: auto; cursor: move; width: fit-content;"
		on:mousedown={dragStart}
		use:portal
	>
		<div class="drag-handle cursor-move p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Drag to move">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
				<path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM17 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM17 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM17 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/>
			</svg>
		</div>
		<div class="flex items-center border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
			<button on:click={() => handleAction('addColumnBefore')} class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Add column before">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
					<path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v2.5h2.5a.75.75 0 010 1.5h-2.5v2.5a.75.75 0 01-1.5 0v-2.5h-2.5a.75.75 0 010-1.5h2.5v-2.5A.75.75 0 0110 3z" clip-rule="evenodd"></path>
				</svg>
			</button>
			<button on:click={() => handleAction('addColumnAfter')} class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Add column after">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 rotate-90">
					<path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v2.5h2.5a.75.75 0 010 1.5h-2.5v2.5a.75.75 0 01-1.5 0v-2.5h-2.5a.75.75 0 010-1.5h2.5v-2.5A.75.75 0 0110 3z" clip-rule="evenodd"></path>
				</svg>
			</button>
			<button on:click={() => handleAction('deleteColumn')} class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors" title="Delete column">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
					<path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"></path>
				</svg>
			</button>
		</div>
		<div class="flex items-center border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
			<button on:click={() => handleAction('addRowBefore')} class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Add row before">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
					<path d="M10.75 6.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"></path>
					<path fill-rule="evenodd" d="M5.22 2.22C4.455 2.22 3.75 2.925 3.75 3.69v2.62c0 .765.705 1.47 1.47 1.47h9.56c.765 0 1.47-.705 1.47-1.47V3.69c0-.765-.705-1.47-1.47-1.47H5.22zm0 10c-.765 0-1.47.705-1.47 1.47v2.62c0 .765.705 1.47 1.47 1.47h9.56c.765 0 1.47-.705 1.47-1.47v-2.62c0-.765-.705-1.47-1.47-1.47H5.22z" clip-rule="evenodd"></path>
				</svg>
			</button>
			<button on:click={() => handleAction('addRowAfter')} class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Add row after">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 rotate-180">
					<path d="M10.75 6.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"></path>
					<path fill-rule="evenodd" d="M5.22 2.22C4.455 2.22 3.75 2.925 3.75 3.69v2.62c0 .765.705 1.47 1.47 1.47h9.56c.765 0 1.47-.705 1.47-1.47V3.69c0-.765-.705-1.47-1.47-1.47H5.22zm0 10c-.765 0-1.47.705-1.47 1.47v2.62c0 .765.705 1.47 1.47 1.47h9.56c.765 0 1.47-.705 1.47-1.47v-2.62c0-.765-.705-1.47-1.47-1.47H5.22z" clip-rule="evenodd"></path>
				</svg>
			</button>
			<button on:click={() => handleAction('deleteRow')} class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors" title="Delete row">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
					<path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"></path>
				</svg>
			</button>
		</div>
		<div class="flex items-center border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
			<button on:click={() => handleAction('mergeCells')} class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Merge cells">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
					<path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z"></path>
				</svg>
			</button>
			<button on:click={() => handleAction('splitCell')} class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Split cell">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
					<path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42L18.5 8.5a2.121 2.121 0 00-3-3l-10.92 10.92a4 4 0 00.885 1.343l3.154 1.262a.5.5 0 00.65-.65l-3.154-1.262a4 4 0 01-1.343-.885z"></path>
				</svg>
			</button>
		</div>
		<div class="flex items-center border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
			<button on:click={() => handleAction('toggleHeaderColumn')} class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Toggle header column">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
					<path d="M10 2a.75.75 0 01.75.75v5.59l1.95-2.1a.75.75 0 111.1 1.02L10.53 10.5a.75.75 0 01-1.06 0L6.2 7.26a.75.75 0 111.1-1.02l1.95 2.1V2.75A.75.75 0 0110 2z"></path>
					<path d="M5.273 4.5a1.25 1.25 0 00-1.205.918L3.327 7.5A1.25 1.25 0 004.523 9H6.25a.75.75 0 010 1.5H4.523a1.25 1.25 0 00-1.196 1.582l.741 2.082a1.25 1.25 0 001.205.918h9.454a1.25 1.25 0 001.205-.918l.741-2.082A1.25 1.25 0 0015.477 10.5H13.75a.75.75 0 010-1.5h1.727a1.25 1.25 0 001.196-1.582L15.932 5.418A1.25 1.25 0 0014.727 4.5H5.273z"></path>
				</svg>
			</button>
			<button on:click={() => handleAction('toggleHeaderRow')} class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Toggle header row">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 rotate-90">
					<path d="M10 2a.75.75 0 01.75.75v5.59l1.95-2.1a.75.75 0 111.1 1.02L10.53 10.5a.75.75 0 01-1.06 0L6.2 7.26a.75.75 0 111.1-1.02l1.95 2.1V2.75A.75.75 0 0110 2z"></path>
					<path d="M5.273 4.5a1.25 1.25 0 00-1.205.918L3.327 7.5A1.25 1.25 0 004.523 9H6.25a.75.75 0 010 1.5H4.523a1.25 1.25 0 00-1.196 1.582l.741 2.082a1.25 1.25 0 001.205.918h9.454a1.25 1.25 0 001.205-.918l.741-2.082A1.25 1.25 0 0015.477 10.5H13.75a.75.75 0 010-1.5h1.727a1.25 1.25 0 001.196-1.582L15.932 5.418A1.25 1.25 0 0014.727 4.5H5.273z"></path>
				</svg>
			</button>
		</div>
		<button on:click={() => handleAction('deleteTable')} class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors" title="Delete table">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
				<path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"></path>
			</svg>
		</button>
	</div>
{/if}
