<script lang="ts">
	import { getContext } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import GarbageBin from '$lib/components/icons/GarbageBin.svelte';

	const i18n = getContext('i18n');

	export let editor = null;
	export let visible = false;

	// Table command handlers
	const handleAddColumnBefore = () => {
		if (editor) {
			editor.chain().focus().addColumnBefore().run();
		}
	};

	const handleAddColumnAfter = () => {
		if (editor) {
			editor.chain().focus().addColumnAfter().run();
		}
	};

	const handleDeleteColumn = () => {
		if (editor) {
			editor.chain().focus().deleteColumn().run();
		}
	};

	const handleAddRowBefore = () => {
		if (editor) {
			editor.chain().focus().addRowBefore().run();
		}
	};

	const handleAddRowAfter = () => {
		if (editor) {
			editor.chain().focus().addRowAfter().run();
		}
	};

	const handleDeleteRow = () => {
		if (editor) {
			editor.chain().focus().deleteRow().run();
		}
	};

	const handleMergeCells = () => {
		if (editor) {
			editor.chain().focus().mergeCells().run();
		}
	};

	const handleSplitCell = () => {
		if (editor) {
			editor.chain().focus().splitCell().run();
		}
	};

	const handleToggleHeaderColumn = () => {
		if (editor) {
			editor.chain().focus().toggleHeaderColumn().run();
		}
	};

	const handleToggleHeaderRow = () => {
		if (editor) {
			editor.chain().focus().toggleHeaderRow().run();
		}
	};

	const handleDeleteTable = () => {
		if (editor) {
			editor.chain().focus().deleteTable().run();
		}
	};
</script>

{#if visible}
	<div
		class="flex items-center gap-1 p-2 bg-white/95 dark:bg-gray-850/95 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl backdrop-blur-md transition-all duration-200 ease-in-out"
		in:scale={{ duration: 200, start: 0.9 }}
		out:scale={{ duration: 150, start: 0.9 }}
	>
		<!-- Column Controls -->
		<div class="flex items-center border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
			<Tooltip content={$i18n.t('Add column before')}>
				<button
					type="button"
					class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
					on:click={handleAddColumnBefore}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 4.5v15m7.5-7.5h-15"
						/>
					</svg>
				</button>
			</Tooltip>

			<Tooltip content={$i18n.t('Add column after')}>
				<button
					type="button"
					class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
					on:click={handleAddColumnAfter}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4 rotate-90"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 4.5v15m7.5-7.5h-15"
						/>
					</svg>
				</button>
			</Tooltip>

			<Tooltip content={$i18n.t('Delete column')}>
				<button
					type="button"
					class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors"
					on:click={handleDeleteColumn}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
						/>
					</svg>
				</button>
			</Tooltip>
		</div>

		<!-- Row Controls -->
		<div class="flex items-center border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
			<Tooltip content={$i18n.t('Add row before')}>
				<button
					type="button"
					class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
					on:click={handleAddRowBefore}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 4.5v15m7.5-7.5h-15"
						/>
					</svg>
				</button>
			</Tooltip>

			<Tooltip content={$i18n.t('Add row after')}>
				<button
					type="button"
					class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
					on:click={handleAddRowAfter}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4 rotate-180"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 4.5v15m7.5-7.5h-15"
						/>
					</svg>
				</button>
			</Tooltip>

			<Tooltip content={$i18n.t('Delete row')}>
				<button
					type="button"
					class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors"
					on:click={handleDeleteRow}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
						/>
					</svg>
				</button>
			</Tooltip>
		</div>

		<!-- Cell Controls -->
		<div class="flex items-center border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
			<Tooltip content={$i18n.t('Merge cells')}>
				<button
					type="button"
					class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
					on:click={handleMergeCells}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M2.25 21h19.5m-18-18v18m10.5-18v18m10.5-18v18m-10.5 0v18m10.5 0v18"
						/>
					</svg>
				</button>
			</Tooltip>

			<Tooltip content={$i18n.t('Split cell')}>
				<button
					type="button"
					class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
					on:click={handleSplitCell}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M2.25 21h19.5m-18-18v18m10.5-18v18m10.5-18v18m-10.5 0v18m10.5 0v18"
						/>
					</svg>
				</button>
			</Tooltip>
		</div>

		<!-- Header Controls -->
		<div class="flex items-center border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
			<Tooltip content={$i18n.t('Toggle header column')}>
				<button
					type="button"
					class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
					on:click={handleToggleHeaderColumn}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 4.5v15m7.5-7.5h-15"
						/>
					</svg>
				</button>
			</Tooltip>

			<Tooltip content={$i18n.t('Toggle header row')}>
				<button
					type="button"
					class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
					on:click={handleToggleHeaderRow}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4 rotate-90"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 4.5v15m7.5-7.5h-15"
						/>
					</svg>
				</button>
			</Tooltip>
		</div>

		<!-- Delete Table -->
		<Tooltip content={$i18n.t('Delete table')}>
			<button
				type="button"
				class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors"
				on:click={handleDeleteTable}
			>
				<GarbageBin strokeWidth="2" />
			</button>
		</Tooltip>
	</div>
{/if} 