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
	
	public DbDataArray getPermanentCrops(Long parcelId, SvReader svr) throws SvException {
		DbSearchCriterion cr = new DbSearchCriterion(CC.PARCEL_ID, DbCompareOperand.EQUAL, parcelId);
		return svr.getObjects(new DbSearchExpression().addDbSearchItem(cr), SvReader.getTypeIdByName(CC.PERMANENT_CROP),
				null, 0, 0);
	}
	
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
}
