package com.prtech.lpis;

import java.math.BigDecimal;

import com.prtech.svarog.SvException;
import com.prtech.svarog.SvReader;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_common.DbSearchCriterion;
import com.prtech.svarog_common.DbSearchExpression;
import com.prtech.svarog_common.DbSearchCriterion.DbCompareOperand;

public class PermanentCrop {
	
	/**
	 * Method that return list of PERMANENT_CROP objects
	 * 
	 * @param parcelId
	 *            Object ID of AGRI_PARCEL object
	 * @param svr
	 *            SvReader instance
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
	 * @param permanentCrop
	 *            DbDataObject of PERMANENT_CROP
	 * @param svr
	 *            SvReader instance
	 * @throws SvException
	 */
	public void checkBeforeSavePermanentCrop(DbDataObject permanentCrop, SvReader svr) throws SvException {
		Long sumOfParcels = 0L;
		DbDataObject agriParcel = svr.getObjectById((long) permanentCrop.getVal(CC.PARCEL_ID),
				SvReader.getTypeIdByName(CC.AGRI_PARCEL), null);
		if (agriParcel != null) {
			DbDataArray permanentCrops = getPermanentCrops(agriParcel.getObjectId(), svr);
			if (permanentCrops != null && !permanentCrops.getItems().isEmpty()) {
				for (DbDataObject tempPermanentCrop : permanentCrops.getItems()) {
					sumOfParcels += (Long) tempPermanentCrop.getVal(CC.PLANT_AREA);
				}
				if (sumOfParcels > ((BigDecimal) agriParcel.getVal(CC.AREA)).longValue()) {
					throw new SvException("lpis.error.sumOfPermanentCropsAreaCannotBeBiggerThanParcelArea",
							svr.getInstanceUser());
				}
			}
		}
	}

	/**
	 * Method that checks if ALLOWED_AREA from PERMANENT_CROP is bigger than
	 * AREA from AGRI_PARCEL
	 * 
	 * @param permanentCrop
	 *            DbDataObject of PERMANENT_CROP
	 * @param svr
	 *            SvReader instance
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
