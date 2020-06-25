package com.prtech.lpis.assets;

import java.util.ArrayList;

import com.prtech.svarog.SvConf;
import com.prtech.svarog_common.DbDataField;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_common.DbDataTable;
import com.prtech.svarog_common.IDbInit;
import com.prtech.svarog_common.DbDataField.DbFieldType;

public class DbInit implements IDbInit {
	
	static final String CONST_MASTER_REPO = "{MASTER_REPO}";
	static final String CONST_DEFAULT_SCHEMA = "{DEFAULT_SCHEMA}";
	static final String SRID = new Integer(SvConf.getSDISrid()).toString();
	
	public static DbDataTable createPhysicalBlock () {
		/* The flagship table of the project. */
		DbDataTable dbt = new DbDataTable();
		dbt.setDbTableName("PHYSICAL_BLOCK");
		dbt.setDbRepoName(CONST_MASTER_REPO);
		dbt.setDbSchema(CONST_DEFAULT_SCHEMA);
		dbt.setIsSystemTable(false);
		dbt.setIsRepoTable(false);
		dbt.setIsConfigTable(false);
		dbt.setLabel_code("physical_block.general");
		dbt.setUse_cache(true);
		
		/* C1N, [system, form-hidden] */
		DbDataField dbf1 = new DbDataField();
		dbf1.setDbFieldName("PKID");
		dbf1.setDbFieldType(DbFieldType.NUMERIC);
		dbf1.setIsPrimaryKey(true);
		dbf1.setDbFieldSize(18);
		dbf1.setDbFieldScale(0);
		dbf1.setIsNull(false);
		dbf1.setLabel_code("physical_block.pkid");

		/*
		 * C2, [read-write, not null, form-hidden]
		 * 
		 * Between all spatial columns specify geometry first, because GeoServer is silly like that.
		 * It will read the first spatial column it can find and disregard others.
		 */
		DbDataField dbf2 = new DbDataField();
		dbf2.setDbFieldName("GEOM");
		dbf2.setDbFieldType(DbFieldType.GEOMETRY);
		dbf2.setGeometryType("MULTIPOLYGON"); // allows holes, do not use Polygon.
		dbf2.setGeometrySrid(SRID);
		dbf2.setIndexName("pb_geom_sidx"); // name must be unique
		dbf2.setIsNull(false);
		dbf2.setLabel_code("sdi_common.geometry");

		/* C3 [read-write, not null, form-hidden], derivative of geometry. */
		DbDataField dbf3 = new DbDataField();
		dbf3.setDbFieldName("CENTROID");
		dbf3.setDbFieldType(DbFieldType.GEOMETRY);
		dbf3.setGeometryType("POINT");
		dbf3.setGeometrySrid(SRID);
		dbf3.setIndexName("pb_cnt_sidx");
		dbf3.setIsNull(false);
		dbf3.setLabel_code("sdi_common.centroid");
		
		return dbt;
	}

	@Override
	public ArrayList<DbDataTable> getCustomObjectTypes() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public ArrayList<DbDataObject> getCustomObjectInstances() {
		// TODO Auto-generated method stub
		return null;
	}
}
