var fs = require('fs'),
	path = require('path'),
	find = require('find'),
	util = require('util'),
	readfile = util.promisify(fs.readFile),
	readdir = util.promisify(fs.readdir);

var dirs = ['/usr/share/applications', '/usr/local/share/applications', path.join(process.env.HOME, '/.local/share/applications')],
	desktopFiles = [],
	desktopEntries = [];

async function main() {
	for (let i = 0; i < dirs.length; i++) {
		var files = await readdir(dirs[i]);
		files = files.filter(f => f.includes('.desktop'));
		files = files.map(f => `${dirs[i]}/${f}`);
		desktopFiles.push(...files)
	}

	for (let i = 0; i < desktopFiles.length; i++) {
		var data = await readfile(desktopFiles[i]);
		var desktopArea = data.toString().match(/^\[Desktop Entry\](?:(?!^\[[^\]\r\n]+\]).)*/gms)[0];
		var properties = desktopArea.split('\n').filter(e => e.includes('='))

		var entry = {};

		for (let i = 0; i < properties.length; i++) {
			var match = properties[i].split('=');
			entry[match[0]] = match[1];
		}

		desktopEntries.push(entry);
	}
}

function findIcons(iconName, searchDir) {
	var pixmaps = find.fileSync(searchDir);
	var result = pixmaps.filter(i => String(i).toLowerCase().includes(String(iconName).toLowerCase()));
	return result;
}

function rankIcons(iconName) {
	var result = findIcons(iconName, '/usr/share/pixmaps')
	if (result.length != 0) return result[0];

	var result = findIcons(iconName, '/usr/share/icons')
	if (result.length != 0) {
		if (result.length == 1) return result[0];

		var resRegex = /\d{1,4}x\d{1,4}/
		if (result.find(i => i.match(resRegex))) {
			var filter = result.filter(i => i.match(resRegex))
			var filter = filter.sort((a, b) => Number(b.match(/(\d{1,4})x\d{1,4}/)[1]) - Number(a.match(/(\d{1,4})x\d{1,4}/)[1]))
			return filter[0]
		}
		return result
	}
}

function cleanitem(item) {
	var inputItem = item;
	var outputItem = {};

	for (var key in inputItem) {
		if (key.includes('[') && key.includes(']')) {
			var match = key.match(/(.+)\[(.+)\]/);
			var localeKey = `${match[1]}_locale`;
			if (outputItem[localeKey] == undefined) outputItem[localeKey] = {};
			outputItem[localeKey][match[2]] = inputItem[key]
		} else if (inputItem[key].includes(';')) {
			outputItem[key] = inputItem[key].split(';').filter(i => i.length > 0);
		} else if (inputItem[key] == 'true' || inputItem[key] == 'false') {
			outputItem[key] = !!(inputItem[key] == 'true')
		} else if (key == 'Icon') {
			outputItem[key] = rankIcons(inputItem[key]);
		} else {
			outputItem[key] = inputItem[key];
		}
	}

	return outputItem;
}

module.exports = {
	findByExacutable: executableLocation => desktopEntries.find(entry => entry.Exec && executableLocation.includes(entry.Exec)),
	findByCommand: command => desktopEntries.find(entry => entry.Exec && entry.Exec.includes(command)),
	refineEntry: cleanitem,
	indexItems: main
}

