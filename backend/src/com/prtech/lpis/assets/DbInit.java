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
	static final String SRID = Integer.valueOf(SvConf.getSDISrid()).toString();
	
	private static DbDataTable addSortOrder(DbDataTable dbtt) {
		Integer order = 100;
		if (dbtt.getDbTableFields() != null)
			for (DbDataField dbf : dbtt.getDbTableFields()) {
				if (dbf != null && dbf.getSort_order() == null) {
					dbf.setSort_order(order);
					order = order + 100;
				}
			}
		return dbtt;
	}
	
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
		dbf2.setLabel_code("common.geometry");

		/* C3 [read-write, not null, form-hidden], derivative of geometry. */
		DbDataField dbf3 = new DbDataField();
		dbf3.setDbFieldName("CENTROID");
		dbf3.setDbFieldType(DbFieldType.GEOMETRY);
		dbf3.setGeometryType("POINT");
		dbf3.setGeometrySrid(SRID);
		dbf3.setIndexName("pb_cnt_sidx");
		dbf3.setIsNull(false);
		dbf3.setLabel_code("common.centroid");
		
		/* C4 [read-write, not null, form-hidden], derivative of geometry. */
		DbDataField dbf4 = new DbDataField();
		dbf4.setDbFieldName("PERIMETER");
		dbf4.setDbFieldType(DbFieldType.NUMERIC);
		dbf4.setDbFieldSize(18);
		dbf4.setDbFieldSize(2);
		dbf4.setIsNull(false);
		dbf4.setLabel_code("common.perimeter");
		
		/* C5 [read-write, not null, form-hidden], derivative of geometry. */
		DbDataField dbf5 = new DbDataField();
		dbf5.setDbFieldName("AREA");
		dbf5.setDbFieldType(DbFieldType.NUMERIC);
		dbf5.setDbFieldSize(18);
		dbf5.setDbFieldSize(2);
		dbf5.setIsNull(false);
		dbf5.setLabel_code("common.area");
		
		/* C6 [read-write, not null, form-visible], essential alphanumerical data of this object.*/
		DbDataField dbf6 = new DbDataField();
		dbf6.setDbFieldName("LAND_COVER_CODE");
		dbf6.setDbFieldType(DbFieldType.NVARCHAR);
		dbf6.setDbFieldSize(50);
		dbf6.setIsNull(false);
		dbf6.setLabel_code("physical_block.land_cover_code");
		dbf6.setCode_list_user_code("LAND_COVER");
		
		/* C7 [read-write, can be null, form-visible] */
		DbDataField dbf7 = new DbDataField();
		dbf7.setDbFieldName("NOTE");
		dbf7.setDbFieldType(DbFieldType.NVARCHAR);
		dbf7.setDbFieldSize(2000);
		dbf7.setIsNull(true);
		dbf7.setLabel_code("common.note");
		
		/* C8 [system, form-hidden] */
		DbDataField dbf8 = new DbDataField();
		dbf8.setDbFieldName("OLD_ID");
		dbf8.setDbFieldType(DbFieldType.NUMERIC);
		dbf8.setDbFieldSize(18);
		dbf8.setDbFieldScale(0);
		dbf8.setIsNull(true);
		dbf8.setLabel_code("physical_block.old_id");

		DbDataField[] fieldList = new DbDataField[8];
		fieldList[0] = dbf1;
		fieldList[1] = dbf2;
		fieldList[2] = dbf3;
		fieldList[3] = dbf4;
		fieldList[4] = dbf5;
		fieldList[5] = dbf6;
		fieldList[6] = dbf7;
		fieldList[7] = dbf8;
		dbt.setDbTableFields(fieldList);
		
		return dbt;
	}

	@Override
	public ArrayList<DbDataTable> getCustomObjectTypes() {
		ArrayList<DbDataTable> dbtList = new ArrayList<DbDataTable>();
		dbtList.add(addSortOrder(DbInit.createPhysicalBlock()));
		
		return dbtList;
	}

	@Override
	public ArrayList<DbDataObject> getCustomObjectInstances() {
		return null;
	}
}
