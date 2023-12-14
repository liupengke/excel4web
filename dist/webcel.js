const S = window.document;
function m(a, t) {
  const e = S.elementsFromPoint(a, t);
  let l = null;
  for (const s of e)
    if (s.tagName.toUpperCase() == "TD" && s.classList.contains("e-cell") && !s.classList.contains("e-rownumber")) {
      l = s;
      break;
    }
  return l;
}
function g(a, t) {
  const e = document.createRange();
  e.setStart(a, 0), e.setEnd(a, a.childNodes.length), document.getSelection().removeAllRanges(), document.getSelection().addRange(e), a.childNodes.length > 0 && document.execCommand("delete", !1, null), t && (a.innerText = t);
}
let T = 0;
function v() {
  return "_wel_" + ++T;
}
const w = {};
class u {
  constructor(t) {
    if (t.dataset.rtId && w[t.dataset.rtId])
      return w[t.dataset.rtId];
    this.el = t, this.listeners = {}, t.dataset.rtId = v(), w[t.dataset.rtId] = this;
  }
  find(t) {
    const e = this.el.querySelector(t);
    return new u(e);
  }
  on(t, e) {
    return this.listeners[t] || (this.listeners[t] = []), this.listeners[t].push(e), this.el.addEventListener(t, e, !1), this;
  }
  off(t, e) {
    if (e)
      this.el.removeEventListener(t, e, !1), this.listeners[t] && (this.listeners[t] = this.listeners[t].filter(
        (l) => l != e
      ));
    else if (this.listeners[t]) {
      for (const l of this.listeners[t])
        this.el.removeEventListener(t, l, !1);
      this.listeners[t] = [];
    }
    return this;
  }
  attr(t, e) {
    return typeof e > "u" ? this.el.getAttribute(t) : (this.el.setAttribute(t, e), this);
  }
  removeAttr(t) {
    return this.el.removeAttribute(t), this;
  }
  css(t, e) {
    if (typeof t == "string")
      return typeof e < "u" ? this.css({ [t]: e }) : window.getComputedStyle(this.el)[t];
    {
      const l = ["left", "top", "right", "bottom", "width", "height"];
      for (const s in t) {
        let d = t[s];
        l.includes(s) && typeof d == "number" && (d += "px"), this.el.style[s] = d;
      }
      return this;
    }
  }
  html(t) {
    return typeof t < "u" ? (this.el.innerHTML = t, this) : this.el.innerHTML;
  }
  text(t) {
    return typeof t < "u" ? (this.el.innerText = t, this) : this.el.innerText;
  }
}
const C = `<div class="e-panel">
	<table class="e-excel e-excel-main" contenteditable width="{{tableWidth}}">
		<thead contenteditable="false">
			<tr>
				{{headHtml}}
			</tr>
		</thead>
		<tbody></tbody>
	</table>
	<div class="e-pad"></div>
	<div class="e-selector"></div>
	<table class="e-excel e-excel-fly">
		<tbody>
			<tr>
				<td class="e-cell e-cell-fly"></td>
			</tr>
		</tbody>
	</table>
	<div class="e-selector-dot"></div>
</div>
`;
const b = window.document;
class R {
  constructor(t) {
    this.initDom(t), this.startSelectCell = null, this.endSelectCell = null, this.status = "";
  }
  initDom(t) {
    const e = (t == null ? void 0 : t.el) instanceof HTMLElement ? t.el : b.querySelector(t.el);
    let s = [...[
      {
        type: "rownumber",
        cls: "e-rownumber",
        width: 40,
        editable: !1,
        render(i, r, x) {
          return x + 1;
        }
      }
    ], ...t.columns];
    const n = e.getBoundingClientRect().width;
    let h = n, o = 0;
    s.forEach((i) => {
      var r;
      typeof i.width == "number" ? (h -= i.width, i._width = i.width) : (r = i.width) != null && r.flex ? o += i.width.flex : i.width = { flex: 1 };
    }), h -= 10, s.forEach((i) => {
      var r;
      (r = i.width) != null && r.flex && (i._width = Math.floor(h * i.width.flex / o), i.width.min && i._width < i.width.min && (i._width = i.width.min), i.width.max && i._width > i.width.max && (i._width = i.width.max), i._width < 0 && (i._width = 120));
    });
    const f = Math.max(
      n - s.reduce((i, r) => i + r._width, 0),
      24
    );
    s = [
      ...s,
      {
        title: "",
        editable: !1,
        _width: f
      }
    ];
    const c = s.reduce((i, r) => i + r._width, 0), p = {
      tableWidth: c,
      headHtml: s.map(
        (i) => `<th width="${i._width}" class="e-cell ${i.cls || ""}">${i.title || ""}</th>`
      ).join("")
    }, y = C.replace(
      /\{\{\s*(.+?)\s*\}\}/g,
      (i, r) => p[r] || ""
    );
    this.columns = s, e.innerHTML = y, this.container = new u(e), this.selector = this.container.find(".e-selector"), this.dot = this.container.find(".e-selector-dot"), this.pad = this.container.find(".e-pad"), this.flyTable = this.container.find(".e-excel-fly"), this.containerRect = e.getBoundingClientRect(), this.docEl = new u(b.documentElement), e.querySelector(".e-pad").style.width = c + "px", this.elPanel = e.querySelector(".e-panel"), this.pad.on("mousedown", (i) => this.startDragSelect(i)), this.dot.on("mousedown", (i) => this.startDragFill(i)), this.flyTable.on("dblclick", () => {
      this.flyTable.attr("contenteditable", !0), this.status = "editing", this.editingCell = this.startSelectCell;
    }), this.flyTable.on("blur", () => {
      this.flyTable.removeAttr("contenteditable"), g(this.editingCell, this.flyTable.text()), this.editingCell = null, this.status = "";
    });
  }
  updateRecords(t) {
    const e = t.map((l, s) => "<tr>" + this.columns.map((n) => {
      let h = !0, o = "";
      return n.render ? o = n.render(l, n, s) : n.dataIndex && (o = l[n.dataIndex] || ""), n.editable === !1 && (h = !1), { editable: h, text: o };
    }).map(
      (n) => `<td class="e-cell" ${n.editable ? "" : 'contenteditable="false"'}>${n.text}</td>`
    ).join("") + "</tr>").join("");
    this.container.find(".e-excel-main>tbody").html(e);
  }
  startDragSelect(t) {
    t.preventDefault();
    const e = m(t.clientX, t.clientY);
    e && (this.container.off("mousemove").off("mouseup").on("mousemove", (l) => this.dragSelect(l)).on("mouseup", (l) => this.stopDragSelect(l)), this.startSelectCell = this.endSelectCell = e, this.showSelector(!0));
  }
  dragSelect(t) {
    this.dragSelectTimer || (this.dragSelectTimer = setTimeout(() => {
      this.dragSelectTimer = null, t.preventDefault();
      const e = m(t.clientX, t.clientY);
      e && this.endSelectCell != e && (this.endSelectCell = e, this.showSelector());
    }, 100));
  }
  stopDragSelect() {
    this.container.off("mousemove").off("mouseup");
  }
  showSelector(t) {
    const e = this.startSelectCell.getBoundingClientRect(), l = this.endSelectCell.getBoundingClientRect();
    let s = Math.min(e.left, l.left), d = Math.min(e.top, l.top);
    const n = Math.max(e.right, l.right) - s + 2, h = Math.max(e.bottom, l.bottom) - d + 2, { scrollLeft: o, scrollTop: f } = this.elPanel;
    s -= this.containerRect.left + 1 - o, d -= this.containerRect.top + 1 - f, this.selector.css({
      left: s,
      top: d,
      width: n,
      height: h
    }), this.dot.css({
      left: s + n - 4,
      top: d + h - 4
    }), t === !0 && (this.flyTable.css({
      left: e.left - this.containerRect.left + 1 + o,
      top: e.top - this.containerRect.top + 1 + f,
      width: e.width - 2,
      height: e.height - 1.5
    }), this.flyTable.el.blur(), this.flyTable.find(".e-cell").text(this.startSelectCell.innerText), this.status = "editReady", this.docEl.off("keydown").on("keydown", (c) => {
      c.altKey || c.ctrlKey || c.metaKey || c.shiftKey || (this.status == "editReady" && (this.flyTable.attr("contenteditable", !0), g(this.flyTable.find(".e-cell-fly").el), this.status = "editing", this.editingCell = this.startSelectCell), this.docEl.off("keydown"));
    }));
  }
  startDragFill(t) {
    t.preventDefault(), this.data4dragFill = {
      sx: t.clientX,
      sy: t.clientY
    }, this.container.off("mousemove").off("mouseup").on("mousemove", (e) => this.dragFill(e)).on("mouseup", (e) => this.stopDragFill(e));
  }
  dragFill(t) {
    this.dragFillTimer || (this.dragFillTimer = setTimeout(() => {
      this.dragFillTimer = null, t.preventDefault();
      const e = m(t.clientX, t.clientY);
      e && this.endSelectCell != e && (this.endSelectCell = e, this.showSelector());
    }, 100));
  }
  stopDragFill() {
    this.container.off("mousemove").off("mouseup");
  }
}
export {
  R as default
};
