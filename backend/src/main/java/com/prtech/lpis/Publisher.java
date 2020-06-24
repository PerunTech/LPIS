package com.prtech.lpis;

import java.util.HashMap;

import com.google.gson.JsonObject;
import com.prtech.svarog_interfaces.IPerunPlugin;
import com.prtech.svarog_interfaces.ISvCore;

public class Publisher implements IPerunPlugin {

	@Override
	public int getVersion() {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public String getContextName() {
		// TODO Auto-generated method stub
		return null;
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
