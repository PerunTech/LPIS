package com.prtech.lpis;

import java.util.HashMap;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.google.gson.JsonObject;
import com.prtech.svarog_interfaces.IPerunPlugin;
import com.prtech.svarog_interfaces.ISvCore;

public class Publisher implements IPerunPlugin {
	
	private static final Logger log = LogManager.getLogger(Config.class.getName());
	
	/**
	 * This value is used in triggering update of the plugin dbo.
	 *
	 * It is our host responsibility to implement robust maven version comparison,
	 * which is currently absent, until then we provide a fairly gimmicky, but consequentially trivial
	 * value here.
	 * 
	 * @return the first digit of the maven version;
	 */
	@Override
	public int getVersion() {
		int i = 1; // default
		
		try {
			i = Integer.parseInt(Config.getProjectVersion().substring(0, 1));
		} catch (NumberFormatException e) {
			log.error("Failed to parse project version: " + e);
		}
		
		return i;
	}

	@Override
	public String getContextName() {
		return Config.getProjectName();
	}

	@Override
	public String getJsPluginUrl() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public String getIconPath() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public String getLabelCode() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public String getPermissionCode() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public int getSortOrder() {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public JsonObject getMenu(JsonObject existingMenu, ISvCore core) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public boolean replaceMenuOnNew() {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public JsonObject getContextMenu(HashMap<String, String> contextMap, JsonObject existingMenu, ISvCore core) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public boolean replaceContextMenuOnNew() {
		// TODO Auto-generated method stub
		return false;
	}

}
