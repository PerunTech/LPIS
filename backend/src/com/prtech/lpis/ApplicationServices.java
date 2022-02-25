package com.prtech.lpis;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

import org.apache.logging.log4j.LogManager;
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
import com.prtech.svarog.SvExecManager;
import com.prtech.svarog.SvGeometry;
import com.prtech.svarog.SvReader;
import com.prtech.svarog.SvSDITile;
import com.prtech.svarog.SvSDITile.SDIRelation;
import com.prtech.svarog.SvUtil;
import com.prtech.svarog.SvWriter;
import com.prtech.svarog.svCONST;
import com.prtech.svarog.DbCacheTable.DboComparator;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_common.ResponseHandler;
import com.prtech.svarog_common.ResponseHandler.MessageType;
import com.prtech.svarog_common.SvCharId;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.MultiPolygon;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.Polygon;

@Path("/lpis")
public class ApplicationServices {
	
	static int precisionScale = 2;

	static {
		int i = (int) (SvConf.getSDIPrecision() / 10);
		String s = Integer.toString(i);
		precisionScale = s.length();
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


	@Path("/split/agriParcel/{token}/{objectName}/{parentId}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces("application/pbf")
	public Response splitSpatialControl(@PathParam("token") final String token,
			@PathParam("objectName") final String objectName, @PathParam("parentId") final Long parentId,
			final MultivaluedMap<String, String> formVals, @Context HttpServletRequest httpRequest) {

		String errMsg = "";
		final Set<Geometry> result = new HashSet<Geometry>();
		try (SvReader svr = new SvReader(token); SvGeometry svg = new SvGeometry(svr)) {
			Geometry geom = Util.getInputGeometry(formVals, null);
			Long layerTypeId = SvCore.getTypeIdByName(objectName);
			List<DbDataObject> toBeDeleted = new ArrayList<DbDataObject>();
			Set<Geometry> split = svg.splitGeometries((LineString) geom, layerTypeId, toBeDeleted, false, SC.PARENT_ID,
					parentId, false);

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
				try (SvReader svr = new SvReader(token);SvGeometry svg = new SvGeometry(svr);){
					
					svr.setIncludeGeometries(true);
					ap = new DbDataObject();
					DbDataArray intersectArr = new DbDataArray();
					DbDataArray resultArr = new DbDataArray();
					Geometry geom = null;
					Long typeId = SvCore.getTypeIdByName("AGRI_PARCEL");
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
					isUpdate = (new com.prtech.spatial.ApplicationServices()).prepareGeometry(geom, ap, svg, false);
					geom = SvGeometry.getGeometry(ap);

					// Map form values to dbo fields
					for (DbDataObject field : fieldSet.getItems()) {
						String fieldName = field.getVal("FIELD_NAME").toString();
						if (Util.excludeField(fieldName)
								&& !"".equalsIgnoreCase(field.getVal("FIELD_TYPE").toString())) {
							ap = Util.addValueToDataObject(ap, fieldName, field, metadata);
						}
					}

					if (opType.equals(CC.CUTOFF)) {
						geom = svg.cutLayerFromGeom(geom, typeId);
						SvGeometry.setGeometry(ap, geom);
					} else {
						SvGeometry.setGeometry(ap, geom);
					}

					Util.calculateGeometryDerivatives(ap);
					resultArr.addDataItem(ap);
					svg.saveGeometry(ap);
					
					enc.writeDbDataArray(resultArr);
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
			};
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
				if (dbo.getParentId().equals(0L)) {
					dbo.setParentId(farmId);
					svw.saveObject(dbo, true);
					result.add(SvGeometry.getGeometry(dbo));
				} else
					errMsg = "{err.parcel_has_farm}";
			} else
				errMsg = "err.no_parcel.selected";
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

	@GET
	@Path("/remove/farm/{token}/{objectId}/{objectName}")
	@Produces("application/pbf")
	public Response deleteParcel(@PathParam("token") final String token, @PathParam("objectId") final Long objectId,
			@PathParam("objectName") final String objectName, MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {

		String errMsg = "";
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
				SvSDITile svTile = SvGeometry.getTile(SvCore.getTypeIdByName(objectName), (String) gTile.getUserData(), null);
				dbo.setParentId(0L);
				svg.saveObject(dbo, false);
				svTile.setIsTileDirty(true);
				svw.dbCommit();
			}

		} catch (SvException e) {
			errMsg = e.getJsonMessage();
		} catch (Exception e) {
			errMsg = e.getMessage();
		}
		if (errMsg.isEmpty()) {
			ResponseHandler rr = new ResponseHandler(MessageType.SUCCESS, "parcel.detached.from.farm");
			return Response.status(200).entity(rr.getAll().toString()).type(MediaType.APPLICATION_JSON).build();
		} else
			return Response.status(500).entity(errMsg).type(MediaType.APPLICATION_JSON).build();

//		return mergeGeometryImpl(token, objectName, false, lineStringWKT, formVals);

	}

	@POST
	@Path("/overlap/farm/{token}/{farmId}/{objectName}/{x}/{y}")
	@Produces("application/pbf")
	public Response overlapFarm(@PathParam("token") final String token, @PathParam("farmId") final Long farmId,
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
					errMsg = "success.overlap_created";
			} else
				errMsg = "err.no_parcel.selected";
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
	
	@Path("/save/commonUse/{token}/{objectId}/{parentId}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces("application/pbf")
	public Response saveCommonUse(@PathParam("token") final String token, @PathParam("objectId") final Long objectId,
			@PathParam("parentId") final Long parentId, MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {

		String errMsg = "";
		JsonObject metadata = new JsonObject();
		DbDataObject commonUse = null;
		try (SvReader svr = new SvReader(token);
				SvWriter svw = new SvWriter(svr);
				SvGeometry svg = new SvGeometry(svr)) {

			metadata = Util.dataToJson(formVals);
			commonUse = new DbDataObject();
			Long typeId = SvCore.getTypeIdByName("COMMON_USE");
			DbDataArray fieldSet = SvCore.getFields(typeId);
			boolean isUpdate = objectId.compareTo(0L) > 0 ? true : false;

			if (isUpdate) {
				commonUse = svr.getObjectById(objectId, typeId, null);
			} else {
				commonUse.setObjectId(0L);
				commonUse.setObjectType(objectId);
				commonUse.setParentId(parentId);
			}

			// Map form values to dbo fields
			for (DbDataObject field : fieldSet.getItems()) {
				String fieldName = field.getVal("FIELD_NAME").toString();
				if (Util.excludeField(fieldName) && !"".equalsIgnoreCase(field.getVal("FIELD_TYPE").toString())) {
					commonUse = Util.addValueToDataObject(commonUse, fieldName, field, metadata);
				}
			}
			svw.saveObject(commonUse);
		} catch (SvException e) {
			errMsg = e.getJsonMessage();
		} catch (Exception e) {
			errMsg = e.getMessage();
		}
		if (errMsg.isEmpty()) {
			ResponseHandler rr = new ResponseHandler(MessageType.SUCCESS, metadata.toString());
			return Response.status(200).entity(rr.getAll().toString()).type(MediaType.APPLICATION_JSON).build();
		} else
			return Response.status(500).entity(errMsg).type(MediaType.APPLICATION_JSON).build();

		// return mergeGeometryImpl(token, objectName, false, lineStringWKT,
		// formVals);
	}

	@Path("/save/agriParcel/{token}/{objectId}/{opType}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces("application/pbf")
	public StreamingOutput saveAgriParcel(@PathParam("token") String token, @PathParam("objectId") Long objectId,
			@PathParam("opType") Long opType, MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {

		return new StreamingOutput() {
			public void write(OutputStream stream) throws IOException {
				GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
				SvReader svr = null;
				SvGeometry svg = null;
				DbDataObject ap = null;
				JsonObject metadata = new JsonObject();
				try {
					svr = new SvReader(token);
					svr.setIncludeGeometries(true);
					svg = new SvGeometry(svr);
					ap = new DbDataObject();
					DbDataArray intersectArr = new DbDataArray();
					DbDataArray resultArr = new DbDataArray();
					Geometry geom = null;
					Long typeId = SvCore.getTypeIdByName("AGRI_PARCEL");
					DbDataArray fieldSet = SvCore.getFields(typeId);
					boolean isUpdate = objectId.compareTo(0L) > 0 ? true : false;
					metadata = Util.dataToJson(formVals);

					if (isUpdate) {
						ap = svr.getObjectById(objectId, typeId, null);
					} else {
						ap.setObjectId(0L);
						ap.setObjectType(typeId);
					}

					// Map form values to dbo fields
					for (DbDataObject field : fieldSet.getItems()) {
						String fieldName = field.getVal("FIELD_NAME").toString();
						if (Util.excludeField(fieldName)
								&& !"".equalsIgnoreCase(field.getVal("FIELD_TYPE").toString())) {
							ap = Util.addValueToDataObject(ap, fieldName, field, metadata);
						}
					}

					// Run cut operations with neighbour agri parcels.
					geom = Util.jsonToGeometry(metadata.get("GEOM"));
					if (opType > 0) {
						if (opType.equals(1L)) {
							geom = svg.cutLayerFromGeom(geom, typeId);
							SvGeometry.setGeometry(ap, geom);
						} else if (opType.equals(2L)) {
							SvGeometry.setGeometry(ap, geom);
							Collection<Geometry> apCol = svg.cutGeomFromLayer(geom, typeId);
							Iterator<Geometry> it = apCol.iterator();
							while (it.hasNext()) {
								Geometry g = it.next();
								DbDataObject dbo = (DbDataObject) g.getUserData();

								SvGeometry.setGeometry(dbo, g);

								Util.calculateGeometryDerivatives(dbo);
								intersectArr.addDataItem(dbo);
								resultArr.addDataItem(dbo);
							}

							svg.saveGeometry(intersectArr);
						}
					} else {
						SvGeometry.setGeometry(ap, geom);
					}

					Util.calculateGeometryDerivatives(ap);
					resultArr.addDataItem(ap);

					svg.saveGeometry(ap);
					enc.writeDbDataArray(resultArr);
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
					if (svg != null)
						svg.close();
					if (enc != null)
						enc.close();
					if (svr != null)
						svr.close();
				}
			};
		};
	}

	@Path("/check/PBContainsAP/{token}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	public Response checkPBContainsAP(@PathParam("token") String token, MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {

		Boolean result = false;
		SvGeometry svg = null;
		JsonObject json = null;

		try {
			svg = new SvGeometry(token);
			json = Util.dataToJson(formVals);

			Set<Geometry> geoms = new HashSet<Geometry>();
			geoms = svg.getRelatedGeometries(Util.jsonToGeometry(json.get("GEOM")),
					SvCore.getTypeIdByName("PHYSICAL_BLOCK"), SDIRelation.COVERS, null, null, true);

			result = geoms.size() == 1;
		} catch (Exception e) {
			// TODO: handle exception
		}

		return Response.status(200).entity(result.toString()).build();
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
			Set<Geometry> neighbourAP = new HashSet<>();
			neighbourAP = svg.getRelatedGeometries(containedAP, SvCore.getTypeIdByName("AGRI_PARCEL"),
					SDIRelation.INTERSECTS, null, null, true);

			// revert user data, do not return as part of json.
			containedAP.setUserData(null);
			json.addProperty("GEOM", Util.geometryToJson(containedAP));
			result = new JsonObject();
			result.add("layer", json);
			result.addProperty("check", neighbourAP.size() > 0);
		} catch (Exception e) {
			// TODO: handle exception
		} finally {
			if (svg != null) {
				svg.close();
			}
		}

		return Response.status(200).entity(result.toString()).build();
	}

	@Path("/get/farmerAssets/{token}/{objectId}/{typeName}")
	@GET
	@Produces("application/pbf")
	public StreamingOutput getFarmerAssets(@PathParam("token") final String token,
			@PathParam("objectId") final Long objectId, @PathParam("typeName") final String typeName,
			@Context HttpServletRequest httpRequest) {

		return new StreamingOutput() {
			public void write(OutputStream stream) {
				GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
				DbDataArray dbArr = new DbDataArray();
				DbDataArray assets = new DbDataArray();

				try (SvReader svr = new SvReader(token)) {
					svr.setIncludeGeometries(true);
					dbArr = svr.getObjectsByParentId(objectId, SvCore.getTypeIdByName(typeName), null);

					// Filter for campaign year and geometry not null, when cp is requested.
					if (typeName.equalsIgnoreCase("LAND_USE_PLAN")) {
						for (DbDataObject dbo : dbArr.getItems()) {
							String cYear = (String) dbo.getVal("CAMPAIGN_YEAR");
							String now = String.valueOf(new DateTime().year().get());
							Geometry g = SvGeometry.getGeometry(dbo);

							if (cYear != null && cYear.equals(now) && g != null) {
								assets.addDataItem(dbo);
							}
						}
						enc.writeDbDataArray(assets);
					} else {
						enc.writeDbDataArray(dbArr);
					}
				} catch (Exception e) {
					String errMsg = "Failed fetching geometry set. Please see server logs";
					if (e instanceof SvException)
						errMsg = ((SvException) e).getJsonMessage();
					try {
						stream.write(errMsg.getBytes(StandardCharsets.UTF_8));
					} catch (IOException ioe) {
						log.error("Stream closed, can't write error", ioe);
					}
					log.error(errMsg, e);
				}
			};
		};
	}
}
