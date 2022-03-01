package com.prtech.lpis;

import org.junit.Test;

import com.prtech.svarog.SvConf;
import com.prtech.svarog.SvException;
import com.prtech.svarog.SvSecurity;
import com.prtech.svarog.SvUtil;
import com.prtech.svarog_common.DbDataArray;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.Assert;

public class ConfigTest {
	private static final Logger log = LogManager.getLogger(Config.class.getName());

	static String getUserSessionIdForTestPurpose() {
		String sessionId = CC.EMPTY_STRING;
		try (@SuppressWarnings("deprecation")
		SvSecurity svc = new SvSecurity();) {
			String userName = "ADMIN";
			String password = "welcome";
			if (SvConf.getParam("conn.string").equals("jdbc:oracle:thin:@192.168.9.60:1521:orclte19")) {
				password = "welcome13";
			}
			sessionId = svc.logon(userName, SvUtil.getMD5(password));
		} catch (Exception e) {
			log.error(e);
		}
		return sessionId;
	}

	@Test
	public void testProjectInfo() {
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
	public void testAccessCard() {
		String icon = Config.getCardIcon();
		String permissionCode = Config.getPermissionCode();
		String label = Config.getCardLabel();
		String order = Config.getCardOrder();

		String url = Config.getJSURL();
		int urlLen = url.length();

		Assert.assertTrue("Frontend card label is not defined, check configuration.", label != null);
		Assert.assertTrue("Frontend card order is not properly defined, check configuration.",
				order != null && Integer.parseInt(order) > 0);
		Assert.assertTrue("Permission code is not properly defined, check configuration.", permissionCode != null);
		Assert.assertTrue("Frontend card icon path is not set, check configuration", icon != null);
		Assert.assertTrue(
				"Frontend js script path is not set, check configuration.\n"
						+ "Without a registered script name, the user will not be able to access the plugin.",
				url != null && url.substring(urlLen - 3, urlLen).equals(".js"));
	}

	public void getAssets() throws SvException {
		ApplicationServices as = new ApplicationServices();

		String token = getUserSessionIdForTestPurpose();
		if (!token.equals(CC.EMPTY_STRING)) {
			DbDataArray rs = as.getAssetsList(token, 673774999L, CC.AGRI_PARCEL);
			log.error(rs.toSimpleJson().toString());
		}
	}

	@Test
	public void testGetVersion() {
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
		System.out.println(properties);
		System.out.println("-----------------------------------------");

		String v = properties.getProperty("version", "1");
		String[] vArr = v.split("\\.");
		for (String s : vArr) {
			System.out.println(s);
		}

		Assert.assertTrue("Pom version property read succesfully ", vArr.length > 1);

		int i = 1;
		if (vArr.length > 1) {
			i = Integer.parseInt(vArr[1]);
		}
		System.out.println(i);

		// Assert.assertTrue("version number have not changed based on pom v second
		// digit ", i > 1);
	}
}
