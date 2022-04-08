package com.prtech.lpis;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
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
import java.util.Properties;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

import org.apache.commons.io.IOUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.joda.time.DateTime;

import com.google.gson.JsonObject;
import com.prtech.spatial.SC;
import com.prtech.spatial.Util;
import com.prtech.spatial.geobuf.GeobufEncoder;
import com.prtech.svarog.I18n;
import com.prtech.svarog.Sv;
import com.prtech.svarog.SvConf;
import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvException;
import com.prtech.svarog.SvExecManager;
import com.prtech.svarog.SvFileStore;
import com.prtech.svarog.SvGeometry;
import com.prtech.svarog.SvParameter;
import com.prtech.svarog.SvReader;
import com.prtech.svarog.SvSDITile;
import com.prtech.svarog.SvSDITile.SDIRelation;
import com.prtech.svarog.SvUtil;
import com.prtech.svarog.SvWriter;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_common.DbSearchCriterion;
import com.prtech.svarog_common.DbSearchExpression;
import com.prtech.svarog_common.IDbFilter;
import com.prtech.svarog_common.Jsonable;
import com.prtech.svarog_common.ResponseHandler;
import com.prtech.svarog_common.DbSearchCriterion.DbCompareOperand;
import com.prtech.svarog_common.ResponseHandler.MessageType;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Envelope;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryCollection;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.geom.util.GeometryExtracter;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.io.WKBReader;

@Path("/lpis")
public class ApplicationServices {

	static int minimumAgriParcelSize;

	static final Logger log4j = SvConf.getLogger(ApplicationServices.class);
	static int precisionScale = 2;

	static {
		int i = (int) (SvConf.getSDIPrecision() / 10);
		String s = Integer.toString(i);
		precisionScale = s.length();
		try {
			SvParameter.getSysParam(CC.MINIMUM_AGRI_PARCEL_SIZE, 100);
		} catch (SvException e) {
			log4j.error("Minimum Agri parcel size not size, defaulting to 100 sqm", e);
			minimumAgriParcelSize = 100;
		}
	}

	private static final Logger log = LogManager.getLogger(ApplicationServices.class.getName());

	@Path("/save/physicalBlock/{token}/{objectId}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	public Response savePhysicalBlock(@PathParam("token") String token, @PathParam("objectId") Long objectId,
			MultivaluedMap<String, String> formVals, @Context HttpServletRequest httpRequest) {

		SvReader svr = null;
		SvGeometry svg = null;
		DbDataObject pb = null;

		try {
			svr = new SvReader(token);
			svr.setIncludeGeometries(true);
			svg = new SvGeometry(svr);
			pb = new DbDataObject();
			Long typeId = SvCore.getTypeIdByName("PHYSICAL_BLOCK");
			DbDataArray fieldSet = SvCore.getFields(typeId);
			boolean isUpdate = objectId.compareTo(0L) > 0 ? true : false;
			JsonObject metadata = Util.dataToJson(formVals);

			if (isUpdate) {
				pb = svr.getObjectById(objectId, typeId, null);
			} else {
				pb.setObjectId(0L);
				pb.setObjectType(typeId);
			}

			// Map form values to dbo fields
			for (DbDataObject field : fieldSet.getItems()) {
				String fieldName = field.getVal("FIELD_NAME").toString();
				if (Util.excludeField(fieldName) && !"".equalsIgnoreCase(field.getVal("FIELD_TYPE").toString())) {
					pb = Util.addValueToDataObject(pb, fieldName, field, metadata);
				}
			}

			SvGeometry.setGeometry(pb, Util.jsonToGeometry(metadata.get("GEOM")));
			Util.calculateGeometryDerivatives(pb);
			svg.saveGeometry(pb);
		} catch (Exception e) {
			if (e instanceof SvException) {
				log.error("Failed saving physical block. " + ((SvException) e).getFormattedMessage(), e);
				return Response.status(401).entity(((SvException) e).getJsonMessage()).build();
			} else {
				log.error("Failed saving physical block. " + e);
				return Response.status(401).entity(e).build();
			}
		} finally {
			if (svg != null)
				svg.close();
		}

		return Response.status(200).entity(pb.toSimpleJson().toString()).build();
	}

	@Path("/split/agriParcel/{token}/{objectName}/{parentId}/{x}/{y}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces("application/pbf")
	public Response splitSpatialControl(@PathParam("token") final String token,
			@PathParam("objectName") final String objectName, @PathParam("parentId") final Long parentId,
			@PathParam("x") final Double x, @PathParam("y") final Double y,
			final MultivaluedMap<String, String> formVals, @Context HttpServletRequest httpRequest) {

		String errMsg = "";
		final Set<Geometry> result = new HashSet<Geometry>();
		try (SvReader svr = new SvReader(token); SvGeometry svg = new SvGeometry(svr)) {
			svg.setAutoCommit(false);
			Geometry geom = Util.getInputGeometry(formVals, null);
			Long layerTypeId = SvCore.getTypeIdByName(objectName);
			List<DbDataObject> toBeDeleted = new ArrayList<DbDataObject>();
			Set<Geometry> split = svg.splitGeometries((LineString) geom, layerTypeId, toBeDeleted, false, SC.PARENT_ID,
					parentId, false);

			Point point = SvUtil.sdiFactory.createPoint(new Coordinate(x, y));
			Iterator<Geometry> gi = split.iterator();
			while (gi.hasNext()) {
				if (!gi.next().covers(point))
					gi.remove();
			}
			// TODO add calculus of overlaps
			svg.splitMergeGeometryDbUpdate(split, toBeDeleted, true);
			result.addAll(split);

			svg.dbCommit();
		} catch (SvException e) {
			errMsg = e.getJsonMessage();
		} catch (Exception e) {
			errMsg = e.getMessage();
		}
		if (errMsg.isEmpty()) {
			StreamingOutput pbfStream = new StreamingOutput() {
				public void write(OutputStream stream) throws IOException {
					GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
					enc.writeSvGeometry(result);
				};
			};
			return Response.ok(pbfStream, "application/pbf").build();
		} else
			return Response.status(500).entity(errMsg).type(MediaType.APPLICATION_JSON).build();
	}

	private DbDataObject getOverlapDbo(DbDataArray existingOverlaps, DbDataObject agriParcel,
			DbDataObject relatedParcel) throws SvException {
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
		if (overlap == null || overlap.getArea() < minimumAgriParcelSize)
			throw (new SvException(CC.OVERLAP_LESS_THAN_MINIMUM, svg.getInstanceUser(), relatedParcel, overlap));
		DbDataObject overlapDbo = getOverlapDbo(existingOverlaps, agriParcel, relatedParcel);
		SvGeometry.setGeometry(overlapDbo, overlap);
		Util.calculateGeometryDerivatives(overlapDbo);
		relatedParcel.setVal(CC.HAS_OVERLAP, true);
		relatedParcel.setVal(CC.ALLOWED_AREA, related.getArea() - overlap.getArea());
		overlapParcels.addDataItem(relatedParcel);
		return overlapDbo;
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
		svg.saveGeometry(overlapDbos);
		svg.saveGeometry(overlapParcels);
		if (existingOverlaps.size() > 0)
			try (SvWriter svw = new SvWriter(svg)) {
				svw.deleteObjects(existingOverlaps);
			}

		if (overlapDbos.size() > 0) {
			agriParcel.setVal(CC.HAS_OVERLAP, true);
			agriParcel.setVal(CC.ALLOWED_AREA, geom.getArea() - overlapArea);
		}

	};

	private DbDataArray getOverlaps(SvCore svg, DbDataObject ap) throws SvException {
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

	private DbDataArray removeOverlaps(SvGeometry svg, DbDataObject ap) throws SvException {
		DbDataArray updatedParcels = new DbDataArray();
		try (SvWriter svw = new SvWriter(svg); SvReader svr = new SvReader(svg)) {
			DbDataArray overlaps = getOverlaps(svg, ap);

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

	private Geometry preventFarmOverlap(SvReader svr, DbDataObject parcel) throws SvException {
		DbDataArray assets = getAssetsList(svr, parcel.getParentId(), CC.AGRI_PARCEL);
		Geometry g = SvGeometry.getGeometry(parcel);
		for (DbDataObject dbo : assets.getItems()) {
			Geometry other = SvGeometry.getGeometry(dbo);
			DbDataObject d = (DbDataObject) other.getUserData();
			if (parcel.getObjectId().equals(d.getObjectId()))
				continue;
			if (g.overlaps(other))
				g = g.difference(other);
		}
		g.setUserData(parcel);
		return g;
	}

	@Path("/save/agriParcel/{token}/{objectId}/{parentId}/{opType}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces("application/pbf")
	public StreamingOutput saveAgriParcelToFarm(@PathParam("token") String token, @PathParam("objectId") Long objectId,
			@PathParam("parentId") Long parentId, @PathParam("opType") String opType,
			MultivaluedMap<String, String> formVals, @Context HttpServletRequest httpRequest) {

		return new StreamingOutput() {
			public void write(OutputStream stream) throws IOException {
				GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
				DbDataObject ap = null;
				JsonObject metadata = new JsonObject();
				try (SvReader svr = new SvReader(token); SvGeometry svg = new SvGeometry(svr);) {

					svr.setIncludeGeometries(true);
					ap = new DbDataObject();
					DbDataArray parcelsToSave = new DbDataArray();
					Geometry geom = null;
					Long typeId = SvCore.getTypeIdByName(CC.AGRI_PARCEL);
					DbDataArray fieldSet = SvCore.getFields(typeId);
					boolean isUpdate = objectId.compareTo(0L) > 0 ? true : false;
					metadata = Util.dataToJson(formVals);
					geom = Util.jsonToGeometry(metadata.get(Sv.GEOM));

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
						if (Util.excludeField(fieldName)
								&& !"".equalsIgnoreCase(field.getVal(Sv.FIELD_TYPE).toString())) {
							ap = Util.addValueToDataObject(ap, fieldName, field, metadata);
						}
					}

					DbDataArray result = new DbDataArray();
					if (opType.equals(CC.CUTOFF)) {
						geom = svg.cutLayerFromGeom(geom, typeId);
						SvGeometry.setGeometry(ap, geom);
						if (ap.getVal(CC.HAS_OVERLAP) != null && (boolean) ap.getVal(CC.HAS_OVERLAP))
							result.setItems(removeOverlaps(svg, ap).getItems());
					}
					// check minimum parcel size
					if (geom.getArea() < minimumAgriParcelSize)
						throw (new SvException(CC.OVERLAP_LESS_THAN_MINIMUM, svg.getInstanceUser(), ap,
								minimumAgriParcelSize));

					if (opType.equals(CC.IGNORE)) {
						Collection<Geometry> intersections = svg.getRelatedGeometries(geom, typeId,
								SDIRelation.INTERSECTS, CC.PARENT_ID, ap.getParentId(), true, true, true);
						createOverlaps(svg, ap, typeId, intersections);
					}

					svg.setAutoCommit(false);
					Util.calculateGeometryDerivatives(ap);
					result.addDataItem(ap);
					svg.saveGeometry(ap);
					svg.dbCommit();
					enc.writeDbDataArray(result);
				} catch (Exception e) {
					String errMsg = "Failed saving agri parcel. Please see server logs";
					if (e instanceof SvException)
						log.error("Failed saving agri parcel. " + ((SvException) e).getFormattedMessage(), e);
					errMsg = ((SvException) e).getJsonMessage();
					try {
						stream.write(errMsg.getBytes(StandardCharsets.UTF_8));
					} catch (IOException ioe) {
						log.error("Stream closed, can't write error", ioe);
					}
					log.error(errMsg, e);
				} finally {
					if (enc != null)
						enc.close();
				}
			}

		};
	}

	@POST
	@Path("/add/farm/{token}/{farmId}/{objectName}/{x}/{y}")
	@Produces("application/pbf")
	public Response addToFarm(@PathParam("token") final String token, @PathParam("farmId") final Long farmId,
			@PathParam("objectName") final String objectName, @PathParam("x") final Double x,
			@PathParam("y") final Double y, MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {

		String errMsg = "";
		final Set<Geometry> result = new HashSet<Geometry>();
		try (SvReader svr = new SvReader(token);
				SvWriter svw = new SvWriter(svr);
				SvGeometry svg = new SvGeometry(svr)) {
			svr.setIncludeGeometries(true);
			Point point = SvUtil.sdiFactory.createPoint(new Coordinate(x, y));
			Long layerTypeId = SvCore.getTypeIdByName(objectName);
			Collection<Geometry> geomArr = svg.getRelatedGeometries(point, layerTypeId, SDIRelation.INTERSECTS, null,
					null, false);
			if (geomArr.size() == 1) {
				DbDataObject dbo = (DbDataObject) geomArr.iterator().next().getUserData();
				if ((boolean) dbo.getVal(CC.COMMON_USE))
					errMsg = "{error:'err.parcel_common_use'}";
				else if (dbo.getParentId().equals(0L)) {
					dbo.setParentId(farmId);
					svg.saveGeometry(dbo);
					result.add(SvGeometry.getGeometry(dbo));
				} else
					errMsg = dbo.toSimpleJson().toString();
			} else
				errMsg = "{error:'err.no_parcel.selected'}";
		} catch (SvException e) {
			errMsg = e.getJsonMessage();
		} catch (Exception e) {
			errMsg = e.getMessage();
		}

		if (errMsg.isEmpty()) {
			StreamingOutput pbfStream = new StreamingOutput() {
				public void write(OutputStream stream) throws IOException {
					GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
					enc.writeSvGeometry(result);
				};
			};
			return Response.ok(pbfStream, "application/pbf").build();
		} else
			return Response.status(500).entity(errMsg).type(MediaType.APPLICATION_JSON).build();

//		return mergeGeometryImpl(token, objectName, false, lineStringWKT, formVals);

	}

	@POST
	@Path("/lpis/delete/{token}/{objectId}/{objectType}/")
	@Produces("application/pbf")
	public Response deleteGeometry(@PathParam("token") final String token, @PathParam("objectId") final Long objectId,
			@PathParam("objectType") final Long objectType, MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {

		final Set<Geometry> result = new HashSet<Geometry>();
		try (SvReader svr = new SvReader(token);
				SvWriter svw = new SvWriter(svr);
				SvGeometry svg = new SvGeometry(svr)) {
			svw.setAutoCommit(false);
			svg.setAutoCommit(false);
			svr.setIncludeGeometries(true);
			DbDataObject dbo = svr.getObjectById(objectId, objectType, null);
			if (dbo == null)
				throw (new SvException(Sv.Exceptions.NULL_OBJECT, svr.getInstanceUser()));
			else {
				Geometry gTile = SvGeometry.getTileGeometry(SvGeometry.getCentroid(dbo));
				SvSDITile svTile = SvGeometry.getTile(objectType, (String) gTile.getUserData(), null);
				removeOverlaps(svg, dbo);
				svw.deleteObject(dbo, false);
				svw.dbCommit();
				svTile.setIsTileDirty(true);
			}

		} catch (SvException e) {
			com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(), "lpis.error.delete_parcel");
		}

		StreamingOutput pbfStream = new StreamingOutput() {
			public void write(OutputStream stream) throws IOException {
				GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
				enc.writeSvGeometry(result);
			};
		};
		return Response.ok(pbfStream, "application/pbf").build();

//		return mergeGeometryImpl(token, objectName, false, lineStringWKT, formVals);

	}

	@GET
	@Path("/remove/farm/{token}/{objectId}/{objectName}")
	@Produces("application/pbf")
	public Response removeParcel(@PathParam("token") final String token, @PathParam("objectId") final Long objectId,
			@PathParam("objectName") final String objectName, MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {

		return removeParcel(token, objectId, objectName, 0L, formVals, httpRequest);
	}

	@GET
	@Path("/remove/farm/{token}/{objectId}/{objectName}/{parentId}")
	@Produces("application/pbf")
	public Response removeParcel(@PathParam("token") final String token, @PathParam("objectId") final Long objectId,
			@PathParam("objectName") final String objectName, @PathParam("parentId") final Long parentId,
			MultivaluedMap<String, String> formVals, @Context HttpServletRequest httpRequest) {

		ResponseHandler jrh = new ResponseHandler();
		final Set<Geometry> result = new HashSet<Geometry>();
		try (SvReader svr = new SvReader(token);
				SvWriter svw = new SvWriter(svr);
				SvGeometry svg = new SvGeometry(svr)) {
			svr.setIncludeGeometries(true);
			DbDataObject dbo = svr.getObjectById(objectId, SvCore.getTypeIdByName(objectName), null);
			if (dbo == null)
				throw (new SvException(Sv.Exceptions.NULL_OBJECT, svr.getInstanceUser()));
			else {
				Geometry gTile = SvGeometry.getTileGeometry(SvGeometry.getCentroid(dbo));
				SvSDITile svTile = SvGeometry.getTile(SvCore.getTypeIdByName(objectName), (String) gTile.getUserData(),
						null);

				Long pid = parentId.equals(0L) ? dbo.getParentId() : parentId;
				if ((boolean) dbo.getVal(CC.COMMON_USE)) {
					DbDataArray dba = svr.getObjectsByParentId(pid, SvCore.getTypeIdByName(CC.COMMON_USE), null);
					for (DbDataObject cu : dba.getItems()) {
						if (cu.getVal(CC.PARCEL_ID).equals(objectId)) {
							svw.deleteObject(cu);
							break;
						}
					}

				} else {// not common use, just simple remove
					dbo.setParentId(0L);
					svg.saveGeometry(dbo);
				}
				svTile.setIsTileDirty(true);

			}

		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, jrh, "error.perun.failedToRemoveObject");
		}
		jrh.create(MessageType.SUCCESS, I18n.getText("parcel.detached.from.farm"),
				I18n.getText("parcel.detached.from.farm"));
		return Response.status(200).entity(jrh.getAll().toString()).type(MediaType.APPLICATION_JSON).build();
		// return mergeGeometryImpl(token, objectName, false, lineStringWKT,
		// formVals);
	}

	Collection<Geometry> getPhysicalBlock(SvCore svc, Envelope env, String tableName, String geomColName)
			throws SvException, SQLException, ParseException {
		List<Geometry> result = new ArrayList<>();
		String select = "SELECT " + SvCore.getDbHandler().getGeomReadSQL(geomColName) + " as GG, tt.* FROM " + tableName
				+ " tt WHERE " + SvCore.getDbHandler().getBBoxSQL(geomColName);
		PreparedStatement ps = null;
		ResultSet rs = null;
		WKBReader wkb = new WKBReader(SvUtil.sdiFactory);
		try {
			Connection con = svc.dbGetConn();
			ps = con.prepareStatement(select);
			ps.setDouble(1, env.getMinX());
			ps.setDouble(2, env.getMinY());
			ps.setDouble(3, env.getMaxX());
			ps.setDouble(4, env.getMaxY());
			rs = ps.executeQuery();
			while (rs.next()) {
				DbDataObject dbo = new DbDataObject();
				byte[] geom = SvConf.getDbHandler().getGeometry(rs, 1);
				if (geom != null) {
					Geometry g = wkb.read(geom);

					for (int i = 2; i <= rs.getMetaData().getColumnCount(); i++) {
						String colName = rs.getMetaData().getColumnName(i);
						dbo.setVal(colName, rs.getObject(i));
					}
					g.setUserData(dbo);
					result.add(g);
				}
			}
		} finally {
			if (ps != null)
				ps.close();
			if (rs != null)
				rs.close();
		}
		return result;
	}

	@POST
	@Path("/copy/parcel/{token}/{objectName}/{x}/{y}")
	@Produces("application/pbf")
	public Response copyFromLayer(@PathParam("token") final String token,
			@PathParam("objectName") final String objectName, @PathParam("x") final Double x,
			@PathParam("y") final Double y, MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {

		final Set<Geometry> result = new HashSet<Geometry>();
		try (SvReader svr = new SvReader(token);
				SvWriter svw = new SvWriter(svr);
				SvGeometry svg = new SvGeometry(svr)) {
			svr.setIncludeGeometries(true);
			Point point = SvUtil.sdiFactory.createPoint(new Coordinate(x, y));
			Collection<Geometry> gg = getPhysicalBlock(svg, point.getEnvelopeInternal(), "ext_lpis.ilpis", "geometry");
			for (Geometry g : gg) {
				if (g.covers(point))
					result.add(g);
			}
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(), "error.lpis.copy");
		}

		if (!result.isEmpty()) {
			StreamingOutput pbfStream = new StreamingOutput() {
				public void write(OutputStream stream) throws IOException {
					GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
					enc.writeSvGeometry(result);
				};
			};
			return Response.ok(pbfStream, "application/pbf").build();
		} else
			return Response.status(500).entity("{error:err.no_parcel.selected}").type(MediaType.APPLICATION_JSON)
					.build();

//		return mergeGeometryImpl(token, objectName, false, lineStringWKT, formVals);

	}

	@POST
	@Path("/overlap/farm/{token}/{farmId}/{objectName}/{x}/{y}")
	@Produces("application/pbf")
	public Response overlapFarm(@PathParam("token") final String token, @PathParam("farmId") final Long farmId,
			@PathParam("objectName") final String objectName, @PathParam("x") final Double x,
			@PathParam("y") final Double y, MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {

		final Set<Geometry> result = new HashSet<Geometry>();
		try (SvReader svr = new SvReader(token);
				SvWriter svw = new SvWriter(svr);
				SvGeometry svg = new SvGeometry(svr)) {
			svr.setIncludeGeometries(true);
			Point point = SvUtil.sdiFactory.createPoint(new Coordinate(x, y));
			Long layerTypeId = SvCore.getTypeIdByName(objectName);
			Collection<Geometry> geomArr = svg.getRelatedGeometries(point, layerTypeId, SDIRelation.INTERSECTS, null,
					null, false);
			if (geomArr.size() == 1) {
				result.add(geomArr.iterator().next());
			}
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(), "error.lpis.overlap");
		}

		if (!result.isEmpty()) {
			StreamingOutput pbfStream = new StreamingOutput() {
				public void write(OutputStream stream) throws IOException {
					GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
					enc.writeSvGeometry(result);
				};
			};
			return Response.ok(pbfStream, "application/pbf").build();
		} else
			return Response.status(500).entity("{error:err.no_parcel.selected}").type(MediaType.APPLICATION_JSON)
					.build();

//		return mergeGeometryImpl(token, objectName, false, lineStringWKT, formVals);

	}

	@GET
	@Path("/info/agriParcel/{token}/{objectName}/{x}/{y}")
	@Produces("application/pbf")
	public Response getGeometryInfo(@PathParam("token") final String token,
			@PathParam("objectName") final String objectName, @PathParam("x") final Double x,
			@PathParam("y") final Double y) {

		DbDataArray result = new DbDataArray();
		String errMsg = null;
		try (SvGeometry svg = new SvGeometry(token); SvReader svr = new SvReader(svg)) {
			Point point = SvUtil.sdiFactory.createPoint(new Coordinate(x, y));
			Long layerTypeId = SvCore.getTypeIdByName(objectName);
			Collection<Geometry> geomArr = svg.getRelatedGeometries(point, layerTypeId, SDIRelation.INTERSECTS, null,
					null, false);
			for (Geometry g : geomArr) {
				DbDataObject dbo = (DbDataObject) g.getUserData();
				DbDataObject dbt = SvCore.getDbt(SvCore.getDbt(dbo).getParentId());
				DbDataObject dboP = null;
				if (!dbo.getParentId().equals(0L)) {
					dboP = svr.getObjectById(dbo.getParentId(), dbt, null);
					if (dboP == null) {
						if (dbt.getVal(Sv.TABLE_NAME).equals("FARM"))
							dbt = SvCore.getDbtByName("FARMER");
						else
							dbt = SvCore.getDbtByName("FARM");
						dboP = svr.getObjectById(dbo.getParentId(), dbt, null);
					}
				}
				if (dboP != null)
					result.addDataItem(dboP);
				if (dbo != null)
					result.addDataItem(dbo);
			}
		} catch (Exception e) {
			log.error("Error fetching geometry info", e);
			errMsg = "Failed fetching geometry set. Please see server logs";
		}
		if (errMsg != null)
			return Response.status(500).entity(errMsg).type(MediaType.APPLICATION_JSON).build();
		else
			return Response.status(200).entity(result.toSimpleJson().toString()).type(MediaType.APPLICATION_JSON)
					.build();
	}

	/**
	 * parent filter class.
	 * 
	 * @author ristepejov
	 *
	 */
	public class parentFilter implements IDbFilter {
		Long parentId;

		public parentFilter(Long parentId) {
			this.parentId = parentId;
		}

		public boolean filterObject(DbDataObject dbo) {
			return dbo.getParentId().equals(this.parentId);

		}

	}

	/**
	 * WS that return list of COMMON_USE object/s
	 * 
	 * @param token       Session ID
	 * @param parentId    Object ID of FARMER object
	 * @param parcelId    Object ID of AGRI_PARCEL object
	 * @param httpRequest
	 * @return DbDataArray of DbDataObjects (COMMON_USE)
	 */
	@Path("/get/commonUse/{token}/{parentId}/{parcelId}")
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	public Response getCommonUse(@PathParam("token") final String token, @PathParam("parentId") final Long parentId,
			@PathParam("parcelId") final Long parcelId, @Context HttpServletRequest httpRequest) {

		Jsonable commonUse = null;
		try (SvReader svr = new SvReader(token)) {
			DbDataArray result = new CommonUse().getCommonUseParcels(parcelId, svr);
			if (parentId.equals(0L))
				commonUse = result;
			else {
				result = result.applyFilter(new parentFilter(parentId));
				if (result.size() > 0)
					commonUse = result.get(0);
				else {
					commonUse = new Jsonable() {
					};
				}
			}
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(),
					"error.perun.failedToGetObject");
		}
		// ResponseHandler rr = new ResponseHandler(MessageType.SUCCESS, );
		return Response.status(200).entity(commonUse.toSimpleJson().toString()).type(MediaType.APPLICATION_JSON)
				.build();

	}

	@Path("/get/overlaps/{token}/{parcelId}")
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	public Response getOverlaps(@PathParam("token") final String token, @PathParam("parcelId") final Long parcelId,
			@Context HttpServletRequest httpRequest) {

		DbDataArray overlaps = new DbDataArray();
		try (SvReader svr = new SvReader(token)) {
			DbDataObject parcel = svr.getObjectById(parcelId, SvCore.getTypeIdByName(CC.AGRI_PARCEL), null);
			overlaps = getOverlaps(svr, parcel);
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(), "error.lpis.getOverlaps");
		}
		// ResponseHandler rr = new ResponseHandler(MessageType.SUCCESS, );
		return Response.status(200).entity(overlaps.toSimpleJson().toString()).type(MediaType.APPLICATION_JSON).build();

	}

	/**
	 * WS that saves DbDataObject of COMMON_USE type
	 *
	 * @param token       session ID
	 * @param objectId    Object ID of the COMMON_USE object (0 for new object)
	 * @param parentId    Object ID of the FARMER object
	 * @param parcelId    Object ID of the AGRI_PARCEL object
	 * @param formVals    MultivaluedMap with form data values
	 * @param httpRequest
	 * @return appropriate message if object was successfully saved or not
	 */
	@Path("/save/commonUse/{token}/{objectId}/{parentId}/{parcelId}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces("application/pbf")
	public Response saveCommonUse(@PathParam("token") final String token, @PathParam("objectId") final Long objectId,
			@PathParam("parentId") final Long parentId, @PathParam("parcelId") final Long parcelId,
			MultivaluedMap<String, String> formVals, @Context HttpServletRequest httpRequest) {

		ResponseHandler jrh = new ResponseHandler();
		JsonObject metadata = new JsonObject();
		DbDataObject commonUse = null;
		CommonUse cu = null;
		try (SvReader svr = new SvReader(token);
				SvWriter svw = new SvWriter(svr);
				SvGeometry svg = new SvGeometry(svr)) {
			svr.setIncludeGeometries(true);
			cu = new CommonUse();
			metadata = Util.dataToJson(formVals);
			Long typeId = SvCore.getTypeIdByName(CC.COMMON_USE);
			DbDataArray fieldSet = SvCore.getFields(typeId);
			boolean isUpdate = objectId.compareTo(0L) > 0 ? true : false;
			if (isUpdate) {
				commonUse = svr.getObjectById(objectId, typeId, null);
			} else {
				DbDataArray dba = svr.getObjectsByParentId(parentId, SvCore.getTypeIdByName(CC.COMMON_USE), null);
				for (DbDataObject tcu : dba.getItems()) {
					if (tcu.getVal(CC.PARCEL_ID).equals(parcelId)) {
						commonUse = tcu;
						break;
					}
				}
			}
			if (commonUse == null) {
				commonUse = new DbDataObject(typeId);
				commonUse.setParentId(parentId);
			}
			// Map form values to dbo fields
			for (DbDataObject field : fieldSet.getItems()) {
				String fieldName = field.getVal(CC.FIELD_NAME).toString();
				if (Util.excludeField(fieldName)
						&& !CC.EMPTY_STRING.equalsIgnoreCase(field.getVal(CC.FIELD_TYPE).toString())) {
					commonUse = Util.addValueToDataObject(commonUse, fieldName, field, metadata);
				}
			}

			DbDataObject agriParcel = cu.commonUseChecksBeforeSave(parcelId, parentId, svr);
			if (agriParcel.getIsDirty())
				svg.saveObject(agriParcel);
			cu.saveCommonUseObject(commonUse, parentId, parcelId, formVals, metadata, svg, svw, svr);
			svw.dbCommit();
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, jrh, "error.perun.failedToSaveObject");
		}
		jrh.create(MessageType.SUCCESS, I18n.getText("success.perun.successfullySavedObject"),
				I18n.getText("success.perun.successfullySavedObject"));
		return Response.status(200).entity(jrh.getAll().toString()).type(MediaType.APPLICATION_JSON).build();
	}

	@Path("/check/PBContainsAP/{token}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	public Response checkPBContainsAP(@PathParam("token") String token, MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {

		Boolean result = false;
		JsonObject json = null;
		ResponseHandler rhs = new ResponseHandler();
		try (SvGeometry svg = new SvGeometry(token);) {

			json = Util.dataToJson(formVals);
			Geometry gp = Util.jsonToGeometry(json.get("GEOM"));
			Set<Geometry> geoms = new HashSet<Geometry>();
			Collection<Geometry> gg = getPhysicalBlock(svg, gp.getEnvelopeInternal(), "ext_lpis.ilpis", "geometry");
			Iterator<Geometry> i = gg.iterator();
			while (i.hasNext()) {
				Geometry g = i.next();
				if (!g.intersects(g))
					i.remove();
			}

			if (gg.size() > 1) {
				rhs.create(MessageType.WARNING, "error.intersects_physical_block");
			} else if (gg.size() < 1)
				rhs.create(MessageType.ERROR, "error.out_of_physical_block");
			else if (!gg.iterator().next().covers(gp))
				rhs.create(MessageType.WARNING, "error.intersects_physical_block");
			else
				rhs.create(MessageType.SUCCESS, "ok");
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(),
					"error.lpis.check.physicallBlock");
		}

		return Response.status(200).entity(rhs.getAll().toString()).build();
	}

	@Path("/cutoff/physicalBlock/{token}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	public Response cutOffPB(@PathParam("token") String token, MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {

		JsonObject json = null;
		final ArrayList<Geometry> result = new ArrayList<Geometry>();
		ResponseHandler rhs = new ResponseHandler();
		try (SvGeometry svg = new SvGeometry(token);) {

			json = Util.dataToJson(formVals);
			Geometry gp = Util.jsonToGeometry(json.get("GEOM"));
			Collection<Geometry> gg = getPhysicalBlock(svg, gp.getEnvelopeInternal(), "ext_lpis.ilpis", "geometry");
			Geometry greatest = null;
			for (Geometry pb : gg) {
				Geometry tmp = gp.intersection(pb);
				if (greatest == null || tmp.getArea() > greatest.getArea()) {
					greatest = tmp;
					greatest.setUserData(gp.getUserData());
				}
			}
			result.add(greatest);
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(),
					"error.lpis.cutoff.physicallBlock");
		}

		if (!result.isEmpty()) {
			StreamingOutput pbfStream = new StreamingOutput() {
				public void write(OutputStream stream) throws IOException {
					GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
					enc.writeSvGeometry(result);
				};
			};
			return Response.ok(pbfStream, "application/pbf").build();
		} else
			return Response.status(500).entity("{error:err.no_parcel.selected}").type(MediaType.APPLICATION_JSON)
					.build();
	}

	@Path("/get/cropList/{token}/{farmObjectId}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	public Response getCropList(@PathParam("token") final String token,
			@PathParam("farmObjectId") final Long farmObjectId, MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {

		JsonObject json = null;
		try (SvReader svr = new SvReader(token); SvExecManager svm = new SvExecManager(svr)) {

			Map<String, Object> params = new HashMap<String, Object>();
			params.put("FORM_VALS", formVals);
			params.put("FARM_OBJECT_ID", farmObjectId);
			json = (JsonObject) svm.execute("EDBAR_UTIL.CROPS_BY_COVER", params, null);

		} catch (Exception e) {
			log.error("Cant get crops by land cover code.", e);
		}

		return Response.status(200).entity(json.toString()).build();
	}

	@Path("/check/APIntersectsAP/{token}/{isContained}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	public Response checkAPIntersectsAP(@PathParam("token") String token, @PathParam("isContained") Boolean isContained,
			MultivaluedMap<String, String> formVals, @Context HttpServletRequest httpRequest) {

		JsonObject result = null;
		JsonObject json = null;
		SvGeometry svg = null;
		Geometry geom = null;
		Geometry containedAP = null;

		try {
			svg = new SvGeometry(token);
			json = Util.dataToJson(formVals);
			geom = Util.jsonToGeometry(json.get("GEOM"));

			// Perform cut of agri parcel against a container physical block.
			// In case of multiple blocks, use the block that lends maximum size to the
			// parcel
			if (!isContained) {
				Set<Geometry> blocks = new HashSet<Geometry>();
				blocks = svg.getRelatedGeometries(geom, SvCore.getTypeIdByName("PHYSICAL_BLOCK"),
						SDIRelation.INTERSECTS, null, null, true);

				if (blocks.size() == 0) // Fix this abuse, eventually.
					return Response.status(401).entity("AP must be covered by PB.").build();

				for (Geometry block : blocks) {
					if (containedAP == null) {
						containedAP = block.intersection(geom);
					} else {
						Geometry g = block.intersection(geom);
						if (g.getArea() > containedAP.getArea()) {
							containedAP = g;
						}
					}
				}
			} else {
				containedAP = geom;
			}

			// Apply user data to containedAP
			DbDataObject userData = new DbDataObject();
			Long oid = json.get("OBJECT_ID").getAsLong();
			if (oid > 0L) {
				userData.setObjectId(oid);
				containedAP.setUserData(userData);
			}

			// Perform check if our parcel crosses with neighbouring parcels.
			Collection<Geometry> neighbourAP = svg.getRelatedGeometries(containedAP,
					SvCore.getTypeIdByName("AGRI_PARCEL"), SDIRelation.INTERSECTS, null, null, true, true, true);

			boolean neighbourAPoverlap = false;
			for (Geometry ng : neighbourAP) {
				if (geom.overlaps(ng)) {
					neighbourAPoverlap = true;
					break;
				}
			}
			// revert user data, do not return as part of json.
			containedAP.setUserData(null);
			json.addProperty("GEOM", Util.geometryToJson(containedAP));
			result = new JsonObject();
			result.add("layer", json);
			result.addProperty("check", neighbourAPoverlap);
		} catch (Exception e) {
			// TODO: handle exception
		} finally {
			if (svg != null) {
				svg.close();
			}
		}

		return Response.status(200).entity(result.toString()).build();
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
			result = new Reader(svr).getParcels(objectId, null,true); 
			

		}

		return result;

	}

	@Path("/get/farmerAssets/{token}/{objectId}/{typeName}")
	@GET
	@Produces("application/pbf")
	public Response getFarmerAssets(@PathParam("token") final String token, @PathParam("objectId") final Long objectId,
			@PathParam("typeName") final String typeName, @Context HttpServletRequest httpRequest) {

		final DbDataArray result = new DbDataArray();
		try (SvReader svr = new SvReader(token)) {
			result.setItems(getAssetsList(svr, objectId, typeName).getItems());

		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(),
					"error.perun.failedToSaveObject");
		}

		StreamingOutput pbfStream = new StreamingOutput() {
			public void write(OutputStream stream) throws IOException {
				GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
				enc.writeDbDataArray(result);
			};
		};
		return Response.ok(pbfStream, "application/pbf").build();

	}

	/**
	 * WS that saves DbDataObject of PERMANENT_CROP type
	 * 
	 * @param token       Session ID
	 * @param objectId    Object ID of the PERMANENT_CROP object (0 for new object)
	 * @param parentId    Object ID of the FARMER object
	 * @param formVals    MultivaluedMap with form data values
	 * @param httpRequest
	 * @return appropriate message if object was successfully saved or not
	 */
	@Path("/save/permanentCrop/{token}/{objectId}/{parentId}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces("application/pbf")
	public Response savePermanentCrop(@PathParam("token") final String token,
			@PathParam("objectId") final Long objectId, @PathParam("parentId") final Long parentId,
			MultivaluedMap<String, String> formVals, @Context HttpServletRequest httpRequest) {

		ResponseHandler jrh = new ResponseHandler();
		JsonObject metadata = new JsonObject();
		DbDataObject permanentCrop = null;
		try (SvReader svr = new SvReader(token);
				SvWriter svw = new SvWriter(svr);
				SvGeometry svg = new SvGeometry(svr)) {
			metadata = Util.dataToJson(formVals);
			permanentCrop = new DbDataObject();
			Long typeId = SvCore.getTypeIdByName(CC.PERMANENT_CROP);
			DbDataArray fieldSet = SvCore.getFields(typeId);
			boolean isUpdate = objectId.compareTo(0L) > 0 ? true : false;

			if (isUpdate) {
				permanentCrop = svr.getObjectById(objectId, typeId, null);
			} else {
				permanentCrop.setObjectId(0L);
				permanentCrop.setObjectType(typeId);
				permanentCrop.setParentId(parentId);
			}

			// Map form values to dbo fields
			for (DbDataObject field : fieldSet.getItems()) {
				String fieldName = field.getVal(CC.FIELD_NAME).toString();
				if (Util.excludeField(fieldName)
						&& !CC.EMPTY_STRING.equalsIgnoreCase(field.getVal(CC.FIELD_TYPE).toString())) {
					permanentCrop = Util.addValueToDataObject(permanentCrop, fieldName, field, metadata);
				}
			}
			new PermanentCrop().checkBeforeSavePermanentCrop(permanentCrop, svr);
			PermanentCrop.checkIfPlantAreaIsBiggerThanArea(permanentCrop, svr);
			svw.saveObject(permanentCrop);
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, jrh, "error.perun.failedToSaveObject");
		}
		jrh.create(MessageType.SUCCESS, I18n.getText("success.perun.successfullySavedObject"),
				I18n.getText("success.perun.successfullySavedObject"));
		return Response.status(200).entity(jrh.getAll().toString()).type(MediaType.APPLICATION_JSON).build();
	}

	/**
	 * WS that return list of PERMANENT_CROP object/s
	 * 
	 * @param token       Session ID
	 * @param parcelId    Object ID of AGRI_PARCEL object
	 * @param httpRequest
	 * @return
	 */
	@Path("/get/permanentCrop/{token}/{parcelId}")
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	public Response getPermanentCrop(@PathParam("token") final String token, @PathParam("parcelId") final Long parcelId,
			@Context HttpServletRequest httpRequest) {
		DbDataArray result = new DbDataArray();
		try (SvReader svr = new SvReader(token)) {
			if (parcelId != null) {
				result = new PermanentCrop().getPermanentCrops(parcelId, svr);
			}
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(),
					"error.perun.failedToGetObject");
		}
		return Response.status(200).entity(result.toSimpleJson().toString()).type(MediaType.APPLICATION_JSON).build();
	}

	/**
	 * WS that delete DbDataObject of PERMANENT_CROP type
	 * 
	 * @param token       Session ID
	 * @param objectId    Object ID of PERMANENT_CROP object
	 * @param httpRequest
	 * @return
	 */
	@GET
	@Path("/delete/permanentCrop/{token}/{objectId}")
	@Produces("application/pbf")
	public Response deletePermanentCrop(@PathParam("token") final String token,
			@PathParam("objectId") final Long objectId, @Context HttpServletRequest httpRequest) {
		ResponseHandler jrh = new ResponseHandler();
		try (SvReader svr = new SvReader(token); SvWriter svw = new SvWriter(svr)) {
			DbDataObject permanentCrop = svr.getObjectById(objectId, SvReader.getTypeIdByName(CC.PERMANENT_CROP), null);
			if (permanentCrop != null) {
				svw.deleteObject(permanentCrop);
				jrh.create(MessageType.SUCCESS, I18n.getText("success.perun.successfullyDeletedObject"),
						I18n.getText("success.perun.successfullyDeletedObject"));
			} else {
				jrh.create(MessageType.ERROR, I18n.getText("error.perun.failedToDeleteObject"),
						I18n.getText("error.perun.failedToDeleteObject"));
			}
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(),
					"error.perun.failedToDeleteObject");
		}
		return Response.status(200).entity(jrh.getAll().toString()).type(MediaType.APPLICATION_JSON).build();
	}

	/**
	 * WS that generates PDF reports
	 * 
	 * @param sessionId   Session object ID
	 * @param objectId    Input object ID parameter
	 * @param fileType    PDF
	 * @param reportName  Name of report
	 * @param httpRequest
	 * @return
	 */
	@GET
	@Path("/Generate/report/sessionId/{sessionId}/objectId/{objectId}/reportName/{reportName}/fileType/{fileType}")
	@Produces("application/pdf")
	public Response generateAndUploadPdfOrExcel(@PathParam("sessionId") final String sessionId,
			@PathParam("objectId") final Long objectId, @PathParam("fileType") final String fileType,
			@PathParam("reportName") final String reportName, @Context HttpServletRequest httpRequest) {
		String errMsg = "error.perun.failedToGeneratePdf";
		Boolean shouldGenerate = false;
		final ByteArrayOutputStream bstr = new ByteArrayOutputStream();
		try (SvReader svr = new SvReader(sessionId)) {
			String printParam = SvConf.getParam("print.jrxml_path");
			Properties rb = setReportProperties(reportName, printParam, objectId, svr);
			com.prtech.svarog.printer.GeneratePrint2.executeReport(rb, reportName, fileType, bstr, svr.dbGetConn());
			shouldGenerate = true;
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(),
					"error.perun.failedToGeneratePdf");
		}
		if (shouldGenerate) {
			StreamingOutput fileStream = new StreamingOutput() {
				@Override
				public void write(java.io.OutputStream output) throws IOException {
					try (SvReader svr = new SvReader(sessionId);) {
						byte[] data = bstr.toByteArray();
						IOUtils.write(data, output);
					} catch (Exception e) {
						log4j.error("Error occurred while printing PDF/Excel!", e);
					}
				}
			};
			return Response.ok(fileStream, MediaType.APPLICATION_OCTET_STREAM)
					.header("content-disposition", "attachment; filename = " + reportName + ".pdf").build();
		} else {
			return Response.status(500).entity(errMsg).type(MediaType.APPLICATION_JSON).build();
		}
	}

	public static Properties setReportProperties(String reportName, String reportPath, Long objectId, SvReader svr) {
		Properties prop = new Properties();
		prop.put("path", reportPath + CC.PATH_DELIMITER);
		switch (reportName) {
		case "parcels_changes":
			prop.put("OBJ_ID", objectId);
			break;
		case "parcels_identification":
			prop.put("OBJ_ID", objectId);
			break;
		default:
			break;
		}
		return prop;
	}
}
