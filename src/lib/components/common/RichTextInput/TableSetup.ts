import { mergeAttributes } from '@tiptap/core';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';

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