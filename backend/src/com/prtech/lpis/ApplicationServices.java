package com.prtech.lpis;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.math.BigDecimal;
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
import java.util.LinkedHashMap;
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
import org.json.simple.JSONObject;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.prtech.perun_core.ws.Rc;
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
import com.prtech.svarog.SvLock;
import com.prtech.svarog.SvParameter;
import com.prtech.svarog.SvReader;
import com.prtech.svarog.SvSDITile;
import com.prtech.svarog.SvSDITile.SDIRelation;
import com.prtech.svarog.SvUtil;
import com.prtech.svarog.SvWriter;
import com.prtech.svarog.svCONST;
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
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.geom.util.GeometryExtracter;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.io.WKBReader;
import com.vividsolutions.jts.io.svarog_geojson.GeoJsonReader;
import com.vividsolutions.jts.operation.distance.DistanceOp;
import com.vividsolutions.jts.simplify.TopologyPreservingSimplifier;

@Path("/lpis")
public class ApplicationServices {
	static Geometry municipalities = null;
	static Map<Integer, ArrayList<Geometry>> municipalityMap = new HashMap<Integer, ArrayList<Geometry>>();

	static int minimumAgriParcelSize;
	static String externalIdSequence;
	static double simplifyTopoligyLevel;

	static final Logger log4j = SvConf.getLogger(ApplicationServices.class);
	static int precisionScale = 2;

	static {
		int i = (int) (SvConf.getSDIPrecision() / 10);
		String s = Integer.toString(i);
		precisionScale = s.length();
		try {
			simplifyTopoligyLevel = SvParameter.getSysParam(CC.SIMPLIFY_LEVEL, 1.0);

		} catch (SvException e) {
			log4j.error("Simplify level not set", e);
			simplifyTopoligyLevel = 1.0;
		}

		try {
			minimumAgriParcelSize = SvParameter.getSysParam(CC.MINIMUM_AGRI_PARCEL_SIZE, 100);
		} catch (SvException e) {
			log4j.error("Minimum Agri parcel size not size, defaulting to 100 sqm", e);
			minimumAgriParcelSize = 100;
		}
		try {
			externalIdSequence = SvParameter.getSysParam(CC.EXTERNAL_SEQ_NAME, CC.NO_SEQUENCE);
		} catch (SvException e) {
			log4j.error("No external sequence configured", e);
			externalIdSequence = CC.NO_SEQUENCE;
		}
	}

	static ArrayList<Geometry> getCadMunicipalities(Integer sector, String token) throws SvException, ParseException {
		ArrayList<Geometry> munics = municipalityMap.get(sector);
		if (munics == null || munics.size() < 1) {
			synchronized (ApplicationServices.class) {
				munics = new ArrayList<Geometry>();
				municipalityMap.putIfAbsent(sector, munics);
				Geometry geom = getCadMunicipalities(token);
				for (int i = 0; i < geom.getNumGeometries(); i++) {
					Geometry gg = geom.getGeometryN(i);
					Map<String, Object> js = (Map<String, Object>) gg.getUserData();
					Integer tmpSector = Integer.parseInt(js.get("ODDELENIE").toString());
					if (tmpSector.equals(sector)) {
						munics.add(gg);
					}

				}
			}
		}
		return munics;
	}

	static String loadCadMunicipalitiesRemote() throws SvException, ParseException {
		Geometry geom;
		String layer = SvConf.getParam("CAD_MUNICIPALITY_LAYER_NAME");
		String epsg = SvConf.getParam("CAD_PARCEL_LAYER_EPSG");
		String wfsUrl = SvConf.getParam("CAD_PARCEL_LAYER_WFS");
		String wfsUser = SvConf.getParam("CAD_PARCEL_LAYER_WFS_U");
		String wfsPass = SvConf.getParam("CAD_PARCEL_LAYER_WFS_P");
		String sshProxy = SvConf.getParam("CAD_PARCEL_LAYER_SSH_PROXY");
		String sshProxyUser = SvConf.getParam("CAD_PARCEL_LAYER_SSH_PROXY_USER");
		String sshProxyPass = SvConf.getParam("CAD_PARCEL_LAYER_SSH_PROXY_PASS");
		WFSReader wfs = new WFSReader(layer, epsg, wfsUrl);
		String extParams = "-oKexAlgorithms=+diffie-hellman-group1-sha1";
		String json = wfs.getWFSResponse(SvGeometry.getSysBoundary().getEnvelope(), sshProxy, sshProxyUser,
				sshProxyPass, wfsUser, wfsPass, extParams);

		return json;

	}

	static Geometry loadCadMunicipalities(String token) throws SvException, ParseException {
		Geometry geom = null;
		try (SvFileStore svf = new SvFileStore(token)) {
			DbDataArray files = svf.getFiles(SvCore.getDbtByName(CC.AGRI_PARCEL), "ATTACHMENT", null);
			for (DbDataObject dbf : files.getItems()) {
				if (CC.CAD_MUNICIPALITIES_FILENAME.equals(dbf.getVal(Sv.FILE_NAME))) {
					InputStream is = svf.getFileAsStream(dbf);
					InputStreamReader targetReader = new InputStreamReader(is);
					GeometryFactory gf = SvUtil.sdiFactory;
					GeoJsonReader gjr = new GeoJsonReader(gf);
					gjr.setUseFeatureType(true);
					gjr.setUsePropertiesAsUserData(true);
					geom = gjr.read(targetReader);

				}
			}

		}
		return geom;

	}

	static void saveCadMunicipalities(String token, String geoJson) throws SvException, ParseException {
		try (SvFileStore svf = new SvFileStore(token)) {
			DbDataObject dbo = new DbDataObject(svCONST.OBJECT_TYPE_FILE);
			dbo.setVal(Sv.FILE_TYPE, "ATTACHMENT");
			dbo.setVal(Sv.FILE_NAME, CC.CAD_MUNICIPALITIES_FILENAME);
			byte[] bytes = geoJson.getBytes();
			dbo.setVal(Sv.FILE_SIZE, bytes.length);
			svf.saveFile(dbo, SvCore.getDbtByName(CC.AGRI_PARCEL), bytes, true);
		}

	}

	static Geometry getCadMunicipalities(String token) throws SvException, ParseException {
		if (municipalities == null) {
			synchronized (ApplicationServices.class) {
				if (municipalities == null) {
					municipalities = loadCadMunicipalities(token);
					if (municipalities == null) {
						String json = loadCadMunicipalitiesRemote();
						GeometryFactory gf = SvUtil.sdiFactory;
						GeoJsonReader gjr = new GeoJsonReader(gf);
						gjr.setUseFeatureType(true);
						gjr.setUsePropertiesAsUserData(true);
						municipalities = gjr.read(json);
						saveCadMunicipalities(token, json);
					}
				}

			}
		}
		return municipalities;
	}

	@Path("/get/CadMunicipalities/{token}/{sectorId}")
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	public Response getMunicipalities(@PathParam("token") String token, @PathParam("sectorId") Integer sectorId,
			@Context HttpServletRequest httpRequest) {
		ResponseHandler jrh = new ResponseHandler();
		JsonArray ja = new JsonArray();
		try (SvGeometry svg = new SvGeometry(token)) {
			List<Geometry> geom = ApplicationServices.getCadMunicipalities(sectorId, token);

			for (Geometry gg : geom) {
				Map<String, Object> js = (Map<String, Object>) gg.getUserData();
				JsonObject jo = new JsonObject();
				String koId = js.get("SIFRA1").toString();
				koId = koId.substring(2);
				koId = Integer.toString(Integer.parseInt(koId));
				jo.addProperty(koId, js.get("NAZIV").toString());
				ja.add(jo);

			}

		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, jrh, token);
		}
		jrh.create(MessageType.ERROR, "operation.in.progress", "operation.in.progress", ja);
		return Response.ok().entity(jrh.getAll().toString()).build();

	}

	void setMetaData(Geometry g) {
		if (g.getUserData() != null) {
			if (g.getUserData() instanceof Map) {
				((Map) g.getUserData()).put("CENTROID", g.getCentroid());
			}
		}
	}

	@Path("/get/CadParcel/{token}/{sectorId}/{koId}/{parcelId}")
	@GET
	@Produces("application/pbf")
	public Response getParcel(@PathParam("token") String token, @PathParam("sectorId") String sectorId,
			@PathParam("koId") String koId, @PathParam("parcelId") String parcelId,
			@Context HttpServletRequest httpRequest) {
		final ArrayList<Geometry> geoms = new ArrayList<>();
		ResponseHandler jrh = new ResponseHandler();
		try (SvGeometry svg = new SvGeometry(token)) {
			String layer = SvConf.getParam("CAD_PARCEL_LAYER_NAME");
			String epsg = SvConf.getParam("CAD_PARCEL_LAYER_EPSG");
			String wfsUrl = SvConf.getParam("CAD_PARCEL_LAYER_WFS");
			String wfsUser = SvConf.getParam("CAD_PARCEL_LAYER_WFS_U");
			String wfsPass = SvConf.getParam("CAD_PARCEL_LAYER_WFS_P");
			String sshProxy = SvConf.getParam("CAD_PARCEL_LAYER_SSH_PROXY");
			String sshProxyUser = SvConf.getParam("CAD_PARCEL_LAYER_SSH_PROXY_USER");
			String sshProxyPass = SvConf.getParam("CAD_PARCEL_LAYER_SSH_PROXY_PASS");
			WFSReader wfs = new WFSReader(layer, epsg, wfsUrl);
			ArrayList<String> strl = new ArrayList<String>();
			strl.add(parcelId);
			String filter = wfs.buildOgcFilter(sectorId.toString(), koId.toString(), strl);
			System.out.println("WFS request:" + wfs.buildWfsRequestUrlFilter(filter));
			String extParams = "-oKexAlgorithms=+diffie-hellman-group1-sha1";
			String json = wfs.getWFSResponse(filter, sshProxy, sshProxyUser, sshProxyPass, wfsUser, wfsPass, extParams);
			GeometryFactory gf = SvUtil.sdiFactory;
			GeoJsonReader gjr = new GeoJsonReader(gf);
			gjr.setUseFeatureType(true);
			gjr.setUsePropertiesAsUserData(true);
			Geometry gc = gjr.read(json);
			if (gc.getGeometryType().equals("GeometryCollection")) {
				for (int j = 0; j < gc.getNumGeometries(); j++) {
					Geometry g = gc.getGeometryN(j);
					setMetaData(g);
					geoms.add(g);

				}
			} else {
				setMetaData(gc);
				geoms.add(gc);
			}

		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, jrh, token);
		}

		StreamingOutput pbfStream = new StreamingOutput() {
			public void write(OutputStream stream) throws IOException {
				GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
				enc.writeSvGeometry(geoms);
			};
		};
		return Response.ok(pbfStream, "application/pbf").build();

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

		final Set<Geometry> result = new HashSet<Geometry>();
		try (SvReader svr = new SvReader(token); SvGeometry svg = new SvGeometry(svr)) {
			svg.setAutoCommit(false);
			Geometry geom = Util.getInputGeometry(formVals, null);
			Long layerTypeId = SvCore.getTypeIdByName(objectName);
			List<DbDataObject> splitObject = new ArrayList<DbDataObject>();
			Set<Geometry> split = svg.splitGeometries((LineString) geom, layerTypeId, splitObject, false, SC.PARENT_ID,
					parentId, false);

			Point point = SvUtil.sdiFactory.createPoint(new Coordinate(x, y));
			Iterator<Geometry> gi = split.iterator();
			Geometry newGeometry = null;
			while (gi.hasNext()) {
				newGeometry = gi.next();
				if (newGeometry.covers(point))
					break;
				else
					newGeometry = null;
			}
			// TODO add calculus of overlaps
			if (newGeometry != null && splitObject.size() == 1) {
				DbDataObject dbo = splitObject.get(0);
				(new AgriParcel()).saveAgriParcel(svr, dbo.getObjectId(), dbo.getParentId(), 0, 0, 2, new JsonObject(),
						true, newGeometry);
				result.add(newGeometry);
				svg.dbCommit();
			}
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(), "lpis.error.splitParcel");
		}

		StreamingOutput pbfStream = new StreamingOutput() {
			public void write(OutputStream stream) throws IOException {
				GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
				enc.writeSvGeometry(result);
			};
		};
		return Response.ok(pbfStream, "application/pbf").build();		
		
	}

	@Path("/intersect/{token}/{objectName}/{objectId}/")
	@GET
	@Produces("application/pbf")
	public Response calculateParcelCadIntersection(@PathParam("token") String token,
			@PathParam("objectId") Long objectId, @PathParam("objectName") String objectName) {
		int lock = 0;
		Response response = null;
		try (SvReader svr = new SvReader(token)) {
			lock = SvLock.getDistributedLock("CAD-INTERSECT-" + objectId.toString());
			DbDataObject farm = svr.getObjectById(objectId, SvCore.getTypeIdByName(CC.FARMER), null);
			if (lock != 0) {
				(new AgriParcel()).performCadCalc(svr, farm.getObjectId(), SvCore.getTypeIdByName("CAD_PARCEL"));
				ResponseHandler jrh = new ResponseHandler();
				jrh.create(MessageType.SUCCESS, "lpis.intersections.calculated", "lpis.intersections.calculated",
						new JsonObject());
				response = Response.ok().entity(jrh.getAll().toString()).build();
			} else {
				ResponseHandler jrh = new ResponseHandler();
				jrh.create(MessageType.ERROR, "operation.in.progress", "operation.in.progress", new JsonObject());
				response = Response.ok().entity(jrh.getAll().toString()).build();
			}
		} catch (Exception e) {
			response = com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(), objectName);
		} finally {
			if (lock != 0)
				try {
					SvLock.releaseDistributedLock(lock);
				} catch (Exception e2) {
					log4j.error("Error releasing lock:" + lock, e2);
				}
		}

		return response;

	}

	@Path("/save/agriParcel/{token}/{objectId}/{parentId}/{cutPB}/{cutAP}/{alignAP}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	public Response saveAgriParcelToFarmExt(@PathParam("token") String token, @PathParam("objectId") Long objectId,
			@PathParam("parentId") Long parentId, @PathParam("cutPB") Integer cutPB, @PathParam("cutAP") Integer cutAP,
			@PathParam("alignAP") Integer alignAP, MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {
		final Set<Geometry> result = new HashSet<Geometry>();
		try (SvReader svr = new SvReader(token)) {

			JsonObject metadata = Util.dataToJson(formVals);
			(new AgriParcel()).saveAgriParcel(svr, objectId, parentId, cutPB, cutAP, alignAP, metadata, true, null);

		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(), "lpis.error.saveParcel");
		}

		StreamingOutput pbfStream = new StreamingOutput() {
			public void write(OutputStream stream) throws IOException {
				GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
				enc.writeSvGeometry(result);
			};
		};
		return Response.ok(pbfStream, "application/pbf").build();

	};

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
				if ((boolean) dbo.getVal(CC.COMMON_USE) && CommonUse.isParcelCU(dbo.getObjectId(), svr)) {
					errMsg = "{error:'err.parcel_common_use'}";
				} else if (dbo.getParentId().equals(0L)) {
					dbo.setParentId(farmId);
					dbo.setVal(CC.COMMON_USE, false);
					svg.setSkipSpatialValidations(true);
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
				DbDataArray dba = new DbDataArray();
				dba.addDataItem(dbo);
				AgriParcel ap = new AgriParcel();
				ap.deleteGeometry(svw, dba, false);
				svg.setSkipSpatialValidations(true);
				DbDataArray dbr = ap.removeOverlaps(svg, dbo);
				try {
					svg.setSkipSpatialValidations(true);
					svg.saveGeometry(dbr);
					svw.dbCommit();
				} catch (Exception e) {
					log4j.error("Error update overlap", e);
				}
			}

		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(), "lpis.error.delete_parcel");
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
					svg.setSkipSpatialValidations(true);
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

	@GET
	@Path("/get/parcel/{token}/{sizpId}")
	@Produces("application/pbf")
	public Response getParcelBySIZP(@PathParam("token") final String token, @PathParam("sizpId") final Long sizpId,
			MultivaluedMap<String, String> formVals, @Context HttpServletRequest httpRequest) {

		final DbDataArray result = new DbDataArray();
		try (SvReader svr = new SvReader(token)) {
			result.setItems(new AgriParcel().searchParcelBySIZP(svr, sizpId).getItems());
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(), "error.lpis.search_parcel");
		}

		if (!result.isEmpty()) {
			StreamingOutput pbfStream = new StreamingOutput() {
				public void write(OutputStream stream) throws IOException {
					GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
					enc.writeDbDataArray(result);
				};
			};
			return Response.ok(pbfStream, "application/pbf").build();
		} else
			return Response.status(500).entity("{error:err.no_parcel.found}").type(MediaType.APPLICATION_JSON).build();

//		return mergeGeometryImpl(token, objectName, false, lineStringWKT, formVals);

	}

	@GET
	@Path("/get/parcelHistory/{token}/{tableName}/{objectId}")
	@Produces("application/pbf")
	public Response getParcelHistory(@PathParam("token") final String token,
			@PathParam("tableName") final String tableName, @PathParam("objectId") final Long objectId,
			MultivaluedMap<String, String> formVals, @Context HttpServletRequest httpRequest) {

		final DbDataArray result = new DbDataArray();
		try (SvReader svr = new SvReader(token)) {
			svr.setIncludeGeometries(true);
			DbSearchCriterion cr1 = new DbSearchCriterion(Rc.OBJECT_ID, DbCompareOperand.EQUAL, objectId);
			DbSearchExpression expr = new DbSearchExpression().addDbSearchItem(cr1);
			DbDataArray dbArray = svr.getObjectsHistory(expr, SvReader.getTypeIdByName(tableName), 0, 0);

			for (DbDataObject dbo : dbArray.getItems()) {
				DbDataObject user = svr.getObjectById(dbo.getUserId(), svCONST.OBJECT_TYPE_USER, null);
				dbo.setVal(Sv.USER_NAME, user != null ? user.getVal(Sv.USER_NAME) : dbo.getUserId());
				DbDataObject farm = svr.getObjectById(dbo.getParentId(), SvCore.getTypeIdByName(CC.FARMER), null);
				attachOrgUnitName(svr, farm);
				dbo.setVal(CC.ORG_UNIT_NAME, farm.getVal(CC.ORG_UNIT_NAME));
				dbo.setVal("DT_INSERT", dbo.getDtInsert());

			}
			result.getItems().addAll(dbArray.getItems());
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(), "error.lpis.search_parcel");
		}

		if (!result.isEmpty()) {
			StreamingOutput pbfStream = new StreamingOutput() {
				public void write(OutputStream stream) throws IOException {
					GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
					enc.writeDbDataArray(result);
				};
			};
			return Response.ok(pbfStream, "application/pbf").build();
		} else
			return Response.status(500).entity("{error:err.no_parcel.found}").type(MediaType.APPLICATION_JSON).build();

//		return mergeGeometryImpl(token, objectName, false, lineStringWKT, formVals);

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
			Geometry pb = null;
			for (Geometry g : gg) {
				if (g.covers(point)) {
					pb = g;
					break;
				}
			}
			Geometry tmpb = pb;
			if (tmpb != null) {
				Long layerTypeId = SvCore.getTypeIdByName(objectName);
				Collection<Geometry> agriParcels = svg.getRelatedGeometries(pb, layerTypeId, SDIRelation.INTERSECTS,
						null, null, false);
				for (Geometry apc : agriParcels) {
					tmpb = tmpb.difference(apc);
					tmpb = LpisUtil.ensurePolygon(tmpb, point);
					if (tmpb == null)
						break;
				}
			}
			if (tmpb != null) {
				tmpb.setUserData(pb.getUserData());
				result.add(tmpb);
			} else
				result.add(pb);

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
	@Path("/geometry/merge/confirm/{token}/{objectName}/{parentId}")
	@Produces("application/pbf")
	public Response mergeGeometryConfirm(@PathParam("token") final String token,
			@PathParam("objectName") final String objectName, @PathParam("parentId") final Long parentId,
			MultivaluedMap<String, String> formVals, @Context HttpServletRequest httpRequest) {
		final Set<Geometry> result = new HashSet<Geometry>();
		try (SvGeometry svg = new SvGeometry(token)) {
			LineString lineString = (LineString) Util.getInputGeometry(formVals, null);

			result.add(new AgriParcel().mergeGeometryConfirm(svg, objectName, parentId, lineString, true));
		} catch (SvException e) {
			ResponseHandler jrh = new ResponseHandler();
			return com.prtech.perun_core.ws.Util.handleException(e, jrh, token);
		}

		StreamingOutput pbfStream = new StreamingOutput() {
			public void write(OutputStream stream) throws IOException {
				GeobufEncoder enc = new GeobufEncoder(stream, ApplicationServices.precisionScale);
				enc.writeSvGeometry(result);
			};
		};
		return Response.ok(pbfStream, "application/pbf").build();
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
	@Path("/info/physicalBlock/{token}/{objectName}/{x}/{y}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getPBGeometryInfo(@PathParam("token") final String token,
			@PathParam("objectName") final String objectName, @PathParam("x") final Double x,
			@PathParam("y") final Double y) {

		DbDataObject dbo = null;
		try (SvReader svr = new SvReader(token);
				SvWriter svw = new SvWriter(svr);
				SvGeometry svg = new SvGeometry(svr)) {
			svr.setIncludeGeometries(true);
			Point point = SvUtil.sdiFactory.createPoint(new Coordinate(x, y));
			Collection<Geometry> gg = getPhysicalBlock(svg, point.getEnvelopeInternal(), "ext_lpis.ilpis", "geometry");
			for (Geometry g : gg) {
				if (g.covers(point)) {
					dbo = (DbDataObject) g.getUserData();
				}
			}
		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(), "error.lpis.copy");
		}
		if (dbo != null)
			return Response.ok(dbo.toSimpleJson().toString(), MediaType.APPLICATION_JSON).build();
		else
			return Response.status(500).entity("{error:err.no_parcel.selected}").type(MediaType.APPLICATION_JSON)
					.build();
	}

	void attachOrgUnitName(SvReader svr, DbDataObject dboP) throws SvException {
		DbDataObject dbl = SvCore.getLinkType("POA", svCONST.OBJECT_TYPE_ORG_UNITS, dboP.getObjectType());
		DbDataArray ous = svr.getObjectsByLinkedId(dboP.getObjectId(), dboP.getObjectType(), dbl,
				svCONST.OBJECT_TYPE_ORG_UNITS, true, null, 0, 0, "VALID");
		String name = ous.size() > 0 ? (String) ous.get(0).getVal("NAME") : null;
		dboP.setVal(CC.ORG_UNIT_NAME, name);
	}

	@GET
	@Path("/info/agriParcel/{token}/{objectName}/{x}/{y}")
	@Produces(MediaType.APPLICATION_JSON)
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
					if (dboP != null)
						attachOrgUnitName(svr, dboP);

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
			overlaps = (new AgriParcel()).getOverlaps(svr, parcel);
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
			svg.setSkipSpatialValidations(true);
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

	public JsonObject parcelChecks(String token, JsonObject json) throws SvException, SQLException, ParseException {
		try (SvGeometry svg = new SvGeometry(token); SvReader svr = new SvReader(svg)) {
			svr.setIncludeGeometries(true);
			Long typeId = SvCore.getTypeIdByName(CC.AGRI_PARCEL);
			AgriParcel aps = new AgriParcel();

			Geometry geom = Util.jsonToGeometry(json.get("GEOM"));
			if (geom.getGeometryType().equals("LineString"))
				geom = aps.generatePolygon(svg, (LineString) geom, typeId);

			Long objectId = json.get("OBJECT_ID").getAsLong();
			Long parentId = json.get("parent_id").getAsLong();
			DbDataObject ap;
			if (objectId != null && objectId > 0L)
				ap = svr.getObjectById(objectId, typeId, null);
			else
				ap = new DbDataObject(typeId);
			// prepare the geometry for further processing
			if (geom.isValid())
				TopologyPreservingSimplifier.simplify(geom, 0.01);
			boolean isUpdate = (new com.prtech.spatial.ApplicationServices()).prepareGeometry(geom, ap, svg, true);

			geom = SvGeometry.getGeometry(ap);
			Collection<Geometry> gg = aps.getPBIntersections(svg, geom);
			boolean pbCover = false;
			for (Geometry pb : gg) {
				if (com.prtech.lpis.LpisUtil.coversWithTolerance(pb, geom, 0.01)) {
					pbCover = true;
					break;
				}
			}

			json.addProperty(CC.PHYSICAL_BLOCK_CHECK, !pbCover);

			Collection<Geometry> neighbours = aps.overlappedNeighbours(svg, geom, parentId, typeId);

			json.addProperty(CC.AGRI_PARCEL_CHECK, neighbours.size() > 0);
			Geometry bufferedAP = geom
					.buffer(SvParameter.getSysParam(CC.SDI_MERGE_TOLERANCE, CC.DEFAULT_MERGE_TOLERANCE));

			Collection<Geometry> neighboursNearBy = aps.overlappedNeighbours(svg, bufferedAP, parentId, typeId);

			Collection<Geometry> slivered = aps.potentialSliver(svg, geom, neighbours, neighboursNearBy);
			json.addProperty(CC.AGRI_PARCEL_NEIGHBOUR, slivered.size() > 0);
		}
		return json;
	}

	@Path("/check/AgriParcel/{token}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	public Response checkAgriParcel(@PathParam("token") String token, MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {

		Boolean result = false;
		JsonObject json = new JsonObject();

		ResponseHandler rhs = new ResponseHandler();
		try {

			json = Util.dataToJson(formVals);
			json = parcelChecks(token, json);

		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, new ResponseHandler(), "error.lpis.crosscheck");
		}
		if (json != null)
			return Response.ok(json.toString(), MediaType.APPLICATION_JSON).build();
		else
			return Response.status(500).entity("{error:err.no_parcel.selected}").type(MediaType.APPLICATION_JSON)
					.build();
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
			Collection<Geometry> gg = (new AgriParcel()).getPBIntersections(svg, gp);

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

	@Path("/get/cropList/{token}/land_parcel/{landParcelId}/year/{year}/basic/{includeOnlyBasic}/otsc/{includeOtscCrops}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	public Response getCropListByParcel(@PathParam("token") final String token, MultivaluedMap<String, String> formVals,
			@PathParam("landParcelId") final Long landParcelId, @PathParam("year") final Integer year,
			@PathParam("includeOnlyBasic") final Boolean includeOnlyBasic,
			@PathParam("includeOnlyBasic") final Boolean includeOtscCrops, @Context HttpServletRequest httpRequest) {

		return getCropList(token, landParcelId, null, year, includeOnlyBasic, includeOtscCrops);
	}

	Response getCropList(String token, Long landParcelId, Integer landCover, Integer year, Boolean includeOnlyBasic,
			Boolean includeOtscCrops) {

		JsonObject json = null;
		try (SvExecManager svx = new SvExecManager(token); SvReader svr = new SvReader(svx)) {
			if (landCover == null) {
				DbDataObject dbo = svr.getObjectById(landParcelId, SvCore.getDbtByName(CC.AGRI_PARCEL), null);
				if (dbo != null)
					landCover = Integer.parseInt((String) dbo.getVal("LAND_COVER_CODE"));
			}

			Map<String, Object> params = new HashMap<>();
			params.put("year", year);
			params.put("landCover", landCover);
			params.put("includeOnlyBasic", includeOnlyBasic);
			params.put("includeOtscCrops", includeOtscCrops);

			json = (JsonObject) svx.execute("LAND_USE.GET_LAND_USE_CODES", params, null);

		} catch (Exception e) {
			return com.prtech.perun_core.ws.Util.handleException(e, "Системска Грешка");

		}

		return Response.status(200).entity(json.toString()).build();
	}

	@Path("/get/cropList/{token}/land_cover/{landCover}/year/{year}/basic/{includeOnlyBasic}/otsc/{includeOtscCrops}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	public Response getCropList(@PathParam("token") final String token, MultivaluedMap<String, String> formVals,
			@PathParam("landCover") final Integer landCover, @PathParam("year") final Integer year,
			@PathParam("includeOnlyBasic") final Boolean includeOnlyBasic,
			@PathParam("includeOnlyBasic") final Boolean includeOtscCrops, @Context HttpServletRequest httpRequest) {
		return getCropList(token, null, landCover, year, includeOnlyBasic, includeOtscCrops);
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

	@GET
	@Path("/geometry/get/point/{token}/{objectName}/{x}/{y}")
	@Produces("application/pbf")
	public StreamingOutput getGeometry(@PathParam("token") final String token,
			@PathParam("objectName") final String objectName, @PathParam("x") final Double x,
			@PathParam("y") final Double y) {

		return new StreamingOutput() {
			public void write(OutputStream stream) {
				GeobufEncoder enc = new GeobufEncoder(stream, precisionScale);
				try (SvGeometry svg = new SvGeometry(token)) {
					Point point = SvUtil.sdiFactory.createPoint(new Coordinate(x, y));
					Long layerTypeId = SvCore.getTypeIdByName(objectName);
					Set<Geometry> geomArr = svg.getRelatedGeometries(point, layerTypeId, SDIRelation.INTERSECTS, null,
							null, false);
					double minPointDistance = SvParameter.getSysParam(Sv.SDI_MIN_POINT_DISTANCE,
							Sv.DEFAULT_MIN_POINT_DISTANCE);
					for (Geometry g : geomArr) {
						DbDataObject prc = (DbDataObject) g.getUserData();
						if (!g.isSimple() || !g.isValid() || Util.hasDuplicates((Polygon) g, minPointDistance))
							prc.setStatus(CC.TOPO_ERR);
					}

					enc.writeSvGeometry(geomArr);
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

	@Path("/get/farmerAssets/{token}/{objectId}/{typeName}")
	@GET
	@Produces("application/pbf")
	public Response getFarmerAssets(@PathParam("token") final String token, @PathParam("objectId") final Long objectId,
			@PathParam("typeName") final String typeName, @Context HttpServletRequest httpRequest) {

		final DbDataArray result = new DbDataArray();
		try (SvReader svr = new SvReader(token)) {
			result.setItems((new AgriParcel()).getAssetsList(svr, objectId, typeName).getItems());
			topoVerify(result);
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

	void topoVerify(DbDataArray result) throws SvException {
		double minPointDistance = SvParameter.getSysParam(Sv.SDI_MIN_POINT_DISTANCE, Sv.DEFAULT_MIN_POINT_DISTANCE);
		for (DbDataObject prc : result.getItems()) {
			Geometry g = SvGeometry.getGeometry(prc);
			if (!g.isSimple() || !g.isValid() || Util.hasDuplicates((Polygon) g, minPointDistance))
				prc.setStatus(CC.TOPO_ERR);
		}
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

		metadata = Util.dataToJson(formVals);
		try {
			DbDataObject result = (new PermanentCrop()).savePermanentCrop(token, objectId, parentId, metadata);
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
