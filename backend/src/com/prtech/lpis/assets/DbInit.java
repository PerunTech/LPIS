package com.prtech.lpis.assets;

import java.util.ArrayList;

import com.prtech.lpis.CC;
import com.prtech.svarog.Sv;
import com.prtech.svarog.svCONST;
import com.prtech.svarog_common.DbDataField;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_common.DbDataTable;
import com.prtech.svarog_common.IDbInit;
import com.prtech.svarog_common.DbDataField.DbFieldType;

public class DbInit implements IDbInit {
	
	static final String CONST_MASTER_REPO = "{MASTER_REPO}";
	static final String CONST_DEFAULT_SCHEMA = "{DEFAULT_SCHEMA}";
	static final String SRID = "NULL";
	
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
	
	public static DbDataTable createAPOverlap () {
		DbDataTable dbt = new DbDataTable();
		dbt.setDbTableName(CC.AGRI_PARCEL_OVERLAP);
		dbt.setDbRepoName(CONST_MASTER_REPO);
		dbt.setDbSchema(CONST_DEFAULT_SCHEMA);
		dbt.setIsSystemTable(false);
		dbt.setIsRepoTable(false);
		dbt.setIsConfigTable(false);
		dbt.setLabel_code("ap_overlap.general");
		dbt.setUse_cache(true);
		
		/* C1N, [system, form-hidden] */
		DbDataField dbf1 = new DbDataField();
		dbf1.setDbFieldName("PKID");
		dbf1.setDbFieldType(DbFieldType.NUMERIC);
		dbf1.setIsPrimaryKey(true);
		dbf1.setDbFieldSize(18);
		dbf1.setDbFieldScale(0);
		dbf1.setIsNull(false);
		dbf1.setLabel_code("overlap.pkid");
		dbf1.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false,\"sortable\":true,"
				+ "\"isDefaultSort\":true,\"defaultSortDirection\":\"DESC\",}}");
		
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
		dbf2.setIndexName("GEOM_SIDX"); // name must be unique
		dbf2.setIsNull(false);
		dbf2.setLabel_code("common.geometry");
		dbf2.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");

		/* C3 [read-write, not null, form-hidden], derivative of geometry. */
		DbDataField dbf3 = new DbDataField();
		dbf3.setDbFieldName("CENTROID");
		dbf3.setDbFieldType(DbFieldType.GEOMETRY);
		dbf3.setGeometryType("POINT");
		dbf3.setGeometrySrid(SRID);
		dbf3.setIndexName("CNT_SIDX");
		dbf3.setIsNull(false);
		dbf3.setLabel_code("common.centroid");
		dbf3.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		/* C4 [read-write, not null, form-hidden], derivative of geometry. */
		DbDataField dbf4 = new DbDataField();
		dbf4.setDbFieldName("PERIMETER");
		dbf4.setDbFieldType(DbFieldType.NUMERIC);
		dbf4.setDbFieldSize(18);
		dbf4.setDbFieldScale(4);
		dbf4.setIsNull(false);
		dbf4.setLabel_code("common.perimeter");
		dbf4.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");
		
		/* C5 [read-write, not null, form-hidden], derivative of geometry. */
		DbDataField dbf5 = new DbDataField();
		dbf5.setDbFieldName("AREA");
		dbf5.setDbFieldType(DbFieldType.NUMERIC);
		dbf5.setDbFieldSize(18);
		dbf5.setDbFieldScale(4);
		dbf5.setIsNull(false);
		dbf5.setLabel_code("common.area");
		dbf5.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");
		
		/* C7 [read-write, can be null, form-visible] */
		DbDataField dbf7 = new DbDataField();
		dbf7.setDbFieldName("NOTE");
		dbf7.setDbFieldType(DbFieldType.NVARCHAR);
		dbf7.setDbFieldSize(2000);
		dbf7.setIsNull(true);
		dbf7.setLabel_code("common.note");
		dbf7.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":false,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":true}}");
		
		
		/* C1N, [system, form-hidden] */
		DbDataField dbf11 = new DbDataField();
		dbf11.setDbFieldName(CC.FARM_ID1);
		dbf11.setDbFieldType(DbFieldType.NUMERIC);
		dbf11.setIsPrimaryKey(true);
		dbf11.setDbFieldSize(18);
		dbf11.setDbFieldScale(0);
		dbf11.setIndexName("FARM_ID1_IDX");
		dbf11.setIsNull(false);
		dbf11.setLabel_code("overlap.farm1");
		dbf11.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false,\"sortable\":true,"
				+ "\"isDefaultSort\":true,\"defaultSortDirection\":\"DESC\",}}");
		
		/* C1N, [system, form-hidden] */
		DbDataField dbf12 = new DbDataField();
		dbf12.setDbFieldName(CC.PARCEL_ID1);
		dbf12.setDbFieldType(DbFieldType.NUMERIC);
		dbf12.setIsPrimaryKey(true);
		dbf12.setDbFieldSize(18);
		dbf12.setDbFieldScale(0);
		dbf12.setIsNull(false);
		dbf12.setLabel_code("overlap.parcel_id1");
		dbf12.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false,\"sortable\":true,"
				+ "\"isDefaultSort\":true,\"defaultSortDirection\":\"DESC\",}}");
		
		/* C1N, [system, form-hidden] */
		DbDataField dbf13 = new DbDataField();
		dbf13.setDbFieldName(CC.FARM_ID2);
		dbf13.setDbFieldType(DbFieldType.NUMERIC);
		dbf13.setIsPrimaryKey(true);
		dbf13.setDbFieldSize(18);
		dbf13.setDbFieldScale(0);
		dbf13.setIndexName("FARM_ID2_IDX");
		dbf13.setIsNull(false);
		dbf13.setLabel_code("overlap.farm1");
		dbf13.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false,\"sortable\":true,"
				+ "\"isDefaultSort\":true,\"defaultSortDirection\":\"DESC\",}}");
		
		/* C1N, [system, form-hidden] */
		DbDataField dbf14 = new DbDataField();
		dbf14.setDbFieldName(CC.PARCEL_ID2);
		dbf14.setDbFieldType(DbFieldType.NUMERIC);
		dbf14.setIsPrimaryKey(true);
		dbf14.setDbFieldSize(18);
		dbf14.setDbFieldScale(0);
		dbf14.setIsNull(false);
		dbf14.setLabel_code("overlap.parcel_id1");
		dbf14.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false,\"sortable\":true,"
				+ "\"isDefaultSort\":true,\"defaultSortDirection\":\"DESC\",}}");
		
		DbDataField[] fieldList = new DbDataField[10];
		fieldList[0] = dbf1;
		fieldList[1] = dbf2;
		fieldList[2] = dbf3;
		fieldList[3] = dbf4;
		fieldList[4] = dbf5;
		fieldList[5] = dbf7;
		
		fieldList[6] = dbf11;
		fieldList[7] = dbf12;
		fieldList[8] = dbf13;
		fieldList[9] = dbf14;
		dbt.setDbTableFields(fieldList);
		
		return dbt;
	}
	public static DbDataTable createPhysicalBlock () {
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
		dbf1.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false,\"sortable\":true,"
				+ "\"isDefaultSort\":true,\"defaultSortDirection\":\"DESC\",}}");
		
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
		dbf2.setIndexName("GEOM_SIDX"); // name must be unique
		dbf2.setIsNull(false);
		dbf2.setLabel_code("common.geometry");
		dbf2.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");

		/* C3 [read-write, not null, form-hidden], derivative of geometry. */
		DbDataField dbf3 = new DbDataField();
		dbf3.setDbFieldName("CENTROID");
		dbf3.setDbFieldType(DbFieldType.GEOMETRY);
		dbf3.setGeometryType("POINT");
		dbf3.setGeometrySrid(SRID);
		dbf3.setIndexName("CNT_SIDX");
		dbf3.setIsNull(false);
		dbf3.setLabel_code("common.centroid");
		dbf3.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		/* C4 [read-write, not null, form-hidden], derivative of geometry. */
		DbDataField dbf4 = new DbDataField();
		dbf4.setDbFieldName("PERIMETER");
		dbf4.setDbFieldType(DbFieldType.NUMERIC);
		dbf4.setDbFieldSize(18);
		dbf4.setDbFieldScale(4);
		dbf4.setIsNull(false);
		dbf4.setLabel_code("common.perimeter");
		dbf4.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");
		
		/* C5 [read-write, not null, form-hidden], derivative of geometry. */
		DbDataField dbf5 = new DbDataField();
		dbf5.setDbFieldName("AREA");
		dbf5.setDbFieldType(DbFieldType.NUMERIC);
		dbf5.setDbFieldSize(18);
		dbf5.setDbFieldScale(4);
		dbf5.setIsNull(false);
		dbf5.setLabel_code("common.area");
		dbf5.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");
		
		/* C6 [read-write, not null, form-visible], essential alphanumerical data of this object.*/
		DbDataField dbf6 = new DbDataField();
		dbf6.setDbFieldName("LAND_COVER_CODE");
		dbf6.setDbFieldType(DbFieldType.NVARCHAR);
		dbf6.setDbFieldSize(50);
		dbf6.setIsNull(false);
		dbf6.setLabel_code("physical_block.land_cover_code");
		dbf6.setCode_list_user_code("LAND_COVER");
		dbf6.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":true}}");
		
		/* C7 [read-write, can be null, form-visible] */
		DbDataField dbf7 = new DbDataField();
		dbf7.setDbFieldName("NOTE");
		dbf7.setDbFieldType(DbFieldType.NVARCHAR);
		dbf7.setDbFieldSize(2000);
		dbf7.setIsNull(true);
		dbf7.setLabel_code("common.note");
		dbf7.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":false,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":true}}");
		
		/* C8 [system, form-hidden] */
		DbDataField dbf8 = new DbDataField();
		dbf8.setDbFieldName("OLD_ID");
		dbf8.setDbFieldType(DbFieldType.NUMERIC);
		dbf8.setDbFieldSize(18);
		dbf8.setDbFieldScale(0);
		dbf8.setIsNull(true);
		dbf8.setLabel_code("physical_block.old_id");
		dbf8.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");

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
	
	public static DbDataTable createAgriParcel () {
		DbDataTable dbt = new DbDataTable();
		dbt.setDbTableName("AGRI_PARCEL");
		dbt.setDbRepoName(CONST_MASTER_REPO);
		dbt.setDbSchema(CONST_DEFAULT_SCHEMA);
		dbt.setIsSystemTable(false);
		dbt.setIsRepoTable(false);
		dbt.setIsConfigTable(false);
		dbt.setLabel_code("agri_parcel.general");
		dbt.setUse_cache(true);
		dbt.setParentName("FARMER");
		
		/* C1N, [system, form-hidden] */
		DbDataField dbf1 = new DbDataField();
		dbf1.setDbFieldName("PKID");
		dbf1.setDbFieldType(DbFieldType.NUMERIC);
		dbf1.setIsPrimaryKey(true);
		dbf1.setDbFieldSize(18);
		dbf1.setDbFieldScale(0);
		dbf1.setIsNull(false);
		dbf1.setLabel_code("agri_parcel.pkid");
		dbf1.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false,\"sortable\":true,"
				+ "\"isDefaultSort\":true,\"defaultSortDirection\":\"DESC\",}}");
		
		/**
		 * Geometry segment
		 */
		DbDataField dbf2 = new DbDataField();
		dbf2.setDbFieldName("GEOM");
		dbf2.setDbFieldType(DbFieldType.GEOMETRY);
		dbf2.setGeometryType("MULTIPOLYGON"); // allows holes, do not use Polygon.
		dbf2.setGeometrySrid(SRID);
		dbf2.setIndexName("_GEOM_SIDX"); // name must be unique
		dbf2.setIsNull(false);
		dbf2.setLabel_code("common.geometry");
		dbf2.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");

		/* C3 [read-write, not null, form-hidden], derivative of geometry. */
		DbDataField dbf3 = new DbDataField();
		dbf3.setDbFieldName("CENTROID");
		dbf3.setDbFieldType(DbFieldType.GEOMETRY);
		dbf3.setGeometryType("POINT");
		dbf3.setGeometrySrid(SRID);
		dbf3.setIndexName("_CNT_SIDX");
		dbf3.setIsNull(false);
		dbf3.setLabel_code("common.centroid");
		dbf3.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		/* C4 [read-write, not null, form-hidden], derivative of geometry. */
		DbDataField dbf4 = new DbDataField();
		dbf4.setDbFieldName("PERIMETER");
		dbf4.setDbFieldType(DbFieldType.NUMERIC);
		dbf4.setDbFieldSize(18);
		dbf4.setDbFieldScale(4);
		dbf4.setIsNull(false);
		dbf4.setLabel_code("common.perimeter");
		dbf4.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		/* C5 [read-write, not null, form-hidden], derivative of geometry. */
		DbDataField dbf5 = new DbDataField();
		dbf5.setDbFieldName("AREA");
		dbf5.setDbFieldType(DbFieldType.NUMERIC);
		dbf5.setDbFieldSize(18);
		dbf5.setDbFieldScale(4);
		dbf5.setIsNull(false);
		dbf5.setLabel_code("common.area");
		dbf5.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");
		
		/* C5 [read-write, not null, form-hidden], derivative of geometry. */
		DbDataField dbf29 = new DbDataField();
		dbf29.setDbFieldName("ALLOWED_AREA");
		dbf29.setDbFieldType(DbFieldType.NUMERIC);
		dbf29.setDbFieldSize(18);
		dbf29.setDbFieldScale(4);
		dbf29.setIsNull(true);
		dbf29.setLabel_code("allowed.area");
		dbf29.setSort_order(120);
		dbf29.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");
		
		/**
		 * Primary data
		 */
		DbDataField dbf6 = new DbDataField();
		dbf6.setDbFieldName("LAND_COVER_CODE");
		dbf6.setDbFieldType(DbFieldType.NVARCHAR);
		dbf6.setDbFieldSize(50);
		dbf6.setIsNull(false);
		dbf6.setLabel_code("agri_parcel.land_cover_code");
		dbf6.setCode_list_user_code("LAND_COVER");
		dbf6.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");
		
		DbDataField dbf7 = new DbDataField();
		dbf7.setDbFieldName("HOME_NAME");
		dbf7.setDbFieldType(DbFieldType.NVARCHAR);
		dbf7.setDbFieldSize(2000);
		dbf7.setIsNull(true);
		dbf7.setLabel_code("agri_parcel.home_name");
		dbf7.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");
		
		DbDataField dbf8 = new DbDataField();
		dbf8.setDbFieldName("NOTE_INSERT");
		dbf8.setDbFieldType(DbFieldType.NVARCHAR);
		dbf8.setDbFieldSize(2000);
		dbf8.setIsNull(true);
		dbf8.setLabel_code("agri_parcel.note_insert");
		dbf8.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		DbDataField dbf9 = new DbDataField();
		dbf9.setDbFieldName("NOTE_FARMER");
		dbf9.setDbFieldType(DbFieldType.NVARCHAR);
		dbf9.setDbFieldSize(2000);
		dbf9.setIsNull(true);
		dbf9.setLabel_code("agri_parcel.note_farmer");
		dbf9.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		DbDataField dbf10 = new DbDataField();
		dbf10.setDbFieldName("NOTE_ORGANISATION");
		dbf10.setDbFieldType(DbFieldType.NVARCHAR);
		dbf10.setDbFieldSize(2000);
		dbf10.setIsNull(true);
		dbf10.setLabel_code("agri_parcel.note_organisation");
		dbf10.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		/**
		 * Supporting data 
		 */
		DbDataField dbf11 = new DbDataField();
		dbf11.setDbFieldName("LAND_COVER_CODE_2");
		dbf11.setDbFieldType(DbFieldType.NVARCHAR);
		dbf11.setDbFieldSize(50);
		dbf11.setIsNull(true);
		dbf11.setLabel_code("agri_parcel.land_cover_code_2");
		dbf11.setCode_list_user_code("LAND_COVER");
		dbf11.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		DbDataField dbf12 = new DbDataField();
		dbf12.setDbFieldName("KO_ID");
		dbf12.setDbFieldType(DbFieldType.NUMERIC);
		dbf12.setDbFieldSize(18);
		dbf12.setDbFieldScale(0);
		dbf12.setIsNull(true);	// this needs to be mandatory, but politics... 
		dbf12.setLabel_code("agri_parcel.cadastral_municipality");
		dbf12.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");
		
		DbDataField dbf13 = new DbDataField();
		dbf13.setDbFieldName("INVISIBLE_BORDER");
		dbf13.setDbFieldType(DbFieldType.BOOLEAN);
		dbf13.setIsNull(true);
		dbf13.setLabel_code("agri_parcel.invisible_border");
		dbf13.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		DbDataField dbf14 = new DbDataField();
		dbf14.setDbFieldName("CHANGED_BORDER");
		dbf14.setDbFieldType(DbFieldType.BOOLEAN);
		dbf14.setIsNull(true);
		dbf14.setLabel_code("agri_parcel.changed_border");
		dbf14.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		DbDataField dbf15 = new DbDataField();
		dbf15.setDbFieldName("IRRIGATION");
		dbf15.setDbFieldType(DbFieldType.BOOLEAN);
		dbf15.setIsNull(true);
		dbf15.setLabel_code("agri_parcel.irrigation");
		dbf15.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		DbDataField dbf16 = new DbDataField();
		dbf16.setDbFieldName("SLOPE_AVG");
		dbf16.setDbFieldType(DbFieldType.NUMERIC);
		dbf16.setDbFieldSize(18);
		dbf16.setDbFieldScale(0);
		dbf16.setIsNull(true);
		dbf16.setLabel_code("agri_parcel.slope_avg");
		dbf16.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		DbDataField dbf17 = new DbDataField();
		dbf17.setDbFieldName("TERRACE");
		dbf17.setDbFieldType(DbFieldType.BOOLEAN);
		dbf17.setIsNull(true);
		dbf17.setLabel_code("agri_parcel.terrace");
		dbf17.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		DbDataField dbf18 = new DbDataField();
		dbf18.setDbFieldName("PO_ID");
		dbf18.setDbFieldType(DbFieldType.NUMERIC);
		dbf18.setDbFieldSize(18);
		dbf18.setDbFieldScale(0);
		dbf18.setIsNull(true);
		dbf18.setLabel_code("agri_parcel.po_id");
		dbf18.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		DbDataField dbf19 = new DbDataField();
		dbf19.setDbFieldName("Z_AVG");
		dbf19.setDbFieldType(DbFieldType.NUMERIC);
		dbf19.setDbFieldSize(18);
		dbf19.setDbFieldScale(4);
		dbf19.setIsNull(true);
		dbf19.setLabel_code("agri_parcel.z_avg");
		dbf19.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");
		
		DbDataField dbf20 = new DbDataField();
		dbf20.setDbFieldName("EXPOSITION_AVG");
		dbf20.setDbFieldType(DbFieldType.NUMERIC);
		dbf20.setDbFieldSize(3);
		dbf20.setDbFieldScale(0);
		dbf20.setIsNull(true);
		dbf20.setLabel_code("agri_parcel.exposition_avg");
		dbf20.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		DbDataField dbf21 = new DbDataField();
		dbf21.setDbFieldName("LANDSCAPE_FEATURES");
		dbf21.setDbFieldType(DbFieldType.BOOLEAN);
		dbf21.setIsNull(true);
		dbf21.setLabel_code("agri_parcel.landscape_features");
		dbf21.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		DbDataField dbf22 = new DbDataField();
		dbf22.setDbFieldName("ELIGIBILITY_COEF");
		dbf22.setDbFieldType(DbFieldType.NUMERIC);
		dbf22.setDbFieldSize(3);
		dbf22.setDbFieldScale(0);
		dbf22.setIsNull(true);
		dbf22.setLabel_code("agri_parcel.eligibility_coef");
		dbf22.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");

		DbDataField dbf23 = new DbDataField();
		dbf23.setDbFieldName("COMMON_USE");
		dbf23.setDbFieldType(DbFieldType.BOOLEAN);
		dbf23.setIsNull(true);
		dbf23.setLabel_code("agri_parcel.common_use");
		dbf23.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");
		
		DbDataField dbf24 = new DbDataField();
		dbf24.setDbFieldName("CERTIFICATE_OF_USE");
		dbf24.setDbFieldType(DbFieldType.BOOLEAN);
		dbf24.setIsNull(true);
		dbf24.setLabel_code("agri_parcel.certificate_of_use");
		dbf24.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");
		
		DbDataField dbf25 = new DbDataField();
		dbf25.setDbFieldName("ORGANIC");
		dbf25.setDbFieldType(DbFieldType.BOOLEAN);
		dbf25.setIsNull(true);
		dbf25.setLabel_code("agri_parcel.organic");
		dbf25.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		DbDataField dbf26 = new DbDataField();
		dbf26.setDbFieldName("SOIL_TYPE");
		dbf26.setDbFieldType(DbFieldType.NVARCHAR);
		dbf26.setDbFieldSize(100);
		dbf26.setIsNull(true);
		dbf26.setLabel_code("agri_parcel.soil_types");
		dbf26.setCode_list_user_code("SOIL_TYPES");
		dbf26.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");
		
		DbDataField dbf27 = new DbDataField();
		dbf27.setDbFieldName("OLD_ID");
		dbf27.setDbFieldType(DbFieldType.NUMERIC);
		dbf27.setDbFieldSize(18);
		dbf27.setDbFieldScale(0);
		dbf27.setIsNull(true);
		dbf27.setLabel_code("agri_parcel.old_id");
		dbf27.setSort_order(110);
		
		DbDataField dbf28 = new DbDataField();
		dbf28.setDbFieldName("PARCEL_INTERSECT");
		dbf28.setDbFieldType(DbFieldType.NVARCHAR);
		dbf28.setDbFieldSize(2000);
		dbf28.setIsNull(true);
		dbf28.setLabel_code("agri_parcel.parcel_intersect");
		
		DbDataField dbf30 = new DbDataField();
		dbf30.setDbFieldName(CC.HAS_OVERLAP);
		dbf30.setDbFieldType(DbFieldType.BOOLEAN);
		dbf30.setIsNull(true);
		dbf30.setLabel_code("agri_parcel.has_overlap");
		dbf30.setSort_order(120);
		
		
		DbDataField[] fieldList = new DbDataField[30];
		fieldList[0] = dbf1;
		fieldList[1] = dbf2;
		fieldList[2] = dbf3;
		fieldList[3] = dbf4;
		fieldList[4] = dbf5;
		
		fieldList[5] = dbf6;
		fieldList[6] = dbf7;
		fieldList[7] = dbf8;
		fieldList[8] = dbf9;
		fieldList[9] = dbf10;
		
		fieldList[10] = dbf11;
		fieldList[11] = dbf12;
		fieldList[12] = dbf13;
		fieldList[13] = dbf14;
		fieldList[14] = dbf15;
		
		fieldList[15] = dbf16;
		fieldList[16] = dbf17;
		fieldList[17] = dbf18;
		fieldList[18] = dbf19;
		fieldList[19] = dbf20;
		
		fieldList[20] = dbf21;
		fieldList[21] = dbf22;
		fieldList[22] = dbf23;
		fieldList[23] = dbf24;
		fieldList[24] = dbf25;
		
		fieldList[25] = dbf26;
		fieldList[26] = dbf27;
		fieldList[27] = dbf28;
		fieldList[28] = dbf29;
		fieldList[29] = dbf30;

		dbt.setDbTableFields(fieldList);
		
		return dbt;	
	}

	public static DbDataTable createCommonUse() {
		DbDataTable dbt = new DbDataTable();
		dbt.setDbTableName("COMMON_USE");
		dbt.setDbRepoName(CONST_MASTER_REPO);
		dbt.setDbSchema(CONST_DEFAULT_SCHEMA);
		dbt.setIsSystemTable(false);
		dbt.setIsRepoTable(false);
		dbt.setIsConfigTable(false);
		dbt.setLabel_code("common_use.general");
		dbt.setUse_cache(true);
		dbt.setParentName("FARMER");

		DbDataField dbf1 = new DbDataField();
		dbf1.setDbFieldName("PKID");
		dbf1.setDbFieldType(DbFieldType.NUMERIC);
		dbf1.setIsPrimaryKey(true);
		dbf1.setDbFieldSize(18);
		dbf1.setDbFieldScale(0);
		dbf1.setIsNull(false);
		dbf1.setLabel_code("common_use.pkid");
		dbf1.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false,\"sortable\":true,"
				+ "\"isDefaultSort\":true,\"defaultSortDirection\":\"DESC\",}}");

		DbDataField dbf2 = new DbDataField();
		dbf2.setDbFieldName("PARCEL_ID");
		dbf2.setDbFieldType(DbFieldType.NUMERIC);
		dbf2.setDbFieldSize(18);
		dbf2.setIndexName("PARCEL_ID_IDX");
		dbf2.setLabel_code("common_use.parcel_id");
		dbf2.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");

		DbDataField dbf3 = new DbDataField();
		dbf3.setDbFieldName("OWN_PARCEL_PARTS");
		dbf3.setDbFieldType(DbFieldType.NUMERIC);
		dbf3.setDbFieldSize(18);
		dbf3.setLabel_code("common_use.own_parcel_parts");
		dbf3.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");

		DbDataField dbf4 = new DbDataField();
		dbf4.setDbFieldName("TOTAL_PARCEL_PARTS");
		dbf4.setDbFieldType(DbFieldType.NUMERIC);
		dbf4.setDbFieldSize(18);
		dbf4.setLabel_code("common_use.total_parcel_parts");
		dbf4.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");

		DbDataField dbf5 = new DbDataField();
		dbf5.setDbFieldName("ALLOWED_AREA");
		dbf5.setDbFieldType(DbFieldType.NUMERIC);
		dbf5.setDbFieldSize(18);
		dbf5.setIsNull(false);
		dbf5.setLabel_code("common_use.allowed_area");
		dbf5.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");

		DbDataField dbf6 = new DbDataField();
		dbf6.setDbFieldName("PERCENTAGE");
		dbf6.setDbFieldType(DbFieldType.NUMERIC);
		dbf6.setDbFieldSize(18);
		dbf6.setDbFieldScale(3);
		dbf6.setIsNull(false);
		dbf6.setLabel_code("common_use.percentage");
		dbf6.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");

		DbDataField[] fieldList = new DbDataField[6];
		fieldList[0] = dbf1;
		fieldList[1] = dbf2;
		fieldList[2] = dbf3;
		fieldList[3] = dbf4;
		fieldList[4] = dbf5;
		fieldList[5] = dbf6;

		dbt.setDbTableFields(fieldList);
		return dbt;
	}
	
	public static DbDataTable createPermanentCrop() {
		DbDataTable dbt = new DbDataTable();
		dbt.setDbTableName("PERMANENT_CROP");
		dbt.setDbRepoName(CONST_MASTER_REPO);
		dbt.setDbSchema(CONST_DEFAULT_SCHEMA);
		dbt.setIsSystemTable(false);
		dbt.setIsRepoTable(false);
		dbt.setIsConfigTable(false);
		dbt.setLabel_code("permanent_crop.general");
		dbt.setUse_cache(true);
		dbt.setParentName("FARMER");

		DbDataField dbf1 = new DbDataField();
		dbf1.setDbFieldName("PKID");
		dbf1.setDbFieldType(DbFieldType.NUMERIC);
		dbf1.setIsPrimaryKey(true);
		dbf1.setDbFieldSize(18);
		dbf1.setDbFieldScale(0);
		dbf1.setIsNull(false);
		dbf1.setLabel_code("permanent_crop.pkid");
		dbf1.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false,\"sortable\":true,"
				+ "\"isDefaultSort\":true,\"defaultSortDirection\":\"DESC\",}}");

		DbDataField dbf2 = new DbDataField();
		dbf2.setDbFieldName("PARCEL_ID");
		dbf2.setDbFieldType(DbFieldType.NUMERIC);
		dbf2.setDbFieldSize(18);
		dbf2.setIndexName("PARCEL_ID_IDX");
		dbf2.setLabel_code("permanent_crop.parcel_id");
		dbf2.setGui_metadata("{\"react\":{\"visible\":false,\"editable\":false}}");

		DbDataField dbf3 = new DbDataField();
		dbf3.setDbFieldName("NUMBER_OF_TREES");
		dbf3.setDbFieldType(DbFieldType.NUMERIC);
		dbf3.setDbFieldSize(18);
		dbf3.setLabel_code("permanent_crop.number_of_trees");
		dbf3.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");

		DbDataField dbf4 = new DbDataField();
		dbf4.setDbFieldName("PLANT_AREA");
		dbf4.setDbFieldType(DbFieldType.NUMERIC);
		dbf4.setDbFieldSize(18);
		dbf4.setLabel_code("permanent_crop.plant_area");
		dbf4.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");

		DbDataField dbf5 = new DbDataField();
		dbf5.setDbFieldName("TREES_DISTANCE");
		dbf5.setDbFieldType(DbFieldType.NUMERIC);
		dbf5.setDbFieldSize(18);
		dbf5.setLabel_code("permanent_crop.trees_distance");
		dbf5.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");

		DbDataField dbf6 = new DbDataField();
		dbf6.setDbFieldName("TREES_ROW_DISTANCE");
		dbf6.setDbFieldType(DbFieldType.NUMERIC);
		dbf6.setDbFieldSize(18);
		dbf6.setLabel_code("permanent_crop.trees_row_distance");
		dbf6.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");

		DbDataField dbf7 = new DbDataField();
		dbf7.setDbFieldName("YEAR_OF_PLANTING_TREES");
		dbf7.setDbFieldType(DbFieldType.NUMERIC);
		dbf7.setDbFieldSize(18);
		dbf7.setLabel_code("permanent_crop.year_of_planting_trees");
		dbf7.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");

		DbDataField dbf8 = new DbDataField();
		dbf8.setDbFieldName("PERM_CROP_TYPE_ID");
		dbf8.setDbFieldType(DbFieldType.NUMERIC);
		dbf8.setDbFieldSize(18);
		dbf8.setLabel_code("permanent_crop.perm_crop_type_id");
		dbf8.setIsNull(false);
		dbf8.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");

		DbDataField dbf9 = new DbDataField();
		dbf9.setDbFieldName("LPIS_PARCEL_ID");
		dbf9.setDbFieldType(DbFieldType.NUMERIC);
		dbf9.setDbFieldSize(18);
		dbf9.setLabel_code("common_use.lpis_parcel_id");
		dbf9.setGui_metadata("{\"react\":{\"filterable\":true,\"sortable\":true,\"visible\":true,"
				+ "\"resizable\":true,\"editable\":false}}");

		DbDataField[] fieldList = new DbDataField[9];
		fieldList[0] = dbf1;
		fieldList[1] = dbf2;
		fieldList[2] = dbf3;
		fieldList[3] = dbf4;
		fieldList[4] = dbf5;
		fieldList[5] = dbf6;
		fieldList[6] = dbf7;
		fieldList[7] = dbf8;
		fieldList[8] = dbf9;

		dbt.setDbTableFields(fieldList);
		return dbt;
	}
	
	@Override
	public ArrayList<DbDataTable> getCustomObjectTypes() {
		ArrayList<DbDataTable> dbtList = new ArrayList<DbDataTable>();
		dbtList.add(addSortOrder(DbInit.createPhysicalBlock()));
		dbtList.add(addSortOrder(DbInit.createAgriParcel()));
		dbtList.add(addSortOrder(DbInit.createCommonUse()));
		dbtList.add(addSortOrder(DbInit.createPermanentCrop()));
		dbtList.add(addSortOrder(DbInit.createAPOverlap()));
		return dbtList;
	}

	@Override
	public ArrayList<DbDataObject> getCustomObjectInstances() {
		ArrayList<DbDataObject> defaultObjests = new ArrayList<DbDataObject>();
		return defaultObjests;
	}
}
