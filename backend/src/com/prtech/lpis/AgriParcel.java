package com.prtech.lpis;

import java.io.IOException;
import java.io.OutputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

import org.apache.logging.log4j.Logger;
import org.joda.time.DateTime;

import com.google.gson.JsonObject;
import com.prtech.spatial.SC;
import com.prtech.spatial.Util;
import com.prtech.spatial.geobuf.GeobufEncoder;
import com.prtech.svarog.Sv;
import com.prtech.svarog.SvConf;
import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvException;
import com.prtech.svarog.SvGeometry;
import com.prtech.svarog.SvParameter;
import com.prtech.svarog.SvReader;
import com.prtech.svarog.SvSDITile;
import com.prtech.svarog.SvUtil;
import com.prtech.svarog.SvWriter;
import com.prtech.svarog.svCONST;
import com.prtech.svarog.SvSDITile.SDIRelation;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_common.DbQueryObject;
import com.prtech.svarog_common.DbSearchCriterion;
import com.prtech.svarog_common.DbSearchExpression;
import com.prtech.svarog_common.ResponseHandler;
import com.prtech.svarog_common.SvCharId;
import com.prtech.svarog_common.DbSearchCriterion.DbCompareOperand;
import com.prtech.svarog_common.ResponseHandler.MessageType;
import com.vividsolutions.jts.algorithm.ConvexHull;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.GeometryCollection;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.LinearRing;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.geom.util.GeometryExtracter;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.io.svarog_geojson.GeoJsonReader;
import com.vividsolutions.jts.operation.polygonize.Polygonizer;

public class AgriParcel {
	private Double maxAngle = SvParameter.getSysParam(Sv.SDI_SPIKE_MAX_ANGLE, Sv.DEFAULT_SPIKE_MAX_ANGLE);
	private Double minPointDistance = SvParameter.getSysParam(Sv.SDI_MIN_POINT_DISTANCE, Sv.DEFAULT_MIN_POINT_DISTANCE);
	private Double mergeTolerance = SvParameter.getSysParam(CC.SDI_MERGE_TOLERANCE, CC.DEFAULT_MERGE_TOLERANCE);
	static final Logger log4j = SvConf.getLogger(AgriParcel.class);

	public AgriParcel() throws SvException {

	}

	private Long getExternalSequence(SvCore svc) throws SvException {
		Long nextId = null;
		PreparedStatement ps = null;
		ResultSet rs = null;
		Connection con = svc.dbGetConn();
		try {
			ps = con.prepareStatement("select " + ApplicationServices.externalIdSequence + ".nextval from DUAL");
			rs = ps.executeQuery();
			if (rs.next())
				nextId = rs.getLong(1);
		} catch (Exception e) {
			throw (new SvException(CC.NO_SEQUENCE, svc.getInstanceUser(), null,
					ApplicationServices.externalIdSequence));
		} finally {
			if (rs != null)
				SvCore.closeResource(rs, svc.getInstanceUser());
			if (ps != null)
				SvCore.closeResource(ps, svc.getInstanceUser());
		}
		return nextId;
	}

	public Geometry mergeParcels(SvGeometry svg, List<Point> points, Long layerTypeId, List<DbDataObject> mergedObjects,
			boolean allowMultiGeometries, SvCharId filterFieldName, Object filterValue, boolean reverseFilter)
			throws SvException {

		if (points.size() < 2)
			throw (new SvException(Sv.Exceptions.SDI_MERGE_REQUIRES_2PLUS, svCONST.systemUser, null, points));

		Geometry result = svg.getRelatedGeometries(points.get(0), layerTypeId, SDIRelation.INTERSECTS, filterFieldName,
				filterValue, reverseFilter, false).iterator().next();

		DbDataObject resultDbo = (DbDataObject) result.getUserData();
		Geometry geomWithTol = result.buffer(mergeTolerance);
		for (int i = 1; i < points.size(); i++) {
			Iterator<Geometry> iterator = svg.getRelatedGeometries(points.get(i), layerTypeId, SDIRelation.INTERSECTS,
					filterFieldName, filterValue, reverseFilter, false).iterator();

			while (iterator.hasNext()) {
				Geometry g = iterator.next();
				if (geomWithTol.disjoint(g))
					throw (new SvException(Sv.Exceptions.SDI_MERGE_GEOM_DISJOINT, svCONST.systemUser, null, g));

				result = mergePolygons((Polygon) result, (Polygon) g);
				if (!mergedObjects.contains(g.getUserData())) {

					if (!result.isValid())
						throw (new SvException(CC.MERGE_GEOM_INVALID, svCONST.systemUser, null, g));
					mergedObjects.add((DbDataObject) g.getUserData());
				}
			}
		}
		result = svg.fixPolygonSpikes(result, maxAngle);
		result.setUserData(resultDbo);
		return result;
	}

	public Geometry generatePolygon(SvGeometry svg, LineString line, Long layerTypeId) throws SvException {

		Polygonizer polygonizer = new Polygonizer();
		polygonizer.add(line);
		Coordinate[] closeLine = new Coordinate[2];
		closeLine[0] = line.getEndPoint().getCoordinate();
		closeLine[1] = line.getStartPoint().getCoordinate();
		LineString ls = SvUtil.sdiFactory.createLineString(closeLine);
		polygonizer.add(ls);
		Geometry tmpResult = null;
		Iterator<Polygon> polys = polygonizer.getPolygons().iterator();
		if (polys.hasNext())
			tmpResult = polys.next();
		else
			throw (new SvException(CC.GEOM_INVALID, svCONST.systemUser, null, line));

		Collection<Geometry> gg = svg.getRelatedGeometries(tmpResult, layerTypeId, SDIRelation.INTERSECTS, null, null,
				false, false);

		Iterator<Geometry> iterator = gg.iterator();
		while (iterator.hasNext()) {
			tmpResult = mergePolygons((Polygon) tmpResult, (Polygon) iterator.next());
		}
		tmpResult = ensurePolygon(tmpResult);
		tmpResult = SvUtil.sdiFactory.createPolygon(((Polygon) tmpResult).getExteriorRing().getCoordinates());

		Iterator<Geometry> itdiff = gg.iterator();
		while (itdiff.hasNext()) {
			tmpResult = tmpResult.difference(itdiff.next());
		}
		tmpResult = ensurePolygon(tmpResult);
		return tmpResult;
	}

	Polygon mergePolygons(Polygon g1, Polygon g2) throws SvException {
		Geometry result = g1.union(g2);
		if (result.getGeometryType().equals("Polygon"))
			return (Polygon) result;

		// get the buffer zone as overlap of the intersection of the two buffered geoms
		Geometry buffer = g1.buffer(mergeTolerance).intersection(g2.buffer(mergeTolerance));
		// intersection the buffer with the original geoms will give us minimal set of
		// points for convex hull
		Geometry cvh = buffer.intersection(g1).union(buffer.intersection(g2));
		ConvexHull ch = new ConvexHull(cvh);
		Geometry gapFill = ch.getConvexHull();
		result = g1.union(gapFill).union(g2);

		if (!result.getGeometryType().equals("Polygon"))
			throw (new SvException(CC.MERGE_EXCEPTION, svCONST.systemUser, null, result));

		return (Polygon) result;

	}

	public Geometry mergeGeometryConfirm(SvGeometry svg, @PathParam("objectName") final String objectName,
			@PathParam("parentId") final Long parentId, LineString lineString, boolean autoCommit) throws SvException {
		Set<Geometry> result = new HashSet<Geometry>();
		ArrayList<Point> p = new ArrayList<>();
		for (Coordinate c : lineString.getCoordinates())
			p.add(SvUtil.sdiFactory.createPoint(c));
		Long layerTypeId = SvCore.getTypeIdByName(objectName);

		List<DbDataObject> toBeDeleted = new ArrayList<DbDataObject>();
		AgriParcel ap = new AgriParcel();
		Geometry merge = ap.mergeParcels(svg, p, layerTypeId, toBeDeleted, false, SC.PARENT_ID, parentId, false);
		result.add(merge);
		splitMergeGeometryDbUpdate(svg, result, toBeDeleted, autoCommit);
		return merge;

	}

	public void deleteGeometry(SvWriter svw, DbDataArray dba, boolean autoCommit) throws SvException {
		for (DbDataObject dbo : dba.getItems()) {
			Geometry gTile = SvGeometry.getTileGeometry(SvGeometry.getCentroid(dbo));
			SvSDITile svTile = SvGeometry.getTile(dbo.getObjectType(), (String) gTile.getUserData(), null);
			svTile.setIsTileDirty(true);
		}
		svw.deleteObjects(dba, false, false, autoCommit);
	}

	/**
	 * Method which accepts list of new geometries, which are result of merge or
	 * split, and list of old geometries from the same operation, which should be
	 * deleted
	 * 
	 * @param newGeometries     The list of resulting geometries
	 * @param deletedGeometries The list of transformed/deleted geometries
	 * @param autoCommit        If true, the method will commit to the database
	 * @throws SvException Any underlying exception from the svarog core
	 */
	public void splitMergeGeometryDbUpdate(SvGeometry svg, Set<Geometry> newGeometries,
			List<DbDataObject> deletedGeometries, boolean autoCommit) throws SvException {
		try (SvWriter svw = new SvWriter(svg)) {
			DbDataObject dbo = null;
			// delete the others

			DbDataArray dba = new DbDataArray();
			dba.setItems((ArrayList) deletedGeometries);
			deleteGeometry(svw, dba, false);
			// svw.deleteObjects(dba, false, false, false);

			DbDataArray newDba = new DbDataArray();
			for (Geometry g : newGeometries) {
				dbo = (DbDataObject) g.getUserData();
				SvGeometry.setGeometry(dbo, autoFixPoly(svg, g, 2));
				newDba.addDataItem(dbo);
			}

			svg.saveGeometry(newDba, true, false);

			if (autoCommit)
				svg.dbCommit();
		}

	}

	public Collection<Geometry> overlappedNeighbours(SvGeometry svg, Geometry geom, Long parentId, Long typeId)
			throws SvException {
		// Perform check if our parcel crosses with neighbouring parcels.
		Collection<Geometry> neighbourAP = svg.getRelatedGeometries(geom, typeId, SDIRelation.INTERSECTS, null, null,
				true, true, true);

		List<Geometry> gl = new ArrayList<Geometry>();
		Iterator<Geometry> gi = neighbourAP.iterator();
		while (gi.hasNext()) {
			Geometry ng = gi.next();
			DbDataObject dbo = (DbDataObject) ng.getUserData();
			if ((com.prtech.lpis.LpisUtil.overlapsWithTolerance(ng, geom, 0.01))
					&& !dbo.getParentId().equals(parentId)) {
				gl.add(ng);
			}
		}
		return gl;
	}

	public Collection<Geometry> touchingNeighbours(SvGeometry svg, Geometry geom, Long parentId, Long typeId)
			throws SvException {
		// Perform check if our parcel crosses with neighbouring parcels.
		Collection<Geometry> neighbourAP = svg.getRelatedGeometries(geom, typeId, SDIRelation.INTERSECTS, null, null,
				true, true, true);

		List<Geometry> gl = new ArrayList<Geometry>();
		Iterator<Geometry> gi = neighbourAP.iterator();
		while (gi.hasNext()) {
			Geometry ng = gi.next();
			DbDataObject dbo = (DbDataObject) ng.getUserData();
			if ((com.prtech.lpis.LpisUtil.touchesWithTolerance(ng, geom, 0.01))
					&& !dbo.getParentId().equals(parentId)) {
				gl.add(ng);
			}
		}
		return gl;
	}

	public boolean overlapsNeighbours(SvGeometry svg, Geometry geom, Long parentId) throws SvException {
		// Perform check if our parcel crosses with neighbouring parcels.
		return overlappedNeighbours(svg, geom, parentId, SvCore.getTypeIdByName("AGRI_PARCEL")).size() > 0;

	}

	/**
	 * Method to return all blocks intersecting a parcel
	 * 
	 * @param svg
	 * @param gp
	 * @return
	 * @throws SvException
	 * @throws SQLException
	 * @throws ParseException
	 */
	public Collection<Geometry> getPBIntersections(SvGeometry svg, Geometry gp)
			throws SvException, SQLException, ParseException {
		Collection<Geometry> gg = (new ApplicationServices()).getPhysicalBlock(svg, gp.getEnvelopeInternal(),
				"ext_lpis.ilpis", "geometry");
		Iterator<Geometry> i = gg.iterator();
		while (i.hasNext()) {
			Geometry g = i.next();
			if (!LpisUtil.overlapsWithTolerance(g, gp, 0.01))
				i.remove();
		}

		return gg;
	}

	/**
	 * Method to align a new parcel against the physical block
	 * 
	 * @param svg
	 * @param parcel
	 * @param cutPB
	 * @return
	 * @throws SvException
	 * @throws SQLException
	 * @throws ParseException
	 */
	public Geometry parcelPBAlignment(SvGeometry svg, DbDataObject parcel, int cutPB)
			throws SvException, SQLException, ParseException {
		Geometry geom = SvGeometry.getGeometry(parcel);
		Geometry selectedPb = null;
		Collection<Geometry> gg = this.getPBIntersections(svg, geom);
		if (cutPB == 0) {
			Geometry tmpGeom = null;
			for (Geometry pb : gg) {
				if (com.prtech.lpis.LpisUtil.overlapsWithTolerance(pb, geom, 0.01)) {
					Geometry g = geom.intersection(pb);
					if (tmpGeom == null || g.getArea() > tmpGeom.getArea()) {
						tmpGeom = g;
						selectedPb = pb;
					}
				}
			}
			geom = ensurePolygon(tmpGeom);
			SvGeometry.setGeometry(parcel, geom);
		} else if (cutPB >= 1) {
			Boolean isInsiderPB = false;
			for (Geometry pb : gg) {
				if (com.prtech.lpis.LpisUtil.coversWithTolerance(pb, geom, 0.01)) {
					isInsiderPB = true;
					selectedPb = pb;
					break;
				}
			}

			parcel.setVal(CC.HAS_OVERLAP_PB, !isInsiderPB);
		}
		return selectedPb;
	}

	public Geometry parcelNBAlignment(SvGeometry svg, DbDataObject parcel, int alignNB, Geometry currentBlock,
			Collection<Geometry> alreadAligned) throws SvException {
		Geometry geom = SvGeometry.getGeometry(parcel);
		Geometry bufferedAP = geom.buffer(mergeTolerance);

		Collection<Geometry> neighboursNearBy = this.overlappedNeighbours(svg, bufferedAP, parcel.getParentId(),
				SvCore.getTypeIdByName(CC.AGRI_PARCEL));
		// remove the previously aligned ones
		neighboursNearBy.removeAll(alreadAligned);

		if (alignNB == 0) {
			for (Geometry nap : neighboursNearBy) {
				// get the buffer zone as overlap of the intersection of the two buffered geoms
				ArrayList<Geometry> gg = new ArrayList<>();
				Geometry buffer = geom.buffer(mergeTolerance).intersection(nap.buffer(mergeTolerance));
				// intersection the buffer with the original geoms will give us minimal set of
				// points for convex hull
				gg.add(buffer.intersection(geom));
				gg.add(buffer.intersection(nap));
				Geometry cvh = SvUtil.sdiFactory.createGeometryCollection(gg.toArray(new Geometry[gg.size()]));
				ConvexHull ch = new ConvexHull(cvh);
				Geometry gapFill = ch.getConvexHull();
				geom = geom.union(gapFill).difference(nap);
			}

		} else if (alignNB == 1) {
			for (Geometry nap : neighboursNearBy) {
				Geometry alignOn = nap.buffer(mergeTolerance);
				geom = geom.difference(alignOn);
			}
		}
		SvGeometry.setGeometry(parcel, geom);
		return geom;
	}

	public Geometry parcelAlignment(SvGeometry svg, DbDataObject parcel, int cutPB, int cutAP, int alignNB,
			DbDataArray result) throws SvException, SQLException, ParseException {
		Long typeId = SvCore.getTypeIdByName(CC.AGRI_PARCEL);
		Geometry currentBlock = parcelPBAlignment(svg, parcel, cutPB);
		Geometry geom = SvGeometry.getGeometry(parcel);
		Collection<Geometry> neighbours = this.overlappedNeighbours(svg, geom, parcel.getParentId(), typeId);
		if (cutAP == 0) {
			for (Geometry nap : neighbours) {
				if (nap.overlaps(geom))
					geom = geom.difference(nap);
			}
			geom = ensurePolygon(geom);
			SvGeometry.setGeometry(parcel, geom);
			if (parcel.getVal(CC.HAS_OVERLAP) != null && (boolean) parcel.getVal(CC.HAS_OVERLAP))
				result.setItems(removeOverlaps(svg, parcel).getItems());
		}

		geom = parcelNBAlignment(svg, parcel, alignNB, currentBlock, neighbours);

		geom.setUserData(parcel);
		return geom;
	}

	public void saveAgriParcel(SvCore core, Long objectId, Long parentId, int cutPB, int cutAP, int alignNB,
			JsonObject metadata, boolean autoCommit) throws SvException, SQLException, ParseException {
		DbDataObject ap = null;
		DbDataArray result = new DbDataArray();
		try (SvReader svr = new SvReader(core); SvGeometry svg = new SvGeometry(svr);) {

			svr.setIncludeGeometries(true);
			ap = new DbDataObject();
			DbDataArray parcelsToSave = new DbDataArray();
			Geometry geom = null;
			Long typeId = SvCore.getTypeIdByName(CC.AGRI_PARCEL);
			DbDataArray fieldSet = SvCore.getFields(typeId);
			boolean isUpdate = objectId.compareTo(0L) > 0 ? true : false;

			geom = Util.jsonToGeometry(metadata.get(Sv.GEOM));
			if (geom.getGeometryType().equals("LineString"))
				geom = generatePolygon(svg, (LineString) geom, typeId);

			if (isUpdate) {
				ap = svr.getObjectById(objectId, typeId, null);
			} else {
				ap.setObjectId(0L);
				ap.setObjectType(typeId);
				ap.setParentId(parentId);
			}
			// prepare the geometry for further processing
			isUpdate = (new com.prtech.spatial.ApplicationServices()).prepareGeometry(geom, ap, svg, true);
			// prevent farm overlaps
			geom = preventFarmOverlap(svr, ap);
			SvGeometry.setGeometry(ap, geom);

			// Map form values to dbo fields
			for (DbDataObject field : fieldSet.getItems()) {
				String fieldName = field.getVal(Sv.FIELD_NAME).toString();
				if (Util.excludeField(fieldName) && !"".equalsIgnoreCase(field.getVal(Sv.FIELD_TYPE).toString())) {
					ap = Util.addValueToDataObject(ap, fieldName, field, metadata);
				}
			}
			if (ap.getObjectId().equals(0L))
				ap.setVal(CC.OLD_ID, null);
			Collection<Geometry> neighbours = this.overlappedNeighbours(svg, geom, ap.getParentId(), typeId);
			geom = parcelAlignment(svg, ap, cutPB, cutAP, alignNB, result);
			// check minimum parcel size
			if (geom.getArea() < ApplicationServices.minimumAgriParcelSize)
				throw (new SvException(CC.PARCEL_LESS_THAN_MINIMUM, svg.getInstanceUser(), ap,
						ApplicationServices.minimumAgriParcelSize));

			if (ap.getVal(CC.OLD_ID) == null) {
				Long extId = getExternalSequence(svr);
				ap.setVal(CC.OLD_ID, extId);
			}
			svg.setAutoCommit(false);
			Util.calculateGeometryDerivatives(ap);

			geom = autoFixPoly(svg, geom, 2);

			if (geom.isSimple() && geom.isValid() && !geom.isEmpty()) {
				Geometry negativeTest = geom.buffer(-1.0);
				if (!negativeTest.isSimple() || !negativeTest.isValid() || negativeTest.isEmpty())
					throw (new SvException(CC.GEOM_INVALID, svr.getInstanceUser()));

			}

			SvGeometry.setGeometry(ap, geom);
			ap.setVal(CC.ALLOWED_AREA, geom.getArea());
			result.addDataItem(ap);
			svg.saveGeometry(result);

			if (cutAP == 1)
				createOverlaps(svg, ap, typeId, neighbours);
			if (autoCommit)
				svg.dbCommit();
		}
	}

	private Geometry autoFixPoly(SvGeometry svg, Geometry geom, int numberOfRepeats) throws SvException {

		boolean hasSpikes = true;
		Object userDate = geom.getUserData();
		for (int i = 0; i < numberOfRepeats; i++) {
			while (hasSpikes) {
				try {
					svg.testPolygonSpikes(geom, maxAngle);
					hasSpikes = false;
				} catch (SvException e) {
					if (e.getLabelCode().equals(Sv.Exceptions.SDI_SPIKE_DETECTED)) {
						geom = svg.fixPolygonSpikes(geom, maxAngle);
					}
				}
			}
			geom = svg.fixMinVertexDistance(geom, minPointDistance);
			hasSpikes = true;
		}
		geom.setUserData(userDate);
		return geom;

	}

	private Geometry ensurePolygon(Geometry geom) {
		Geometry bestCandidate = geom instanceof Polygon ? geom : null;
		if (geom instanceof GeometryCollection) {
			for (int i = 0; i < geom.getNumGeometries(); i++) {
				Geometry g = geom.getGeometryN(i);
				if (g instanceof Polygon)
					if (bestCandidate == null || (bestCandidate != null && bestCandidate.getArea() < g.getArea()))
						bestCandidate = g;

			}
		}
		return bestCandidate;

	}

	private Geometry preventFarmOverlap(SvReader svr, DbDataObject parcel) throws SvException {
		DbDataArray assets = getAssetsList(svr, parcel.getParentId(), CC.AGRI_PARCEL);
		Geometry g = SvGeometry.getGeometry(parcel);
		for (DbDataObject dbo : assets.getItems()) {
			Geometry other = SvGeometry.getGeometry(dbo);
			DbDataObject d = (DbDataObject) other.getUserData();
			if (parcel.getObjectId().equals(d.getObjectId()))
				continue;
			if (LpisUtil.overlapsWithTolerance(g, other, 0.01))// TODO
				g = g.difference(other);
		}
		g.setUserData(parcel);
		return g;
	}

	/**
	 * Method to get all assets by parent/farm
	 * 
	 * @param svr      The reader which is used for the session
	 * @param objectId The object id of the farm
	 * @param typeName The type name of the assets
	 * @return
	 * @throws SvException
	 */
	DbDataArray getAssetsList(SvReader svr, Long objectId, String typeName) throws SvException {
		DbDataArray result = new DbDataArray();

		// Filter for campaign year and geometry not null, when cp is requested.
		if (typeName.equalsIgnoreCase("LAND_USE_PLAN")) {
			svr.setIncludeGeometries(true);
			DbDataArray dbArr = svr.getObjectsByParentId(objectId, SvCore.getTypeIdByName(typeName), null);
			for (DbDataObject dbo : dbArr.getItems()) {
				String cYear = (String) dbo.getVal("CAMPAIGN_YEAR");
				String now = String.valueOf(new DateTime().year().get());
				Geometry g = SvGeometry.getGeometry(dbo);

				if (cYear != null && cYear.equals(now) && g != null) {
					result.addDataItem(dbo);
				}
			}
		} else if (typeName.equalsIgnoreCase(CC.AGRI_PARCEL)) {
			result = new Reader(svr).getParcels(objectId, null, true);

		} else if (typeName.equalsIgnoreCase(CC.LP_CAD_INTERSECTIONS)) {
			result = new Reader(svr).getParcels(objectId, null, true, true);

		}

		return result;

	}

	DbDataObject getOverlapDbo(DbDataArray existingOverlaps, DbDataObject agriParcel, DbDataObject relatedParcel)
			throws SvException {
		DbDataObject overlapDbo = null;
		Iterator<DbDataObject> it = existingOverlaps.getItems().iterator();
		while (it.hasNext()) {
			DbDataObject existingOvr = it.next();
			if (existingOvr.getVal(CC.FARM_ID1).equals(relatedParcel.getParentId())
					&& existingOvr.getVal(CC.PARCEL_ID1).equals(relatedParcel.getObjectId())) {
				overlapDbo = existingOvr;
				it.remove();
				break;
			}
			if (existingOvr.getVal(CC.FARM_ID2).equals(relatedParcel.getParentId())
					&& existingOvr.getVal(CC.PARCEL_ID2).equals(relatedParcel.getObjectId())) {
				overlapDbo = existingOvr;
				it.remove();
				break;
			}
		}
		if (overlapDbo == null) {
			overlapDbo = new DbDataObject(SvCore.getTypeIdByName(CC.AGRI_PARCEL_OVERLAP));
			overlapDbo.setVal(CC.FARM_ID1, agriParcel.getParentId());
			overlapDbo.setVal(CC.PARCEL_ID1, agriParcel.getObjectId());
			overlapDbo.setVal(CC.FARM_ID2, relatedParcel.getParentId());
			overlapDbo.setVal(CC.PARCEL_ID2, relatedParcel.getObjectId());
		}
		return overlapDbo;
	}

	private DbDataObject updateOverlap(SvCore svg, DbDataObject agriParcel, Geometry related,
			DbDataArray existingOverlaps, DbDataArray overlapParcels) throws SvException {
		Geometry geom = SvGeometry.getGeometry(agriParcel);

		List gl = GeometryExtracter.extract(geom.intersection(related), Polygon.class);
		Geometry overlap = null;
		if (gl.size() > 0)
			overlap = SvUtil.sdiFactory.buildGeometry(gl);

		DbDataObject relatedParcel = (DbDataObject) related.getUserData();
		if (overlap == null || overlap.getArea() < ApplicationServices.minimumAgriParcelSize)
			throw (new SvException(CC.OVERLAP_LESS_THAN_MINIMUM, svg.getInstanceUser(), relatedParcel, overlap));
		DbDataObject overlapDbo = getOverlapDbo(existingOverlaps, agriParcel, relatedParcel);
		SvGeometry.setGeometry(overlapDbo, overlap);
		Util.calculateGeometryDerivatives(overlapDbo);
		relatedParcel.setVal(CC.HAS_OVERLAP, true);
		relatedParcel.setVal(CC.ALLOWED_AREA, related.getArea() - overlap.getArea());
		overlapParcels.addDataItem(relatedParcel);
		return overlapDbo;
	}

	DbDataArray searchParcelBySIZP(SvReader svr, Long sizpId) throws SvException {
		svr.setIncludeGeometries(true);
		DbSearchCriterion dbc = new DbSearchCriterion(CC.OLD_ID, DbCompareOperand.EQUAL, sizpId);
		DbQueryObject dbq = new DbQueryObject(SvCore.getDbtByName(CC.AGRI_PARCEL), dbc, null, null);
		DbDataArray dba = svr.getObjects(dbq, null, null);
		return dba;
	}

	private void createOverlaps(SvGeometry svg, DbDataObject agriParcel, Long typeId,
			Collection<Geometry> intersections) throws SvException {
		DbDataArray overlapDbos = new DbDataArray();
		DbDataArray overlapParcels = new DbDataArray();
		// get any existing overlaps we need to update
		DbDataArray existingOverlaps = getOverlaps(svg, agriParcel);
		Geometry geom = SvGeometry.getGeometry(agriParcel);
		DbDataArray assets = null;
		try (SvReader svr = new SvReader(svg)) {
			assets = getAssetsList(svr, agriParcel.getParentId(), CC.AGRI_PARCEL);
			assets.rebuildIndex("OBJECT_ID", true);
		}

		double overlapArea = 0;
		for (Geometry related : intersections) {
			DbDataObject relatedDbo = (DbDataObject) related.getUserData();
			if (assets.getItemByIdx(relatedDbo.getObjectId().toString()) != null)
				continue;
			DbDataObject overlapDbo = updateOverlap(svg, agriParcel, related, existingOverlaps, overlapParcels);
			overlapArea = +SvGeometry.getGeometry(overlapDbo).getArea();
			overlapDbos.addDataItem(overlapDbo);
		}
		svg.setAutoCommit(false);
		svg.setSkipSpatialValidations(true);
		svg.saveGeometry(overlapDbos);
		svg.saveGeometry(overlapParcels);
		if (existingOverlaps.size() > 0)
			try (SvWriter svw = new SvWriter(svg)) {
				svw.deleteObjects(existingOverlaps);
			}

		if (overlapDbos.size() > 0) {
			agriParcel.setVal(CC.HAS_OVERLAP, true);
			agriParcel.setVal(CC.ALLOWED_AREA, geom.getArea() - overlapArea);
			svg.saveGeometry(agriParcel);
		}

	};

	DbDataArray getOverlaps(SvCore svg, DbDataObject ap) throws SvException {
		try (SvReader svr = new SvReader(svg);) {
			DbSearchExpression dbs = new DbSearchExpression();
			dbs.setNextCritOperand("OR");
			dbs.addDbSearchItem(new DbSearchCriterion(CC.FARM_ID1, DbCompareOperand.EQUAL, ap.getParentId()));
			dbs.addDbSearchItem(new DbSearchCriterion(CC.PARCEL_ID1, DbCompareOperand.EQUAL, ap.getObjectId()));
			DbSearchExpression dbs2 = new DbSearchExpression();
			dbs2.addDbSearchItem(new DbSearchCriterion(CC.FARM_ID2, DbCompareOperand.EQUAL, ap.getParentId()));
			dbs2.addDbSearchItem(new DbSearchCriterion(CC.PARCEL_ID2, DbCompareOperand.EQUAL, ap.getObjectId()));
			DbSearchExpression dbx = new DbSearchExpression();
			dbx.addDbSearchItem(dbs);
			dbx.addDbSearchItem(dbs2);
			return svr.getObjects(dbx, SvCore.getTypeIdByName(CC.AGRI_PARCEL_OVERLAP), null, null, null);
		}
	}

	DbDataArray removeOverlaps(SvGeometry svg, DbDataObject ap) throws SvException {
		DbDataArray updatedParcels = new DbDataArray();
		try (SvWriter svw = new SvWriter(svg); SvReader svr = new SvReader(svg)) {
			DbDataArray overlaps = getOverlaps(svg, ap);
			svr.setIncludeGeometries(true);
			if (overlaps.size() > 0) {
				svw.setAutoCommit(false);
				svw.deleteObjects(overlaps);
				for (DbDataObject ovr : overlaps.getItems()) {
					Long otherParcelId;
					if (ovr.getVal(CC.PARCEL_ID1).equals(ap.getObjectId()))
						otherParcelId = (Long) ovr.getVal(CC.PARCEL_ID2);
					else
						otherParcelId = (Long) ovr.getVal(CC.PARCEL_ID1);
					DbDataObject dbp = svr.getObjectById(otherParcelId, ap.getObjectType(), null);
					dbp.setVal(CC.HAS_OVERLAP, false);
					updatedParcels.addDataItem(dbp);
				}
			}

			ap.setVal(CC.HAS_OVERLAP, false);
		}
		return updatedParcels;
	}

	DbDataObject calculateIntersection(Geometry g, DbDataArray agriParcels, SvCore svr) {

		Geometry geom_intersect = null;
		DbDataObject intersection = null;

		try {
			for (DbDataObject dbc : agriParcels.getItems()) {
				Geometry parcel = SvGeometry.getGeometry(dbc);
				if (g.intersects(parcel)) {
					try {
						geom_intersect = parcel.intersection(g);
					} catch (Exception e) {
						log4j.error("Agri Parcel " + dbc.getVal("OLD_ID") + " has bad cadastral intersection with:"
								+ g.toString(), e);

					}

					Map<String, Object> usermap = (Map<String, Object>) g.getUserData();

					intersection = new DbDataObject(SvCore.getTypeIdByName("LP_CAD_INTERSECTIONS"));
					geom_intersect = com.prtech.spatial.Util.verifyGeometryType(intersection, geom_intersect);
					intersection.setParentId(dbc.getParentId());
					SvGeometry.setGeometry(intersection, geom_intersect);
					intersection.setVal("EXTERNAL_ID", usermap.get("ID_PARC"));
					intersection.setVal("GR_COD_CC", usermap.get("GR_COD_CC"));
					intersection.setVal("GR_COD_DP", usermap.get("GR_COD_DP"));
					intersection.setVal("GR_PARCEL", usermap.get("GR_PARCEL").toString());
					intersection.setVal("LAND_PARCEL_ID", dbc.getVal("OLD_ID"));
					intersection.setVal("PARCEL_ID", dbc.getObjectId());
					intersection.setVal("CAD_AREA", usermap.get("AREA"));
					intersection.setVal("FR_AREA", usermap.get("AREA"));
					intersection.setVal("AREA", Math.round(geom_intersect.getArea()));
					Long sector = (Long) usermap.get("GR_COD_DP");
					List<Geometry> munics = ApplicationServices.getCadMunicipalities(sector.intValue(),
							svr.getSessionId());
					for (Geometry gg : munics) {
						Map<String, Object> usermapItem = (Map<String, Object>) gg.getUserData();
						String koId = usermapItem.get("SIFRA1").toString();
						koId = koId.substring(2);

						if (usermap.get("GR_COD_CC").equals(Long.parseLong(koId))) {
							intersection.setVal("MUNICIPALITY_NAME", usermapItem.get("NAZIV").toString());
							break;
						}
					}

				}
			}
			// intersections.addDataItem(intersection);

		} catch (Exception e) {
			log4j.error("Agri Parcels have bad cadastral intersection with:" + g.toString(), e);

		}
		return intersection;
	}

	Map<String, List<String>> performFarmCadMapping(DbDataArray cadParcels) throws SvException, ParseException {
		Map<String, List<String>> map = new HashMap<>();
		for (DbDataObject dbc : cadParcels.getItems()) {
			String dp = (String) dbc.getVal("DEPARTMENT_CODE");
			String cc = (String) dbc.getVal("NATIONAL_CODE");
			String pc = (String) dbc.getVal("PARCEL_ID");
			if (dbc.getVal("SUB") != null && !dbc.getVal("SUB").equals(" ")) {
				pc = pc + "/" + dbc.getVal("SUB");
			}
			String key = dp + ":" + cc;
			List<String> parcs = map.get(key);
			if (parcs == null) {
				parcs = new ArrayList<>();
				map.put(key, parcs);
			}
			parcs.add(pc);
		}
		return map;
	}

	Geometry performMunicipalityCadCalc(String dp, String cc, List<String> ar) throws SvException, ParseException {

		String layer = SvConf.getParam("CAD_PARCEL_LAYER_NAME");
		String epsg = SvConf.getParam("CAD_PARCEL_LAYER_EPSG");
		String wfsUrl = SvConf.getParam("CAD_PARCEL_LAYER_WFS");
		String wfsUser = SvConf.getParam("CAD_PARCEL_LAYER_WFS_U");
		String wfsPass = SvConf.getParam("CAD_PARCEL_LAYER_WFS_P");
		String sshProxy = SvConf.getParam("CAD_PARCEL_LAYER_SSH_PROXY");
		String sshProxyUser = SvConf.getParam("CAD_PARCEL_LAYER_SSH_PROXY_USER");
		String sshProxyPass = SvConf.getParam("CAD_PARCEL_LAYER_SSH_PROXY_PASS");
		WFSReader wfs = new WFSReader(layer, epsg, wfsUrl);

		String filter = wfs.buildOgcFilter(dp, cc, ar);
		if (log4j.isDebugEnabled())
			log4j.debug("WFS request:" + wfs.buildWfsRequestUrlFilter(filter));
		System.out.println("WFS request:" + wfs.buildWfsRequestUrlFilter(filter));
		String extParams = "-oKexAlgorithms=+diffie-hellman-group1-sha1";
		String json = wfs.getWFSResponse(filter, sshProxy, sshProxyUser, sshProxyPass, wfsUser, wfsPass, extParams);

		GeometryFactory gf = SvUtil.sdiFactory;
		GeoJsonReader gjr = new GeoJsonReader(gf);
		gjr.setUseFeatureType(true);
		gjr.setUsePropertiesAsUserData(true);
		Geometry geom = gjr.read(json);
		return geom;
	}

	void performCadCalc(SvReader svr, Long objectId, Long type) throws SvException, ParseException {
		try (SvGeometry svg = new SvGeometry(svr); SvWriter svw = new SvWriter(svr)) {
			DbDataArray cadParcels = svr.getObjectsByParentId(objectId, type, null);
			svr.setIncludeGeometries(true);
			DbDataArray agriParcels = svr.getObjectsByParentId(objectId, SvCore.getTypeIdByName(CC.AGRI_PARCEL), null);
			Map<String, List<String>> cadMap = performFarmCadMapping(cadParcels);
			DbDataArray lpCadIntersections = svr.getObjectsByParentId(objectId,
					SvCore.getTypeIdByName("LP_CAD_INTERSECTIONS"), null);
			DbDataArray intersections = new DbDataArray();

			for (Entry<String, List<String>> e : cadMap.entrySet()) {
				String[] dp_cc = e.getKey().split(":");
				Geometry geom = performMunicipalityCadCalc(dp_cc[0], dp_cc[1], e.getValue());
				for (int i = 0; i < geom.getNumGeometries(); i++) {
					Geometry g = geom.getGeometryN(i);
					DbDataObject intersection = calculateIntersection(g, agriParcels, svr);

					if (intersection != null) {
						boolean existingFound = false;
						Iterator<DbDataObject> lpCadIt = lpCadIntersections.getItems().iterator();
						while (lpCadIt.hasNext()) {
							DbDataObject existing = lpCadIt.next();
							if (intersection.getVal("EXTERNAL_ID").equals(existing.getVal("EXTERNAL_ID"))) {
								existingFound = true;
								if (!intersection.getVal("AREA").equals(existing.getVal("AREA"))) {
									intersection.setObjectId(existing.getObjectId());
									intersection.setPkid(existing.getPkid());
									intersections.addDataItem(intersection);
								}
								lpCadIt.remove();
								break;
							}

						}
						if (!existingFound)
							intersections.addDataItem(intersection);
					}
				}
			}
			// add new or updated
			svg.setSkipSpatialValidations(true);
			svg.saveGeometry(intersections);
			// delete non existing intersections
			if (lpCadIntersections.size() > 0)
				svw.deleteObjects(lpCadIntersections);
			svg.dbCommit();
		}
	}
}
