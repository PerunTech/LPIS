package com.prtech.lpis;

import java.math.BigDecimal;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MultivaluedMap;

import com.google.gson.JsonObject;
import com.prtech.spatial.Util;
import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvException;
import com.prtech.svarog.SvGeometry;
import com.prtech.svarog.SvReader;
import com.prtech.svarog.SvWriter;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_common.DbSearchCriterion;
import com.prtech.svarog_common.DbSearchExpression;
import com.prtech.svarog_common.DbSearchCriterion.DbCompareOperand;

public class PermanentCrop {

	/**
	 * Method that return list of PERMANENT_CROP objects
	 * 
	 * @param parcelId Object ID of AGRI_PARCEL object
	 * @param svr      SvReader instance
	 * @return
	 * @throws SvException
	 */
	public DbDataArray getPermanentCrops(Long parcelId, SvReader svr) throws SvException {
		DbSearchCriterion cr = new DbSearchCriterion(CC.PARCEL_ID, DbCompareOperand.EQUAL, parcelId);
		return svr.getObjects(new DbSearchExpression().addDbSearchItem(cr), SvReader.getTypeIdByName(CC.PERMANENT_CROP),
				null, 0, 0);
	}

	/**
	 * Method that checks some conditions before saving a PERMANENT_CROP object
	 * 
	 * @param permanentCrop DbDataObject of PERMANENT_CROP
	 * @param svr           SvReader instance
	 * @throws SvException
	 */
	public void checkBeforeSavePermanentCrop(DbDataObject permanentCrop, SvReader svr) throws SvException {
		BigDecimal sumOfParcels = new BigDecimal((double) permanentCrop.getVal(CC.PLANT_AREA));
		DbDataObject agriParcel = svr.getObjectById((long) permanentCrop.getVal(CC.PARCEL_ID),
				SvReader.getTypeIdByName(CC.AGRI_PARCEL), null);
		if (agriParcel != null) {
			DbDataArray permanentCrops = getPermanentCrops(agriParcel.getObjectId(), svr);
			if (permanentCrops != null && !permanentCrops.getItems().isEmpty()) {
				for (DbDataObject tempPermanentCrop : permanentCrops.getItems()) {
					sumOfParcels = sumOfParcels.add((BigDecimal) tempPermanentCrop.getVal(CC.PLANT_AREA));
				}
				if (sumOfParcels.compareTo((BigDecimal) agriParcel.getVal(CC.AREA)) > 0) {
					throw new SvException("lpis.error.sumOfPermanentCropsAreaCannotBeBiggerThanParcelArea",
							svr.getInstanceUser());
				}
			}
		}
	}

	public DbDataObject savePermanentCrop(String token, Long objectId, Long parentId, JsonObject metadata)
			throws SvException {
		DbDataObject permanentCrop = null;

		try (SvReader svr = new SvReader(token);
				SvWriter svw = new SvWriter(svr);
				SvGeometry svg = new SvGeometry(svr)) {

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
			this.checkBeforeSavePermanentCrop(permanentCrop, svr);
			PermanentCrop.checkIfPlantAreaIsBiggerThanArea(permanentCrop, svr);
			svw.saveObject(permanentCrop);
		}
		return permanentCrop;
	}

	/**
	 * Method that checks if ALLOWED_AREA from PERMANENT_CROP is bigger than AREA
	 * from AGRI_PARCEL
	 * 
	 * @param permanentCrop DbDataObject of PERMANENT_CROP
	 * @param svr           SvReader instance
	 * @throws SvException
	 */
	public static void checkIfPlantAreaIsBiggerThanArea(DbDataObject permanentCrop, SvReader svr) throws SvException {
		DbDataObject agriParcel = svr.getObjectById((long) permanentCrop.getVal(CC.PARCEL_ID),
				SvReader.getTypeIdByName(CC.AGRI_PARCEL), null);
		if (agriParcel != null) {
			if (((BigDecimal) agriParcel.getVal(CC.AREA)).longValue() < ((Double) permanentCrop.getVal(CC.PLANT_AREA))
					.doubleValue()) {
				throw new SvException("lpis.error.plantAreaCannotBeBiggerThanArea", svr.getInstanceUser());
			}
		}
	}
}
