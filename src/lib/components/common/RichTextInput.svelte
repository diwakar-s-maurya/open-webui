<script lang="ts">
	import { marked } from 'marked';
	import TurndownService from 'turndown';
	import { gfm } from 'turndown-plugin-gfm';
	const turndownService = new TurndownService({
		codeBlockStyle: 'fenced',
		headingStyle: 'atx'
	});
	turndownService.escape = (string) => string;

	// Use turndown-plugin-gfm for proper GFM table support including colspan/rowspan
	turndownService.use(gfm);

	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	const eventDispatch = createEventDispatcher();

	import { EditorState, Plugin, PluginKey, TextSelection } from 'prosemirror-state';
	import { Decoration, DecorationSet } from 'prosemirror-view';

	import { Editor, mergeAttributes } from '@tiptap/core';

	import { AIAutocompletion } from './RichTextInput/AutoCompletion.js';
	import TableToolbar from './RichTextInput/TableToolbar.svelte';
	import { tableExtensions } from './RichTextInput/TableSetup';

	import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
	import Placeholder from '@tiptap/extension-placeholder';
	import { all, createLowlight } from 'lowlight';
	import StarterKit from '@tiptap/starter-kit';
	import Highlight from '@tiptap/extension-highlight';
	import Typography from '@tiptap/extension-typography';
	import Table from '@tiptap/extension-table';
	import TableRow from '@tiptap/extension-table-row';
	import TableHeader from '@tiptap/extension-table-header';
	import TableCell from '@tiptap/extension-table-cell';

	import { PASTED_TEXT_CHARACTER_LIMIT } from '$lib/constants';

	// Extend TableCell to properly handle colspan/rowspan in HTML output
	const TableCellExtended = TableCell.extend({
		addAttributes() {
			return {
				...(this.parent ? this.parent() : {}),
				colspan: {
					default: 1,
					parseHTML: element => {
						const colspan = element.getAttribute('colspan');
						const value = colspan ? parseInt(colspan, 10) : 1;
						return value;
					},
					renderHTML: attributes => {
						return attributes.colspan && attributes.colspan > 1 ? { colspan: attributes.colspan } : {};
					}
				},
				rowspan: {
					default: 1,
					parseHTML: element => {
						const rowspan = element.getAttribute('rowspan');
						const value = rowspan ? parseInt(rowspan, 10) : 1;
						return value;
					},
					renderHTML: attributes => {
						return attributes.rowspan && attributes.rowspan > 1 ? { rowspan: attributes.rowspan } : {};
					}
				},
				colwidth: {
					default: null,
					parseHTML: element => {
						const colwidth = element.getAttribute('colwidth');
						const value = colwidth ? colwidth.split(',').map(item => parseInt(item, 10)) : null;
						return value;
					},
					renderHTML: attributes => {
						return attributes.colwidth ? { colwidth: attributes.colwidth.join(',') } : {};
					}
				}
			};
		},

		renderHTML({ HTMLAttributes }) {
			return ['td', mergeAttributes(this.options.HTMLAttributes || {}, HTMLAttributes), 0];
		}
	});

	// Extend TableHeader to properly handle colspan/rowspan in HTML output
	const TableHeaderExtended = TableHeader.extend({
		addAttributes() {
			return {
				...(this.parent ? this.parent() : {}),
				colspan: {
					default: 1,
					parseHTML: element => {
						const colspan = element.getAttribute('colspan');
						const value = colspan ? parseInt(colspan, 10) : 1;
						return value;
					},
					renderHTML: attributes => {
						return attributes.colspan && attributes.colspan > 1 ? { colspan: attributes.colspan } : {};
					}
				},
				rowspan: {
					default: 1,
					parseHTML: element => {
						const rowspan = element.getAttribute('rowspan');
						const value = rowspan ? parseInt(rowspan, 10) : 1;
						return value;
					},
					renderHTML: attributes => {
						return attributes.rowspan && attributes.rowspan > 1 ? { rowspan: attributes.rowspan } : {};
					}
				},
				colwidth: {
					default: null,
					parseHTML: element => {
						const colwidth = element.getAttribute('colwidth');
						const value = colwidth ? colwidth.split(',').map(item => parseInt(item, 10)) : null;
						return value;
					},
					renderHTML: attributes => {
						return attributes.colwidth ? { colwidth: attributes.colwidth.join(',') } : {};
					}
				}
			};
		},

		renderHTML({ HTMLAttributes }) {
			return ['th', mergeAttributes(this.options.HTMLAttributes || {}, HTMLAttributes), 0];
		}
	});

	export let oncompositionstart = (e) => {};
	export let oncompositionend = (e) => {};
	export let onChange = (e) => {};

	// create a lowlight instance with all languages loaded
	const lowlight = createLowlight(all);

	export let className = 'input-prose';
	export let placeholder = 'Type here...';

	export let id = '';
	export let value = '';
	export let html = '';

	export let json = false;
	export let raw = false;
	export let editable = true;

	export let preserveBreaks = false;
	export let generateAutoCompletion: Function = async () => null;
	export let autocomplete = false;
	export let messageInput = false;
	export let shiftEnter = false;
	export let largeTextAsFile = false;

	let element;
	let editor;
	let tableToolbarVisible = false;
	let toolbarPortal;

	const options = {
		throwOnError: false
	};

	$: if (editor) {
		editor.setOptions({
			editable: editable
		});
	}

	$: if (value === null && html !== null && editor) {
		editor.commands.setContent(html);
	}

	// Function to find the next template in the document
	function findNextTemplate(doc, from = 0) {
		const patterns = [{ start: '{{', end: '}}' }];

		let result = null;

		doc.nodesBetween(from, doc.content.size, (node, pos) => {
			if (result) return false; // Stop if we've found a match
			if (node.isText) {
				const text = node.text;
				let index = Math.max(0, from - pos);
				while (index < text.length) {
					for (const pattern of patterns) {
						if (text.startsWith(pattern.start, index)) {
							const endIndex = text.indexOf(pattern.end, index + pattern.start.length);
							if (endIndex !== -1) {
								result = {
									from: pos + index,
									to: pos + endIndex + pattern.end.length
								};
								return false; // Stop searching
							}
						}
					}
					index++;
				}
			}
		});

		return result;
	}

	// Function to select the next template in the document
	function selectNextTemplate(state, dispatch) {
		const { doc, selection } = state;
		const from = selection.to;
		let template = findNextTemplate(doc, from);

		if (!template) {
			// If not found, search from the beginning
			template = findNextTemplate(doc, 0);
		}

		if (template) {
			if (dispatch) {
				const tr = state.tr.setSelection(TextSelection.create(doc, template.from, template.to));
				dispatch(tr);
			}
			return true;
		}
		return false;
	}

	export const setContent = (content) => {
		editor.commands.setContent(content);
	};

	// Function to update table toolbar visibility
	const updateTableToolbar = () => {
		if (!editor) return;

		// Check if cursor is currently inside a table
		const isInTable = editor.isActive('table');
		tableToolbarVisible = isInTable;
		
		// Create or remove toolbar portal
		if (isInTable && !toolbarPortal) {
			createToolbarPortal();
		} else if (!isInTable && toolbarPortal) {
			removeToolbarPortal();
		}
	};

	// Create toolbar portal attached to body
	const createToolbarPortal = () => {
		if (toolbarPortal) return;
		
		toolbarPortal = document.createElement('div');
		toolbarPortal.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; pointer-events: auto; cursor: move; width: fit-content;';
		toolbarPortal.className = 'table-toolbar-portal';
		
		// Create the toolbar component manually
		const toolbarHTML = `
			<div class="flex items-center gap-1 p-2 bg-white/95 dark:bg-gray-850/95 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl backdrop-blur-md transition-all duration-200 ease-in-out select-none">
				<div class="drag-handle cursor-move p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Drag to move">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
						<path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM17 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM17 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM17 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/>
					</svg>
				</div>
				<div class="flex items-center border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
					<button data-action="addColumnBefore" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Add column before">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
							<path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v2.5h2.5a.75.75 0 010 1.5h-2.5v2.5a.75.75 0 01-1.5 0v-2.5h-2.5a.75.75 0 010-1.5h2.5v-2.5A.75.75 0 0110 3z" clip-rule="evenodd"></path>
						</svg>
					</button>
					<button data-action="addColumnAfter" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Add column after">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 rotate-90">
							<path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v2.5h2.5a.75.75 0 010 1.5h-2.5v2.5a.75.75 0 01-1.5 0v-2.5h-2.5a.75.75 0 010-1.5h2.5v-2.5A.75.75 0 0110 3z" clip-rule="evenodd"></path>
						</svg>
					</button>
					<button data-action="deleteColumn" class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors" title="Delete column">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
							<path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"></path>
						</svg>
					</button>
				</div>
				<div class="flex items-center border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
					<button data-action="addRowBefore" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Add row before">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
							<path d="M10.75 6.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"></path>
							<path fill-rule="evenodd" d="M5.22 2.22C4.455 2.22 3.75 2.925 3.75 3.69v2.62c0 .765.705 1.47 1.47 1.47h9.56c.765 0 1.47-.705 1.47-1.47V3.69c0-.765-.705-1.47-1.47-1.47H5.22zm0 10c-.765 0-1.47.705-1.47 1.47v2.62c0 .765.705 1.47 1.47 1.47h9.56c.765 0 1.47-.705 1.47-1.47v-2.62c0-.765-.705-1.47-1.47-1.47H5.22z" clip-rule="evenodd"></path>
						</svg>
					</button>
					<button data-action="addRowAfter" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Add row after">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 rotate-180">
							<path d="M10.75 6.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"></path>
							<path fill-rule="evenodd" d="M5.22 2.22C4.455 2.22 3.75 2.925 3.75 3.69v2.62c0 .765.705 1.47 1.47 1.47h9.56c.765 0 1.47-.705 1.47-1.47V3.69c0-.765-.705-1.47-1.47-1.47H5.22zm0 10c-.765 0-1.47.705-1.47 1.47v2.62c0 .765.705 1.47 1.47 1.47h9.56c.765 0 1.47-.705 1.47-1.47v-2.62c0-.765-.705-1.47-1.47-1.47H5.22z" clip-rule="evenodd"></path>
						</svg>
					</button>
					<button data-action="deleteRow" class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors" title="Delete row">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
							<path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"></path>
						</svg>
					</button>
				</div>
				<div class="flex items-center border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
					<button data-action="mergeCells" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Merge cells">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
							<path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z"></path>
						</svg>
					</button>
					<button data-action="splitCell" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Split cell">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
							<path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42L18.5 8.5a2.121 2.121 0 00-3-3l-10.92 10.92a4 4 0 00.885 1.343l3.154 1.262a.5.5 0 00.65-.65l-3.154-1.262a4 4 0 01-1.343-.885z"></path>
						</svg>
					</button>
				</div>
				<div class="flex items-center border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
					<button data-action="toggleHeaderColumn" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Toggle header column">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
							<path d="M10 2a.75.75 0 01.75.75v5.59l1.95-2.1a.75.75 0 111.1 1.02L10.53 10.5a.75.75 0 01-1.06 0L6.2 7.26a.75.75 0 111.1-1.02l1.95 2.1V2.75A.75.75 0 0110 2z"></path>
							<path d="M5.273 4.5a1.25 1.25 0 00-1.205.918L3.327 7.5A1.25 1.25 0 004.523 9H6.25a.75.75 0 010 1.5H4.523a1.25 1.25 0 00-1.196 1.582l.741 2.082a1.25 1.25 0 001.205.918h9.454a1.25 1.25 0 001.205-.918l.741-2.082A1.25 1.25 0 0015.477 10.5H13.75a.75.75 0 010-1.5h1.727a1.25 1.25 0 001.196-1.582L15.932 5.418A1.25 1.25 0 0014.727 4.5H5.273z"></path>
						</svg>
					</button>
					<button data-action="toggleHeaderRow" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Toggle header row">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 rotate-90">
							<path d="M10 2a.75.75 0 01.75.75v5.59l1.95-2.1a.75.75 0 111.1 1.02L10.53 10.5a.75.75 0 01-1.06 0L6.2 7.26a.75.75 0 111.1-1.02l1.95 2.1V2.75A.75.75 0 0110 2z"></path>
							<path d="M5.273 4.5a1.25 1.25 0 00-1.205.918L3.327 7.5A1.25 1.25 0 004.523 9H6.25a.75.75 0 010 1.5H4.523a1.25 1.25 0 00-1.196 1.582l.741 2.082a1.25 1.25 0 001.205.918h9.454a1.25 1.25 0 001.205-.918l.741-2.082A1.25 1.25 0 0015.477 10.5H13.75a.75.75 0 010-1.5h1.727a1.25 1.25 0 001.196-1.582L15.932 5.418A1.25 1.25 0 0014.727 4.5H5.273z"></path>
						</svg>
					</button>
				</div>
				<button data-action="deleteTable" class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors" title="Delete table">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
						<path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"></path>
					</svg>
				</button>
			</div>
		`;
		
		toolbarPortal.innerHTML = toolbarHTML;
		
		// Add event listeners
		toolbarPortal.addEventListener('click', (e) => {
			const button = e.target.closest('button[data-action]');
			if (!button || !editor) return;
			
			// Store current scroll position
			const scrollPosition = window.scrollY;
			
			const action = button.dataset.action;
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
		});

		// Add drag functionality
		let isDragging = false;
		let currentX;
		let currentY;
		let initialX;
		let initialY;
		let xOffset = 0;
		let yOffset = 0;
		let dragTimeout;

		const dragStart = (e) => {
			// Only start drag if clicking the drag handle
			const dragHandle = e.target.closest('.drag-handle');
			if (!dragHandle) return;
			
			// Prevent text selection
			e.preventDefault();
			
			// Get initial position from current computed style
			const rect = toolbarPortal.getBoundingClientRect();
			initialX = e.clientX - rect.left;
			initialY = e.clientY - rect.top;

			isDragging = true;
			if (toolbarPortal) {
				toolbarPortal.style.transition = 'none';
				// Remove right positioning when starting drag
				toolbarPortal.style.right = 'auto';
			}
		};

		const dragEnd = () => {
			if (!toolbarPortal) return;
			
			// Clear any pending drag operations
			if (dragTimeout) {
				clearTimeout(dragTimeout);
				dragTimeout = null;
			}

			initialX = currentX;
			initialY = currentY;
			isDragging = false;
			
			// Use requestAnimationFrame to ensure smooth transition
			requestAnimationFrame(() => {
				if (toolbarPortal) {
					toolbarPortal.style.transition = 'all 0.2s ease-in-out';
				}
			});
		};

		const drag = (e) => {
			if (!isDragging || !toolbarPortal) {
				// If we somehow got here without a valid toolbar, clean up
				if (isDragging) {
					isDragging = false;
					if (dragTimeout) {
						clearTimeout(dragTimeout);
						dragTimeout = null;
					}
				}
				return;
			}
			
			e.preventDefault();

			// Use requestAnimationFrame for smoother dragging
			requestAnimationFrame(() => {
				if (!toolbarPortal) return;

				// Calculate new position
				const newX = e.clientX - initialX;
				const newY = e.clientY - initialY;

				// Keep toolbar within viewport bounds
				const rect = toolbarPortal.getBoundingClientRect();
				const maxX = window.innerWidth - rect.width;
				const maxY = window.innerHeight - rect.height;

				// Update position with bounds checking
				xOffset = Math.min(Math.max(0, newX), maxX);
				yOffset = Math.min(Math.max(0, newY), maxY);

				// Update position
				toolbarPortal.style.left = `${xOffset}px`;
				toolbarPortal.style.top = `${yOffset}px`;
			});
		};

		// Store event listeners for cleanup
		const dragStartHandler = dragStart;
		const dragHandler = drag;
		const dragEndHandler = dragEnd;

		toolbarPortal.addEventListener('mousedown', dragStartHandler);
		document.addEventListener('mousemove', dragHandler);
		document.addEventListener('mouseup', dragEndHandler);

		// Store cleanup function
		toolbarPortal.cleanup = () => {
			isDragging = false;
			if (dragTimeout) {
				clearTimeout(dragTimeout);
				dragTimeout = null;
			}
			document.removeEventListener('mousemove', dragHandler);
			document.removeEventListener('mouseup', dragEndHandler);
		};
		
		document.body.appendChild(toolbarPortal);
	};

	// Remove toolbar portal from body
	const removeToolbarPortal = () => {
		if (toolbarPortal) {
			// Call cleanup function if it exists
			if (toolbarPortal.cleanup) {
				toolbarPortal.cleanup();
			}
			if (toolbarPortal.parentNode) {
				toolbarPortal.parentNode.removeChild(toolbarPortal);
			}
			toolbarPortal = null;
		}
	};

	const selectTemplate = () => {
		if (value !== '') {
			// After updating the state, try to find and select the next template
			setTimeout(() => {
				const templateFound = selectNextTemplate(editor.view.state, editor.view.dispatch);
				if (!templateFound) {
					// If no template found, set cursor at the end
					const endPos = editor.view.state.doc.content.size;
					editor.view.dispatch(
						editor.view.state.tr.setSelection(TextSelection.create(editor.view.state.doc, endPos))
					);
				}
			}, 0);
		}
	};

	onMount(async () => {
		let content = value;

		if (!json) {
			if (preserveBreaks) {
				turndownService.addRule('preserveBreaks', {
					filter: 'br', // Target <br> elements
					replacement: function (content) {
						return '<br/>';
					}
				});
			}

			if (!raw) {
				async function tryParse(value, attempts = 3, interval = 100) {
					try {
						// Try parsing the value
						return marked.parse(value.replaceAll(`\n<br/>`, `<br/>`), {
							breaks: false
						});
					} catch (error) {
						// If no attempts remain, fallback to plain text
						if (attempts <= 1) {
							return value;
						}
						// Wait for the interval, then retry
						await new Promise((resolve) => setTimeout(resolve, interval));
						return tryParse(value, attempts - 1, interval); // Recursive call
					}
				}

				// Usage example
				content = await tryParse(value);
			}
		} else {
			if (html && !content) {
				content = html;
			}
		}

		console.log('content', content);

		editor = new Editor({
			element: element,
			extensions: [
				StarterKit,
				CodeBlockLowlight.configure({
					lowlight
				}),
				Highlight,
				Typography,
				Placeholder.configure({ placeholder }),
				...tableExtensions,
				...(autocomplete
					? [
							AIAutocompletion.configure({
								generateCompletion: async (text) => {
									if (text.trim().length === 0) {
										return null;
									}

									const suggestion = await generateAutoCompletion(text).catch(() => null);
									if (!suggestion || suggestion.trim().length === 0) {
										return null;
									}

									return suggestion;
								}
							})
						]
					: [])
			],
			content: content,
			autofocus: messageInput ? true : false,
			onTransaction: () => {
				// force re-render so `editor.isActive` works as expected
				editor = editor;

				// Update table toolbar visibility and position
				updateTableToolbar();

				html = editor.getHTML();

				onChange({
					html: editor.getHTML(),
					json: editor.getJSON(),
					md: turndownService.turndown(editor.getHTML())
				});

				if (json) {
					value = editor.getJSON();
				} else {
					if (!raw) {
						let newValue = turndownService
							.turndown(
								editor
									.getHTML()
									.replace(/<p><\/p>/g, '<br/>')
									.replace(/ {2,}/g, (m) => m.replace(/ /g, '\u00a0'))
							)
							.replace(/\u00a0/g, ' ');

						if (!preserveBreaks) {
							newValue = newValue.replace(/<br\/>/g, '');
						}

						if (value !== newValue) {
							value = newValue;

							// check if the node is paragraph as well
							if (editor.isActive('paragraph')) {
								if (value === '') {
									editor.commands.clearContent();
								}
							}
						}
					} else {
						value = editor.getHTML();
					}
				}
			},
			editorProps: {
				attributes: { id },
				handleDOMEvents: {
					compositionstart: (view, event) => {
						oncompositionstart(event);
						return false;
					},
					compositionend: (view, event) => {
						oncompositionend(event);
						return false;
					},
					focus: (view, event) => {
						eventDispatch('focus', { event });
						setTimeout(updateTableToolbar, 0);
						return false;
					},
					keyup: (view, event) => {
						eventDispatch('keyup', { event });
						setTimeout(updateTableToolbar, 0);
						return false;
					},
					click: (view, event) => {
						setTimeout(updateTableToolbar, 0);
						return false;
					},
					scroll: (view, event) => {
						setTimeout(updateTableToolbar, 0);
						return false;
					},
					keydown: (view, event) => {
						if (messageInput) {
							// Handle Tab Key
							if (event.key === 'Tab') {
								const handled = selectNextTemplate(view.state, view.dispatch);
								if (handled) {
									event.preventDefault();
									return true;
								}
							}

							if (event.key === 'Enter') {
								// Check if the current selection is inside a structured block (like codeBlock or list)
								const { state } = view;
								const { $head } = state.selection;

								// Recursive function to check ancestors for specific node types
								function isInside(nodeTypes: string[]): boolean {
									let currentNode = $head;
									while (currentNode) {
										if (nodeTypes.includes(currentNode.parent.type.name)) {
											return true;
										}
										if (!currentNode.depth) break; // Stop if we reach the top
										currentNode = state.doc.resolve(currentNode.before()); // Move to the parent node
									}
									return false;
								}

								const isInCodeBlock = isInside(['codeBlock']);
								const isInList = isInside(['listItem', 'bulletList', 'orderedList']);
								const isInHeading = isInside(['heading']);

								if (isInCodeBlock || isInList || isInHeading) {
									// Let ProseMirror handle the normal Enter behavior
									return false;
								}
							}

							// Handle shift + Enter for a line break
							if (shiftEnter) {
								if (event.key === 'Enter' && event.shiftKey && !event.ctrlKey && !event.metaKey) {
									editor.commands.setHardBreak(); // Insert a hard break
									view.dispatch(view.state.tr.scrollIntoView()); // Move viewport to the cursor
									event.preventDefault();
									return true;
								}
							}
						}
						eventDispatch('keydown', { event });
						return false;
					},
					paste: (view, event) => {
						if (event.clipboardData) {
							// Extract plain text from clipboard and paste it without formatting
							const plainText = event.clipboardData.getData('text/plain');
							if (plainText) {
								if (largeTextAsFile) {
									if (plainText.length > PASTED_TEXT_CHARACTER_LIMIT) {
										// Dispatch paste event to parent component
										eventDispatch('paste', { event });
										event.preventDefault();
										return true;
									}
								}
								return false;
							}

							// Check if the pasted content contains image files
							const hasImageFile = Array.from(event.clipboardData.files).some((file) =>
								file.type.startsWith('image/')
							);

							// Check for image in dataTransfer items (for cases where files are not available)
							const hasImageItem = Array.from(event.clipboardData.items).some((item) =>
								item.type.startsWith('image/')
							);
							if (hasImageFile) {
								// If there's an image, dispatch the event to the parent
								eventDispatch('paste', { event });
								event.preventDefault();
								return true;
							}

							if (hasImageItem) {
								// If there's an image item, dispatch the event to the parent
								eventDispatch('paste', { event });
								event.preventDefault();
								return true;
							}
						}

						// For all other cases (text, formatted text, etc.), let ProseMirror handle it
						view.dispatch(view.state.tr.scrollIntoView()); // Move viewport to the cursor after pasting
						return false;
					}
				}
			}
		});

		if (messageInput) {
			selectTemplate();
		}
	});

	onDestroy(() => {
		// Clean up toolbar portal
		removeToolbarPortal();
		
		if (editor) {
			editor.destroy();
		}
	});

	$: if (value !== null && editor) {
		onValueChange();
	}

	const onValueChange = () => {
		if (!editor) return;

		if (json) {
			if (JSON.stringify(value) !== JSON.stringify(editor.getJSON())) {
				editor.commands.setContent(value);
				selectTemplate();
			}
		} else {
			if (raw) {
				if (value !== editor.getHTML()) {
					editor.commands.setContent(value);
					selectTemplate();
				}
			} else {
				if (
					value !==
					turndownService
						.turndown(
							(preserveBreaks
								? editor.getHTML().replace(/<p><\/p>/g, '<br/>')
								: editor.getHTML()
							).replace(/ {2,}/g, (m) => m.replace(/ /g, '\u00a0'))
						)
						.replace(/\u00a0/g, ' ')
				) {
					preserveBreaks
						? editor.commands.setContent(value)
						: editor.commands.setContent(
								marked.parse(value.replaceAll(`\n<br/>`, `<br/>`), {
									breaks: false
								})
							); // Update editor content

					selectTemplate();
				}
			}
		}
	};
</script>

<div bind:this={element} class="relative w-full min-w-full h-full min-h-fit {className}">
</div>
