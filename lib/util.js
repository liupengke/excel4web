const doc = window.document;

export function getCell(x, y) {
	const els = doc.elementsFromPoint(x, y);
	let cell = null;
	for (const el of els) {
		if (
			el.tagName.toUpperCase() == "TD" &&
			el.classList.contains("e-cell") &&
			!el.classList.contains("e-rownumber")
		) {
			cell = el;
			break;
		}
	}
	return cell;
}
export function paste(cell, text) {
	const range = document.createRange();
	range.setStart(cell, 0);
	range.setEnd(cell, cell.childNodes.length);
	document.getSelection().removeAllRanges();
	document.getSelection().addRange(range);
	if (cell.childNodes.length > 0) document.execCommand("delete", false, null);

	if (text) {
		cell.innerText = text;
	}
}

export function collapseToEnd(el) {
	const sel = document.getSelection();
	sel.removeAllRanges();
	sel.selectAllChildren(el);
	sel.collapseToEnd();
}

let idSeed = 0;
export function genId() {
	return "_wel_" + ++idSeed;
}
