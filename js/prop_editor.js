class PropEditor extends HTMLElement {

	constructor(editorElement, annotationParser, annotationRenderer) {

		super();

		editorElement.parentElement.append(this);
		this.append(editorElement);

		this._annotationData = {};

		this.editorElement = editorElement;
		this.annotationParser = annotationParser;
		this.annotationRenderer = annotationRenderer;

		this.annotationCodeInput = document.getElementById("annotation-code");
		this.annotationTypeInput = document.getElementById("annotation-type");
		this.annotationTypeInput.addEventListener("change", e => {
			this.setAnnotationProperty("type", e.target.value);
		});

		this.annotationTimeStartInput = document.getElementById("time-start");
		this.annotationTimeEndInput = document.getElementById("time-end");

		for (const input of [this.annotationTimeStartInput, this.annotationTimeEndInput]) {
			input.addEventListener("input", e => {

				const which = e.target.getAttribute("id");
				const timeStart = this.annotationData["timeStart"];
				const timeEnd = this.annotationData["timeEnd"];

				const inputTimeStart = this.durationToSeconds(this.annotationTimeStart);
				const inputTimeEnd = this.durationToSeconds(this.annotationTimeEnd);

				if (inputTimeStart < inputTimeEnd) {
					this.annotationTimeStartInput.setCustomValidity("");
					this.annotationTimeEndInput.setCustomValidity("");
				}
				else if (inputTimeStart === inputTimeEnd) {
					const errorMessage = `The time that the annotation starts cannot be equal to the time it ends (${inputTimeStart}s to ${inputTimeEnd}s)`;
					this.annotationTimeStartInput.setCustomValidity(errorMessage);
					this.annotationTimeEndInput.setCustomValidity(errorMessage);
				}
				else {
					console.log(which, inputTimeStart, inputTimeEnd);
					if (which === "time-end") {
						const errorMessage = `The time that the annotation ends cannot be less than or equal to the time it starts (${inputTimeStart}s to ${inputTimeEnd}s)`;
						this.annotationTimeStartInput.setCustomValidity("");
						this.annotationTimeEndInput.setCustomValidity(errorMessage);
					}
					else {
						const errorMessage = `The time that the annotation starts cannot be greater than or equal to the time it ends (${inputTimeStart}s to ${inputTimeEnd}s)`;
						this.annotationTimeStartInput.setCustomValidity(errorMessage);
						this.annotationTimeEndInput.setCustomValidity("");
					}
				}

				const updateTime = (prop, dataTime, inputTime) => {
					if (this.annotationTimeStartInput.checkValidity() && this.annotationTimeEndInput.checkValidity() && dataTime !== inputTime) {
						this.setAnnotationProperty(prop, inputTime);
					}
				}

				if (which === "time-start") {
					updateTime("timeStart", timeStart, inputTimeStart);
					updateTime("timeEnd", timeEnd, inputTimeEnd);
				}
				else {
					updateTime("timeEnd", timeEnd, inputTimeEnd);
					updateTime("timeStart", timeStart, inputTimeStart);
				}
			});
		}

		this.annotationXPosInput = document.getElementById("x-pos");
		this.annotationYPosInput = document.getElementById("y-pos");
		this.annotationWidthInput = document.getElementById("an-width");
		this.annotationHeightInput = document.getElementById("an-height");
		const inputs = [
			this.annotationXPosInput, this.annotationYPosInput, 
			this.annotationWidthInput, this.annotationHeightInput
		];

		for (const input of inputs) {
			input.addEventListener("change", e => {
				let prop;
				const inputId = input.getAttribute("id");
				if (inputId === "x-pos") prop = "x";
				else if (inputId === "y-pos") prop = "y";
				else if (inputId === "an-width") prop = "width";
				else if (inputId === "an-height") prop = "height";

				this.setAnnotationProperty(prop, parseInt(e.target.value, 10));
			});
		}

		this.annotationTextInput = document.getElementById("annotation-text");
		this.annotationTextInput.addEventListener("input", e => {
			this.setAnnotationProperty("text", e.target.value);
		});
		this.annotationTextSizeInput = document.getElementById("text-size");

		this.backgroundColorInput = document.getElementById("background-color");
		this.textColorInput = document.getElementById("text-color");

		for (const input of editorElement.querySelectorAll("input, textarea, select")) {
			input.addEventListener("change", this.inputChangeHandler);
		}

		this.saveButton = document.getElementById("save-options");
		this.saveButton.addEventListener("click", e => {
			console.log("yoga", this.currentAnnotationData.timeStart, this._annotationData.timeStart);
			for (const prop in this._annotationData) {
				if (prop !== "_element") {
					this.currentAnnotationData[prop] = this._annotationData[prop];
				}
			}
			this.annotationsTrack.createAnnotationsFromRenderer();
			this.annotationRenderer.updateAllAnnotationSizes();
		});
	}

	setAnnotationProperty(prop, value) {
		if (prop === "type") {
			this.annotationType = value;
		}
		else if (prop === "x") {
			this.annotationXPos = value
		}
		else if (prop === "y") {
			this.annotationYPos = value;
		}
		else if (prop === "width") {
			this.annotationWidth = value;
		}
		else if (prop === "height") {
			this.annotationHeight = value;
		}
		else if (prop === "timeStart") {
			this.annotationTimeStart = value;
		}
		else if (prop === "timeEnd") {
			this.annotationTimeEnd = value;
		}
		else if (prop === "text") {
			this.annotationText = value;
		}
		else if (prop === "bgColor") {
			this.annotationBackgroundColor = value;
		}
		else if (prop === "fgColor") {
			this.annotationTextColor = value;
		}
		else if (prop === "textSize") {
			this.annotationTextSize = value;
		}

		if (prop !== "text") {
			this._annotationData[prop] = value;
		}
		else {
			if (!value) {
				delete this._annotationData["text"];
			}
			else {
				this._annotationData[prop] = value;
			}
		}
		this.annotationCode = this.annotationParser.serializeAnnotation(this.annotationData);
	}

	loadAnnotation(annotationData) {
		this.annotationCode = this.annotationParser.serializeAnnotation(annotationData);
		this.currentAnnotationData = annotationData;
		this._annotationData = {};

		this.annotationTextInput.value = "";
		this.annotationTextSizeInput.value = 0;
		this.backgroundColorInput.value = "#ffffff";
		this.textColorInput.value = "#ffffff";

		for (const prop in annotationData) {
			if (prop !== "_element") {
				this.setAnnotationProperty(prop, annotationData[prop])
			}
		}
	}

	formatSeconds(sec) {
        const minutes = Math.floor(sec / 60);
        const seconds = Math.floor(sec % 60);

        const minPadding = minutes < 10 ? "0" : "";
        const secPadding = seconds < 10 ? "0" : "";

        return `${minPadding}${minutes}:${secPadding}${seconds}`;
    }
    durationToSeconds(formatted) {
    	const parts = formatted.split(":");
    	return (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
    }

	set annotationCode(code) {
		const formatted = code.split(",");
		for (let i = 0; i < formatted.length; i++) {
			formatted[i] = formatted[i].trim();
		}
		this.annotationCodeInput.setAttribute("rows", formatted.length);
		this.annotationCodeInput.value = formatted.join("\n");
	}
	set annotationType(type) {
		const annotationTypes = ["text", "note", "speech", "title", "highlight", "label"]
		if (!annotationTypes.includes(type)) {
			throw new Error(`Invalid annotation type: \"${type}\"`)
		}
		this.annotationTypeInput.value = type;
	}
	set annotationTimeStart(seconds) {
		if (typeof seconds !== "number" || isNaN(seconds)) {
			throw new Error(`Invalid annotation time start: ${seconds}`);
		}
		const timeEnd = this.durationToSeconds(this.annotationTimeEnd);
		this.annotationTimeStartInput.value = this.formatSeconds(seconds);
		// if (seconds >= timeEnd) {
		// 	const errorMessage = `The time that the annotation starts cannot be greater than or equal to the time it ends (${seconds}s to ${timeEnd}s)`;
		// 	this.annotationTimeStartInput.setCustomValidity(errorMessage);
		// 	throw new Error(errorMessage);
		// }
		this.annotationTimeStartInput.setCustomValidity("");
		// this.annotationTimeStartInput.value = this.formatSeconds(seconds);
	}
	set annotationTimeEnd(seconds) {
		if (typeof seconds !== "number" || isNaN(seconds)) {
			throw new Error(`Invalid annotation time end: ${seconds}`);
		}
		const timeStart = this.durationToSeconds(this.annotationTimeStart);
		this.annotationTimeEndInput.value = this.formatSeconds(seconds);
		// if (seconds <= timeStart) {
		// 	const errorMessage = `The time that the annotation ends cannot be less than or equal to the time it starts (${timeStart}s to ${seconds}s)`;
		// 	this.annotationTimeEndInput.setCustomValidity(errorMessage);
		// 	throw new Error(errorMessage);
		// }
		this.annotationTimeEndInput.setCustomValidity("");
		// this.annotationTimeEndInput.value = this.formatSeconds(seconds);
	}
	set annotationXPos(percent) {
		if (typeof percent !== "number" || isNaN(percent) || percent < 0 || percent > 100) {
			throw new Error(`Invalid annotation X position: ${percent}`);
		}
		this.annotationXPosInput.value = percent;
	}
	set annotationYPos(percent) {
		if (typeof percent !== "number" || isNaN(percent) || percent < 0 || percent > 100) {
			throw new Error(`Invalid annotation Y position: ${percent}`);
		}
		this.annotationYPosInput.value = percent;
	}
	set annotationWidth(percent) {
		if (typeof percent !== "number" || isNaN(percent) || percent < 0 || percent > 100) {
			throw new Error(`Invalid annotation width: ${percent}`);
		}
		this.annotationWidthInput.value = percent;
	}
	set annotationHeight(percent) {
		if (typeof percent !== "number" || isNaN(percent) || percent < 0 || percent > 100) {
			throw new Error(`Invalid annotation height: ${percent}`);
		}
		this.annotationHeightInput.value = percent;
	}
	set annotationText(text) {
		this.annotationTextInput.value = text;
	}
	set annotationTextSize(percent) {
		if (typeof percent !== "number" || isNaN(percent) || percent < 0 || percent > 100) {
			throw new Error(`Invalid annotation text size: ${percent}`);
		}
		this.annotationTextSizeInput.value = percent;
	}
	set annotationBackgroundColor(num) {
		if (typeof num !== "number" || isNaN(num)) {
			throw new Error(`Invalid annotation background color: ${num}`);
		}
		const color = "#" + num.toString(16).padStart(6, "0");
		this.backgroundColorInput.value = color;
	}
	set annotationTextColor(num) {
		if (typeof num !== "number" || isNaN(num)) {
			throw new Error(`Invalid annotation text color: ${num}`);
		}
		const color = "#" + num.toString(16).padStart(6, "0");
		this.textColorInput.value = color;
	}

	get annotationData() {
		return this._annotationData;
	}

	get annotationCode() {
		return this.annotationCodeInput.value;
	}
	get annotationType() {
		return this.annotationTypeInput.value;
	}
	get annotationTimeStart() {
		return this.annotationTimeStartInput.value;
	}
	get annotationTimeEnd() {
		return this.annotationTimeEndInput.value;
	}
	get annotationXPos() {
		return this.annotationXPosInput.value;
	}
	get annotationYPos() {
		return this.annotationYPosInput.value;
	}
	get annotationWidth() {
		return this.annotationWidthInput.value;
	}
	get annotationHeight() {
		return this.annotationHeightInput.value;
	}
	get annotationText() {
		return this.annotationTextInput.value;
	}
	get annotationTextSize() {
		return this.annotationTextSizeInput.value;
	}
	get annotationBackgroundColor() {
		return this.backgroundColorInput.value;
	}
	get annotationTextColor() {
		return this.textColorInput.value;
	}

}

customElements.define("props-editor", PropEditor);

// const form = document.getElementById("options-form");

// const p = new AnnotationParser();
// const x = new PropEditor(form, p);

// x.loadAnnotation({"bgColor":16777215,"bgOpacity":0.8,"fgColor":0,"textSize":3.15,"actionType":"url","actionUrl":"https://www.youtube.com/watch?annotation_id=annotation_212768267&ei=ELoxXIj0GoKXkASHuq2oBw&feature=iv&src_vid=l4_P_vHtb5c&v=Av4cP-mAnR4","actionUrlTarget":"current","type":"highlight","x":69.414,"y":0,"width":28.645,"height":8.62,"timeStart":0,"timeEnd":5});
// console.log(x.annotationData);