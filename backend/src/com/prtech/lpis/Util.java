package com.prtech.lpis;

import java.text.DecimalFormat;
import java.util.List;
import java.util.Map.Entry;

import javax.ws.rs.core.MultivaluedMap;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.joda.time.DateTime;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.prtech.svarog.SvGeometry;
import com.prtech.svarog.SvUtil;
import com.prtech.svarog_common.DbDataObject;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.io.svarog_geojson.GeoJsonReader;
import com.vividsolutions.jts.io.svarog_geojson.GeoJsonWriter;

public class Util {
	private static final Logger log = LogManager.getLogger(Util.class.getName());

	public static Boolean excludeField(String fieldName) {
		if ("PKID".equalsIgnoreCase(fieldName) || "GUI_METADATA".equalsIgnoreCase(fieldName)
				|| "CENTROID".equalsIgnoreCase(fieldName) || "GEOM".equalsIgnoreCase(fieldName)) {
			return false;
		}

		return true;
	}

	public static boolean coversWithTolerance(Geometry g1, Geometry g2, double tolerance) {
		if (g2.getGeometryType().equals(g1.getGeometryType())) {
			Geometry intersection = g2.intersection(g1);
			if (intersection.getGeometryType().equals(g1.getGeometryType())) {
				if (Math.abs(intersection.getArea() - g2.getArea()) < tolerance)

					return true;
			}
		}
		return false;
	}

	public static boolean overlapsWithTolerance(Geometry g1, Geometry g2, double tolerance) {
		if (g2.getGeometryType().equals(g1.getGeometryType())) {
			Geometry intersection = g2.intersection(g1);
			if (intersection.getGeometryType().equals(g1.getGeometryType())) {
				if (Math.abs(intersection.getArea()) > tolerance)
					return true;
			}
		}
		return false;
	}

	public static DbDataObject addValueToDataObject(DbDataObject dbo, String fieldName, DbDataObject fieldObject,
			JsonObject jsonData) {

		String fieldType = fieldObject.getVal("FIELD_TYPE").toString();
		Long scale = (Long) fieldObject.getVal("FIELD_SCALE");
		Gson gson = new Gson();
		JsonObject jsonObjRet = jsonData;
		JsonObject guiMetadata = null;

		try {
			if (fieldObject.getVal("GUI_METADATA") != null) {
				guiMetadata = gson.fromJson(fieldObject.getVal("GUI_METADATA").toString(), JsonObject.class);
			}
		} catch (Exception e) {
			log.debug(e);
		}

		if (guiMetadata != null && guiMetadata.has("react")) {
			JsonObject jsonreactGUI = (JsonObject) guiMetadata.get("react");
			if (jsonreactGUI != null && jsonreactGUI.has("grouppath"))
				jsonObjRet = (JsonObject) jsonData.get(jsonreactGUI.get("grouppath").getAsString());
		}

		if (jsonObjRet != null) {
			if (jsonObjRet.has(fieldName)) {
				switch (fieldType) {
				case "NUMERIC":
					if (scale == null || scale <= 0) {
						Long tmpLong = jsonObjRet.get(fieldName).getAsLong();
						dbo.setVal(fieldName, tmpLong);
					} else {
						Double tmpDouble = jsonObjRet.get(fieldName).getAsDouble();
						dbo.setVal(fieldName, tmpDouble);
					}
					break;
				case "NVARCHAR":
					dbo.setVal(fieldName, jsonObjRet.get(fieldName).getAsString());
					break;
				case "BOOLEAN":
					dbo.setVal(fieldName, jsonObjRet.get(fieldName).getAsBoolean());
					break;
				case "DATE":
					DateTime date = new DateTime(jsonObjRet.get(fieldName).getAsString());
					dbo.setVal(fieldName, date);
					break;
				case "TIMESTAMP":
				case "DATETIME":
					DateTime pickDate = new DateTime(jsonObjRet.get(fieldName).getAsString());
					dbo.setVal(fieldName, pickDate);
					break;
				default:
				}
			} else
				dbo.setVal(fieldName, null);
		}

		return dbo;
	}

	public static JsonObject dataToJson(MultivaluedMap<String, String> data) {
		String formData = "";
		JsonObject json = null;

		try {
			Gson gson = new Gson();
			// handle empty, prep json, create data
			for (Entry<String, List<String>> entry : data.entrySet()) {
				if (entry.getKey() != null && !entry.getKey().isEmpty()) {
					String key = entry.getKey();
					formData = key;
				}
			}

			json = gson.fromJson(formData, JsonObject.class);
		} catch (Exception e) {
			// TODO: handle exception
		}

		return json;
	}

	public static String geometryToJson(Geometry g) {
		GeoJsonWriter gjw = new GeoJsonWriter();
		return gjw.write(g);
	}

	public static Geometry jsonToGeometry(JsonElement el) {
		return jsonToGeometry(el, SvUtil.sdiFactory);
	}

	public static Geometry jsonToGeometry(JsonElement el, GeometryFactory gf) {
		Geometry geom = null;

		try {
			GeoJsonReader gjr = new GeoJsonReader(gf);
			geom = gjr.read(el.toString());

			String polyType = geom.getGeometryType();
			// if ("Polygon".equalsIgnoreCase(polyType))
			// geom = gf.createMultiPolygon(new Polygon[] { (Polygon) geom });
		} catch (Exception e) {
			log.error("Failed parsing geometry. " + e);
		}

		return geom;
	}

	public static void calculateGeometryDerivatives(DbDataObject dbo) {
		Geometry geom = SvGeometry.getGeometry(dbo);
		DecimalFormat df = new DecimalFormat("#.####");

		dbo.setVal("AREA", Double.parseDouble(df.format(geom.getArea()).replace(",", ".")));
		dbo.setVal("PERIMETER", Double.parseDouble(df.format(geom.getLength()).replace(",", ".")));
	}
}
