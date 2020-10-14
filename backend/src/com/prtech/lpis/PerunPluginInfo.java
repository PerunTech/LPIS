package com.prtech.lpis;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.google.gson.JsonObject;
import com.prtech.svarog_interfaces.IPerunPlugin;
import com.prtech.svarog_interfaces.ISvCore;

public class PerunPluginInfo implements IPerunPlugin {
	
	private static final Logger log = LogManager.getLogger(PerunPluginInfo.class.getName());
	
	/**
	 * This value is used in triggering update of the plugin dbo.
	 *
	 * It is our host responsibility to implement robust maven version comparison,
	 * which is currently absent, until then we provide a fairly gimmicky,
	 * but consequentially trivial value here.
	 * 
	 * @return The first digit of the Maven version.
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

	/** @return Maven artifactId || "lpis" */
	@Override
	public String getContextName() {
		return Config.getProjectName();
	}

	/** @return Name of the JavaScript bundle. */
	@Override
	public String getJsPluginUrl() {
		return Config.getJSURL();
	}

	/** @return Name of the image asset to be used for icon. */
	@Override
	public String getIconPath() {
		return "/perun/assets/img/modulecards/lpis.jpg";
	}

	/**
	 * Label code to be used for translation purposes. The name of the module
	 * and its description can be fetched through the label code.
	 * 
	 * @return Label code from the table Svarog_Labels.
	 */
	@Override
	public String getLabelCode() {
		return Config.getCardLabel();
	}

	/**
	 * Permission code to be used for authorisation purposes.
	 * 
	 * @return Permission code to be mapped to svarog permissions.
	 */
	@Override
	public String getPermissionCode() {
		return Config.getPermissionCode();
	}

	/**
	 * Numeric value according to which the main menu with modules/plugings will
	 * be sorted
	 * 
	 * @return Numeric sort order.
	 */
	@Override
	public int getSortOrder() {
		return Integer.parseInt(Config.getCardOrder());
	}

	/**
	 * Method to return the JSON object representing the main module menu. This
	 * menu is used to configure the frontend.
	 * 
	 * @param existingMenu
	 *            The existing menu configuration from the database is passed as
	 *            reference
	 * @param core
	 *            The SvCore instance used to validate permissions
	 * 
	 * @return The menu configuration for the plugin
	 */
	@Override
	public JsonObject getMenu(JsonObject existingMenu, ISvCore core) {
		return null;
	}

	/**
	 * If this flag is set to true, svarog use the return value of the
	 * {@link #getMenu(JsonObject)} method to update the menu configuration in
	 * the database (if version update is needed)
	 * 
	 * @return
	 */
	@Override
	public boolean replaceMenuOnNew() {
		return false;
	}

	/**
	 * Method to return the JSON object representing the module context menu.
	 * This menu is used to configure the frontend.
	 * 
	 * @param contextMap
	 *            The map of parameters from the frontend describing the context
	 *            for the menu request
	 * @param existingMenu
	 *            The existing menu configuration from the database is passed as
	 *            reference
	 * @param core
	 *            The SvCore instance used to validate permissions
	 * @return The configuration of the context menu for the plugin
	 */
	@Override
	public JsonObject getContextMenu(HashMap<String, String> contextMap, JsonObject existingMenu, ISvCore core) {
		return null;
	}

	/**
	 * If this flag is set to true, svarog use the return value of the
	 * {@link #getContextMenu(HashMap, JsonObject)} method to update the menu
	 * configuration in the database (if version update is needed)
	 * 
	 * @return
	 */
	@Override
	public boolean replaceContextMenuOnNew() {
		return false;
	}

	@Override
	public List<String> dependencies() {
		List<String> deps = new ArrayList<String>();
		deps.add("spatial");

		return deps;
	}
}
