try{
	// Add menu DOM to the top of the page.
	var menuDOM = createMenuDOM();
	// Add rewind DOM to the top of the page.
	var rewindDOM = createRewindDOM();
	// Add bubble to the top of the page.
	var bubbleDOM = createAdaptationDOM();
	document.body.appendChild(bubbleDOM);
	loadBubble();
	formatBubble();
	//Create global variables and resources:
	var currentWord = "";
	var currentModification = [];
	var previousModification = [];
	var currentMousePosition = [];
	var mapContent = loadMapContent();
	var map = createMap(mapContent);
} catch(err){
	alert(err.message);
}

// Lets listen to mouseup DOM events.
document.addEventListener('mouseup', function (e) {
	if (bubbleDOM.style.visibility!='visible' && menuDOM.style.visibility!='visible' && rewindDOM.style.visibility!='visible'){
		//Get selection content:
		var selectionData = window.getSelection();
		var selection = selectionData.toString();
		var range  = selectionData.getRangeAt(0);
		var startc = range.startContainer;
		var prefix = getSelectedPrefix(startc);
		var suffix = getSelectedSuffix(startc);
		//Find immediate Element node:
		var elemnode = startc;
		while (elemnode.nodeType!='1'){
			elemnode = elemnode.parentNode;
		}
		var textc = String(startc.textContent);
		var offset = range.startOffset;
		//Account for spaces before word selected:
		while (textc[offset]==' '){
			offset += 1;
		}
		//Account for half-selected words:
		while (textc[offset-1]!=' ' && offset>0){
			offset -= 1;
		}
		//Get tokens and target token:
		var tokens = textc.split(' ');
		var targetToken = 0;
		var currSize = 0;
		//Find token with respect to offset:
		while (currSize<offset){
			currSize += tokens[targetToken].length + 1;
			targetToken += 1;
		}
		//Find indexes for beginning and ending of sentence containing the target within the node:
		var beg = targetToken;
		while (beg>=0 && tokens[beg]!="."){
			beg = beg-1;
		}
		beg = beg+1;
		var end = targetToken;
		while (end<tokens.length-1 && tokens[end]!="."){
			end = end+1;
		}
		//Create map entry:
		var targetWord = tokens[targetToken];
		currentWord = targetWord;
		var sentence = "";
		var i;
		for (i=beg; i<end; i++){
			sentence += tokens[i] + " ";
		}
		sentence += tokens[end];
		mapentry = targetWord.toLowerCase();
		//var mapentry = sentence+"|||"+targetWord+"|||"+targetToken;
		//Get simplification for context:
		var mapanswer = map[mapentry];
		//If simplification is not null, change HMTL:
		if (map[mapentry]!=null){
			//Create simplified sentence:
			var modifiedSentence = prefix;
			var previousSentence = prefix;
			for (i=0; i<targetToken; i++){
				modifiedSentence += tokens[i] + " ";
				previousSentence += tokens[i] + " ";
			}
			modifiedSentence += "<mark>" + mapanswer + "</mark> ";
			previousSentence += targetWord + " ";
			for (i=targetToken+1; i<tokens.length-1; i++){
				modifiedSentence += tokens[i] + " ";
				previousSentence += tokens[i] + " ";
			}
			if (targetToken<tokens.length-1){
				modifiedSentence += tokens[tokens.length-1] + "";
				previousSentence += tokens[tokens.length-1] + "";
			}
			modifiedSentence += suffix;
			previousSentence += suffix;
			//Save transformation:
			currentModification = [elemnode, modifiedSentence, previousSentence];
			//currentModification = [startc, modifiedSentence];
			//elemnode.innerHTML = modifiedSentence;
			//startc.textContent = modifiedSentence;
		}
		//If the selection has at least one character, show bubble:
		if (selection.length > 0) {
			//Check to see if word is already simplified:
			if(elemnode.nodeName=='MARK'){
				currentMousePosition = [e.clientX, e.pageY];
				renderRewind(e.clientX, e.pageY-rewindDOM.offsetHeight);
			}else{
				currentMousePosition = [e.clientX, e.pageY];
				renderMenu(e.clientX, e.pageY-menuDOM.offsetHeight);
			}
		}
	}
}, false);

// Close the bubble when we click on the screen.
document.addEventListener('keydown', function (e) {
	if (e.keyCode==27){
		closeBubble();
	}
}, false);

//Render menu bubble in the appropriate place:
function renderMenu(mouseX, mouseY) {
	//Place it on screen:
	var finalX = mouseX;
	var finalY = mouseY;
	//Account for horizontal screen boundaries:
	if (finalX+menuDOM.offsetWidth>screen.width){
		finalX = screen.width-menuDOM.offsetWidth;
	}
	//Account for vertical screen boundaries:
	if (finalY<0){
		finalY = 0;
	}
	menuDOM.style.left = finalX + 'px';
	menuDOM.style.top = finalY + 'px';
	//Make it visible:
	menuDOM.style.visibility = 'visible';
}

//Render rewind bubble in the appropriate place:
function renderRewind(mouseX, mouseY) {
	try{
		//Place it on screen:
		var finalX = mouseX;
		var finalY = mouseY;
		//Account for horizontal screen boundaries:
		if (finalX+rewindDOM.offsetWidth>screen.width){
			finalX = screen.width-rewindDOM.offsetWidth;
		}
		//Account for vertical screen boundaries:
		if (finalY<0){
			finalY = 0;
		}
		rewindDOM.style.left = finalX + 'px';
		rewindDOM.style.top = finalY + 'px';
		//Make it visible:
		rewindDOM.style.visibility = 'visible';
	} catch(err){
		alert(err.message);
	}
}

//Render analysis bubble in the appropriate place:
function renderBubble(mouseX, mouseY) {
	//Set intro page of bubble:
	var framec = document.getElementById("framecontainer");
	framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/intro.html")+"></iframe>";
	//Place it on screen:
	var finalX = mouseX;
	var finalY = mouseY;
	//Account for horizontal screen boundaries:
	if (finalX+bubbleDOM.offsetWidth>screen.width){
		finalX = screen.width-bubbleDOM.offsetWidth;
	}
	//Account for vertical screen boundaries:
	if (finalY<0){
		finalY = 0;
	}
	bubbleDOM.style.left = finalX + 'px';
	bubbleDOM.style.top = finalY + 'px';
	//Make it visible:
	bubbleDOM.style.visibility = 'visible';
}

//Reads bubble page and sets its HTML:
function loadBubble(){
	var xhttp;
	if (window.XMLHttpRequest) {
		xhttp = new XMLHttpRequest();
	} else {
		xhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			bubbleDOM.innerHTML = xhttp.responseText;
		}else if(xhttp.readyState == 4){
			alert('An error has occurred while loading SIMPATICO');
		}
	};
	xhttp.open("GET", chrome.extension.getURL("/data/bubble.html"), false);
	xhttp.send();
}

//Loads simplifications from a text file:
function loadMapContent(){
	var xhttp;
	xhttp = new XMLHttpRequest();
	var resptext;
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			resptext = xhttp.responseText;
		}
	};
	xhttp.open("GET", chrome.extension.getURL("/data/simplifications.txt"), false);
	xhttp.send();
	return resptext;
}

//Creates a map of simplifications:
function createMap(content){
	var map = {};
	try {
		var i;
		var lines = String(content);
		lines = lines.split("\n");
		for (i=0; i<lines.length; i++){
			var components = lines[i].split("|||");
			var complex = components[0];
			//var context = components[0]+"|||"+components[1]+"|||"+components[2];
			var replacement = components[1];
			map[complex] = replacement;
		}
	}
	catch(err) {
		alert(err.message);
	}
	return map;
}

//Sets functions and properties of loaded bubble:
function formatBubble(){
	//Set onclick function of wikipedia button:
	bt = document.getElementById('wikibt');
	bt.onclick = showWikipedia;
	//Set onclick function of word definition button:
	bt = document.getElementById('definitionbt');
	bt.onclick = showDefinition;
	//Set onclick function of similar words button:
	bt = document.getElementById('similarbt');
	bt.onclick = showSimilar;
	//Set onclick function of translated words button:
	bt = document.getElementById('translatedbt');
	bt.onclick = showTranslated;
	//Set onclick function of images button:
	bt = document.getElementById('imagebt');
	bt.onclick = showImages;
	//Set onclick function of window closing button:
	bt = document.getElementById('closebt');
	bt.onclick = closeBubble;
	//Set bubble intro page:
	var framec = document.getElementById("framecontainer");
	framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/intro.html")+"></iframe>";
}

//Removes the current selection and hides the menu:
function closeMenu(){
	window.getSelection().removeAllRanges();
	menuDOM.style.visibility = 'hidden';
}

//Removes the current selection and hides the menu:
function closeRewind(){
	window.getSelection().removeAllRanges();
	rewindDOM.style.visibility = 'hidden';
}

//Removes the current selection and hides the bubble:
function closeBubble(){
	window.getSelection().removeAllRanges();
	bubbleDOM.style.visibility = 'hidden';
}

//Acquires the selected word's page in wikipedia and provides the content:
function showWikipedia(){
	//Show loading page:
	var framec = document.getElementById("framecontainer");
	framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/loading_page.html")+"></iframe>";
	//Start querying for definitions in the Merriam Dictionary:
	var query = "https://en.wikipedia.org/w/api.php?action=parse&page="+currentWord+"&contentmodel=wikitext&prop=text&format=json";
	var xhttp;
	xhttp = new XMLHttpRequest();
	var resptext;
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			resptext = JSON.parse(xhttp.responseText);
			presentWikipedia(resptext);
		}else if(xhttp.readyState == 4){
			var framec = document.getElementById("framecontainer");
			framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/wikipedia_error.html")+"></iframe>";
		}
	};
	xhttp.open("GET", query, true);
	xhttp.send();
}

//Acquires the selected word's definition and provides the content:
function showDefinition(){
	//Show loading page:
	var framec = document.getElementById("framecontainer");
	framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/loading_page.html")+"></iframe>";
	//Start querying for definitions in the Merriam Dictionary:
	var query = "http://www.dictionaryapi.com/api/v1/references/collegiate/xml/"+currentWord+"?key=65f439df-0149-4294-bd7f-2d317b3bd00e";
	var xhttp;
	xhttp = new XMLHttpRequest();
	var resptext;
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			resptext = xhttp.responseText;
			presentDefinitions(resptext);
		}else if(xhttp.readyState == 4){
			var framec = document.getElementById("framecontainer");
			framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/definition_error.html")+"></iframe>";
		}
	};
	xhttp.open("GET", query, true);
	xhttp.send();
}

function presentWikipedia(content){
	try{
		var framec = document.getElementById("framecontainer");
		framec.innerHTML = "<div align='center'>"+content["parse"]["text"]["*"]+"</div>";
	}catch(err){
		alert(err.message);
		var framec = document.getElementById("framecontainer");
		framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/definition_error.html")+"></iframe>";
	}
}

function presentDefinitions(content){
	try{
		var parser = new DOMParser();
		var doc = parser.parseFromString(content, "application/xml");
		//Get definition nodes:
		var dts = doc.getElementsByTagName("dt");
		//Create list of definitions:
		var definitions = [];
		var i;
		for (i=0; i<dts.length; i++){
			definitions.push(String(dts[i].textContent));
		}
		//Check to see if there is a definition for the target word:
		if (definitions.length==0){
			var framec = document.getElementById("framecontainer");
			framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/definition_error.html")+"></iframe>";
		}else{
			var framec = document.getElementById("framecontainer");
			framec.innerHTML = produceHTMLDefinitionList(definitions);
		}
	}catch(err){
		alert(err.message);
	}
}

function produceHTMLDefinitionList(definitions){
	var formattedWord = currentWord.toLowerCase();
	var html = "<p class='targetword'><b>"+formattedWord+":</b></p><ul class='worddeflist'>";
	var i;
	for (i=0; i<definitions.length; i++){
		var formattedDef = definitions[i];
		if (formattedDef[0]==':'){
			formattedDef = formattedDef.substr(1);
		}
		formattedDef = formattedDef[0].toUpperCase() + formattedDef.substr(1).toLowerCase();
		if (formattedDef[formattedDef.length-1]!='.'){
			formattedDef = formattedDef + '.';
		}
		html += "<li class='worddefinition'>"+formattedDef+"</li>";
	}
	html += "</ul>"
	return html;
}

function presentSimilar(content){
	try{
		var parser = new DOMParser();
		var doc = parser.parseFromString(content, "application/xml");
		//Get relevant nodes:
		var syns = doc.getElementsByTagName("syn");
		var nears = doc.getElementsByTagName("near");
		//var rels = doc.getElementsByTagName("rel");
		//Create list of synonyms:
		var synonymMap = {};
		var synonyms = [];
		var i;
		for (i=0; i<syns.length; i++){
			var syntext = String(syns[i].textContent).replace(';', ',');
			var units = syntext.split(', ');
			var j;
			for (j=0; j<units.length; j++){
				synonymMap[units[j]] = true;
			}
		}
		for (i=0; i<nears.length; i++){
			var syntext = String(nears[i].textContent).replace(';', ',');
			var units = syntext.split(', ');
			var j;
			for (j=0; j<units.length; j++){
				synonymMap[units[j]] = true;
			}
		}
		try{
			delete synonymMap[currentWord.toLowerCase()];
		}catch(err){}
		var synonym;
		for (synonym in synonymMap){
			synonyms.push(synonym);
		}
		//Check to see if there is a definition for the target word:
		if (synonyms.length==0){
			var framec = document.getElementById("framecontainer");
			framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/similar_error.html")+"></iframe>";
		}else{
			var framec = document.getElementById("framecontainer");
			framec.innerHTML = produceHTMLSimilarList(synonyms);
		}
	}catch(err){
		var framec = document.getElementById("framecontainer");
		framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/similar_error.html")+"></iframe>";
	}
}

//Acquires synonyms and other types of words that relate to the target and provides the content:
function showSimilar(){
	//Show loading page:
	var framec = document.getElementById("framecontainer");
	framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/loading_page.html")+"></iframe>";
	//Start querying for definitions in the Merriam Dictionary:
	var query = "http://www.dictionaryapi.com/api/v1/references/thesaurus/xml/"+currentWord+"?key=c21550b0-418e-4a52-b85c-76587b8fdc2f";
	var xhttp;
	xhttp = new XMLHttpRequest();
	var resptext;
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			resptext = xhttp.responseText;
			presentSimilar(resptext);
		}else if(xhttp.readyState == 4){
			var framec = document.getElementById("framecontainer");
			framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/similar_error.html")+"></iframe>";
		}
	};
	xhttp.open("GET", query, true);
	xhttp.send();
}

function produceHTMLSimilarList(synonyms){
	var formattedWord = currentWord.toLowerCase();
	var html = "<p class='targetword'><b>"+formattedWord+":</b></p><ul class='worddeflist'>";
	var i;
	for (i=0; i<synonyms.length; i++){
		var formattedSyn = synonyms[i];
		formattedSyn = formattedSyn.toLowerCase();
		html += "<li class='worddefinition'>"+formattedSyn+"</li>";
	}
	html += "</ul>"
	return html;
}

//Acquires images of the target word and provides the content:
function showImages(){
	//Show loading page:
	var framec = document.getElementById("framecontainer");
	framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/loading_page.html")+"></iframe>";
	//Start querying for definitions in the Merriam Dictionary:
	var query = "https://api.gettyimages.com/v3/search/images?fields=allowed_use,thumb&phrase="+currentWord;
	var xhttp;
	xhttp = new XMLHttpRequest();
	var resptext;
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			resptext = xhttp.responseText;
			presentImages(resptext);
		}else if(xhttp.readyState == 4){
			var framec = document.getElementById("framecontainer");
			framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/images_error.html")+"></iframe>";
		}
	};
	xhttp.open("GET", query, true);
	xhttp.setRequestHeader("Api-Key", "bja8gp6j9kg6hmwpqv4ht5cm");
	xhttp.send();
}

function produceHTMLImageList(imgurls){
	var formattedWord = currentWord.toLowerCase();
	var html = "<p class='targetword'><b>"+formattedWord+":</b></p>";
	var i;
	for (i=0; i<imgurls.length; i++){
		var imgurl = imgurls[i];
		html += "<img class='targetimage' src='"+imgurl+"'/>";
	}
	return html;
}

function presentImages(content){
	try{
		var imgdata = JSON.parse(content);
		var entries = imgdata['images'];
		//Get relevant nodes:
		var imgurls = [];
		var i;
		for (i=0; i<entries.length; i++){
			var entry = entries[i];
			var display = entry['display_sizes'][0];
			var url = display['uri'];
			imgurls.push(url);
		}
		//Check to see if there is a definition for the target word:
		if (imgurls.length==0){
			var framec = document.getElementById("framecontainer");
			framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/images_error.html")+"></iframe>";
		}else{
			var framec = document.getElementById("framecontainer");
			framec.innerHTML = produceHTMLImageList(imgurls);
		}
	}catch(err){
		var framec = document.getElementById("framecontainer");
		framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/images_error.html")+"></iframe>";
	}
}

//Creates a menu DOM:
function createMenuDOM(){
	//Create new DOM object:
	var newDOM = document.createElement('div');
	newDOM.setAttribute('class', 'menu_bubble');
	newDOM.setAttribute('id', 'menu_div');
	document.body.appendChild(newDOM);
	//Fill it with appropriate HTML:
	var xhttp;
	if (window.XMLHttpRequest) {
		xhttp = new XMLHttpRequest();
	} else {
		xhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			newDOM.innerHTML = xhttp.responseText;
		}else if(xhttp.readyState == 4){
			alert('An error has occurred while loading SIMPATICO');
		}
	};
	xhttp.open("GET", chrome.extension.getURL("/data/menu.html"), false);
	xhttp.send();
	//Set menu image source:
	//var bt = document.getElementById('servicemenuimg');
	//bt.setAttribute('src', chrome.extension.getURL("/data/simpatico_logo.png"));
	//Set menu simplify button image source:
	var bt = document.getElementById('servicesimplifyimg');
	bt.setAttribute('src', chrome.extension.getURL("/data/simplify.png"));
	//Set menu enhance button image source:
	var bt = document.getElementById('serviceenhanceimg');
	bt.setAttribute('src', chrome.extension.getURL("/data/enhance.png"));
	//Set onclick function of simplification button:
	bt = document.getElementById('simplifybt');
	bt.onclick = simplifyWord;
	//Set onclick function of analysis button:
	bt = document.getElementById('analyzebt');
	bt.onclick = analyzeWord;
	//Set onclick function of window closing button:
	bt = document.getElementById('menuclosebt');
	bt.onclick = closeMenu;
	//Return menu DOM:
	return newDOM;
}

//Creates a rewind DOM:
function createRewindDOM(){
	//Create new DOM object:
	var newDOM = document.createElement('div');
	newDOM.setAttribute('class', 'rewind_bubble');
	newDOM.setAttribute('id', 'rewind_div');
	document.body.appendChild(newDOM);
	//Fill it with appropriate HTML:
	var xhttp;
	if (window.XMLHttpRequest) {
		xhttp = new XMLHttpRequest();
	} else {
		xhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			newDOM.innerHTML = xhttp.responseText;
		}else if(xhttp.readyState == 4){
			alert('An error has occurred while loading SIMPATICO');
		}
	};
	xhttp.open("GET", chrome.extension.getURL("/data/rewind.html"), false);
	xhttp.send();
	//Set menu image source:
	//var bt = document.getElementById('rewindmenuimg');
	//bt.setAttribute('src', chrome.extension.getURL("/data/simpatico_logo.png"));
	//Set onclick function of simplification rewind button:
	//Set rewind menu unsimplify button image source:
	var bt = document.getElementById('rewindunsimplifyimg');
	bt.setAttribute('src', chrome.extension.getURL("/data/rewind.png"));
	//Set rewind menu enhance button image source:
	var bt = document.getElementById('rewindenhanceimg');
	bt.setAttribute('src', chrome.extension.getURL("/data/enhance.png"));
	bt = document.getElementById('rewindbt');
	bt.onclick = rewindSimplification;
	//Set onclick function of analysis button:
	bt = document.getElementById('reanalyzebt');
	bt.onclick = reanalyzeWord;
	//Set onclick function of window closing button:
	bt = document.getElementById('rewindclosebt');
	bt.onclick = closeRewind;
	//Return menu DOM:
	return newDOM;
}

//Acquires synonyms and other types of words that relate to the target and provides the content, then translates them:
function showTranslated(){
	//Show loading page:
	var framec = document.getElementById("framecontainer");
	framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/loading_page.html")+"></iframe>";
	//Start querying for definitions in the Merriam Dictionary:
	var query = "http://www.dictionaryapi.com/api/v1/references/thesaurus/xml/"+currentWord+"?key=c21550b0-418e-4a52-b85c-76587b8fdc2f";
	var xhttp;
	xhttp = new XMLHttpRequest();
	var resptext;
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			resptext = xhttp.responseText;
			presentTranslated(resptext);
		}else if(xhttp.readyState == 4){
			var framec = document.getElementById("framecontainer");
			framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/translation_error.html")+"></iframe>";
		}
	};
	xhttp.open("GET", query, true);
	xhttp.send();
}

function presentTranslated(content){
	try{
		var parser = new DOMParser();
		var doc = parser.parseFromString(content, "application/xml");
		//Get relevant nodes:
		var syns = doc.getElementsByTagName("syn");
		var nears = doc.getElementsByTagName("near");
		//Create list of synonyms:
		var synonymMap = {};
		var synonyms = [];
		var i;
		for (i=0; i<syns.length; i++){
			var syntext = String(syns[i].textContent).replace(';', ',');
			var units = syntext.split(', ');
			var j;
			for (j=0; j<units.length; j++){
				synonymMap[units[j]] = true;
			}
		}
		for (i=0; i<nears.length; i++){
			var syntext = String(nears[i].textContent).replace(';', ',');
			var units = syntext.split(', ');
			var j;
			for (j=0; j<units.length; j++){
				synonymMap[units[j]] = true;
			}
		}
		try{
			delete synonymMap[currentWord.toLowerCase()];
		}catch(err){
			alert(err.message);
		}
		var synonym;
		for (synonym in synonymMap){
			synonyms.push(synonym);
		}
		//Get translated synonyms and present them:
		if (synonyms.length>0){
			translateWords(synonyms);
		}else{
			var framec = document.getElementById("framecontainer");
			framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/translation_error.html")+"></iframe>";
		}
	}catch(err){
		var framec = document.getElementById("framecontainer");
		framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/translation_error.html")+"></iframe>";
	}
}

function translateWords(words){
	//Create request for Yandex:
	var yandexreq = "https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20160606T173809Z.74e85f185c13acdf.6ecc9670ee2782570596e24baf237bddd9a33b17&lang=en-it";
	var i;
	for (i=0; i<words.length; i++){
		yandexreq += "&text="+words[i]
	}
	//Request for translations:
	var xhttp;
	xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			translationData = JSON.parse(xhttp.responseText);
			presentTranslatedData(translationData);
		}else if(xhttp.readyState == 4){
			var framec = document.getElementById("framecontainer");
			framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/translation_error.html")+"></iframe>";
		}
	};
	xhttp.open("GET", yandexreq, true);
	xhttp.send();
}

function presentTranslatedData(data){
	//Get translations:
	var translations = [];
	try{
		translations = data['text'];
	}catch(err){
		translations = [];
	}
	//Check to see if there are translations for the target word:
	if (translations.length==0){
		var framec = document.getElementById("framecontainer");
		framec.innerHTML = "<iframe id='mainframe' width='100%' height='100%' src="+chrome.extension.getURL("/data/translation_error.html")+"></iframe>";
	}else{
		var framec = document.getElementById("framecontainer");
		framec.innerHTML = produceHTMLTranslatedList(translations);
	}
}

function produceHTMLTranslatedList(translated){
	var formattedWord = currentWord.toLowerCase();
	var html = "<p class='targetword'><b>"+formattedWord+":</b></p><ul class='worddeflist'>";
	var i;
	for (i=0; i<translated.length; i++){
		var formattedTr = translated[i];
		formattedTr = formattedTr.toLowerCase();
		html += "<li class='worddefinition'>"+formattedTr+"</li>";
	}
	html += "</ul>"
	return html;
}

function simplifyWord(){
	closeMenu();
	closeRewind();
	previousModification = [currentModification[0], currentModification[1], currentModification[2]];
	currentModification[0].innerHTML = currentModification[1];
}

function rewindSimplification(){
	closeRewind();
	previousModification[0].innerHTML = previousModification[2];
}

function analyzeWord(){
	closeMenu();
	renderBubble(currentMousePosition[0], currentMousePosition[1]-bubbleDOM.offsetHeight);
}

function reanalyzeWord(){
	closeRewind();
	renderBubble(currentMousePosition[0], currentMousePosition[1]-bubbleDOM.offsetHeight);
}

function createAdaptationDOM(){
	var newDOM = document.createElement('div');
	newDOM.setAttribute('class', 'selection_bubble');
	newDOM.setAttribute('id', 'selection_div');
	return newDOM;
}

function getSelectedPrefix(node){
	var nodeparent = node.parentNode;
	var parentchildren = nodeparent.childNodes;
	var i;
	var tgti = -1;
	for(i=0; i<parentchildren.length; i+=1){
		var currnode = parentchildren[i];
		if(currnode==node){
			tgti = i;
		}
	}
	var result = '';
	for(i=0; i<tgti; i+=1){
		result += parentchildren[i].textContent;
	}
	return result;
}

function getSelectedSuffix(node){
	var nodeparent = node.parentNode;
	var parentchildren = nodeparent.childNodes;
	var i;
	var tgti = -1;
	for(i=0; i<parentchildren.length; i+=1){
		var currnode = parentchildren[i];
		if(currnode==node){
			tgti = i;
		}
	}
	var result = '';
	for(i=tgti+1; i<parentchildren.length; i+=1){
		result += parentchildren[i].textContent;
	}
	return result;
}