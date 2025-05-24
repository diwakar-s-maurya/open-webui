import { mergeAttributes } from '@tiptap/core';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';

interface TableAttributes {
	colspan?: number;
	rowspan?: number;
	colwidth?: number[] | null;
}

// Common attributes for both table cells and headers
const getCommonAttributes = () => ({
	colspan: {
		default: 1,
		parseHTML: (element: HTMLElement) => {
			const colspan = element.getAttribute('colspan');
			return colspan ? parseInt(colspan, 10) : 1;
		},
		renderHTML: (attributes: TableAttributes) => attributes.colspan && attributes.colspan > 1 ? { colspan: attributes.colspan } : {}
	},
	rowspan: {
		default: 1,
		parseHTML: (element: HTMLElement) => {
			const rowspan = element.getAttribute('rowspan');
			return rowspan ? parseInt(rowspan, 10) : 1;
		},
		renderHTML: (attributes: TableAttributes) => attributes.rowspan && attributes.rowspan > 1 ? { rowspan: attributes.rowspan } : {}
	},
	colwidth: {
		default: null,
		parseHTML: (element: HTMLElement) => {
			const colwidth = element.getAttribute('colwidth');
			return colwidth ? colwidth.split(',').map((item: string) => parseInt(item, 10)) : null;
		},
		renderHTML: (attributes: TableAttributes) => attributes.colwidth ? { colwidth: attributes.colwidth.join(',') } : {}
	}
});

// Extend TableCell with common attributes
const TableCellExtended = TableCell.extend({
	addAttributes() {
		return {
			...(this.parent ? this.parent() : {}),
			...getCommonAttributes()
		};
	},
	renderHTML({ HTMLAttributes }) {
		return ['td', mergeAttributes(this.options.HTMLAttributes || {}, HTMLAttributes), 0];
	}
});

// Extend TableHeader with common attributes
const TableHeaderExtended = TableHeader.extend({
	addAttributes() {
		return {
			...(this.parent ? this.parent() : {}),
			...getCommonAttributes()
		};
	},
	renderHTML({ HTMLAttributes }) {
		return ['th', mergeAttributes(this.options.HTMLAttributes || {}, HTMLAttributes), 0];
	}
});

// Export table extensions configuration
export const tableExtensions = [
	Table.configure({
		resizable: true,
		allowTableNodeSelection: true,
	}),
	TableRow,
	TableHeaderExtended,
	TableCellExtended
];
