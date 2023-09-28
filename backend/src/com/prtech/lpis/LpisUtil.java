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
import com.prtech.spatial.SpatialUtil;
import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvException;
import com.prtech.svarog.SvGeometry;
import com.prtech.svarog.SvUtil;
import com.prtech.svarog_common.DbDataObject;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryCollection;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import com.prtech.svarog_geojson.GeoJsonReader;
import com.prtech.svarog_geojson.GeoJsonWriter;

public class LpisUtil extends SpatialUtil {
	private static final Logger log = LogManager.getLogger(LpisUtil.class.getName());

	public static Boolean excludeField(String fieldName) {
		if ("PKID".equalsIgnoreCase(fieldName) || "GUI_METADATA".equalsIgnoreCase(fieldName)
				|| "CENTROID".equalsIgnoreCase(fieldName) || "GEOM".equalsIgnoreCase(fieldName)) {
			return false;
		}

		return true;
	}

	public static Geometry ensurePolygon(Geometry geom, Geometry location) {
		Geometry bestCandidate = geom instanceof Polygon ? geom : null;
		if (geom instanceof GeometryCollection) {
			for (int i = 0; i < geom.getNumGeometries(); i++) {
				Geometry g = geom.getGeometryN(i);
				if (g instanceof Polygon)
					if (bestCandidate == null || (bestCandidate != null && bestCandidate.getArea() < g.getArea())) {
						if (location == null || (location != null && g.intersects(location)))
							bestCandidate = g;
					}

			}
			
		}
		if (geom.getUserData() != null)
			bestCandidate.setUserData(geom.getUserData());
		return bestCandidate;

	}

	public static Geometry ensurePolygon(Geometry geom) {
		return ensurePolygon(geom, null);

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

	public static boolean coversWithSliverTolerance(Geometry g1, Geometry g2, double minSliverArea,
			double minSliverRatio) {
		if (g2.getGeometryType().equals(g1.getGeometryType())) {
			Geometry outside = g2.difference(g1);
			if ((outside.getArea() > minSliverArea || outside.getArea() > (outside.getLength() * minSliverRatio)))
				return false;
		} else
			return false;
		return true;
	}

	public static boolean overlapsWithTolerance(Geometry g1, Geometry g2, double tolerance) {
		if (g2.getGeometryType().equals(g1.getGeometryType())) {
			Geometry intersection = g2.intersection(g1);
			if (intersection.getDimension() >= 2) {
				if (Math.abs(intersection.getArea()) > tolerance)
					return true;
			}
		}
		return false;
	}

	public static boolean touchesWithTolerance(Geometry g1, Geometry g2, double tolerance) {
		if (g2.getGeometryType().equals(g1.getGeometryType())) {
			Geometry intersection = g2.intersection(g1);
			if (intersection.getDimension() < 2)
				return true;
			if (intersection.getDimension() >= 2) {
				if (Math.abs(intersection.getArea()) < tolerance)
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
