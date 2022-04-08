package com.prtech.lpis;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;

import com.prtech.svarog.SvConf;
import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvException;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_interfaces.ISvCore;
import com.prtech.svarog_interfaces.ISvExecutorGroup;

public class LPISExecutors implements ISvExecutorGroup {
	private static List<String> names = new ArrayList<>(Arrays.asList(CC.PARCELS));
	private static Map<String, Class<?>> returnTypes;
	private static Map<String, String> descriptions;
	static {
		returnTypes = new HashMap<>();
		returnTypes.put(CC.PARCELS, DbDataArray.class);

		descriptions = new HashMap<>();
		descriptions.put(CC.PARCELS,
				"Method which returns array of all parcels related to the farm identified by parameter FARM_ID");

	}

	@Override
	public long versionUID() {
		return 1;
	}

	@Override
	public Map<String, Class<?>> getReturningTypes() {
		// TODO Auto-generated method stub
		return null;
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
		}
		return result;
	}

}
