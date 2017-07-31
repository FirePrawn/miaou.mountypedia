const	http = require('http'),
	url = require('url');

var naming;

// from the jquery-like context of the input page
// build and return the html to send to the clients
function abstract($, line){
	var	$box = $('<div/>').addClass('mountypedia'),
		$abstract = $('<div/>').addClass('abstract'),
		$wikitext = $('#wikitext');
	$box.append(
		$('<a>').attr('href', line).css('text-decoration', 'none')
		.attr('title', "Cliquez ici pour consulter l'article d'origine")
		.append($wikitext.find('h1').first())
	);
	$box.append($('<hr style="clear:both">'));
	$box.append($abstract);
	
	//To avoid duplication and useless content
	$wikitext.find('h1').first().remove();
	$wikitext.find('.rfloat').first().remove();
	$wikitext.find('i').first().remove();
		
	var wholeHTML = $wikitext.html();
	if (line.indexOf('ListeMonstres') !== -1) {
		var id = line.match(/\#(.*)/)[0];
		var $txt = $('<div/>').addClass('txt');
		$abstract.append($txt);
		$txt.append(
			$wikitext.find('p'),
			$('<table>').append(
				$wikitext.find('tr').first(),
				$wikitext.find(id).closest('tr')
			)
		);
	} else {
		$abstract.html(wholeHTML);
	}
	$box.find('a[href]').attr('href', function(_, u){
		return url.resolve(line, u)
	}).attr('target', '_blank');
	$box.find('img').attr('src', function(_, u){
		return url.resolve(line, u)
	});
	$box.append('<div style="clear:both"/>');
	$box.find("script,noscript").remove();
	return $('<div>').append($box).html();
}

exports.init = function(miaou){
	naming = miaou.lib("naming");
	miaou.lib("page-boxers").register({
		name: "Mountypedia",
		pattern: /^\s*https?:\/\/\mountypedia\.mountyhall\.com\/([^ ]+)\s*$/,
		box: abstract
	});
	return miaou.requestTag({
		name: "MountyHall",
		description:
			"https://games.mountyhall.com/mountyhall/Images/Troll_accueil_1.jpg\n"+
			"*[MountyHall](https://www.mountyhall.com) est un jeu de rôles et d'aventures"+
			" en ligne permettant aux participants d'incarner un Troll en quête d'aventures. "+
			"Le jeu se déroule en tour-par-tour d'une durée de 12 heures durant lesquelles"+
			" les joueurs peuvent faire agir leur Troll en dépensant jusqu'à 6 Points d'Actions.*\n"+
			"Donner ce tag à une salle Miaou apporte de nombreuses fonctions liées au jeu MountyHall."
	});
}

function checkURL(args){
	return new Promise(function(resolve, reject){
		var requestURL;
		var encodedArgs = naming.removeDiacritics(args.replace(/\s/g, ''));
		var options = {
			method: 'HEAD',
			hostname: 'mountypedia.mountyhall.com',
			path: '/Mountyhall/'+encodedArgs,
			port: 80,
		};
		http.request(options, function(res){
			if (res.statusCode == 404) {
				encodedArgs = encodedArgs.toLowerCase()
				requestURL = 'http://mountypedia.mountyhall.com/Mountyhall/ListeMonstres#'+encodedArgs;
			} else {
				requestURL = 'http://mountypedia.mountyhall.com/Mountyhall/'+encodedArgs;
			}
			console.log(requestURL);
			resolve(requestURL);
		})
		.on('error', e => {
			console.log('e:', e);
			reject(e);
		})
		.end();
	});
}

async function onCommand(ct){
	var resultURL = await checkURL(ct.args);
	ct.reply('\n'+resultURL);
}

exports.registerCommands = function(cb){
	cb({
		name: 'mounty',
		fun: onCommand,
		help: "affiche la page mountypedia correspondante"+
			" Exemple : `!!mounty Hypnotisme`",
		detailedHelp: "Vous pouvez aussi simplement coller une URL mountypedia "+
			"pour qu'elle soit intégrée pour vous\n"+
			"Exemple: `http://mountypedia.mountyhall.com/Mountyhall/Hypnotisme`"+
			"Cette commande n'est disponible que dans les salles portant le tag [tag:MountyHall]",
		filter: room => room.tags.includes('MountyHall')
	});
}
