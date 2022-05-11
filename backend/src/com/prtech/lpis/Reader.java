package com.prtech.lpis;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;

import org.joda.time.DateTime;

import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvException;
import com.prtech.svarog.SvReader;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;

public class Reader {
	SvCore svc = null;

	public Reader(SvCore svc) {
		this.svc = svc;
	}

	public DbDataArray getParcels(Long farmId, DateTime refDate, boolean includeGeometries) throws SvException {
		try (SvReader svr = new SvReader(svc)) {
			svr.setIncludeGeometries(includeGeometries);
			// load parcels, common use and intersections
			DbDataArray dbArr = svr.getObjectsByParentId(farmId, SvCore.getTypeIdByName(CC.AGRI_PARCEL), null);
			DbDataArray dba = svr.getObjectsByParentId(farmId, SvCore.getTypeIdByName(CC.COMMON_USE), null);
			DbDataArray dbIntersect = svr.getObjectsByParentId(farmId, SvCore.getTypeIdByName(CC.LP_CAD_INTERSECTIONS),
					null);

			// add common use to the parcel list
			for (DbDataObject dbo : dba.getItems()) {
				DbDataObject dbp = svr.getObjectById((Long) dbo.getVal(CC.PARCEL_ID),
						SvCore.getTypeIdByName(CC.AGRI_PARCEL), null);
				if (dbp != null) {
					dbp.setVal(CC.ALLOWED_AREA, dbo.getVal(CC.ALLOWED_AREA));
					dbp.setVal(CC.COMMON_USE, true);
					dbArr.addDataItem(dbp);
				}
			}

			// deduplicate intersections
			Map<String, Long> dedupCadParcels = new HashMap<>();
			for (DbDataObject dbo : dbIntersect.getItems()) {
				if (dbo.getVal("LAND_PARCEL_ID") != null) {
					String cadParcel = ((String) dbo.getVal("MUNICIPALITY_NAME")) + "-"
							+ ((String) dbo.getVal("GR_PARCEL"));
					dedupCadParcels.put(cadParcel, (Long) dbo.getVal("LAND_PARCEL_ID"));
				}
			}
			// add intersections to the parcel list
			for (DbDataObject parcel : dbArr.getItems()) {
				Long landParcelId = (Long) parcel.getVal("OLD_ID");
				Iterator<Entry<String, Long>> it = dedupCadParcels.entrySet().iterator();
				StringBuilder sbt = new StringBuilder();
				while (it.hasNext()) {
					Entry<String, Long> e = it.next();
					if (e.getValue() != null && e.getValue().equals(landParcelId)) {
						sbt.append(e.getKey() + "; ");
						it.remove();
					}

				}
				parcel.setVal("PARCEL_INTERSECT", sbt.toString().trim());
			}
			return dbArr;
		}

	}
}
