package com.prtech.lpis;

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
			DbDataArray dbArr = svr.getObjectsByParentId(farmId, SvCore.getTypeIdByName(CC.AGRI_PARCEL), null);
			DbDataArray dba = svr.getObjectsByParentId(farmId, SvCore.getTypeIdByName(CC.COMMON_USE), null);
			for (DbDataObject dbo : dba.getItems()) {
				DbDataObject dbp = svr.getObjectById((Long) dbo.getVal(CC.PARCEL_ID),
						SvCore.getTypeIdByName(CC.AGRI_PARCEL), null);
				if (dbp != null) {
					dbp.setVal(CC.ALLOWED_AREA, dbo.getVal(CC.ALLOWED_AREA));
					dbp.setVal(CC.COMMON_USE, true);
					dbArr.addDataItem(dbp);
				}
			}
			return dbArr;	
		}

	}
}
