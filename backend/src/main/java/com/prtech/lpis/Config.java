package com.prtech.lpis;

import java.util.Properties;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class Config {
	/*  */
	private static final Logger log = LogManager.getLogger(Config.class.getName());
	
	static private final Properties properties = loadProperties();

	private static Properties loadProperties () {
		Properties properties = new Properties();
		try {
			properties.load(Config.class.getClassLoader().getResourceAsStream("lpis.properties"));
		} catch (Exception e) {
			log.error("Failed loading configuration.");
			log.error(e);
		}
		
		return properties;
	}
	
	static String getProjectGroup () {
		return properties.getProperty("projectGroup", "");
	}
	
	static String getProjectName () {
		return properties.getProperty("projectName", "lpis");
	}
	
	static String getProjectVersion () {
		return properties.getProperty("version", "1");
	}
	
	static String getDescription () {
		return properties.getProperty("description", "");
	}
}
