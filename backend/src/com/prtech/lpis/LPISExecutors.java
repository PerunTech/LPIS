package com.prtech.lpis;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;

import com.prtech.iacs.importer.Importer;
import com.prtech.svarog.SvConf;
import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvException;
import com.prtech.svarog.SvReader;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_interfaces.ISvCore;
import com.prtech.svarog_interfaces.ISvExecutorGroup;

public class LPISExecutors implements ISvExecutorGroup {
	private static List<String> names = new ArrayList<>(Arrays.asList(CC.PARCELS, CC.IMPORT));
	private static Map<String, Class<?>> returnTypes;
	private static Map<String, String> descriptions;
	static {
		returnTypes = new HashMap<>();
		returnTypes.put(CC.PARCELS, DbDataArray.class);
		returnTypes.put(CC.IMPORT, DbDataArray.class);

		descriptions = new HashMap<>();
		descriptions.put(CC.PARCELS,
				"Method which returns array of all parcels related to the farm identified by parameter FARM_ID");
		descriptions.put(CC.IMPORT, "Method which performs import of all farm parcels by FARM_ID ");

	}

	@Override
	public long versionUID() {
		return 2;
	}

	@Override
	public Map<String, Class<?>> getReturningTypes() {
		// TODO Auto-generated method stub
		return returnTypes;
	}

	@Override
	public String getCategory() {
		// TODO Auto-generated method stub
		return CC.LPIS;
	}

	@Override
	public List<String> getNames() {
		// TODO Auto-generated method stub
		return names;
	}

	@Override
	public Map<String, String> getDescriptions() {
		// TODO Auto-generated method stub
		return descriptions;
	}

	@Override
	public DateTime getStartDate() {
		// TODO Auto-generated method stub
		return DateTime.parse("2000-12-31T01:00:00.000+01:00");
	}

	@Override
	public DateTime getEndDate() {
		// TODO Auto-generated method stub
		return SvConf.MAX_DATE;
	}

	@Override
	public Object execute(String name, Map<String, Object> params, ISvCore svCore) throws SvException {
		Object result = null;
		switch (name) {
		case CC.PARCELS:
			Long farmId = (Long) params.get("FARM_ID");
			DateTime refDate = (DateTime) params.get("REFERENCE_DATE");
			Boolean inludeGeometries = (Boolean) params.get("INCLUDE_GEOMETRIES");
			result = new Reader((SvCore) svCore).getParcels(farmId, refDate, inludeGeometries);
			break;
		case CC.IMPORT:
			try (SvReader svr = new SvReader((SvCore) svCore);) {
				DbDataArray errorObjects = new DbDataArray();
				DbDataObject farm = svr.getObjectById((Long) params.get("farmId"), SvCore.getTypeIdByName("FARMER"),
						null);
				Importer.updateIACS((Long) farm.getVal("OLD_PKID"), "FARM_ID", svr, null, "VLPIS_IMP2", "AGRI_PARCEL",
						errorObjects);
				Importer.updateIACS((Long) farm.getVal("OLD_PKID"), "FARM_ID", svr, null, "VLPIS_DEL2", "AGRI_PARCEL",
						errorObjects);
				Importer.updateIACS((Long) farm.getVal("OLD_PKID"), "FARM_ID", svr, null, "VCOMMON_USE_IMP2",
						"COMMON_USE", errorObjects);
				Importer.updateIACS((Long) farm.getVal("OLD_PKID"), "FARM_ID", svr, null, "VCOMMON_USE_DEL2",
						"COMMON_USE", errorObjects);
				Importer.updateIACS((Long) farm.getVal("OLD_PKID"), "FARM_ID", svr, null, "VLP_CAD_INTERSECT_IMP2",
						"LP_CAD_INTERSECTIONS", errorObjects);
				Importer.updateIACS((Long) farm.getVal("OLD_PKID"), "FARM_ID", svr, null, "VLP_CAD_INTERSECT_DEL2",
						"LP_CAD_INTERSECTIONS", errorObjects);
				svr.dbCommit();
				result = errorObjects;
			}
			break;
		}
		return result;
	}

}
