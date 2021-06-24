document.addEventListener("DOMContentLoaded", ready);

function ready() {
	addressInput = document.getElementById('address');
	addressInput.onchange = load;
}

function load() {
	address = addressInput.value;
	if (address) {
		if (address.startsWith('tz')) {
			showForTezosAddress(address)
		} else {
			showForSubjkt(address)
		}
		
	}
}

function showForSubjkt(subjkt) {
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
	    		showForTezosAddress(holder['address']);
	    	}
	    }
	}
	xhr.send(JSON.stringify(payload));
}

function showForTezosAddress(address) {
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
	    	var response = JSON.parse(xhr.responseText);
	    	console.log(response);
	    	var nfts = response['data']['hic_et_nunc_token_holder'];
	    	showCreators(nfts);
	    }
	}
	xhr.send(JSON.stringify(payload));
}

var content = document.getElementById('content');
var columns = document.getElementsByClassName('column');

function clear() {
	for (var i = 0; i < columns.length; i++) {
		columns[i].innerHTML = '';
	}
}

function showCreators(nfts) {
	clear();
	var creators = {};
	for (var i = 0; i < nfts.length; i++) {
		var creator = nfts[i]['token']['creator'];
		creators[creator['address']] = creator;
	}
	var widgets = {};
	var i = 0;
	for (var address in creators) {
		var widget = createCreatorWidget(creators[address]);
		columns[i++ % columns.length].appendChild(widget);
		widgets[address] = widget;
	}
	var countTxt = document.getElementById('collected_count');
	countTxt.innerHTML = Object.keys(creators).length;
	for (var address in widgets) {
		showCreatorName(address, widgets[address]);
	}
}

function createCreatorWidget(creator) {
	var w = document.createElement('div');
	var address = creator['address'];
	var a = document.createElement('a');
	a.classList.add('creator-widget');
	a.href = 'https://www.hicetnunc.xyz/tz/' + address;
	var img = document.createElement('img');
	img.src = 'https://services.tzkt.io/v1/avatars/' + address;
	a.appendChild(img);
	var alias = document.createElement('div');
	alias.classList.add('alias');
	alias.innerHTML = address;
	a.appendChild(alias);
	w.appendChild(a);
	return w;
}

function showCreatorName(address, widget) {
	url = 'https://api.tzkt.io/v1/accounts/' + address + '?metadata=true';
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader("Content-type", "application/json");
	xhr.onreadystatechange = function() {
	    if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
	    	var metadata = JSON.parse(xhr.responseText);
	    	if (metadata['alias']) {
		    	widget.getElementsByClassName('alias')[0].innerHTML = metadata['alias'];
		    }
	    }
	}
	xhr.send();
}

