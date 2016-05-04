shelljs = require('shelljs');
path = require('path');
var buildScriptPath = path.join('platforms', 'android/CordovaLib', 'build.gradle');
shelljs.sed('-i','classpath \'com.android.tools.build:gradle:1.0.0+\'','classpath \'com.android.tools.build:gradle:1.0.0+\' \r\n classpath \'com.uphyca.gradle:gradle-android-aspectj-plugin:0.9.12\'', buildScriptPath);
shelljs.sed('-i','classpath \'com.android.tools.build:gradle:0.14.0+\'','classpath \'com.android.tools.build:gradle:0.14.0+\' \r\n classpath \'com.uphyca.gradle:gradle-android-aspectj-plugin:0.9.12\'', buildScriptPath);
shelljs.sed('-i','classpath \'com.android.tools.build:gradle:0.12.0+\'','classpath \'com.android.tools.build:gradle:0.12.0+\' \r\n classpath \'com.uphyca.gradle:gradle-android-aspectj-plugin:0.9.12\'', buildScriptPath);
shelljs.sed('-i','apply plugin: \'android-library\'','apply plugin: \'android-library\' \r\n apply plugin: \'android-aspectj\'', buildScriptPath);

