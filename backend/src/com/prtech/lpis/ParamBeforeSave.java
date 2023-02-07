package com.prtech.lpis;

import org.apache.logging.log4j.Logger;
import org.joda.time.DateTime;
import org.joda.time.LocalDate;

import com.prtech.svarog.Sv;
import com.prtech.svarog.SvConf;
import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvException;
import com.prtech.svarog.SvParameter;
import com.prtech.svarog.SvReader;
import com.prtech.svarog.SvWriter;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_common.ISvOnSave;

public class ParamBeforeSave implements ISvOnSave {

	static final Logger log4j = SvConf.getLogger(ParamBeforeSave.class);

	@Override
	public boolean beforeSave(SvCore parentCore, DbDataObject dbo) throws SvException {
		// TODO Auto-generated method stub
		String name = (String) dbo.getVal(Sv.PARAM_NAME);
		String value = dbo.getVal(Sv.PARAM_VALUE) != null ? dbo.getVal(Sv.PARAM_VALUE).toString() : null;
		Long taskType = SvCore.getTypeIdByName(CC.LPIS_QA_TASKS);
		DbDataArray tasksToSave = new DbDataArray();
		boolean allowSave = true;
		if (CC.FARM_DIGITIZING_PARAM.equals(name) && CC.FALSE.equals(value)) {
			DateTime since = dbo.getDtInsert();
			DbDataArray list = new Reader(parentCore).getParcels(dbo.getParentId(), null, true);

			StringBuilder parcelIds = new StringBuilder();
			if (list.size() > 0) {
				try (SvReader svr = new SvReader(parentCore); SvWriter svw = new SvWriter(parentCore)) {
					DbDataArray tasks = svr.getObjectsByParentId(dbo.getParentId(), taskType, null);
					tasks.rebuildIndex("PARCEL_OBJ_ID", true);
					for (DbDataObject parcel : list.getItems()) {
						DbDataObject task = tasks.getItemByIdx(parcel.getObjectId().toString());
						if (task == null & parcel.getDtInsert().isAfter(dbo.getDtInsert())) {
							DbDataObject dbtask = new DbDataObject(taskType);
							dbtask.setVal("PARCEL_OBJ_ID", parcel.getObjectId());
							dbtask.setVal("CREATION_DATE", new LocalDate());
							dbtask.setVal("OLD_ID", parcel.getVal("OLD_ID"));
							tasksToSave.addDataItem(dbtask);
						}
					}
					if (tasksToSave.size() > 0) {
						svw.saveObject(tasksToSave);
					}
				} catch (SvException e) {
					log4j.error("Can't create QA tasks", e);
					allowSave = false;
				}
			}

		}
		return allowSave;
	}

	@Override
	public void afterSave(SvCore parentCore, DbDataObject dbo) throws SvException {
		// TODO Auto-generated method stub

	}

}
