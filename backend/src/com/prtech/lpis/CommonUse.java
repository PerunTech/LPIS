package com.prtech.lpis;

import java.math.BigDecimal;
import java.util.concurrent.locks.ReentrantLock;

import javax.ws.rs.core.MultivaluedMap;

import com.google.gson.JsonObject;
import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvException;
import com.prtech.svarog.SvGeometry;
import com.prtech.svarog.SvLock;
import com.prtech.svarog.SvReader;
import com.prtech.svarog.SvWriter;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_common.DbSearchCriterion;
import com.prtech.svarog_common.DbSearchExpression;
import com.prtech.svarog_common.DbSearchCriterion.DbCompareOperand;

public class CommonUse {
	
	/**
	 * Method that fills the COMMON_USE object fields
	 * 
	 * @param dbo
	 *            DbDataObject of COMMON_USE
	 * @param parcelId
	 *            Object ID of AGRI_PARCEL object
	 * @param formVals
	 *            MultivaluedMap with form data values
	 * @param metadata
	 *            Key of the MultiValuedMap as JSON object
	 * @param svr
	 *            SvReader instance
	 * @throws SvException
	 */
	public void createCommonUseObject(DbDataObject dbo, Long parcelId, MultivaluedMap<String, String> formVals,
			JsonObject metadata, SvReader svr) throws SvException {
		if (parcelId != null) {
			DbDataObject agriParcel = svr.getObjectById(parcelId, SvReader.getTypeIdByName(CC.AGRI_PARCEL), null);
			dbo.setVal(CC.PARCEL_ID, parcelId);
			String claimedArea = null;
			String claimedRatio = null;
			if (metadata.has(CC.CLAIMED_AREA)) {
				claimedArea = metadata.get(CC.CLAIMED_AREA).getAsString();
				if (!isParsable(claimedArea))
					throw new SvException("lpis.error.not_parsable", svr.getInstanceUser());
			}
			if (metadata.has(CC.CLAIMED_RATIO))
				claimedRatio = metadata.get(CC.CLAIMED_RATIO).getAsString();
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

	/**
	 * Method that checks if an input is parsable
	 * 
	 * @param input
	 * @return true for parsable, false for not parsable inputs
	 */
	public static boolean isParsable(String input) {
		try {
			Double.parseDouble(input);
			return true;
		} catch (final NumberFormatException e) {
			return false;
		}
	}

	/**
	 * Method that return DbDataArray of COMMON_USE. Additionally, adds the FIC
	 * and FULL_NAME of the FARM as fields.
	 * 
	 * @param parcelId
	 *            Object ID of the AGRI_PARCEL
	 * @param svr
	 *            SvReader instance
	 * @return DbDataArray of DbDataObject (COMMON_USE)
	 * @throws SvException
	 */
	public DbDataArray getCommonUseParcels(Long parcelId, SvReader svr) throws SvException {
		DbSearchCriterion cr = new DbSearchCriterion(CC.PARCEL_ID, DbCompareOperand.EQUAL, parcelId);

		DbDataArray cus = svr.getObjects(new DbSearchExpression().addDbSearchItem(cr),
				SvReader.getTypeIdByName(CC.COMMON_USE), null, 0, 0);
		for (DbDataObject dbo : cus.getItems()) {
			DbDataObject farm = svr.getObjectById(dbo.getParentId(), SvCore.getTypeIdByName(CC.FARMER), null);
			dbo.setVal(CC.FIC, farm.getVal(CC.FIC));
			dbo.setVal(CC.FULL_NAME, farm.getVal(CC.FULL_NAME));
		}
		return cus;
	}

	/**
	 * Method that saves the COMMON_USE object. Additionally, updates the
	 * AGRI_PARCEL object
	 * 
	 * @param dbo
	 *            DbDataObject of COMMON_USE
	 * @param parentId
	 *            Object ID of FARMER object
	 * @param parcelId
	 *            Object ID of AGRI_PARCEL object
	 * @param formVals
	 *            MultivaluedMap with form data values
	 * @param metadata
	 *            Key of the MultiValuedMap as JSON object
	 * @param svg
	 *            SvGeometry instance
	 * @param svw
	 *            SvWriter instance
	 * @param svr
	 *            SvReader instance
	 * @throws SvException
	 */
	public void saveCommonUseObject(DbDataObject dbo, Long parentId, Long parcelId,
			MultivaluedMap<String, String> formVals, JsonObject metadata, SvGeometry svg, SvWriter svw, SvReader svr)
			throws SvException {
		Integer distributedLock = 0;
		Double sumOfParcels = 0.0;
		DbDataObject agriParcel = svr.getObjectById(parcelId, SvReader.getTypeIdByName(CC.AGRI_PARCEL), null);
		svw.setAutoCommit(false);
		svg.setAutoCommit(false);
		try {
			if (agriParcel != null) {
				distributedLock = SvLock.getDistributedLock(agriParcel.getObjectId().toString());
				if (distributedLock != 0) {
					createCommonUseObject(dbo, parcelId, formVals, metadata, svr);
					checkIfAllowedAreaIsBiggerThanArea(dbo, svr);
					DbDataArray commonsParcels = getCommonUseParcels(agriParcel.getObjectId(), svr);
					if (commonsParcels != null && !commonsParcels.getItems().isEmpty()) {
						for (DbDataObject tempCommonUse : commonsParcels.getItems()) {
							sumOfParcels += ((BigDecimal) tempCommonUse.getVal(CC.PERCENTAGE)).doubleValue();
						}
						if (sumOfParcels < 100) {
							svw.saveObject(dbo);
						}
					} else {
						svw.saveObject(dbo);
					}
					if (agriParcel != null && agriParcel.getVal(CC.COMMON_USE) != null
							&& !(boolean) agriParcel.getVal(CC.COMMON_USE)) {
						agriParcel.setVal(CC.COMMON_USE, true);
						svg.saveGeometry(agriParcel);
					}
				}
			}
		} finally {
			if (distributedLock != 0) {
				SvLock.releaseDistributedLock(distributedLock);
			}
		}
	}

	/**
	 * Method that checks some conditions before saving a COMMON_USE object.
	 * Updates the AGRI_PARCEL parent ID
	 * 
	 * @param parcelId
	 *            Object ID of AGRI_PARCEL object
	 * @param farmId
	 *            Object ID of FARM object
	 * @param svr
	 *            SvReader instance
	 * @return
	 * @throws SvException
	 */
	public DbDataObject commonUseChecksBeforeSave(Long parcelId, Long farmId, SvReader svr) throws SvException {
		svr.setIncludeGeometries(true);
		DbDataObject agriParcel = svr.getObjectById(parcelId, SvReader.getTypeIdByName(CC.AGRI_PARCEL), null);
		if (agriParcel != null) {
			// if the parcel is under the current farm we want to convert it to
			// common use.
			if (agriParcel.getParentId().equals(farmId)) {
				agriParcel.setParentId(0L);
				return agriParcel;
			}
			if (!agriParcel.getParentId().equals(0L)) {
				throw new SvException("lpis.error.agriParcelAlreadyBelongsToAgriculturalHolding",
						svr.getInstanceUser());
			}
			if (!agriParcel.getVal(CC.LAND_COVER_CODE).toString().equalsIgnoreCase(CC.LAND_COVER_CODE_200)) {
				throw new SvException("lpis.error.onlyAgriParcelWithCode200CanBeUsedForCommonUse",
						svr.getInstanceUser());
			}
		}
		return agriParcel;
	}

	/**
	 * Method that checks if ALLOWED_AREA from COMMON_USE is bigger than AREA
	 * from AGRI_PARCEL
	 * 
	 * @param commonUse
	 *            DbDataObject of COMMON_USE
	 * @param svr
	 *            SvReader instance
	 * @throws SvException
	 */
	public static void checkIfAllowedAreaIsBiggerThanArea(DbDataObject commonUse, SvReader svr) throws SvException {
		DbDataObject agriParcel = svr.getObjectById((long) commonUse.getVal(CC.PARCEL_ID),
				SvReader.getTypeIdByName(CC.AGRI_PARCEL), null);
		if (agriParcel != null) {
			if (((BigDecimal) agriParcel.getVal(CC.AREA)).longValue() < ((Long) commonUse.getVal(CC.ALLOWED_AREA))) {
				throw new SvException("lpis.error.allowedAreaCannotBeBiggerThanArea", svr.getInstanceUser());
			}
		}
	}
}
