import Element from "./Element";
import { getCell, paste, collapseToEnd } from "./util";
import tmpl from "./tmpl.html?raw";
import "./excel.css";

const doc = window.document;
class Excel {
	constructor(options) {
		this.initDom(options);

		this.startSelectCell = null;
		this.endSelectCell = null;
		this.status = "";
	}

	initDom(options) {
		const container =
			options?.el instanceof HTMLElement
				? options.el
				: doc.querySelector(options.el);

		const assistedColumns = [
			{
				type: "rownumber",
				cls: "e-rownumber",
				width: 40,
				editable: false,
				render(r, col, rIndex) {
					return rIndex + 1;
				},
			},
		];

		// 计算每列的宽度
		let columns = [...assistedColumns, ...options.columns];
		{
			const rect = container.getBoundingClientRect();
			const viewportWidth = rect.width;
			let flexWidth = viewportWidth;
			let totalFlex = 0;
			columns.forEach((col) => {
				if (typeof col.width == "number") {
					flexWidth -= col.width;
					col._width = col.width;
				} else if (col.width?.flex) {
					totalFlex += col.width.flex;
				} else {
					col.width = { flex: 1 };
				}
			});
			flexWidth -= 10;
			columns.forEach((col) => {
				if (col.width?.flex) {
					col._width = Math.floor((flexWidth * col.width.flex) / totalFlex);
					if (col.width.min && col._width < col.width.min) {
						col._width = col.width.min;
					}
					if (col.width.max && col._width > col.width.max) {
						col._width = col.width.max;
					}
					if (col._width < 0) {
						col._width = 120;
					}
				}
			});
			const remainWidth = Math.max(
				viewportWidth - columns.reduce((total, col) => total + col._width, 0),
				24
			);
			columns = [
				...columns,
				{
					title: "",
					editable: false,
					_width: remainWidth,
				},
			];
		}

		// 构建html
		const tableWidth = columns.reduce((total, col) => total + col._width, 0);
		{
			const data = {
				tableWidth,
				headHtml: columns
					.map(
						(col) =>
							`<th width="${col._width}" class="e-cell e-cell-head ${
								col.cls || ""
							}">${col.title || ""}</th>`
					)
					.join(""),
			};
			const html = tmpl.replace(
				/\{\{\s*(.+?)\s*\}\}/g,
				(_, key) => data[key] || ""
			);
			this.columns = columns;
			container.innerHTML = html;
		}

		// 有两种element：原生的以el开头，Element元素以$开头
		this.$container = new Element(container);
		this.$selector = this.$container.find(".e-selector");
		this.$dot = this.$container.find(".e-selector-dot");
		this.$pad = this.$container.find(".e-pad");
		this.$flyTable = this.$container.find(".e-excel-fly");
		this.$panel = this.$container.find(".e-panel");
		this.$body = this.$container.find(".e-excel-main>tbody");
		this.$docEl = new Element(doc.documentElement);

		this.containerRect = container.getBoundingClientRect();
		this.$pad.css("width", tableWidth);

		this.$pad.on("mousedown", (e) => this.startDragSelect(e));
		this.$dot.on("mousedown", (e) => this.startDragFill(e));
		this.$flyTable
			.on("dblclick", () => {
				this.$flyTable.attr("contenteditable", true);
				this.status = "editing";
				// paste(this.flyTable.find("td").el, this.flyTable.text());
				collapseToEnd(this.flyTable.find("td").el);
				this.editingCell = this.startSelectCell;
			})
			.on("blur", () => {
				this.$flyTable.removeAttr("contenteditable");
				paste(this.editingCell, this.flyTable.text());

				// this.editingCell.innerText = this.flyTable.text();
				this.editingCell.blur();
				this.editingCell = null;
				this.status = "";
			});
	}

	updateRecords(records) {
		const html = records
			.map((r, rIndex) => {
				const rowHtml = this.columns
					.map((col) => {
						let editable = true;
						let text = "";
						if (col.render) text = col.render(r, col, rIndex);
						else if (col.dataIndex) text = r[col.dataIndex] || "";
						if (col.editable === false) {
							editable = false;
						}
						return { editable, text };
					})
					.map(
						(cell, colIndex) =>
							`<td class="e-cell" ${
								!cell.editable ? 'contenteditable="false"' : ""
							} data-row="${rIndex}" data-col="${colIndex}">${cell.text}</td>`
					)
					.join("");

				return "<tr>" + rowHtml + "</tr>";
			})
			.join("");

		this.$body.html(html);
	}
	startDragSelect(e) {
		e.preventDefault();
		const cell = getCell(e.clientX, e.clientY);
		if (!cell) return;
		this.$container
			.off("mousemove")
			.off("mouseup")
			.on("mousemove", (e) => this.dragSelect(e))
			.on("mouseup", (e) => this.stopDragSelect(e));

		this.selectData = {
			from: {
				row: cell.dataset.row,
				col: cell.dataset.col,
			},
			to: {
				row: cell.dataset.row,
				col: cell.dataset.col,
			},
		};

		this.showSelector(true);
	}
	dragSelect(e) {
		this._movePos = [e.clientX, e.clientY];
		if (this.dragSelectTimer) {
			return;
		}
		this.dragSelectTimer = setTimeout(() => {
			this.dragSelectTimer = null;
			e.preventDefault();

			const cell = getCell(this._movePos[0], this._movePos[1]);
			if (!cell) return;
			const { row, col } = this.selectData.to;
			if (row == cell.dataset.row && col == cell.dataset.col) return;
			this.selectData.to.row = cell.dataset.row;
			this.selectData.to.col = cell.dataset.col;
			this.showSelector();
		}, 100);
	}
	stopDragSelect() {
		this.$container.off("mousemove").off("mouseup");
	}
	showSelector(needPlaceFlyTable) {
		const { from, to } = this.selectData;
		const r0 = Math.min(from.row, to.row);
		const c0 = Math.min(from.col, to.col);
		const r1 = Math.max(from.row, to.row);
		const c1 = Math.max(from.col, to.col);
		const sCell = this.$body.find(`td[data-row="${r0}"][data-col="${c0}"]`).el;
		const eCell = this.$body.find(`td[data-row="${r1}"][data-col="${c1}"]`).el;
		const startRect = sCell.getBoundingClientRect();
		const endRect = eCell.getBoundingClientRect();
		let left = Math.min(startRect.left, endRect.left);
		let top = Math.min(startRect.top, endRect.top);
		const width = endRect.right - startRect.left + 2;
		const height = endRect.bottom - startRect.top + 2;
		const { scrollLeft, scrollTop } = this.$panel.el;

		left -= this.containerRect.left + 1 - scrollLeft;
		top -= this.containerRect.top + 1 - scrollTop;
		this.$selector.css({
			left,
			top,
			width,
			height,
		});
		this.$dot.css({
			left: left + width - 4,
			top: top + height - 4,
		});

		if (needPlaceFlyTable === true) {
			const { row, col } = this.selectData.from;
			const cell = this.$body.find(
				`td[data-row="${row}"][data-col="${col}"]`
			).el;
			const rect = cell.getBoundingClientRect();
			this.$flyTable.css({
				left: rect.left - this.containerRect.left + 1 + scrollLeft,
				top: rect.top - this.containerRect.top + 1 + scrollTop,
				width: rect.width - 2,
				height: rect.height - 1.5,
			});
			this.$flyTable.el.blur();

			this.$flyTable.find(".e-cell").text(cell.innerText);
			this.status = "editReady";

			this.$docEl.off("keydown").on("keydown", (e) => {
				if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
				if (this.status == "editReady") {
					this.$flyTable.attr("contenteditable", true);
					paste(this.flyTable.find(".e-cell-fly").el);
					this.status = "editing";
					this.editingCell = cell;
				}
				this.$docEl.off("keydown");
			});
		}
	}
	startDragFill(e) {
		e.preventDefault();
		this.$container
			.off("mousemove")
			.off("mouseup")
			.on("mousemove", (e) => this.dragFill(e))
			.on("mouseup", (e) => this.stopDragFill(e));
	}
	dragFill(e) {
		this._dragPos = [e.clientX, e.clientY];
		if (this.dragFillTimer) {
			return;
		}
		this.dragFillTimer = setTimeout(() => {
			this.dragFillTimer = null;
			e.preventDefault();

			const cell = getCell(e.clientX, e.clientY);
			if (!cell) return;
			if (this.elEndSelectCell == cell) return;
			this.elEndSelectCell = cell;
			this.showSelector();
		}, 100);
	}
	stopDragFill() {
		this.$container.off("mousemove").off("mouseup");
	}
}

export default Excel;
