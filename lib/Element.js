import { genId } from "./util";

const cache = {};
export default class Element {
	constructor(el) {
		if (el.dataset.rtId && cache[el.dataset.rtId]) {
			return cache[el.dataset.rtId];
		}
		this.el = el;
		this.listeners = {};

		el.dataset.rtId = genId();
		cache[el.dataset.rtId] = this;
	}

	find(selector) {
		const el = this.el.querySelector(selector);
		return new Element(el);
	}
	on(name, handler) {
		if (!this.listeners[name]) {
			this.listeners[name] = [];
		}
		this.listeners[name].push(handler);
		this.el.addEventListener(name, handler, false);
		return this;
	}
	off(name, handler) {
		if (handler) {
			this.el.removeEventListener(name, handler, false);
			if (this.listeners[name])
				this.listeners[name] = this.listeners[name].filter(
					(fn) => fn != handler
				);
		} else if (this.listeners[name]) {
			for (const handler of this.listeners[name]) {
				this.el.removeEventListener(name, handler, false);
			}
			this.listeners[name] = [];
		}
		return this;
	}
	attr(name, val) {
		if (typeof val == "undefined") {
			return this.el.getAttribute(name);
		} else {
			this.el.setAttribute(name, val);
			return this;
		}
	}
	removeAttr(name) {
		this.el.removeAttribute(name);
		return this;
	}
	css(key, val) {
		if (typeof key == "string") {
			if (typeof val != "undefined") {
				return this.css({ [key]: val });
			} else {
				return window.getComputedStyle(this.el)[key];
			}
		} else {
			const sizeKeyList = ["left", "top", "right", "bottom", "width", "height"];
			for (const k in key) {
				let v = key[k];
				if (sizeKeyList.includes(k) && typeof v == "number") {
					v += "px";
				}
				this.el.style[k] = v;
			}
			return this;
		}
	}
	html(str) {
		if (typeof str != "undefined") {
			this.el.innerHTML = str;
			return this;
		} else return this.el.innerHTML;
	}
	text(str) {
		if (typeof str != "undefined") {
			this.el.innerText = str;
			return this;
		} else return this.el.innerText;
	}
}
