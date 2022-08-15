package com.prtech.lpis;

import org.junit.Test;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.prtech.spatial.Util;
import com.prtech.svarog.SvConf;
import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvException;
import com.prtech.svarog.SvGeometry;
import com.prtech.svarog.SvLock;
import com.prtech.svarog.SvReader;
import com.prtech.svarog.SvSecurity;
import com.prtech.svarog.SvUtil;
import com.prtech.svarog.SvSDITile.SDIRelation;
import com.prtech.svarog_common.DbDataArray;
import com.prtech.svarog_common.DbDataObject;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Envelope;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.io.svarog_geojson.GeoJsonReader;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.sql.SQLException;
import java.util.Collection;
import java.util.Properties;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.joda.time.DateTime;
import org.junit.Assert;

public class ConfigTest {
	private static final Logger log = LogManager.getLogger(Config.class.getName());

	static String getUserSessionIdForTestPurpose() {
		String sessionId = CC.EMPTY_STRING;
		try (@SuppressWarnings("deprecation")
		SvSecurity svc = new SvSecurity();) {
			String userName = "ADMIN";
			String password = "welcome";
			if (SvConf.getParam("conn.string").equals("jdbc:oracle:thin:@192.168.9.60:1521:orclte19")) {
				password = "welcome";
			}
			sessionId = svc.logon(userName, SvUtil.getMD5(password));
		} catch (Exception e) {
			log.error(e);
		}
		return sessionId;
	}

	@Test
	public void testProjectInfo() {
		String group = Config.getProjectGroup();
		String name = Config.getProjectName();
		String version = Config.getProjectVersion();
		String description = Config.getDescription();

		Assert.assertTrue("Project group ID is not defined, check configuration.", group != null);
		Assert.assertTrue("Project description is not defined, check configuration.", description != null);
		Assert.assertTrue("Project description is not defined, check configuration.", version != null);
		Assert.assertTrue("Project name is not defined, check configuration.\n"
				+ "Project name is used as the http context, thus all web assets are requested via an URL that contains this value.\n"
				+ "It evaluates to the maven artifactId.\n"
				+ "Since it is not defined properly, expect nothing to work.", (name != null && name.length() > 1));
	}

	@Test
	public void testAccessCard() {
		String icon = Config.getCardIcon();
		String permissionCode = Config.getPermissionCode();
		String label = Config.getCardLabel();
		String order = Config.getCardOrder();

		String url = Config.getJSURL();
		int urlLen = url.length();

		Assert.assertTrue("Frontend card label is not defined, check configuration.", label != null);
		Assert.assertTrue("Frontend card order is not properly defined, check configuration.",
				order != null && Integer.parseInt(order) > 0);
		Assert.assertTrue("Permission code is not properly defined, check configuration.", permissionCode != null);
		Assert.assertTrue("Frontend card icon path is not set, check configuration", icon != null);
		Assert.assertTrue(
				"Frontend js script path is not set, check configuration.\n"
						+ "Without a registered script name, the user will not be able to access the plugin.",
				url != null && url.substring(urlLen - 3, urlLen).equals(".js"));
	}

	// @Test
	public void getInfo() throws SvException, SQLException, ParseException {
		ApplicationServices as = new ApplicationServices();

		String token = getUserSessionIdForTestPurpose();
		if (!token.equals(CC.EMPTY_STRING)) {
			try (SvReader svr = new SvReader(token)) {

				Coordinate c = new Coordinate(7557076.5319, 4615323.6902);
				Point p = SvUtil.sdiFactory.createPoint(c);
				Response r = as.getGeometryInfo(token, "AGRI_PARCEL", 7557340.8594, 4615078.5757);
				log.error(r.toString());
			}
		}
	}

	// @Test
	public void getParcels() throws SvException, SQLException, ParseException {

		String token = getUserSessionIdForTestPurpose();
		if (!token.equals(CC.EMPTY_STRING)) {
			try (SvReader svr = new SvReader(token)) {
				DbDataArray result = new Reader(svr).getParcels(45984L, null, true);
				System.out.println(result.toSimpleJson().toString());
			}
		}

	}

	// @Test
	public void getMunicipalities() throws SvException, SQLException, ParseException, IOException {

		String jsonParcel = "{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\",\"id\":\"KATASTARSKI_OPSTINI_WMS.4020\",\"geometry\":{\"type\":\"MultiPolygon\",\"coordinates\":[[[[7640516.2001,4576040.2001],[7640585.3501,4576118.0201],[7640667.1601,4576160.1001],[7640714.1101,4576181.0699],[7640737.8301,4576206.3001],[7640758.4001,4576245.1299],[7640752.6101,4576257.9101],[7640798.4301,4576294.7901],[7640531.2701,4576443.3799],[7640296.9101,4576501.5401],[7640076.8901,4576687.7201],[7639899.8901,4576755.5699],[7639878.1101,4576763.9501],[7639650.5001,4576852.9201],[7639567.0901,4576960.4601],[7639483.1401,4577027.5099],[7639239.6101,4577152.5901],[7639233.2001,4577115.8001],[7639245.5601,4577075.0901],[7639246.4401,4577067.5501],[7639247.1101,4577059.6299],[7639230.6299,4577007.0801],[7639227.0201,4576984.9201],[7639248.6001,4576949.5601],[7639284.1401,4576902.1501],[7639348.9801,4576786.8701],[7639365.9701,4576717.3101],[7639366.5001,4576684.0001],[7639355.6801,4576669.5801],[7639331.4801,4576655.6601],[7639303.1601,4576641.2401],[7639290.7201,4576623.3601],[7639286.3501,4576595.5401],[7639292.3401,4576568.3199],[7639317.5801,4576515.7599],[7639333.0201,4576477.6299],[7639339.7201,4576443.1101],[7639337.2501,4576423.9501],[7639332.5501,4576399.5099],[7639289.2901,4576306.7599],[7639290.3001,4576289.4301],[7639301.1101,4576285.3101],[7639321.7101,4576269.8501],[7639341.2801,4576269.3401],[7639347.9701,4576266.7599],[7639348.0099,4576259.7001],[7639345.9101,4576251.8199],[7639327.3701,4576212.6601],[7639319.6601,4576187.6601],[7639318.6299,4576174.2599],[7639314.5099,4576160.8601],[7639303.1801,4576145.9201],[7639298.4101,4576129.2599],[7639299.0601,4576115.5201],[7639298.5501,4576105.7301],[7639293.8001,4576102.7301],[7639290.2801,4576101.1701],[7639285.1601,4576100.0601],[7639247.5699,4576100.0601],[7639234.7001,4576097.4801],[7639224.4001,4576092.8501],[7639219.7599,4576075.8401],[7639221.8199,4576051.6299],[7639219.7599,4576030.5001],[7639215.7501,4576021.8001],[7639228.5601,4576013.8601],[7639276.4401,4576018.4801],[7639290.2301,4576014.5501],[7639292.5201,4576010.2599],[7639288.7901,4575989.3901],[7639303.3799,4575967.0301],[7639304.1401,4575902.0201],[7639296.2201,4575855.7701],[7639263.4101,4575821.7701],[7639245.5601,4575780.0201],[7639229.1299,4575749.0601],[7639213.4501,4575706.0501],[7639211.6601,4575687.0699],[7639216.7101,4575654.6801],[7639237.9101,4575618.5201],[7639244.5901,4575619.7701],[7639272.6001,4575556.2301],[7639272.7101,4575556.2701],[7639269.7301,4575539.0201],[7639269.0901,4575513.7101],[7639268.5201,4575491.1101],[7639267.9401,4575480.0001],[7639263.4301,4575467.4501],[7639255.4901,4575435.4001],[7639247.9801,4575411.4301],[7639242.6801,4575351.4401],[7639239.8101,4575326.4101],[7639239.8101,4575250.9701],[7639243.3199,4575240.2901],[7639252.6401,4575163.1501],[7639268.0099,4575087.3901],[7639264.4301,4575059.8301],[7639262.5699,4575050.1501],[7639252.3401,4575018.9701],[7639233.6901,4574980.9201],[7639216.5801,4574958.5301],[7639219.5901,4574953.0699],[7639212.0801,4574939.6901],[7639215.2701,4574922.7501],[7639223.5301,4574879.4901],[7639230.1101,4574851.4501],[7639242.6101,4574797.5601],[7639267.1299,4574758.3799],[7639278.5901,4574713.8601],[7639276.2401,4574669.2501],[7639258.3199,4574638.5699],[7639235.8401,4574615.9001],[7639200.1801,4574589.5501],[7639171.0301,4574570.4501],[7639156.1001,4574542.9501],[7639138.1601,4574511.1299],[7639100.4701,4574471.6001],[7639093.1801,4574468.4801],[7639044.5501,4574445.0801],[7639012.4001,4574426.3799],[7638980.8401,4574404.5901],[7638932.9801,4574379.8199],[7638926.2101,4574370.4401],[7638961.4701,4574354.0501],[7638996.3199,4574356.5601],[7639026.7901,4574354.1299],[7639043.1601,4574353.5501],[7639071.7001,4574356.4901],[7639095.9301,4574355.2599],[7639102.0099,4574350.4901],[7639140.3001,4574358.8601],[7639152.6201,4574363.0501],[7639176.8001,4574364.3601],[7639193.8601,4574365.2701],[7639225.5699,4574366.4201],[7639229.8199,4574366.7401],[7639252.4901,4574369.3701],[7639287.0099,4574371.0901],[7639298.1801,4574369.2001],[7639313.6201,4574366.7301],[7639335.5601,4574358.3101],[7639388.9901,4574339.8301],[7639417.3799,4574330.3001],[7639444.0501,4574314.5601],[7639495.3101,4574288.5501],[7639517.2501,4574272.3601],[7639527.5699,4574260.0801],[7639550.6101,4574244.0099],[7639558.0001,4574235.6201],[7639562.7599,4574242.7701],[7639589.2599,4574271.5601],[7639610.1201,4574282.1601],[7639626.9301,4574295.7801],[7639632.5201,4574311.3101],[7639639.9701,4574316.2901],[7639652.3501,4574339.2501],[7639658.5901,4574365.8501],[7639678.2201,4574425.6601],[7639685.2001,4574438.8101],[7639682.9801,4574467.6501],[7639681.4201,4574491.9001],[7639697.5699,4574501.2201],[7639711.8401,4574525.0099],[7639717.5901,4574553.0501],[7639717.5901,4574582.3101],[7639726.5401,4574614.7901],[7639739.4101,4574634.3701],[7639759.5901,4574656.4501],[7639765.8401,4574670.2599],[7639747.3701,4574691.4001],[7639725.9601,4574722.1701],[7639724.9801,4574736.3001],[7639729.6601,4574752.8601],[7639738.1901,4574772.8799],[7639744.2599,4574787.7599],[7639743.5301,4574805.7701],[7639734.7401,4574821.8001],[7639717.0201,4574831.4701],[7639699.0501,4574843.8401],[7639694.6201,4574863.0699],[7639712.2599,4574877.4101],[7639733.1801,4574902.5001],[7639734.1701,4574921.8199],[7639724.9801,4574937.9501],[7639724.6501,4574954.4601],[7639729.2501,4574974.0601],[7639727.6901,4575003.9701],[7639730.5201,4575027.5401],[7639746.7401,4575039.2901],[7639772.8601,4575049.7599],[7639773.9701,4575072.6001],[7639770.0901,4575081.2201],[7639773.9701,4575099.8799],[7639790.3901,4575119.9301],[7639785.1901,4575133.3601],[7639780.2001,4575167.9901],[7639782.3701,4575188.0001],[7639787.9601,4575212.8199],[7639802.4801,4575235.9801],[7639804.7801,4575256.2599],[7639796.8401,4575259.7201],[7639781.1101,4575262.0301],[7639782.6901,4575272.8901],[7639818.1299,4575283.5301],[7639821.0801,4575296.2001],[7639826.7401,4575328.0801],[7639842.2001,4575332.2301],[7639858.4201,4575345.3601],[7639872.7599,4575350.6299],[7639879.7801,4575368.9501],[7639870.4401,4575385.2701],[7639873.6601,4575397.8701],[7639883.2001,4575407.4201],[7639901.1601,4575413.0099],[7639916.3199,4575425.8101],[7639923.5601,4575443.0601],[7639919.2801,4575480.0601],[7639933.6001,4575488.7101],[7639951.8301,4575491.6101],[7639970.5401,4575486.7401],[7639972.3199,4575499.2301],[7639975.1501,4575512.5301],[7639962.5901,4575558.8301],[7640054.3199,4575630.7301],[7640097.3199,4575681.3501],[7640150.9601,4575715.9701],[7640230.0301,4575751.6801],[7640277.3601,4575791.8901],[7640315.0801,4575859.1401],[7640355.7701,4575890.1001],[7640370.5401,4575956.0901],[7640422.0001,4575997.9301],[7640516.2001,4576040.2001]]]]},\"geometry_name\":\"SHAPE\",\"properties\":{\"SHAPE_LENG\":8626,\"ODDELENIE\":\"4\",\"OPS\":\"4017\",\"VALID\":1,\"FID_KATOPS\":1160,\"SIFRA1\":\"04017\",\"NAZIV\":\"Прстен\",\"KNAZIV\":\"Prsten\",\"OPST2004\":\"Valandovo\",\"OO_\":1160,\"RAZMER\":2500,\"DAT_OBJ\":\"10.02.1993\",\"SHAPE_LE_1\":8626}}],\"totalFeatures\":1,\"numberMatched\":1,\"numberReturned\":1,\"timeStamp\":\"2022-05-23T11:40:11.946Z\",\"crs\":{\"type\":\"name\",\"properties\":{\"name\":\"urn:ogc:def:crs:EPSG::6316\"}}}";
		String filter = "<ogc:Filter><ogc:PropertyIsEqualTo><ogc:PropertyName>KNAZIV</ogc:PropertyName><ogc:Literal>Prsten</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>";
		GeometryFactory gf = SvUtil.sdiFactory;

		Envelope e = SvGeometry.parseBBox("7452549.065335996,4519504.284285896,7677998.951467971,4697211.004479155");
		GeoJsonReader gjr = new GeoJsonReader(gf);
		gjr.setUseFeatureType(true);
		gjr.setUsePropertiesAsUserData(true);

		Geometry parcel = gjr.read(jsonParcel);
		WFSReader wfs = new WFSReader("PARCELI:KATASTARSKI_OPSTINI_WMS", "EPSG:6316",
				"http://osspwms.katastar.gov.mk/geoserver/PARCELI/gwc/service/wfs");
		System.out.println(wfs.buildWfsRequestUrl(e));
		String extParams = "-oKexAlgorithms=+diffie-hellman-group1-sha1";
		String json = wfs.getWFSResponse(e, "10.88.1.31", "root", "root12", "MZSV2018", "M20zSV18", extParams);

		System.out.println(json);

		Geometry geom = gjr.read(json);

		for (int i = 0; i < geom.getNumGeometries(); i++) {
			Geometry g = geom.getGeometryN(i);
			System.out.println(g.getUserData());
		}

		/*
		 * String token = getUserSessionIdForTestPurpose(); if
		 * (!token.equals(CC.EMPTY_STRING)) { try (SvReader svr = new SvReader(token)) {
		 * File fl = new File("labels/PARCELI_KATASTARSKI_OPSTINI_WMS.json"); String
		 * json = com.google.common.io.Files.toString(fl,Charset.defaultCharset());
		 * 
		 * System.out.println(json); } }
		 */
	}

	// @Test
	public void testIntersections() throws SvException, SQLException, ParseException, IOException {

		String jsonParcel = "{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\",\"id\":\"KATASTARSKI_OPSTINI_WMS.4020\",\"geometry\":{\"type\":\"MultiPolygon\",\"coordinates\":[[[[7640516.2001,4576040.2001],[7640585.3501,4576118.0201],[7640667.1601,4576160.1001],[7640714.1101,4576181.0699],[7640737.8301,4576206.3001],[7640758.4001,4576245.1299],[7640752.6101,4576257.9101],[7640798.4301,4576294.7901],[7640531.2701,4576443.3799],[7640296.9101,4576501.5401],[7640076.8901,4576687.7201],[7639899.8901,4576755.5699],[7639878.1101,4576763.9501],[7639650.5001,4576852.9201],[7639567.0901,4576960.4601],[7639483.1401,4577027.5099],[7639239.6101,4577152.5901],[7639233.2001,4577115.8001],[7639245.5601,4577075.0901],[7639246.4401,4577067.5501],[7639247.1101,4577059.6299],[7639230.6299,4577007.0801],[7639227.0201,4576984.9201],[7639248.6001,4576949.5601],[7639284.1401,4576902.1501],[7639348.9801,4576786.8701],[7639365.9701,4576717.3101],[7639366.5001,4576684.0001],[7639355.6801,4576669.5801],[7639331.4801,4576655.6601],[7639303.1601,4576641.2401],[7639290.7201,4576623.3601],[7639286.3501,4576595.5401],[7639292.3401,4576568.3199],[7639317.5801,4576515.7599],[7639333.0201,4576477.6299],[7639339.7201,4576443.1101],[7639337.2501,4576423.9501],[7639332.5501,4576399.5099],[7639289.2901,4576306.7599],[7639290.3001,4576289.4301],[7639301.1101,4576285.3101],[7639321.7101,4576269.8501],[7639341.2801,4576269.3401],[7639347.9701,4576266.7599],[7639348.0099,4576259.7001],[7639345.9101,4576251.8199],[7639327.3701,4576212.6601],[7639319.6601,4576187.6601],[7639318.6299,4576174.2599],[7639314.5099,4576160.8601],[7639303.1801,4576145.9201],[7639298.4101,4576129.2599],[7639299.0601,4576115.5201],[7639298.5501,4576105.7301],[7639293.8001,4576102.7301],[7639290.2801,4576101.1701],[7639285.1601,4576100.0601],[7639247.5699,4576100.0601],[7639234.7001,4576097.4801],[7639224.4001,4576092.8501],[7639219.7599,4576075.8401],[7639221.8199,4576051.6299],[7639219.7599,4576030.5001],[7639215.7501,4576021.8001],[7639228.5601,4576013.8601],[7639276.4401,4576018.4801],[7639290.2301,4576014.5501],[7639292.5201,4576010.2599],[7639288.7901,4575989.3901],[7639303.3799,4575967.0301],[7639304.1401,4575902.0201],[7639296.2201,4575855.7701],[7639263.4101,4575821.7701],[7639245.5601,4575780.0201],[7639229.1299,4575749.0601],[7639213.4501,4575706.0501],[7639211.6601,4575687.0699],[7639216.7101,4575654.6801],[7639237.9101,4575618.5201],[7639244.5901,4575619.7701],[7639272.6001,4575556.2301],[7639272.7101,4575556.2701],[7639269.7301,4575539.0201],[7639269.0901,4575513.7101],[7639268.5201,4575491.1101],[7639267.9401,4575480.0001],[7639263.4301,4575467.4501],[7639255.4901,4575435.4001],[7639247.9801,4575411.4301],[7639242.6801,4575351.4401],[7639239.8101,4575326.4101],[7639239.8101,4575250.9701],[7639243.3199,4575240.2901],[7639252.6401,4575163.1501],[7639268.0099,4575087.3901],[7639264.4301,4575059.8301],[7639262.5699,4575050.1501],[7639252.3401,4575018.9701],[7639233.6901,4574980.9201],[7639216.5801,4574958.5301],[7639219.5901,4574953.0699],[7639212.0801,4574939.6901],[7639215.2701,4574922.7501],[7639223.5301,4574879.4901],[7639230.1101,4574851.4501],[7639242.6101,4574797.5601],[7639267.1299,4574758.3799],[7639278.5901,4574713.8601],[7639276.2401,4574669.2501],[7639258.3199,4574638.5699],[7639235.8401,4574615.9001],[7639200.1801,4574589.5501],[7639171.0301,4574570.4501],[7639156.1001,4574542.9501],[7639138.1601,4574511.1299],[7639100.4701,4574471.6001],[7639093.1801,4574468.4801],[7639044.5501,4574445.0801],[7639012.4001,4574426.3799],[7638980.8401,4574404.5901],[7638932.9801,4574379.8199],[7638926.2101,4574370.4401],[7638961.4701,4574354.0501],[7638996.3199,4574356.5601],[7639026.7901,4574354.1299],[7639043.1601,4574353.5501],[7639071.7001,4574356.4901],[7639095.9301,4574355.2599],[7639102.0099,4574350.4901],[7639140.3001,4574358.8601],[7639152.6201,4574363.0501],[7639176.8001,4574364.3601],[7639193.8601,4574365.2701],[7639225.5699,4574366.4201],[7639229.8199,4574366.7401],[7639252.4901,4574369.3701],[7639287.0099,4574371.0901],[7639298.1801,4574369.2001],[7639313.6201,4574366.7301],[7639335.5601,4574358.3101],[7639388.9901,4574339.8301],[7639417.3799,4574330.3001],[7639444.0501,4574314.5601],[7639495.3101,4574288.5501],[7639517.2501,4574272.3601],[7639527.5699,4574260.0801],[7639550.6101,4574244.0099],[7639558.0001,4574235.6201],[7639562.7599,4574242.7701],[7639589.2599,4574271.5601],[7639610.1201,4574282.1601],[7639626.9301,4574295.7801],[7639632.5201,4574311.3101],[7639639.9701,4574316.2901],[7639652.3501,4574339.2501],[7639658.5901,4574365.8501],[7639678.2201,4574425.6601],[7639685.2001,4574438.8101],[7639682.9801,4574467.6501],[7639681.4201,4574491.9001],[7639697.5699,4574501.2201],[7639711.8401,4574525.0099],[7639717.5901,4574553.0501],[7639717.5901,4574582.3101],[7639726.5401,4574614.7901],[7639739.4101,4574634.3701],[7639759.5901,4574656.4501],[7639765.8401,4574670.2599],[7639747.3701,4574691.4001],[7639725.9601,4574722.1701],[7639724.9801,4574736.3001],[7639729.6601,4574752.8601],[7639738.1901,4574772.8799],[7639744.2599,4574787.7599],[7639743.5301,4574805.7701],[7639734.7401,4574821.8001],[7639717.0201,4574831.4701],[7639699.0501,4574843.8401],[7639694.6201,4574863.0699],[7639712.2599,4574877.4101],[7639733.1801,4574902.5001],[7639734.1701,4574921.8199],[7639724.9801,4574937.9501],[7639724.6501,4574954.4601],[7639729.2501,4574974.0601],[7639727.6901,4575003.9701],[7639730.5201,4575027.5401],[7639746.7401,4575039.2901],[7639772.8601,4575049.7599],[7639773.9701,4575072.6001],[7639770.0901,4575081.2201],[7639773.9701,4575099.8799],[7639790.3901,4575119.9301],[7639785.1901,4575133.3601],[7639780.2001,4575167.9901],[7639782.3701,4575188.0001],[7639787.9601,4575212.8199],[7639802.4801,4575235.9801],[7639804.7801,4575256.2599],[7639796.8401,4575259.7201],[7639781.1101,4575262.0301],[7639782.6901,4575272.8901],[7639818.1299,4575283.5301],[7639821.0801,4575296.2001],[7639826.7401,4575328.0801],[7639842.2001,4575332.2301],[7639858.4201,4575345.3601],[7639872.7599,4575350.6299],[7639879.7801,4575368.9501],[7639870.4401,4575385.2701],[7639873.6601,4575397.8701],[7639883.2001,4575407.4201],[7639901.1601,4575413.0099],[7639916.3199,4575425.8101],[7639923.5601,4575443.0601],[7639919.2801,4575480.0601],[7639933.6001,4575488.7101],[7639951.8301,4575491.6101],[7639970.5401,4575486.7401],[7639972.3199,4575499.2301],[7639975.1501,4575512.5301],[7639962.5901,4575558.8301],[7640054.3199,4575630.7301],[7640097.3199,4575681.3501],[7640150.9601,4575715.9701],[7640230.0301,4575751.6801],[7640277.3601,4575791.8901],[7640315.0801,4575859.1401],[7640355.7701,4575890.1001],[7640370.5401,4575956.0901],[7640422.0001,4575997.9301],[7640516.2001,4576040.2001]]]]},\"geometry_name\":\"SHAPE\",\"properties\":{\"SHAPE_LENG\":8626,\"ODDELENIE\":\"4\",\"OPS\":\"4017\",\"VALID\":1,\"FID_KATOPS\":1160,\"SIFRA1\":\"04017\",\"NAZIV\":\"Прстен\",\"KNAZIV\":\"Prsten\",\"OPST2004\":\"Valandovo\",\"OO_\":1160,\"RAZMER\":2500,\"DAT_OBJ\":\"10.02.1993\",\"SHAPE_LE_1\":8626}}],\"totalFeatures\":1,\"numberMatched\":1,\"numberReturned\":1,\"timeStamp\":\"2022-05-23T11:40:11.946Z\",\"crs\":{\"type\":\"name\",\"properties\":{\"name\":\"urn:ogc:def:crs:EPSG::6316\"}}}";
		String filter = "<ogc:Filter><ogc:PropertyIsEqualTo><ogc:PropertyName>KNAZIV</ogc:PropertyName><ogc:Literal>Prsten</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>";
		GeometryFactory gf = SvUtil.sdiFactory;

		Envelope e = SvGeometry.parseBBox("7640026.21,4574935.62,7640698.43,4575335.59");
		GeoJsonReader gjr = new GeoJsonReader(gf);
		gjr.setUseFeatureType(true);
		gjr.setUsePropertiesAsUserData(true);

		Geometry parcel = gjr.read(jsonParcel);
		WFSReader wfs = new WFSReader("PARCELI:PARCELI_WMS", "EPSG:6316",
				"http://osspwms.katastar.gov.mk/geoserver/PARCELI/gwc/service/wfs");
		System.out.println(wfs.buildWfsRequestUrl(e));
		String extParams = "-oKexAlgorithms=+diffie-hellman-group1-sha1";
		String json = wfs.getWFSResponse(e, "10.88.1.31", "root", "root12", "MZSV2018", "M20zSV18", extParams);

		System.out.println(json);

		Geometry geom = gjr.read(json);

		for (int i = 0; i < geom.getNumGeometries(); i++) {
			Geometry g = geom.getGeometryN(i);
			System.out.println(g.getUserData());
		}

		/*
		 * String token = getUserSessionIdForTestPurpose(); if
		 * (!token.equals(CC.EMPTY_STRING)) { try (SvReader svr = new SvReader(token)) {
		 * File fl = new File("labels/PARCELI_KATASTARSKI_OPSTINI_WMS.json"); String
		 * json = com.google.common.io.Files.toString(fl,Charset.defaultCharset());
		 * 
		 * System.out.println(json); } }
		 */
	}

	// @Test
	public void testParcelIntersect() throws SvException, ParseException {

		int lock = 0;
		Response response = null;
		try (SvReader svr = new SvReader(getUserSessionIdForTestPurpose())) {
			DbDataObject type = SvCore.getDbtByName("AGRI_PARCEL");

			AgriParcel as = new AgriParcel();
			as.performCadCalc(svr, 656559968L, type.getObjectId());
		}

	}

	// @Test
	public void testParcelsServ() throws SvException {

		int lock = 0;
		Response response = null;
		try (SvReader svr = new SvReader(getUserSessionIdForTestPurpose())) {
			DateTime dt = DateTime.parse("2021-04-19T09:36:21.583+02:00");
			DbDataArray result = new Reader((SvCore) svr).getParcels(23971L, dt, true);
			System.out.println(result);
		}

	}

	//@Test
	public void testParcelsMergeDisjoint() throws SvException {

		String input = "{\"type\":\"Feature\",\"properties\":{},\"geometry\":{\"type\":\"LineString\",\"coordinates\":[[7550857.4277,4528950.4667],[7550881.2064,4528947.7444]]}}";
		// =
		// "{\"type\":\"Feature\",\"properties\":{},\"geometry\":{\"type\":\"LineString\",\"coordinates\":[[7549677.4457,4530304.3899],[7549695.3881,4530279.6366]]}}";
		Gson g = new Gson();
		JsonObject json = g.fromJson(input, JsonObject.class);
		LineString lineString = (LineString) Util.jsonToGeometry(json);
		Response response = null;
		try (SvGeometry svr = new SvGeometry(getUserSessionIdForTestPurpose())) {
			Geometry gg = new AgriParcel().mergeGeometryConfirm(svr, "AGRI_PARCEL", 21345L, lineString, false);
			System.out.println(gg.getArea());
		}

	}

	//@Test
	public void testPolyFromLine() throws SvException {
		 
		String input = "{\"type\":\"Feature\",\"properties\":{},\"geometry\":{\"type\":\"LineString\",\"coordinates\":[[7551828.7821,4527439.2274],[7551826.5822,4527428.5511],[7551807.2683,4527406.8712],[7551788.1915,4527411.2895],[7551771.4982,4527448.151],[7551741.9278,4527506.5762],[7551741.8589,4527516.348],[7551772.4135,4527521.4498]]}}";
		 
		// =
		// "{\"type\":\"Feature\",\"properties\":{},\"geometry\":{\"type\":\"LineString\",\"coordinates\":[[7549677.4457,4530304.3899],[7549695.3881,4530279.6366]]}}";
		Gson g = new Gson();
		JsonObject json = g.fromJson(input, JsonObject.class);
		LineString lineString = (LineString) Util.jsonToGeometry(json);
		Response response = null;
		try (SvGeometry svr = new SvGeometry(getUserSessionIdForTestPurpose())) {
			Long typeId = SvCore.getTypeIdByName(CC.AGRI_PARCEL);
			Geometry gg = new AgriParcel().generatePolygon(svr, (LineString) lineString, typeId);
			System.out.println(gg);
		}

	}

	//@Test
	public void getAssets() throws SvException, SQLException, ParseException {
		ApplicationServices as = new ApplicationServices();

		String token = getUserSessionIdForTestPurpose();
		if (!token.equals(CC.EMPTY_STRING)) {
			try (SvReader svr = new SvReader(token)) {
				DbDataArray rs = (new AgriParcel()).getAssetsList(svr, 21345L, CC.AGRI_PARCEL);
				for (DbDataObject dbp : rs.getItems()) {
					Geometry gp = SvGeometry.getGeometry(dbp);

					Collection<Geometry> gg = as.getPhysicalBlock(svr, gp.getEnvelopeInternal(), "ext_lpis.ilpis",
							"geometry");
					log.error(gg.toString());
				}
				log.error(rs.toSimpleJson().toString());
				rs = (new AgriParcel()).getAssetsList(svr, 21345L, CC.LP_CAD_INTERSECTIONS);
				log.error(rs.toSimpleJson().toString());

			}
		}
	}

	// @Test
	public void testGetVersion() {
		Properties properties = new Properties();
		InputStream is = Config.class.getClassLoader().getResourceAsStream("lpis.properties");

		try {
			properties.load(is);
		} catch (IOException e) {
			log.error("Failed loading configuration.");
			log.error(e);
		} finally {
			try {
				if (is != null)
					is.close();
			} catch (IOException ioe) {
				log.error(ioe);
			}
		}
		System.out.println(properties);
		System.out.println("-----------------------------------------");

		String v = properties.getProperty("version", "1");
		String[] vArr = v.split("\\.");
		for (String s : vArr) {
			System.out.println(s);
		}

		Assert.assertTrue("Pom version property read succesfully ", vArr.length > 1);

		int i = 1;
		if (vArr.length > 1) {
			i = Integer.parseInt(vArr[1]);
		}
		System.out.println(i);

		// Assert.assertTrue("version number have not changed based on pom v second
		// digit ", i > 1);
	}

	// @Test
	public void testMerge() throws SvException {
		String input = "{\"type\":\"Feature\",\"properties\":{},\"geometry\":{\"type\":\"LineString\",\"coordinates\":[[7549677.4457,4530304.3899],[7549695.3881,4530279.6366]]}}";
		Gson g = new Gson();
		JsonObject json = g.fromJson(input, JsonObject.class);
		LineString lineString = (LineString) Util.jsonToGeometry(json);
		Response response = null;
		try (SvGeometry svr = new SvGeometry(getUserSessionIdForTestPurpose())) {
			Geometry gg = new AgriParcel().mergeGeometryConfirm(svr, "AGRI_PARCEL", 21345L, lineString, false);
			System.out.println(gg);
		}

	}

}
