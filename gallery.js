function load() {
	address = addressInput.value;
	if (address) {
		if (address.startsWith('tz')) {
			showCollectionForTezosAddress(address)
		} else {
			showCollectionForSubjkt(address)
		}
		
	}
}

function showCollectionForSubjkt(subjkt) {
	var url = "https://api.hicdex.com/v1/graphql";
	var payload = {
		"query":"\nquery subjktsQuery($subjkt: String!) {\n  hic_et_nunc_holder(where: { name: {_eq: $subjkt}}) {\n    address\n    name\n    hdao_balance\n    metadata\n  }\n}\n",
		"variables": { "subjkt": address },
		"operationName":"subjktsQuery"
	};
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
	xhr.onreadystatechange = function() {
	    if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
	    	response = JSON.parse(xhr.responseText);
	    	console.log(response);
	    	holder = response['data']['hic_et_nunc_holder'][0];
	    	if (holder) {
	    		showCollectionForTezosAddress(holder['address']);
	    	}
	    }
	}
	xhr.send(JSON.stringify(payload));
}

function showCollectionForTezosAddress(address) {
	var url = "https://api.hicdex.com/v1/graphql";
	var payload = {
		"query":"\nquery collectorGallery($address: String!) {\n  hic_et_nunc_token_holder(where: {holder_id: {_eq: $address}, token: {creator: {address: {_neq: $address}}}, quantity: {_gt: \"0\"}}, order_by: {token_id: desc}) {\n    token {\n      id\n      artifact_uri\n      display_uri\n      thumbnail_uri\n      timestamp\n      mime\n      title\n      description\n      supply\n      token_tags {\n        tag {\n          tag\n        }\n      }\n      creator {\n        address\n      }\n    }\n  }\n}\n",
		"variables": { "address": address },
		"operationName":"collectorGallery"
	};
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
	xhr.onreadystatechange = function() {
	    if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
	    	response = JSON.parse(xhr.responseText);
	    	console.log(response);
	    	nfts = response['data']['hic_et_nunc_token_holder'];
	    	pageNumber = 1;
	    	pageCount = Math.ceil(nfts.length / MAX_PAGE_SIZE);
	    	for (var i = 0; i < prevPageBtns.length; i++) {
				prevPageBtns[i].onclick = showPrev;
			}
			for (var i = 0; i < nextPageBtns.length; i++) {
				nextPageBtns[i].onclick = showNext;
			}
			for (var i = 0; i < pageNumberInputs.length; i++) {
				pageNumberInputs[i].onchange = onPageNumberChanged;
			}
			for (var i = 0; i < pageCountLbls.length; i++) {
				pageCountLbls[i].innerHTML = pageCount;
			}
	    	onHashChanged();
	    }
	}
	xhr.send(JSON.stringify(payload));
}

document.addEventListener("DOMContentLoaded", ready);

function ready() {
	addressInput = document.getElementById('address');
	addressInput.onchange = load;
}


var nfts = [];
var pageNumber = 0;
var pageCount = 0;

var content = document.getElementById('content');
var columns = document.getElementsByClassName('column');
var prevPageBtns = document.getElementsByClassName('prevPage');
var nextPageBtns = document.getElementsByClassName('nextPage');
var pageNumberInputs = document.getElementsByClassName('pageNumber');
var pageCountLbls = document.getElementsByClassName('pageCount');

var MAX_PAGE_SIZE = 50;

var PLACEHOLDER_ID = 'QmNrhZHUaEqxhyLfqoq1mtHSipkWHeT31LNHb1QEbDHgnc';

function contains(string, substring) {
	return string.indexOf(substring) != -1;
}

function show() {
	clear();
	for (var i = 0; i < pageNumberInputs.length; i++) {
		pageNumberInputs[i].value = pageNumber;
	}
	var offset = (pageNumber - 1) * MAX_PAGE_SIZE;
	for (var i = offset, columnIndex = 0; i < Math.min(nfts.length, offset + MAX_PAGE_SIZE); i++) {
		token = nfts[i]['token'];
		var artifactId = getIDfromIPFSurl(token['artifact_uri']);
		var displayId = getIDfromIPFSurl(token['display_uri']);
		var thumbnailId = getIDfromIPFSurl(token['thumbnail_uri']);
		var posterId = displayId || thumbnailId;
		var mime = token['mime'];
		if (contains(mime, 'video')) {
			el = createVideo(artifactId, posterId);
		} else if (contains(mime, 'model')) {
			el = createModelViewer(artifactId, posterId);
		} else if (contains(mime, 'application')) {
			el = createApplication(artifactId, posterId);
		} else if (contains(mime, 'svg+xml')) {
			el = createIFrame(artifactId, posterId);
		} else {
			el = createImage(token, artifactId, posterId);
		}
		columns[columnIndex].appendChild(el);
		columnIndex = (columnIndex + 1) % columns.length;
	}
}

function getIDfromIPFSurl(url) {
	id = url.split("//")[1];
	return id != PLACEHOLDER_ID ? id : null;
}

function createImage(token, artifactId, posterId) {
	mime = token['mime']
	if (contains(mime, 'gif')) {
		id = artifactId || posterId;
	} else {
		id = posterId || artifactId;
	}
	var img = document.createElement("img");
	img.classList.add('nft');
	img.setAttribute('src', "https://cloudflare-ipfs.com/ipfs/" + id);
	//img.addEventListener('error', retrySrcLoad);
	return img;
}

function createIFrame(artifactId, posterId) {
	var div = document.createElement("div");
	id = artifactId || posterId;
	var ifr = document.createElement("iframe");
	ifr.classList.add('nft');
	ifr.setAttribute('src', "https://cloudflare-ipfs.com/ipfs/" + id);
	div.appendChild(ifr);
	return div;
}

function createVideo(artifactId, posterId) {
	var vid = document.createElement("video");
	vid.classList.add('nft');
	vid.setAttribute('playsinline', '');
	vid.setAttribute('loop', '');
	vid.muted = true;
	vid.setAttribute('src', 'https://cloudflare-ipfs.com/ipfs/' + artifactId);
	vid.setAttribute('poster', posterId ? ('https://cloudflare-ipfs.com/ipfs/' + posterId) : '');
	vid.setAttribute('autoplay', '');
	//vid.addEventListener('error', retrySrcLoad);
	return vid;
}

function createModelViewer(artifactId, posterId) {
	var mv = document.createElement("model-viewer");
	mv.classList.add('nft');
	mv.setAttribute('camera-controls', '');
	mv.setAttribute('poster', posterId ? ('https://cloudflare-ipfs.com/ipfs/' + posterId) : '');
	mv.setAttribute('src', 'https://cloudflare-ipfs.com/ipfs/' + artifactId);
	mv.setAttribute('autoplay', 'true');
	mv.setAttribute('auto-rotate', 'true');
	mv.setAttribute('data-js-focus-visible', 'true');
	mv.setAttribute('interaction-prompt', 'none');
	mv.setAttribute('ar-status', 'not-presenting');
	return mv;
}

function createApplication(artifactId, posterId) {
	var img = document.createElement("img");
	img.classList.add('nft');
	img.setAttribute('src', "https://cloudflare-ipfs.com/ipfs/" + posterId);
	//img.addEventListener('error', retrySrcLoad);
	return img;
}

function clear() {
	for (var i = 0; i < columns.length; i++) {
		columns[i].innerHTML = '';
	}
}

function showPrev() {
	console.log("show prev");
	if (pageNumber > 1) {
		pageNumber--;
		window.location.hash = pageNumber;
		show();
	}
}

function showNext() {
	if (pageNumber < pageCount) {
		pageNumber++;
		window.location.hash = pageNumber;
		show();
	}
}

function onPageNumberChanged(event) {
	var value = Number(event.srcElement.value);
	if (value > 0 && value <= pageCount) {
		pageNumber = value;
		window.location.hash = pageNumber;
		show();
	}
}

function onHashChanged() {
	var value = Number(window.location.hash.substr(1));
	console.log("hash changed: " + value);
	if (value > 0 && value <= pageCount) {
		pageNumber = value;
		show();
	} else {
		window.location.hash = pageNumber;
	}
}

function retrySrcLoad(event) {
	img = event.srcElement;
	console.log('retry failed to load ' + img.src);
	url = img.src;
	img.removeAttribute('src');
	siu = setUrl.bind(img, url);
	setTimeout(function() { siu }, 2000);
}

function setUrl(img, url) {
	console.log('setUrl', img, url);
	img.src = url;
}

window.onhashchange = onHashChanged;
