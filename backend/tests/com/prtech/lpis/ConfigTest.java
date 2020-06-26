package com.prtech.lpis;

import org.junit.Test;
import org.junit.Assert;

public class ConfigTest {
	
	@Test
	public void testProjectInfo () {
		String group = Config.getProjectGroup();
		String name = Config.getProjectName();
		String version = Config.getProjectVersion();
		String description = Config.getDescription();
	
		Assert.assertTrue("Project group ID is not defined, check configuration.", group != null);
		Assert.assertTrue("Project description is not defined, check configuration.", description != null);
		Assert.assertTrue("Project description is not defined, check configuration.", version != null);
		Assert.assertTrue("Project name is not defined, check configuration.\n"
				+ "Project name is used as the http context, thus all web assets are requested via an URL that contains this value.\n"
				+ "It evaluates to the maven artifactId.\n"
				+ "Since it is not defined properly, expect nothing to work.", (name != null && name.length() > 1));
	}
	
	@Test
	public void testAccessCard () {
		String icon = Config.getCardIcon();
		String permissionCode = Config.getPermissionCode();
		String label = Config.getCardLabel();
		String order = Config.getCardOrder();
		
		String url = Config.getJSURL();
		int urlLen = url.length();
		
		Assert.assertTrue("Frontend card label is not defined, check configuration.", label != null);
		Assert.assertTrue("Frontend card order is not properly defined, check configuration.", order != null && Integer.parseInt(order) > 0);
		Assert.assertTrue("Permission code is not properly defined, check configuration.", permissionCode != null);
		Assert.assertTrue("Frontend card icon path is not set, check configuration", icon != null);
		Assert.assertTrue(
				"Frontend js script path is not set, check configuration.\n"
				+ "Without a registered script name, the user will not be able to access the plugin.", 
				url != null && url.substring(urlLen -3, urlLen).equals(".js"));
	}
}
