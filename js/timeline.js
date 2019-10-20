"use strict"

class TimeLine extends HTMLElement {

	static get observedAttributes() {
	  	return ["data-duration"];
	}

	attributeChangedCallback(name, oldValue, newValue) {
	  	if (name === "data-duration") {
	  		this.style.width = `${this.timelineWidth}px`;
	  		this.removeMarkers();
	  		this.addMarkers();
	  	}
	}

	connectedCallback() {
		this.style.width = `${this.timelineWidth}px`;
		this.removeMarkers();
		this.addMarkers();
	}

	addMarkers() {
		const gap = this.gap;
		for (let i = 0; i < this.duration; i += gap) {
			const el = document.createElement("div");
			const textEl = document.createElement("span");

			el.classList.add("timeline-marker");
			el.style.left = `${i * this.pixelsPerSecond}px`;

			textEl.textContent = this.formatSeconds(i);

			el.append(textEl)
			this.append(el);
		}

		const el = document.createElement("div");
		const textEl = document.createElement("span");

		el.classList.add("timeline-marker");
		el.style.left = `${this.timelineWidth - 1}px`;

		textEl.textContent = this.formatSeconds(this.duration);

		el.append(textEl)
		this.append(el);
	}

	removeMarkers() {
		while (this.firstChild) {
			this.lastChild.remove();
		}
	}

	formatSeconds(sec) {
        const minutes = Math.floor(sec / 60);
        const seconds = Math.floor(sec % 60);

        const minPadding = minutes < 10 ? "0" : "";
        const secPadding = seconds < 10 ? "0" : "";

        return `${minPadding}${minutes}:${secPadding}${seconds}`;
	}

	get timelineWidth() {
		return this.duration * this.pixelsPerSecond;
	}
	get duration() {
		const attr = this.getAttribute("data-duration");
		return parseInt(attr, 10);
	}
	get pixelsPerSecond() {
		const attr = this.getAttribute("data-pps");
		return parseInt(attr, 10);
	}
	get gap() {
		const attr = this.getAttribute("data-gap");
		return parseInt(attr, 10);
	}
}

customElements.define("time-line", TimeLine);