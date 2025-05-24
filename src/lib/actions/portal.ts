export function portal(node: HTMLElement) {
	// Move the node to the body
	document.body.appendChild(node);

	return {
		destroy() {
			// Remove the node when the component is destroyed
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		}
	};
}
