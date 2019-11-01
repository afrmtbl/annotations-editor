"use strict"

function secondsToPixels(seconds, pixelsPerSecond) {
	return seconds * pixelsPerSecond;
}

class AnnotationsTrack extends HTMLElement {
	connectedCallback() {

		this.currentTimeEl = document.createElement("div");
		this.currentTimeEl.classList.add("current-time");
		this.append(this.currentTimeEl);

		this.annotationsContainer = document.createElement("annotations-container");
		this.append(this.annotationsContainer)

		if (!this.videoId) throw new Error("A video element id must be provided");

		this.videoElement = document.getElementById(this.videoId);

		this.addTimeline();

		this.videoElement.addEventListener("loadedmetadata", e => {
			this.updateTrackLength(this.videoElement.duration);
		});

		this.scroll(0, 0);

		this.acStyles = window.getComputedStyle(this.annotationsContainer);

		this.videoElement.addEventListener("timeupdate", e => {

			let mLeft = this.acStyles.marginLeft
		  	mLeft = mLeft.substring(0, mLeft.length - 2);
		  	mLeft = parseFloat(mLeft, 10);

			const time = this.videoElement.currentTime;
			const nextScrollLeft = this.pixelsPerSecond * time;

			const containerOffsetWidth = this.annotationsContainer.offsetWidth;

			const curScrollExceeds = this.scrollLeft + this.offsetWidth - mLeft - 48 >= containerOffsetWidth;
			const nextScrollExceeds = nextScrollLeft + this.offsetWidth - mLeft - 48 >= containerOffsetWidth;

			if (!curScrollExceeds || !nextScrollExceeds) {
			  	this.scrollLeft = nextScrollLeft;
			}

			const left = mLeft + secondsToPixels(time, this.pixelsPerSecond) + "px"
			this.currentTimeEl.style.left = left;
		});

		if (!isNaN(this.videoElement.duration)) {
			this.updateTrackLength(this.videoElement.duration);
		}
	}

	setRenderer(renderer) {
		this.renderer = renderer;
	}
	setEditor(editor) {
		this.editor = editor;
		this.editor.annotationsTrack = this;
	}

	addTimeline() {
		this.timeline = document.createElement("time-line");
		this.timeline.setAttribute("data-pps", this.pixelsPerSecond);
		this.timeline.setAttribute("data-duration", 10);
		this.timeline.setAttribute("data-gap", 3);

		this.prepend(this.timeline);
	}

	createAnnotation(annotationData, annotationElement = null, row = 0) {
		const annotation = document.createElement("track-item");

		const pps = this.pixelsPerSecond;

		const left = `${secondsToPixels(annotationData.timeStart, pps)}px`;
		annotation.style.left = left;

		const duration = annotationData.timeEnd - annotationData.timeStart;
		const width = `${secondsToPixels(duration, pps)}px`;
		annotation.style.width = width;

		annotation.style.top = `${row * 52 + 14}px`;

		if (annotationElement && annotationElement.element) {

			const ael = annotationElement.element;

			annotation.addEventListener("mouseenter", e => {
				if (e.fromAnnotationElement) return;

				const ev = new Event("mouseenter");
				ev.fromAnnotationTrack = true;
				ael.dispatchEvent(ev);
			});
			annotation.addEventListener("mouseleave", e => {
				if (e.fromAnnotationElement) return;

				const ev = new Event("mouseleave");
				ev.fromAnnotationTrack = true;
				ael.dispatchEvent(ev);
			});

			annotation.addEventListener("click", e => {
				this.editor.loadAnnotation(annotationData);
			});
		}


		annotation.setAnnotationData(annotationData, annotationElement);
		this.annotationsContainer.append(annotation);
	}

	createAnnotationsFromRenderer() {

		while (this.annotationsContainer.firstChild) {
			this.annotationsContainer.firstChild.remove();
		}

		const annotations = this.renderer.annotations.map(el => {
			el.data["_element"] = el;
			return el.data;
		});
		this.sortAnnotationsByStartTime(annotations);

		const rows = [];
		for (const annotation of annotations) {
			this.fitAnnotationIntoRow(annotation, rows, 0);
		}

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			for (const annotation of row) {
				if (annotation.timeStart > this.videoDuration) continue; 
				this.createAnnotation(annotation, annotation._element, i);
			}
		}
	}

	updateTrackLength(videoDuration) {
		this.videoDuration = videoDuration;
		this.annotationsContainer.style.width = `${videoDuration * this.pixelsPerSecond}px`;
		this.timeline.setAttribute("data-duration", videoDuration);
	}

	sortAnnotationsByStartTime(annotations) {
	    return annotations.sort((a, b) => {
	        if (a.timeStart > b.timeStart) {
	            return true;
	        }
	        else if (a.timeStart === b.timeStart) {
	            return a.timeEnd > b.timeEnd ? true : false;
	        }
	        return false;
	    });
	}

	fitAnnotationIntoRow(annotation, rows, startRowIndex) {
		// If the row doesn't have an annotation in it yet, create
		// a row at the starting index
		if (!rows[startRowIndex]) {
			rows[startRowIndex] = [];
		}
		// Compare the annotation to the last column in the current row
		const prev = rows[startRowIndex][rows[startRowIndex].length - 1];

		if (!prev) {
			rows[startRowIndex].push(annotation);
		}
		else if (annotation.timeStart <= prev.timeEnd) {
			this.fitAnnotationIntoRow(annotation, rows, startRowIndex + 1)
		}
		else if (annotation.timeStart > prev.timeEnd) {
			rows[startRowIndex].push(annotation)
		}
	}

	get videoId() {
		return this.getAttribute("data-video-id");
	}
	get pixelsPerSecond() {
		return parseInt(this.getAttribute("data-pps"), 10);
	}
	get trackItemSpacing() {
		return parseInt(this.getAttribute("data-item-spacing", 10))
	}

}

class TrackItem extends HTMLElement {

	static get observedAttributes() {
	  	return ["data-icon", "data-title"];
	}


	attributeChangedCallback(name, oldValue, newValue) {
		if (name === "data-icon") {
			this.typeIconElement.setAttribute("src", `icons/${newValue}.svg`);
		}
		else if (name === "data-title") {
			this.titleElement.textContent = newValue;
			this.setAttribute("title", newValue);
		}
	}

	constructor() {
		super();

		this.typeIconElement = document.createElement("img");
		this.typeIconElement.classList.add("type-icon");

		this.titleElement = document.createElement("span");
		this.titleElement.classList.add("title");
	}

	connectedCallback() {
		this.append(this.typeIconElement, this.titleElement);
	}

	setAnnotationData(annotationData, annotationElement = null) {

		this.setAttribute("data-icon", annotationData.style);
		this.setAttribute("data-title", annotationData.text || "<no text>");

		this.annotationData = annotationData;
		this.annotationElement = annotationElement ? annotationElement : null;
	}
}

customElements.define("track-item", TrackItem);
customElements.define("annotations-track", AnnotationsTrack);
