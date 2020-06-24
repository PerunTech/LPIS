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
}
