package com.prtech.lpis;

import java.math.BigDecimal;
import java.util.concurrent.locks.ReentrantLock;

import javax.ws.rs.core.MultivaluedMap;

import com.prtech.svarog.SvException;
import com.prtech.svarog.SvLock;
import com.prtech.svarog.SvReader;
import com.prtech.svarog.SvWriter;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_common.DbSearchCriterion;
import com.prtech.svarog_common.DbSearchExpression;
import com.prtech.svarog_common.DbSearchCriterion.DbCompareOperand;

public class CommonUse {
	public void createCommonUseObject(DbDataObject dbo, Long parcelId, MultivaluedMap<String, String> formVals,
			SvReader svr) throws SvException {
		if (parcelId != null) {
			DbDataObject agriParcel = svr.getObjectById(parcelId, SvReader.getTypeIdByName(CC.AGRI_PARCEL), null);
			dbo.setVal(CC.PARCEL_ID, parcelId);
			String claimedArea = null;
			String claimedRatio = null;
			if (formVals.get(CC.CLAIMED_AREA) != null) {
				claimedArea = formVals.get(CC.CLAIMED_AREA).get(0);
			}
			if (formVals.get(CC.CLAIMED_RATIO) != null) {
				claimedRatio = formVals.get(CC.CLAIMED_RATIO).get(0);
			}
			if (claimedArea != null && !claimedArea.equals(CC.EMPTY_STRING)
					&& !claimedArea.trim().equals(CC.EMPTY_STRING)) {
				if (!isParsable(claimedArea))
					throw new SvException("lpis.error.not_parsable", svr.getInstanceUser());
				Double convertedClaimedArea = Double.valueOf(claimedArea);
				BigDecimal agriParcelArea = (BigDecimal) agriParcel.getVal(CC.AREA);
				Double percentage = convertedClaimedArea / agriParcelArea.doubleValue();
				dbo.setVal(CC.PERCENTAGE, percentage);
				dbo.setVal(CC.ALLOWED_AREA, Long.valueOf(claimedArea));
			} else if (claimedRatio != null && !claimedRatio.equals(CC.EMPTY_STRING)
					&& !claimedRatio.trim().equals(CC.EMPTY_STRING)) {
				String[] ratios = claimedRatio.split("/");
				if (isParsable(ratios[0]) && isParsable(ratios[1])) {
					dbo.setVal(CC.OWN_PARCEL_PARTS, Long.valueOf(ratios[0]));
					dbo.setVal(CC.TOTAL_PARCEL_PARTS, Long.valueOf(ratios[1]));
					dbo.setVal(CC.PERCENTAGE, Double.valueOf(ratios[0]) / Double.valueOf(ratios[1]));
					dbo.setVal(CC.ALLOWED_AREA, Long.valueOf(ratios[0]) / Long.valueOf(ratios[1]));
				} else {
					throw new SvException("lpis.error.not_parsable", svr.getInstanceUser());
				}

			}
		}
	}

	public static boolean isParsable(String input) {
		try {
			Double.parseDouble(input);
			return true;
		} catch (final NumberFormatException e) {
			return false;
		}
	}

	public DbDataArray getCommonUseParcels(Long parcelId, SvReader svr) throws SvException {
		DbSearchCriterion cr = new DbSearchCriterion(CC.PARCEL_ID, DbCompareOperand.EQUAL, parcelId);
		return svr.getObjects(new DbSearchExpression().addDbSearchItem(cr), SvReader.getTypeIdByName(CC.COMMON_USE),
				null, 0, 0);
	}

	public void saveCommonUseObject(DbDataObject dbo, Long parentId, Long parcelId,
			MultivaluedMap<String, String> formVals, SvWriter svw, SvReader svr) throws SvException {
		Long distributedLock = null;
		Double sumOfParcels = 0.0;
		DbDataObject agriParcel = svr.getObjectById(parcelId, SvReader.getTypeIdByName(CC.AGRI_PARCEL), null);
		try {
			if (agriParcel != null) {
				distributedLock = (long) SvLock.getDistributedLock(agriParcel.getObjectId().toString());
				if (distributedLock != null) {
					createCommonUseObject(dbo, parcelId, formVals, svr);
					DbDataArray commonsParcels = getCommonUseParcels(agriParcel.getObjectId(), svr);
					if (commonsParcels != null && !commonsParcels.getItems().isEmpty()) {
						for (DbDataObject tempCommonUse : commonsParcels.getItems()) {
							sumOfParcels += (Double) tempCommonUse.getVal(CC.PERCENTAGE);
						}
						if (sumOfParcels < 100) {
							svw.saveObject(dbo);
						}
					} else {
						svw.saveObject(dbo);
					}
				}
			}
		} finally {
			if (distributedLock != null) {
				SvLock.getDistributedLock(agriParcel.getObjectId().toString());
			}
		}
	}
}
