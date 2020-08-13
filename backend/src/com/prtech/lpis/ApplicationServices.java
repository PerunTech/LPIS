package com.prtech.lpis;

import java.util.List;
import java.util.Map.Entry;

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

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvGeometry;
import com.prtech.svarog.SvReader;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;

@Path("/lpis")
public class ApplicationServices {
	private static final Logger log = LogManager.getLogger(ApplicationServices.class.getName());
	
	@Path("/save/physicalBlock/{token}/{objectId}")
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces("text/html;charset=utf-8")
	public Response savePhysicalBlock(
			@PathParam("token") String token,
			@PathParam("objectId") Long objectId,
			MultivaluedMap<String, String> formVals,
			@Context HttpServletRequest httpRequest) {
		
		SvReader svr = null;
		SvGeometry svg = null;
		DbDataObject pb = null;
		String formData = "";
		JsonObject metadata = null;
		
		try {
			svr = new SvReader(token);
			svr.setIncludeGeometries(true);
			svg = new SvGeometry(svr);
			pb = new DbDataObject();
			Long typeId = SvCore.getTypeIdByName("PHYSICAL_BLOCK");
			DbDataArray fieldSet = SvCore.getFields(typeId);
			Gson gson = new Gson();
			boolean isUpdate = objectId.compareTo(0L) > 0 ? true : false;
			
			if (isUpdate) {
				pb = svr.getObjectById(objectId, typeId, null);
			} else {
				pb.setObjectId(0L);
				pb.setObjectType(typeId);
			}
			
			// handle empty, prep json, create data
			for (Entry<String, List<String>> entry : formVals.entrySet()) {
				if (entry.getKey() != null && !entry.getKey().isEmpty()) {
					String key = entry.getKey();
					formData = key;
				}
			}
			metadata = gson.fromJson(formData, JsonObject.class);
			
			// Map form values to dbo fields
			for (DbDataObject field : fieldSet.getItems()) {
				String fieldName = field.getVal("FIELD_NAME").toString();
				if (Util.excludeField(fieldName)
						&& !"".equalsIgnoreCase(field.getVal("FIELD_TYPE").toString())) {
					pb = Util.addValueToDataObject(pb, fieldName, field, metadata);
				}
			}
			
			SvGeometry.setGeometry(pb, Util.jsonToGeometry(metadata.get("GEOM")));
			svg.saveGeometry(pb);
		} catch (Exception e) {
			log.error("Failed saving physical block. " + e);
		}
		
		return Response.status(200).entity("".toString()).build();
	}
}
