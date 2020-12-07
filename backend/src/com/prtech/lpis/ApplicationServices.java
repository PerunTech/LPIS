package com.prtech.lpis;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.LinkedHashMap;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
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

import com.google.gson.JsonObject;
import com.prtech.spatial.geobuf.GeobufEncoder;
import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvException;
import com.prtech.svarog.SvGeometry;
import com.prtech.svarog.SvReader;
import com.prtech.svarog.SvSDITile.SDIRelation;
import com.prtech.svarog.SvUtil;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_common.SvCharId;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.Polygon;

@Path("/lpis")
public class ApplicationServices {
	private static final Logger log = LogManager.getLogger(ApplicationServices.class.getName());
	
	@Path("/save/physicalBlock/{token}/{objectId}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	public Response savePhysicalBlock(
			@PathParam("token") String token,
			@PathParam("objectId") Long objectId,
			MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {
		
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
				if (Util.excludeField(fieldName)
						&& !"".equalsIgnoreCase(field.getVal("FIELD_TYPE").toString())) {
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
	
	@Path("/save/agriParcel/{token}/{objectId}/{opType}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces("application/pbf")
	public StreamingOutput saveAgriParcel(
			@PathParam("token") String token,
			@PathParam("objectId") Long objectId,
			@PathParam("opType") Long opType,
			MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {
		
		return new StreamingOutput() {
			public void write(OutputStream stream) throws IOException {
				GeobufEncoder enc = new GeobufEncoder(stream, 10);
				SvReader svr = null;
				SvGeometry svg = null;
				DbDataObject ap = null;
				JsonObject metadata = new JsonObject();
				try {
					svr = new SvReader(token);
					svr.setIncludeGeometries(true);
					svg = new SvGeometry(svr);
					ap = new DbDataObject();
					DbDataArray geomArr = new DbDataArray();
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
							if ("Polygon".equalsIgnoreCase(geom.getGeometryType()))
								geom = SvUtil.sdiFactory.createMultiPolygon(new Polygon[] { (Polygon) geom });
							SvGeometry.setGeometry(ap, geom);
						} else if (opType.equals(2L)) {
							SvGeometry.setGeometry(ap, geom);
							Collection<Geometry> apCol = svg.cutGeomFromLayer(geom, typeId);
							Iterator<Geometry> it = apCol.iterator();
							while (it.hasNext()) {
								DbDataObject dbo = new DbDataObject();
 								Geometry g = it.next();
 								DbDataObject oldDbo = (DbDataObject) g.getUserData();
							
 								dbo.setValuesMap(oldDbo.getValuesMap());
 								if ("Polygon".equalsIgnoreCase(g.getGeometryType()))
 									g = SvUtil.sdiFactory.createMultiPolygon(new Polygon[] { (Polygon) g });
 								SvGeometry.setGeometry(dbo, g);
 								dbo.setObjectType(oldDbo.getObjectType());
 								dbo.setObjectId(oldDbo.getObjectId());
 								
 								Util.calculateGeometryDerivatives(dbo);
 								geomArr.addDataItem(dbo);
							}
						}
					} else {
						SvGeometry.setGeometry(ap, geom);
					}
					
					Util.calculateGeometryDerivatives(ap);
					geomArr.addDataItem(ap);
					
					svg.saveGeometry(geomArr);	
					enc.writeDbDataArray(geomArr);
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
	public Response checkPBContainsAP(
			@PathParam("token") String token,
			MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {
		
		Boolean result = false;
		SvGeometry svg = null;
		JsonObject json = null;
		
		try {
			svg = new SvGeometry(token);
			json = Util.dataToJson(formVals);
			
			ArrayList<Geometry> geoms = new ArrayList<>();
			geoms = svg.getRelatedGeometries(
					Util.jsonToGeometry(json.get("GEOM")),
					SvCore.getTypeIdByName("PHYSICAL_BLOCK"),
					SDIRelation.COVERS);

			result = geoms.size() == 1;	
		} catch (Exception e) {
			// TODO: handle exception
		}

		return Response.status(200).entity(result.toString()).build();
	}
	
	@Path("/check/APIntersectsAP/{token}/{isContained}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	public Response checkAPIntersectsAP(
			@PathParam("token") String token,
			@PathParam("isContained") Boolean isContained,
			MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {
		
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
			// In case of multiple blocks, use the block that lends maximum size to the parcel
			if (!isContained) {
				ArrayList<Geometry> blocks = new ArrayList<>();
				blocks = svg.getRelatedGeometries(
						geom,
						SvCore.getTypeIdByName("PHYSICAL_BLOCK"),
						SDIRelation.INTERSECTS);
			
				if (blocks.size() == 0) // Fix this abuse, eventually.
					return Response.status(401).entity("AP must be covered by PB.").build();
				
				for (Geometry block: blocks) {
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
			
			// Perform check if our parcel crosses with neighbouring parcels. 
			ArrayList<Geometry> neighbourAP = new ArrayList<>();
			neighbourAP = svg.getRelatedGeometries(
					containedAP,
					SvCore.getTypeIdByName("AGRI_PARCEL"),
					SDIRelation.INTERSECTS);

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
}
