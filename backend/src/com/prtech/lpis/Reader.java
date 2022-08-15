package com.prtech.lpis;

import java.lang.reflect.Array;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.joda.time.DateTime;

import com.prtech.svarog.Sv;
import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvException;
import com.prtech.svarog.SvReader;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_common.SvCharId;

public class Reader {
	SvCore svc = null;

	public Reader(SvCore svc) {
		this.svc = svc;
	}

	public DbDataArray getParcels(Long farmId, DateTime refDate, boolean includeGeometries) throws SvException {
		return getParcels(farmId, refDate, includeGeometries, false);
	}

	void addIntersections(DbDataArray parcels, DbDataArray intersections, boolean includeIntersectionDetails) {
		Map<Long, Object> tmpParcels = new HashMap<>();
		ArrayList<DbDataObject> tmpJoinedParcels = new ArrayList<>();
		if (includeIntersectionDetails)
			parcels.rebuildIndex("OLD_ID", true);
		for (DbDataObject dbo : intersections.getItems()) {
			if (dbo.getVal("LAND_PARCEL_ID") != null) {
				if (!includeIntersectionDetails) {
					StringBuilder existingParc = (StringBuilder) tmpParcels.get((Long) dbo.getVal("LAND_PARCEL_ID"));
					existingParc = (existingParc != null ? existingParc : new StringBuilder());
					existingParc.append(((String) dbo.getVal("MUNICIPALITY_NAME")) + "-"
							+ ((String) dbo.getVal(CC.GR_PARCEL)) + "; ");
					tmpParcels.put((Long) dbo.getVal("LAND_PARCEL_ID"), existingParc);
				} else {
					DbDataObject parcel = parcels.getItemByIdx(dbo.getVal("LAND_PARCEL_ID").toString());
					if (parcel != null) {
						DbDataObject newParcel = new DbDataObject(parcel.getObjectType(), parcel.getValuesMap());
						newParcel.setVal(CC.GR_PARCEL,  dbo.getVal(CC.GR_PARCEL));
						newParcel.setVal(CC.CAD_AREA, dbo.getVal(CC.CAD_AREA));
						newParcel.setVal(CC.FR_AREA, dbo.getVal(CC.FR_AREA));
						newParcel.setVal(CC.OVERLAP_AREA,dbo.getVal(Sv.AREA));
						newParcel.setVal(CC.MUNICIPALITY_NAME, dbo.getVal(CC.MUNICIPALITY_NAME));
						tmpJoinedParcels.add(newParcel);
						tmpParcels.put(parcel.getObjectId(), parcel);
					}
				}
			}
		}

		// add intersections to the parcel list
		if (!includeIntersectionDetails) {
			for (DbDataObject parcel : parcels.getItems()) {
				StringBuilder str = (StringBuilder) tmpParcels.get((Long) parcel.getVal("OLD_ID"));
				parcel.setVal("PARCEL_INTERSECT", str != null ? str.toString() : null);
			}
		} else {
			for (DbDataObject agriParcel : parcels.getItems()) {
				if (!tmpParcels.containsKey(agriParcel.getObjectId())) {
					tmpJoinedParcels.add(agriParcel);
				}
			}
			parcels.setItems(tmpJoinedParcels);
		}

	}

	public DbDataArray getParcels(Long farmId, DateTime refDate, boolean includeGeometries,
			boolean includeIntersectionDetails) throws SvException {
		try (SvReader svr = new SvReader(svc)) {
			svr.setIncludeGeometries(includeGeometries);
			// load parcels, common use and intersections
			DbDataArray parcels = svr.getObjectsByParentId(farmId, SvCore.getTypeIdByName(CC.AGRI_PARCEL), refDate);
			DbDataArray commonUse = svr.getObjectsByParentId(farmId, SvCore.getTypeIdByName(CC.COMMON_USE), refDate);
			DbDataArray dbIntersect = svr.getObjectsByParentId(farmId, SvCore.getTypeIdByName(CC.LP_CAD_INTERSECTIONS),
					null);

			// add common use to the parcel list
			for (DbDataObject dboCommonParcel : commonUse.getItems()) {
				DbDataObject dbp = svr.getObjectById((Long) dboCommonParcel.getVal(CC.PARCEL_ID),
						SvCore.getTypeIdByName(CC.AGRI_PARCEL), null);
				if (dbp != null) {
					Long allowedArea = ((BigDecimal) dbp.getVal(CC.AREA))
							.multiply(((BigDecimal) dboCommonParcel.getVal(CC.PERCENTAGE))).longValue();
					dbp.setVal(CC.ALLOWED_AREA, allowedArea);
					dbp.setVal(CC.COMMON_USE, true);
					parcels.addDataItem(dbp);
				}
			}

			// deduplicate intersections
			addIntersections(parcels, dbIntersect, includeIntersectionDetails);
			return parcels;
		}

	}
}
