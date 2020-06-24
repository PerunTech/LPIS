package com.prtech.lpis;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class Config {
	/*  */
	private static final Logger log = LogManager.getLogger(Config.class.getName());
	
	static private final Properties properties = loadProperties();

	private static Properties loadProperties () {
		Properties properties = new Properties();
		InputStream is = Config.class.getClassLoader().getResourceAsStream("lpis.properties");
	
		try {
			properties.load(is);
		} catch (IOException e) {
			log.error("Failed loading configuration.");
			log.error(e);
		} finally {
			try {
				if (is != null) 
					is.close();
			} catch (IOException ioe) {
				log.error(ioe);
			}
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
