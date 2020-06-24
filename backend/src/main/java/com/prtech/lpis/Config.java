package com.prtech.lpis;

import java.util.Properties;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class Config {
	/*  */
	private static final Logger log = LogManager.getLogger(Config.class.getName());
	
	private final Properties properties = loadProperties();

	private Properties loadProperties () {
		Properties properties = new Properties();
		try {
			properties.load(this.getClass().getClassLoader().getResourceAsStream("lpis.properties"));
		} catch (Exception e) {
			// TODO: handle exception
		}
		
		return properties;
	}
	
	
}
