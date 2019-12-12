package lpis.conf;

import java.util.ArrayList;

import com.prtech.svarog.SvConf;
import com.prtech.svarog.svCONST;
import com.prtech.svarog_common.DbDataField;
import com.prtech.svarog_common.DbDataField.DbFieldType;
import com.prtech.svarog_common.DbDataObject;
import com.prtech.svarog_common.DbDataTable;
import com.prtech.svarog_common.IDbInit;

public class DbInitCustom implements IDbInit {

	static final String CONST_GUI_FIL_VIS_RES_RW = "{\"react\":{\"filterable\":true,\"visible\":true,\"resizable\":true,\"editable\":true}}";
	static final String CONST_MASTER_REPO = "{MASTER_REPO}";
	static final String CONST_DEFAULT_SCHEMA = "{DEFAULT_SCHEMA}";

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

	// CAD_MUNIC
	public static DbDataTable createCadMunic() {
		DbDataTable dbe = new DbDataTable();
		dbe.setDbTableName("CAD_MUNIC");
		dbe.setDbRepoName(CONST_MASTER_REPO);
		dbe.setDbSchema(CONST_DEFAULT_SCHEMA);
		dbe.setIsSystemTable(false);
		dbe.setIsRepoTable(false);
		dbe.setLabel_code("cad_munic.general");
		dbe.setUse_cache(false);

		// Column 1N
		DbDataField dbe1 = new DbDataField();
		dbe1.setDbFieldName("PKID");
		dbe1.setIsPrimaryKey(true);
		dbe1.setDbFieldType(DbFieldType.NUMERIC);
		dbe1.setDbFieldSize(18);
		dbe1.setDbFieldScale(0);
		dbe1.setIsNull(false);
		dbe1.setLabel_code("land_use_plan.pkid");

		// Column 2
		DbDataField dbe2 = new DbDataField();
		dbe2.setDbFieldName("OSG_FID");
		dbe2.setDbFieldType(DbFieldType.NUMERIC);
		dbe2.setDbFieldSize(18);
		dbe2.setDbFieldScale(0);
		dbe2.setLabel_code("cad_munic.osg_fid");

		// Column 3
		DbDataField dbe3 = new DbDataField();
		dbe3.setDbFieldName("CODE");
		dbe3.setDbFieldType(DbFieldType.NUMERIC);
		dbe3.setDbFieldSize(18);
		dbe3.setDbFieldScale(0);
		dbe3.setLabel_code("cad_munic.code");

		// Column 4
		DbDataField dbe4 = new DbDataField();
		dbe4.setDbFieldName("LOCATION_LABEL");
		dbe4.setDbFieldType(DbFieldType.NVARCHAR);
		dbe4.setDbFieldSize(50);
		dbe4.setLabel_code("cad_munic.location_label");

		// Column 5
		DbDataField dbe5 = new DbDataField();
		dbe5.setDbFieldName("MUNIC_LABEL");
		dbe5.setDbFieldType(DbFieldType.NVARCHAR);
		dbe5.setDbFieldSize(50);
		dbe5.setLabel_code("cad_munic.munic_label");

		// Column 6
		DbDataField dbe6 = new DbDataField();
		dbe6.setDbFieldName("YEAR");
		dbe6.setDbFieldType(DbFieldType.NVARCHAR);
		dbe6.setDbFieldSize(4);
		dbe6.setLabel_code("cad_munic.year");

		// Column 7
		DbDataField dbe7 = new DbDataField();
		dbe7.setDbFieldName("PERIMETER");
		dbe7.setDbFieldType(DbFieldType.NUMERIC);
		dbe7.setDbFieldSize(9);
		dbe7.setDbFieldScale(0);
		dbe7.setLabel_code("cad_munic.perimeter");

		// Column 8
		DbDataField dbe8 = new DbDataField();
		dbe8.setDbFieldName("CENTROID");
		dbe8.setDbFieldType(DbFieldType.GEOMETRY);
		dbe8.setGeometryType("POINT");
		dbe8.setGeometrySrid(SvConf.getParam("sys.gis.default_srid"));
		dbe8.setIndexName("cent_idx");
		dbe8.setLabel_code("cad_munic.centroid");

		// Column 9
		DbDataField dbe9 = new DbDataField();
		dbe9.setDbFieldName("GEOM");
		dbe9.setDbFieldType(DbFieldType.GEOMETRY);
		dbe9.setGeometryType("POINT");
		dbe9.setGeometrySrid(SvConf.getParam("sys.gis.default_srid"));
		dbe9.setIndexName("geom_idx");
		dbe9.setLabel_code("cad_munic.geometry");

		DbDataField[] dbTableFields = new DbDataField[9];
		dbTableFields[0] = dbe1;
		dbTableFields[1] = dbe2;
		dbTableFields[2] = dbe3;
		dbTableFields[3] = dbe4;
		dbTableFields[4] = dbe5;
		dbTableFields[5] = dbe6;
		dbTableFields[6] = dbe7;
		dbTableFields[7] = dbe8;
		dbTableFields[8] = dbe9;
		dbe.setDbTableFields(dbTableFields);
		return dbe;
	}

	// CAD_PARCEL
	public static DbDataTable createCadParcel() {
		DbDataTable dbe = new DbDataTable();
		dbe.setDbTableName("CAD_PARCEL");
		dbe.setDbRepoName(CONST_MASTER_REPO);
		dbe.setDbSchema(CONST_DEFAULT_SCHEMA);
		dbe.setIsSystemTable(false);
		dbe.setIsRepoTable(false);
		dbe.setLabel_code("cad_parcel.general");
		dbe.setUse_cache(false);

		// Column 1N
		DbDataField dbe1 = new DbDataField();
		dbe1.setDbFieldName("PKID");
		dbe1.setIsPrimaryKey(true);
		dbe1.setDbFieldType(DbFieldType.NUMERIC);
		dbe1.setDbFieldSize(18);
		dbe1.setDbFieldScale(0);
		dbe1.setIsNull(false);
		dbe1.setLabel_code("cad_parcel.pkid");

		// Column 2
		DbDataField dbe2 = new DbDataField();
		dbe2.setDbFieldName("OLD_FARMER_PKID");
		dbe2.setDbFieldType(DbFieldType.NUMERIC);
		dbe2.setLabel_code("cad_parcel.old_farmer_pkid");

		// Column 3
		DbDataField dbe3 = new DbDataField();
		dbe3.setDbFieldName("FIC");
		dbe3.setDbFieldType(DbFieldType.NVARCHAR);
		dbe3.setDbFieldScale(0);
		dbe3.setDbFieldSize(16);
		dbe3.setIndexName("CAD_FIC_IDX");
		dbe3.setLabel_code("cad_parcel.fic");

		// Column 4
		DbDataField dbe4 = new DbDataField();
		dbe4.setDbFieldName("VALID_FROM");
		dbe4.setDbFieldType(DbFieldType.TIMESTAMP);
		dbe4.setDbFieldSize(3);
		dbe4.setLabel_code("cad_parcel.valid_from");

		// Column 5
		DbDataField dbe5 = new DbDataField();
		dbe5.setDbFieldName("VALID_TO");
		dbe5.setDbFieldType(DbFieldType.TIMESTAMP);
		dbe5.setDbFieldSize(3);
		dbe5.setLabel_code("cad_parcel.valid_to");

		// Column 6
		DbDataField dbe6 = new DbDataField();
		dbe6.setDbFieldName("PARCEL_ID");
		dbe6.setDbFieldType(DbFieldType.NVARCHAR);
		dbe6.setDbFieldScale(0);
		dbe6.setDbFieldSize(5);
		dbe6.setIndexName("CAD_ID_IDX");
		dbe6.setLabel_code("cad_parcel.parcel_id");

		// Column 7
		DbDataField dbe7 = new DbDataField();
		dbe7.setDbFieldName("NATIONAL_CODE");
		dbe7.setDbFieldType(DbFieldType.NVARCHAR);
		dbe7.setDbFieldScale(0);
		dbe7.setDbFieldSize(4);
		dbe7.setLabel_code("cad_parcel.national_code");
		dbe7.setCode_list_user_code("NATIONAL_COMMON_CODELIST");
		dbe7.setGui_metadata(
				"{\"hidden\":true,\"editoptions\":{\"readonly\":true},\"react\":{\"filterable\":true,\"width\":100,\"visible\":true,\"resizable\":true,\"editable\":false,\"uischema\":{\"ui:readonly\":true}}}");

		// Column 8
		DbDataField dbe8 = new DbDataField();
		dbe8.setDbFieldName("SHEET");
		dbe8.setDbFieldType(DbFieldType.NUMERIC);
		dbe8.setLabel_code("cad_parcel.sheet");

		// Column 9
		DbDataField dbe9 = new DbDataField();
		dbe9.setDbFieldName("SUB");
		dbe9.setDbFieldType(DbFieldType.NVARCHAR);
		dbe9.setDbFieldScale(0);
		dbe9.setDbFieldSize(3);
		dbe9.setLabel_code("cad_parcel.sub");

		// Column 10
		DbDataField dbe10 = new DbDataField();
		dbe10.setDbFieldName("HOLDING_TYPE_CODE");
		dbe10.setDbFieldType(DbFieldType.NVARCHAR);
		dbe10.setDbFieldScale(0);
		dbe10.setDbFieldSize(5);
		// dbe10.setCode_list_user_code("HOLDING_TYPE_CODE");
		dbe10.setLabel_code("cad_parcel.holding_type_code");

		// Column 11
		DbDataField dbe11 = new DbDataField();
		dbe11.setDbFieldName("PERC_OWNERSHIP");
		dbe11.setDbFieldType(DbFieldType.NUMERIC);
		dbe11.setLabel_code("cad_parcel.perc_ownership");

		// Column 12
		DbDataField dbe12 = new DbDataField();
		dbe12.setDbFieldName("AREA");
		dbe12.setDbFieldType(DbFieldType.NUMERIC);
		dbe12.setLabel_code("cad_parcel.area");

		// Column 13
		DbDataField dbe13 = new DbDataField();
		dbe13.setDbFieldName("NATIONAL_CODE_NAME");
		dbe13.setDbFieldType(DbFieldType.NVARCHAR);
		dbe13.setDbFieldScale(0);
		dbe13.setDbFieldSize(100);
		dbe13.setLabel_code("cad_parcel.national_code_name");

		DbDataField[] dbTableFields = new DbDataField[13];
		dbTableFields[0] = dbe1;
		dbTableFields[1] = dbe2;
		dbTableFields[2] = dbe3;
		dbTableFields[3] = dbe4;
		dbTableFields[4] = dbe5;
		dbTableFields[5] = dbe6;
		dbTableFields[6] = dbe13;
		dbTableFields[7] = dbe7;
		dbTableFields[8] = dbe8;
		dbTableFields[9] = dbe9;
		dbTableFields[10] = dbe10;
		dbTableFields[11] = dbe11;
		dbTableFields[12] = dbe12;
		dbe.setDbTableFields(dbTableFields);
		return dbe;
	}

	// PHYSICAL_BLOCK
	public static DbDataTable createPhysicalBlock() {
		DbDataTable dbe = new DbDataTable();
		dbe.setDbTableName("PHYSICAL_BLOCK");
		dbe.setDbRepoName(CONST_MASTER_REPO);
		dbe.setDbSchema(CONST_DEFAULT_SCHEMA);
		dbe.setIsSystemTable(false);
		dbe.setIsRepoTable(false);
		dbe.setLabel_code("physical_block.general");
		dbe.setUse_cache(false);

		// Column 1N
		DbDataField dbe1 = new DbDataField();
		dbe1.setDbFieldName("PKID");
		dbe1.setIsPrimaryKey(true);
		dbe1.setDbFieldType(DbFieldType.NUMERIC);
		dbe1.setDbFieldSize(18);
		dbe1.setDbFieldScale(0);
		dbe1.setIsNull(false);
		dbe1.setLabel_code("physical_block.pkid");

		// Column 2
		DbDataField dbe2 = new DbDataField();
		dbe2.setDbFieldName("PERIMETER");
		dbe2.setDbFieldType(DbFieldType.NUMERIC);
		dbe2.setDbFieldSize(9);
		dbe2.setDbFieldScale(0);
		dbe2.setLabel_code("physical_block.perimeter");

		// Column 3
		DbDataField dbe3 = new DbDataField();
		dbe3.setDbFieldName("CENTROID");
		dbe3.setDbFieldType(DbFieldType.GEOMETRY);
		dbe3.setGeometryType("POINT");
		dbe3.setGeometrySrid(SvConf.getParam("sys.gis.default_srid"));
		dbe3.setIndexName("cent_idx");
		dbe3.setLabel_code("physical_block.centroid");

		// Column 4
		DbDataField dbe4 = new DbDataField();
		dbe4.setDbFieldName("GEOM");
		dbe4.setDbFieldType(DbFieldType.GEOMETRY);
		dbe4.setGeometryType("POINT");
		dbe4.setGeometrySrid(SvConf.getParam("sys.gis.default_srid"));
		dbe4.setIndexName("geom_idx");
		dbe4.setLabel_code("physical_block.geometry");

		// Column 5
		DbDataField dbe5 = new DbDataField();
		dbe5.setDbFieldName("AREA");
		dbe5.setDbFieldType(DbFieldType.NUMERIC);
		dbe5.setLabel_code("physical_block.area");

		// Column 6
		DbDataField dbe6 = new DbDataField();
		dbe6.setDbFieldName("CAD_MUNIC_CODE");
		dbe6.setDbFieldType(DbFieldType.NUMERIC);
		dbe6.setDbFieldSize(18);
		dbe6.setDbFieldScale(0);
		dbe6.setLabel_code("physical_block.cad_munic_code");

		// Column 7
		DbDataField dbe7 = new DbDataField();
		dbe7.setDbFieldName("LAND_COVER");
		dbe7.setDbFieldType(DbFieldType.NVARCHAR);
		dbe7.setDbFieldSize(10);
		dbe7.setCode_list_user_code("LAND_USES");
		dbe7.setLabel_code("physical_block.land_uses");

		DbDataField[] dbTableFields = new DbDataField[7];
		dbTableFields[0] = dbe1;
		dbTableFields[1] = dbe2;
		dbTableFields[2] = dbe3;
		dbTableFields[3] = dbe4;
		dbTableFields[4] = dbe5;
		dbTableFields[5] = dbe6;
		dbTableFields[6] = dbe7;
		dbe.setDbTableFields(dbTableFields);
		return dbe;
	}

	// AGRI_PARCEL
	public static DbDataTable createAgriParcel() {
		DbDataTable dbe = new DbDataTable();
		dbe.setDbTableName("AGRI_PARCEL");
		dbe.setDbRepoName(CONST_MASTER_REPO);
		dbe.setDbSchema(CONST_DEFAULT_SCHEMA);
		dbe.setIsSystemTable(false);
		dbe.setIsRepoTable(false);
		dbe.setLabel_code("agri_parcel.general");
		dbe.setUse_cache(false);

		// Column 1N
		DbDataField dbe1 = new DbDataField();
		dbe1.setDbFieldName("PKID");
		dbe1.setIsPrimaryKey(true);
		dbe1.setDbFieldType(DbFieldType.NUMERIC);
		dbe1.setDbFieldSize(18);
		dbe1.setDbFieldScale(0);
		dbe1.setIsNull(false);
		dbe1.setLabel_code("agri_parcel.pkid");

		// Column 2
		DbDataField dbe2 = new DbDataField();
		dbe2.setDbFieldName("PARCEL_ID");
		dbe2.setDbFieldType(DbFieldType.NUMERIC);
		dbe2.setDbFieldSize(18);
		dbe2.setDbFieldScale(0);
		dbe2.setIndexName("AGRI_ID_IDX");
		dbe2.setLabel_code("agri_parcel.parcel_id");

		// Column 3
		DbDataField dbe3 = new DbDataField();
		dbe3.setDbFieldName("OLD_FARMER_PKID");
		dbe3.setDbFieldType(DbFieldType.NUMERIC);
		dbe3.setDbFieldSize(18);
		dbe3.setDbFieldScale(0);
		dbe3.setLabel_code("agri_parcel.old_farmer_pkid");

		// Column 4
		DbDataField dbe4 = new DbDataField();
		dbe4.setDbFieldName("LAND_USE_ID");
		dbe4.setDbFieldType(DbFieldType.NUMERIC);
		dbe4.setDbFieldSize(18);
		dbe4.setDbFieldScale(0);
		dbe4.setCode_list_user_code("LAND_USES");
		dbe4.setLabel_code("agri_parcel.land_use_id");

		// Column 5
		DbDataField dbe5 = new DbDataField();
		dbe5.setDbFieldName("HOME_NAME");
		dbe5.setDbFieldType(DbFieldType.NVARCHAR);
		dbe5.setDbFieldScale(0);
		dbe5.setDbFieldSize(60);
		dbe5.setLabel_code("agri_parcel.home_name");

		// Column 6
		DbDataField dbe6 = new DbDataField();
		dbe6.setDbFieldName("NOTE_INSERT");
		dbe6.setDbFieldType(DbFieldType.NVARCHAR);
		dbe6.setDbFieldScale(0);
		dbe6.setDbFieldSize(2000);
		dbe6.setLabel_code("agri_parcel.note_insert");

		// Column 7
		DbDataField dbe7 = new DbDataField();
		dbe7.setDbFieldName("NOTE_FARMER");
		dbe7.setDbFieldType(DbFieldType.NVARCHAR);
		dbe7.setDbFieldScale(0);
		dbe7.setDbFieldSize(2000);
		dbe7.setLabel_code("agri_parcel.note_farmer");

		// Column 9
		DbDataField dbe9 = new DbDataField();
		dbe9.setDbFieldName("NOTE_ORGANISATION");
		dbe9.setDbFieldType(DbFieldType.NVARCHAR);
		dbe9.setDbFieldScale(0);
		dbe9.setDbFieldSize(2000);
		dbe9.setLabel_code("agri_parcel.note_organisation");

		// Column 10
		DbDataField dbe10 = new DbDataField();
		dbe10.setDbFieldName("COUNTRY");
		dbe10.setDbFieldType(DbFieldType.NVARCHAR);
		dbe10.setDbFieldScale(0);
		dbe10.setDbFieldSize(1);
		dbe10.setLabel_code("agri_parcel.country");

		// Column 11
		DbDataField dbe11 = new DbDataField();
		dbe11.setDbFieldName("AREA");
		dbe11.setDbFieldType(DbFieldType.NUMERIC);
		dbe11.setDbFieldSize(18);
		dbe11.setDbFieldScale(0);
		dbe11.setLabel_code("agri_parcel.area");

		// Column 12
		DbDataField dbe12 = new DbDataField();
		dbe12.setDbFieldName("ALLOWED_AREA");
		dbe12.setDbFieldType(DbFieldType.NUMERIC);
		dbe12.setDbFieldSize(18);
		dbe12.setDbFieldScale(0);
		dbe12.setLabel_code("agri_parcel.allowed_area");

		// Column 13
		DbDataField dbe13 = new DbDataField();
		dbe13.setDbFieldName("COMMON_USE");
		dbe13.setDbFieldType(DbFieldType.NUMERIC);
		dbe13.setDbFieldSize(18);
		dbe13.setDbFieldScale(0);
		dbe13.setLabel_code("agri_parcel.common_use");

		// Column 14
		DbDataField dbe14 = new DbDataField();
		dbe14.setDbFieldName("CERTIFICATE_OF_USE");
		dbe14.setDbFieldType(DbFieldType.NUMERIC);
		dbe14.setDbFieldSize(1);
		dbe14.setDbFieldScale(0);
		dbe14.setLabel_code("agri_parcel.certificate_of_use");

		// Column 15
		DbDataField dbe15 = new DbDataField();
		dbe15.setDbFieldName("PERIMETER");
		dbe15.setDbFieldType(DbFieldType.NUMERIC);
		dbe15.setDbFieldSize(9);
		dbe15.setDbFieldScale(0);
		dbe15.setLabel_code("cad_munic.perimeter");

		// Column 16
		DbDataField dbe16 = new DbDataField();
		dbe16.setDbFieldName("CENTROID");
		dbe16.setDbFieldType(DbFieldType.GEOMETRY);
		dbe16.setGeometryType("POINT");
		dbe16.setGeometrySrid(SvConf.getParam("sys.gis.default_srid"));
		dbe16.setIndexName("cent_idx");
		dbe16.setLabel_code("agri_parcel.centroid");

		// Column 17
		DbDataField dbe17 = new DbDataField();
		dbe17.setDbFieldName("GEOM");
		dbe17.setDbFieldType(DbFieldType.GEOMETRY);
		dbe17.setGeometryType("POINT");
		dbe17.setGeometrySrid(SvConf.getParam("sys.gis.default_srid"));
		dbe17.setIndexName("geom_idx");
		dbe17.setLabel_code("agri_parcel.geom");

		// Column 18
		DbDataField dbe18 = new DbDataField();
		dbe18.setDbFieldName("CAD_MUNIC_ID");
		dbe18.setDbFieldType(DbFieldType.NUMERIC);
		dbe18.setDbFieldSize(18);
		dbe18.setDbFieldScale(0);
		dbe18.setLabel_code("agri_parcel.cad_munic_id");

		// Column 19
		DbDataField dbe19 = new DbDataField();
		dbe19.setDbFieldName("PHYSICAL_BLOCK_ID");
		dbe19.setDbFieldType(DbFieldType.NUMERIC);
		dbe19.setDbFieldSize(18);
		dbe19.setDbFieldScale(0);
		dbe19.setLabel_code("agri_parcel.physical_block_id");

		DbDataField[] dbTableFields = new DbDataField[13];
		dbTableFields[0] = dbe1;
		dbTableFields[1] = dbe2;
		dbTableFields[2] = dbe3;
		dbTableFields[3] = dbe4;
		dbTableFields[4] = dbe5;
		dbTableFields[5] = dbe6;
		dbTableFields[6] = dbe7;
		dbTableFields[7] = dbe9;
		dbTableFields[8] = dbe10;
		dbTableFields[9] = dbe11;
		dbTableFields[10] = dbe12;
		dbTableFields[11] = dbe13;
		dbTableFields[12] = dbe14;
		dbe.setDbTableFields(dbTableFields);
		return dbe;
	}

	// AGRI_PARCEL
	public static DbDataTable createLpisParcel() {
		DbDataTable dbe = new DbDataTable();
		dbe.setDbTableName("LPIS_PARCEL");
		dbe.setDbRepoName(CONST_MASTER_REPO);
		dbe.setDbSchema(CONST_DEFAULT_SCHEMA);
		dbe.setIsSystemTable(false);
		dbe.setIsRepoTable(false);
		dbe.setLabel_code("lpis_parcel.general");
		dbe.setUse_cache(false);

		// Column 1N
		DbDataField dbe1 = new DbDataField();
		dbe1.setDbFieldName("PKID");
		dbe1.setIsPrimaryKey(true);
		dbe1.setDbFieldType(DbFieldType.NUMERIC);
		dbe1.setDbFieldSize(18);
		dbe1.setDbFieldScale(0);
		dbe1.setIsNull(false);
		dbe1.setLabel_code("lpis_parcel.pkid");

		// Column 2
		DbDataField dbe2 = new DbDataField();
		dbe2.setDbFieldName("PARCEL_ID");
		dbe2.setDbFieldType(DbFieldType.NUMERIC);
		dbe2.setDbFieldSize(18);
		dbe2.setDbFieldScale(0);
		dbe2.setIndexName("LPIS_ID_IDX");
		dbe2.setLabel_code("lpis_parcel.parcel_id");

		// Column 3
		DbDataField dbe3 = new DbDataField();
		dbe3.setDbFieldName("OLD_FARMER_PKID");
		dbe3.setDbFieldType(DbFieldType.NUMERIC);
		dbe3.setDbFieldSize(18);
		dbe3.setDbFieldScale(0);
		dbe3.setLabel_code("lpis_parcel.old_farmer_pkid");

		// Column 4
		DbDataField dbe4 = new DbDataField();
		dbe4.setDbFieldName("LAND_USE_ID_1");
		dbe4.setDbFieldType(DbFieldType.NUMERIC);
		dbe4.setDbFieldSize(18);
		dbe4.setDbFieldScale(0);
		dbe4.setCode_list_user_code("LAND_USES");
		dbe4.setLabel_code("lpis_parcel.land_use_id_1");

		// Column 5
		DbDataField dbe5 = new DbDataField();
		dbe5.setDbFieldName("LAND_USE_ID_2");
		dbe5.setDbFieldType(DbFieldType.NUMERIC);
		dbe5.setDbFieldSize(18);
		dbe5.setDbFieldScale(0);
		dbe5.setCode_list_user_code("LAND_USES");
		dbe5.setLabel_code("lpis_parcel.land_use_id_2");

		// Column 6
		DbDataField dbe6 = new DbDataField();
		dbe6.setDbFieldName("COUNTRY");
		dbe6.setDbFieldType(DbFieldType.NVARCHAR);
		dbe6.setDbFieldScale(0);
		dbe6.setDbFieldSize(1);
		dbe6.setLabel_code("lpis_parcel.country");

		// Column 7
		DbDataField dbe7 = new DbDataField();
		dbe7.setDbFieldName("AREA");
		dbe7.setDbFieldType(DbFieldType.NUMERIC);
		dbe7.setDbFieldSize(18);
		dbe7.setDbFieldScale(0);
		dbe7.setLabel_code("lpis_parcel.area");

		// Column 8
		DbDataField dbe8 = new DbDataField();
		dbe8.setDbFieldName("ALLOWED_AREA");
		dbe8.setDbFieldType(DbFieldType.NUMERIC);
		dbe8.setDbFieldSize(18);
		dbe8.setDbFieldScale(0);
		dbe8.setLabel_code("lpis_parcel.allowed_area");

		// Column 9
		DbDataField dbe9 = new DbDataField();
		dbe9.setDbFieldName("COMMON_USE");
		dbe9.setDbFieldType(DbFieldType.NUMERIC);
		dbe9.setDbFieldSize(18);
		dbe9.setDbFieldScale(0);
		dbe9.setLabel_code("lpis_parcel.common_use");

		// Column 10
		DbDataField dbe10 = new DbDataField();
		dbe10.setDbFieldName("CERTIFICATE_OF_USE");
		dbe10.setDbFieldType(DbFieldType.NUMERIC);
		dbe10.setDbFieldSize(1);
		dbe10.setDbFieldScale(0);
		dbe10.setLabel_code("lpis_parcel.certificate_of_use");

		// Column 11
		DbDataField dbe11 = new DbDataField();
		dbe11.setDbFieldName("PERIMETER");
		dbe11.setDbFieldType(DbFieldType.NUMERIC);
		dbe11.setDbFieldSize(9);
		dbe11.setDbFieldScale(0);
		dbe11.setLabel_code("lpis_parcel.perimeter");

		// Column 12
		DbDataField dbe12 = new DbDataField();
		dbe12.setDbFieldName("CENTROID");
		dbe12.setDbFieldType(DbFieldType.GEOMETRY);
		dbe12.setGeometryType("POINT");
		dbe12.setGeometrySrid(SvConf.getParam("sys.gis.default_srid"));
		dbe12.setIndexName("cent_idx");
		dbe12.setLabel_code("agri_parcel.centroid");

		// Column 13
		DbDataField dbe13 = new DbDataField();
		dbe13.setDbFieldName("GEOM");
		dbe13.setDbFieldType(DbFieldType.GEOMETRY);
		dbe13.setGeometryType("POINT");
		dbe13.setGeometrySrid(SvConf.getParam("sys.gis.default_srid"));
		dbe13.setIndexName("geom_idx");
		dbe13.setLabel_code("lpis_parcel.geom");

		// Column 14
		DbDataField dbe14 = new DbDataField();
		dbe14.setDbFieldName("CAD_MUNIC_ID");
		dbe14.setDbFieldType(DbFieldType.NUMERIC);
		dbe14.setDbFieldSize(18);
		dbe14.setDbFieldScale(0);
		dbe14.setLabel_code("lpis_parcel.cad_munic_id");

		// Column 15
		DbDataField dbe15 = new DbDataField();
		dbe15.setDbFieldName("PHYSICAL_BLOCK_ID");
		dbe15.setDbFieldType(DbFieldType.NUMERIC);
		dbe15.setDbFieldSize(18);
		dbe15.setDbFieldScale(0);
		dbe15.setLabel_code("lpis_parcel.physical_block_id");

		// Column 16
		DbDataField dbe16 = new DbDataField();
		dbe16.setDbFieldName("TERASE");
		dbe16.setDbFieldType(DbFieldType.NUMERIC);
		dbe16.setDbFieldSize(18);
		dbe16.setDbFieldScale(0);
		dbe16.setLabel_code("lpis_parcel.terase");

		// Column 17
		DbDataField dbe17 = new DbDataField();
		dbe17.setDbFieldName("INV_BORDER");
		dbe17.setDbFieldType(DbFieldType.NUMERIC);
		dbe17.setDbFieldSize(18);
		dbe17.setDbFieldScale(0);
		dbe17.setLabel_code("lpis_parcel.inv_border");

		// Column 18
		DbDataField dbe18 = new DbDataField();
		dbe18.setDbFieldName("CHANGE_BORDER");
		dbe18.setDbFieldType(DbFieldType.NUMERIC);
		dbe18.setDbFieldSize(18);
		dbe18.setDbFieldScale(0);
		dbe18.setLabel_code("lpis_parcel.change_border");

		// Column 19
		DbDataField dbe19 = new DbDataField();
		dbe19.setDbFieldName("IRRIGATION");
		dbe19.setDbFieldType(DbFieldType.NUMERIC);
		dbe19.setDbFieldSize(18);
		dbe19.setDbFieldScale(0);
		dbe19.setLabel_code("lpis_parcel.irrigation");

		// Column 20
		DbDataField dbe20 = new DbDataField();
		dbe20.setDbFieldName("EXP_AVG");
		dbe20.setDbFieldType(DbFieldType.NUMERIC);
		dbe20.setDbFieldSize(18);
		dbe20.setDbFieldScale(0);
		dbe20.setLabel_code("lpis_parcel.exp_avg");

		// Column 21
		DbDataField dbe21 = new DbDataField();
		dbe21.setDbFieldName("LANDSCAPE");
		dbe21.setDbFieldType(DbFieldType.NUMERIC);
		dbe21.setDbFieldSize(18);
		dbe21.setDbFieldScale(0);
		dbe21.setLabel_code("lpis_parcel.landscape");

		// Column 22
		DbDataField dbe22 = new DbDataField();
		dbe22.setDbFieldName("ELIGIBILITY");
		dbe22.setDbFieldType(DbFieldType.NUMERIC);
		dbe22.setDbFieldSize(18);
		dbe22.setDbFieldScale(0);
		dbe22.setLabel_code("lpis_parcel.eligibilty");

		// Column 23
		DbDataField dbe23 = new DbDataField();
		dbe23.setDbFieldName("Z_AVG");
		dbe23.setDbFieldType(DbFieldType.NUMERIC);
		dbe23.setDbFieldSize(18);
		dbe23.setDbFieldScale(0);
		dbe23.setLabel_code("lpis_parcel.z_avg");

		DbDataField[] dbTableFields = new DbDataField[23];
		dbTableFields[0] = dbe1;
		dbTableFields[1] = dbe2;
		dbTableFields[2] = dbe3;
		dbTableFields[3] = dbe4;
		dbTableFields[4] = dbe5;
		dbTableFields[5] = dbe6;
		dbTableFields[6] = dbe7;
		dbTableFields[7] = dbe8;
		dbTableFields[8] = dbe9;
		dbTableFields[9] = dbe10;
		dbTableFields[10] = dbe11;
		dbTableFields[11] = dbe12;
		dbTableFields[12] = dbe13;
		dbTableFields[13] = dbe14;
		dbTableFields[14] = dbe15;
		dbTableFields[15] = dbe16;
		dbTableFields[16] = dbe17;
		dbTableFields[17] = dbe18;
		dbTableFields[18] = dbe19;
		dbTableFields[19] = dbe20;
		dbTableFields[20] = dbe21;
		dbTableFields[21] = dbe22;
		dbTableFields[22] = dbe23;

		dbe.setDbTableFields(dbTableFields);
		return dbe;
	}

	// LAND_USE_PLAN
	public static DbDataTable createLandUsePlan() {
		DbDataTable dbe = new DbDataTable();
		dbe.setDbTableName("LAND_USE_PLAN");
		dbe.setDbRepoName(CONST_MASTER_REPO);
		dbe.setDbSchema(CONST_DEFAULT_SCHEMA);
		dbe.setIsSystemTable(false);
		dbe.setIsRepoTable(false);
		dbe.setLabel_code("land_use_plan.general");
		dbe.setUse_cache(false);

		// Column 1N
		DbDataField dbe1 = new DbDataField();
		dbe1.setDbFieldName("PKID");
		dbe1.setIsPrimaryKey(true);
		dbe1.setDbFieldType(DbFieldType.NUMERIC);
		dbe1.setDbFieldSize(18);
		dbe1.setDbFieldScale(0);
		dbe1.setIsNull(false);
		dbe1.setLabel_code("land_use_plan.pkid");

		// Column 2
		DbDataField dbe2 = new DbDataField();
		dbe2.setDbFieldName("CROP_CODE");
		dbe2.setDbFieldType(DbFieldType.NUMERIC);
		dbe2.setIsNull(false);
		dbe2.setDbFieldSize(18);
		dbe2.setDbFieldScale(0);
		dbe2.setLabel_code("land_use_plan.crop_code");
		dbe2.setIndexName("LU_PLAN_CROP_IDX");
		dbe2.setCode_list_user_code("CROP_CODE");
		dbe2.setGui_metadata(
				"{\"react\":{\"filterable\":true,\"width\":270,\"visible\":true,\"resizable\":true,\"editable\":false}}");

		// Column 3
		DbDataField dbe3 = new DbDataField();
		dbe3.setDbFieldName("NUMBER_PLANTS");
		dbe3.setDbFieldType(DbFieldType.NUMERIC);
		dbe3.setDbFieldSize(18);
		dbe3.setDbFieldScale(0);
		dbe3.setLabel_code("land_use_plan.number_plants");

		// Column 4
		DbDataField dbe4 = new DbDataField();
		dbe4.setDbFieldName("AREA");
		dbe4.setDbFieldType(DbFieldType.NUMERIC);
		dbe4.setDbFieldSize(18);
		dbe4.setDbFieldScale(0);
		dbe4.setIsNull(false);
		dbe4.setLabel_code("land_use_plan.area");

		// Column 5
		DbDataField dbe5 = new DbDataField();
		dbe5.setDbFieldName("IS_ORGANIC");
		dbe5.setDbFieldType(DbFieldType.BOOLEAN);
		dbe5.setIndexName("is_organic");
		dbe5.setCode_list_user_code("BOOLEAN_TRUE_FALSE");
		dbe5.setLabel_code("land_use_plan.is_organic");
		dbe5.setGui_metadata(
				"{\"react\":{\"filterable\":true,\"visible\":true,\"resizable\":true,\"editable\":true,\"uischema\":{\"ui:widget\":\"select\"}}}");

		// Column 6
		DbDataField dbe6 = new DbDataField();
		dbe6.setDbFieldName("CAMPAIGN_YEAR");
		dbe6.setDbFieldType(DbFieldType.NVARCHAR);
		dbe6.setDbFieldScale(0);
		dbe6.setDbFieldSize(10);
		dbe6.setLabel_code("land_use_plan.campaign_year");

		// Column 7
		DbDataField dbe7 = new DbDataField();
		dbe7.setDbFieldName("PERIMETER");
		dbe7.setDbFieldType(DbFieldType.NUMERIC);
		dbe7.setDbFieldSize(9);
		dbe7.setDbFieldScale(0);
		dbe7.setLabel_code("cad_munic.perimeter");

		// Column 8
		DbDataField dbe8 = new DbDataField();
		dbe8.setDbFieldName("CENTROID");
		dbe8.setDbFieldType(DbFieldType.GEOMETRY);
		dbe8.setGeometryType("POINT");
		dbe8.setGeometrySrid(SvConf.getParam("sys.gis.default_srid"));
		dbe8.setIndexName("cent_idx");
		dbe8.setLabel_code("cad_munic.centroid");

		// Column 9
		DbDataField dbe9 = new DbDataField();
		dbe9.setDbFieldName("GEOM");
		dbe9.setDbFieldType(DbFieldType.GEOMETRY);
		dbe9.setGeometryType("POINT");
		dbe9.setGeometrySrid(SvConf.getParam("sys.gis.default_srid"));
		dbe9.setIndexName("geom_idx");
		dbe9.setLabel_code("cad_munic.geometry");

		DbDataField[] dbTableFields = new DbDataField[9];
		dbTableFields[0] = dbe1;
		dbTableFields[1] = dbe2;
		dbTableFields[2] = dbe4;
		dbTableFields[3] = dbe3;
		dbTableFields[4] = dbe5;
		dbTableFields[5] = dbe6;
		dbTableFields[6] = dbe7;
		dbTableFields[7] = dbe8;
		dbTableFields[8] = dbe9;
		dbe.setDbTableFields(dbTableFields);
		return dbe;
	}

	// LINK LAND_USE AND CAD
	public static DbDataObject createLandUsePlanLink() {
		DbDataObject dbLink = new DbDataObject();
		dbLink.setObject_type(svCONST.OBJECT_TYPE_LINK_TYPE);
		dbLink.setVal("LINK_TYPE", "LINK_LANDUSE_CAD");
		dbLink.setVal("LINK_TYPE_DESCRIPTION", "link between CAD_PARCEL and LAND_USE_PLAN");
		dbLink.setVal("LINK_OBJ_TYPE_1", ("LAND_USE_PLAN"));
		dbLink.setVal("LINK_OBJ_TYPE_2", ("CAD_PARCEL"));
		return dbLink;
	}

	@Override
	public ArrayList<DbDataTable> getCustomObjectTypes() {
		DbDataTable dbtt = null;
		ArrayList<DbDataTable> dbtList = new ArrayList<DbDataTable>();
		dbtt = DbInitCustom.createCadParcel();
		dbtList.add(addSortOrder(dbtt));
		dbtt = DbInitCustom.createAgriParcel();
		dbtList.add(addSortOrder(dbtt));
		dbtt = DbInitCustom.createLpisParcel();
		dbtList.add(addSortOrder(dbtt));
		dbtt = DbInitCustom.createLandUsePlan();
		dbtList.add(addSortOrder(dbtt));

		return dbtList;
	}

	@Override
	public ArrayList<DbDataObject> getCustomObjectInstances() {
		DbDataObject dbtt = null;
		ArrayList<DbDataObject> dbtList = new ArrayList<DbDataObject>();
		dbtt = DbInitCustom.createLandUsePlanLink();
		dbtList.add((dbtt));
		return dbtList;
	}

}
