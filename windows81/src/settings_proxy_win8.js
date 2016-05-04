var proxy = require("cordova/exec/proxy");
var plugin_list = require("cordova/plugin_list");

// Fiori URL properties
var fioriURL = null;
var fioriURLSheme = null;
var fioriURLHost = null;
var fioriURLPort = null;

var invalidatedPlugins = [];
var moduleMap = {};

/*
	* Gets the registered module exports by plugin id.
	*/
function getModulesByPluginId(pluginId) {
	for (var metadata in plugin_list.metadata) {
		if (pluginId.search(metadata) != -1) {
			return plugin_list.filter(function (p) {
				return p.id.search(metadata) != -1;
			});
		}
	}

	return null;
}

/*
	* Gets active and inactive plugins.
	*/
function getPlugins(plugins) {
	var activePlugins = [];

	for (var i = 0; i < invalidatedPlugins.length; i++) {
		var invalidatedPlugin = invalidatedPlugins[i];
		var hasPlugin = plugins.some(function (element, index, array) {
			return element.Name == invalidatedPlugin.Name;
		});

		if (!hasPlugin) {
			activePlugins.push(invalidatedPlugin);
		}
	}

	invalidatedPlugins = plugins;

	return { activePlugins: activePlugins, inactivePlugins: invalidatedPlugins };
}

module.exports = {

	setFioriURL: function (win, fail, args) {
		try {
			fioriURL = args[0];

			var parser = document.createElement('a');
			parser.href = fioriURL;
			fioriURLHost = parser.host;
			fioriURLPort = parser.port;
			fioriURLSheme = parser.protocol;

			win && win();
		} catch (ex) {
			console.error("Invalid parameter in setFioriURL - " + ex.message);
			fail && fail();
		}
	},

	invalidateModuleList: function (win, fail, args) {
		try {
			var pluginList = JSON.parse(args[0]);
			var plugins = getPlugins(pluginList);

			var evalStr = "";
			for (var i = 0; i < plugins.inactivePlugins.length; i++) {
				var plugin = plugins.inactivePlugins[i];

				if (!moduleMap[plugin.Name])
					moduleMap[plugin.Name] = { };

				// Remove proxy
				var removedProxy = proxy.remove(plugin.Name);
				if (removedProxy) {
					moduleMap[plugin.Name]['Proxy'] = removedProxy;
				}

				// Remove module exports
				var modules = getModulesByPluginId(plugin.Id);
				if (modules) {
					if (!moduleMap[plugin.Name]['ModuleExports'])
						moduleMap[plugin.Name]['ModuleExports'] = {};

					modules.forEach(function (module) {
						var moduleId = module.id;
						if (cordova.define.moduleMap[moduleId]) {
							moduleMap[plugin.Name]['ModuleExports'][moduleId] = cordova.define.moduleMap[moduleId];
							delete cordova.define.moduleMap[moduleId];
						}
					});
				}

				// Nullify namespace
				var inactiveModules = plugin.JSModule.split(',');
				inactiveModules.forEach(function (name) {
					if (!moduleMap[plugin.Name]['JSModule'])
						moduleMap[plugin.Name]['JSModule'] = {};

					evalStr += "if(typeof " + name + " != 'undefined' && " + name + "){";
					evalStr += "moduleMap['" + plugin.Name + "']['JSModule']['" + name + "'] = " + name + ";";
					evalStr += name + "=null;";
					evalStr += "};";
				});
			}

			for (var i = 0; i < plugins.activePlugins.length; i++) {
				var plugin = plugins.activePlugins[i];

				// Restore proxy
				if (moduleMap[plugin.Name] && moduleMap[plugin.Name].Proxy) {
					proxy.add(plugin.Name, moduleMap[plugin.Name].Proxy);
					delete moduleMap[plugin.Name].Proxy;
				}

				// Restore module exports
				var modules = moduleMap[plugin.Name]['ModuleExports'];
				for (var moduleId in modules) {
					cordova.define.moduleMap[moduleId] = modules[moduleId];
					delete modules[moduleId];
				}

				// Restore namespace
				var activeModules = plugin.JSModule.split(',');
				activeModules.forEach(function (name) {
					evalStr += name + " = moduleMap['" + plugin.Name + "']['JSModule']['" + name + "'];";
				});
			}

			eval(evalStr);

			win && win("Feature vector enforcement completed");
		} catch (ex) {
			fail && fail("Feature vector enforcement failed with exception");
		}
	}

};

proxy.add("SMPSettingsExchangePlugin", module.exports);
