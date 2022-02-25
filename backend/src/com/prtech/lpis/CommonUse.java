package com.prtech.lpis;

import java.util.concurrent.locks.ReentrantLock;

import javax.ws.rs.core.MultivaluedMap;

import com.prtech.svarog.SvException;
import com.prtech.svarog.SvLock;
import com.prtech.svarog.SvReader;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_common.DbSearchCriterion;
import com.prtech.svarog_common.DbSearchExpression;
import com.prtech.svarog_common.DbSearchCriterion.DbCompareOperand;

public class CommonUse {
	public void calculateCommonUse(DbDataObject dbo, Long parcelId, MultivaluedMap<String, String> formVals,
			SvReader svr) throws SvException {
		if (parcelId != null) {
			DbDataObject agriParcel = svr.getObjectById(parcelId, SvReader.getTypeIdByName("AGRI_PARCEL"), null);
			dbo.setVal("PARCEL_ID", parcelId);
			String claimedArea = formVals.get("CLAIMED_AREA").get(0);
			String claimedRatio = formVals.get("CLAIMED_RATIO").get(0);

			if (!claimedArea.equals("") && !claimedArea.trim().equals("")) {
				Double convertedClaimedArea = Double.valueOf(claimedArea);
				Double agriParcelArea = (Double) agriParcel.getVal("AREA");
				Double allowedArea = convertedClaimedArea / agriParcelArea;
				dbo.setVal("PERCENTAGE", allowedArea);
				dbo.setVal("ALLOWED_AREA", Long.valueOf((long) (allowedArea * 100)));
			} else if (!claimedRatio.equals("") && !claimedRatio.trim().equals("")) {
				Double convertedRatio = Double.valueOf(claimedRatio);
				dbo.setVal("PERCENTAGE", convertedRatio);
				dbo.setVal("ALLOWED_AREA", convertedRatio * 100);
			}
		}
	}
	
	public DbDataArray getCommonUseParcels(Long parentId, Long parcelId, SvReader svr) throws SvException {
		DbDataArray finalArr = new DbDataArray();
		DbSearchCriterion cr1 = new DbSearchCriterion("PARCEL_ID", DbCompareOperand.EQUAL, parcelId);
		DbDataArray dbArr = svr.getObjects(new DbSearchExpression().addDbSearchItem(cr1),
				SvReader.getTypeIdByName("COMMON_USE"), null, 0, 0);
		if (dbArr != null && !dbArr.getItems().isEmpty()) {
			for (DbDataObject dboTemp : dbArr.getItems()) {
				if (dboTemp.getParentId().equals(parentId)) {
					finalArr.addDataItem(dboTemp);
				}
			}
		}
		return finalArr;
	}
	
	public boolean checkIfCommonUseCanBeSaved(Long parentId, Long parcelId, SvReader svr) throws SvException {
		ReentrantLock lock = null;
		Boolean canBeSaved = false;
		Double sumOfParcels = 0.0;
		DbDataObject agriParcel = svr.getObjectById(parcelId, SvReader.getTypeIdByName("AGRI_PARCEL"), null);
		try {
			if (agriParcel != null) {
				lock = SvLock.getLock(agriParcel.getObjectId().toString(), false, 0);
				if (lock != null) {
					DbDataArray commonsParcels = getCommonUseParcels(parentId, agriParcel.getObjectId(), svr);
					if (commonsParcels != null && !commonsParcels.getItems().isEmpty()) {
						for (DbDataObject dboCommonParcel : commonsParcels.getItems()) {
							sumOfParcels += Double.valueOf((String) dboCommonParcel.getVal("PERCENTAGE"));
						}
					}
					if (sumOfParcels < Double.valueOf((String) agriParcel.getVal("AREA"))) {
						canBeSaved = true;
					}
				}
			}
		} finally {
			if (lock != null) {
				SvLock.releaseLock(agriParcel.getObjectId().toString(), lock);
			}
		}
		return canBeSaved;
	}
}
