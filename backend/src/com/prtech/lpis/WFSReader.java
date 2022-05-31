package com.prtech.lpis;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.Authenticator;
import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.MalformedURLException;
import java.net.PasswordAuthentication;
import java.net.Proxy;
import java.net.URL;
import java.nio.charset.StandardCharsets;

import org.apache.commons.io.IOUtils;
import org.apache.logging.log4j.Logger;

import com.prtech.spatial.ApplicationServices;
import com.prtech.svarog.Sv;
import com.prtech.svarog.SvConf;
import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvException;
import com.prtech.svarog.SvGeometry;
import com.prtech.svarog.SvParameter;
import com.prtech.svarog.svCONST;
import com.vividsolutions.jts.geom.Envelope;
import com.vividsolutions.jts.geom.Geometry;

/**
 * Class to support fetching Geometry objects from external WFS server
 * 
 * @author ristepejov
 *
 */
public class WFSReader {
	private static final Logger log = SvConf.getLogger(WFSReader.class);

	private String wfsServerUrl;
	private String typeName;
	private String epsg;
	private String serviceName = "service=WFS";
	private String serviceVersion = "version=1.1.0";
	private String serviceFormat = "outputFormat=application/json";
	private String serviceRequest = "request=GetFeature";

	public WFSReader(String typeName, String epsg, String wfsServerUrl) throws SvException {

		if (wfsServerUrl == Sv.EMPTY_STRING)
			throw (new SvException(CC.WFS_NOT_CONFIGURED, svCONST.systemUser));

		this.wfsServerUrl = wfsServerUrl;
		this.typeName = typeName;
		this.epsg = epsg;
	}

	public WFSReader(String typeName, String epsg) throws SvException {
		this(typeName, epsg, SvParameter.getSysParam(CC.WFS_SERVER_URL, Sv.EMPTY_STRING));
	}

	// "http://localhost:8888/geoserver/AKN/wfs"
	/**
	 * Minimum distance between to vertexes
	 */
	public String buildWfsRequestUrl(Envelope envelope) {
		String url = buildWfsRequestUrl() + "&BBOX=" + SvGeometry.getBBox(envelope);
		if (log.isDebugEnabled())
			log.debug("WFS url:" + url);
		return url;
	}

	public String buildWfsRequestUrlFilter(String ogcFilter) {
		String url = buildWfsRequestUrl() + "&FILTER=" + ogcFilter;
		if (log.isDebugEnabled())
			log.debug("WFS url:" + url);
		return url;
	}

	public String buildWfsRequestUrl() {
		String url = wfsServerUrl + "?" + serviceName + "&" + serviceVersion + "&" + serviceRequest + "&typeName="
				+ typeName + "&srs=" + epsg + "&" + serviceFormat;
		return url;
	}

	public Geometry getByEnvelope(Envelope envelope) {
		return null;

	}

	public String getWFSResponse(Envelope envelope) {
		return executeGet(buildWfsRequestUrl(envelope), Sv.EMPTY_STRING, 0, Sv.EMPTY_STRING, Sv.EMPTY_STRING);

	}

	public String getWFSResponse(Envelope envelope, final String sshServer, final String sshUser, final String sshPass,
			final String webUser, final String webPass, String extSshParams) {
		return executeGet(buildWfsRequestUrl(envelope), sshServer, sshUser, sshPass, webUser, webPass, extSshParams);

	}

	public String getWFSResponseByFilter(String filter) {
		return executeGet(buildWfsRequestUrlFilter(filter), Sv.EMPTY_STRING, 0, Sv.EMPTY_STRING, Sv.EMPTY_STRING);

	}

	private String executeGet(final String http_url, final String proxyName, final int port, final String proxyUser,
			final String proxyPass) {
		String ret = "";

		URL url;
		try {

			HttpURLConnection con;
			url = new URL(http_url);

			if (proxyName.isEmpty()) {
				con = (HttpURLConnection) url.openConnection();
			} else {
				Proxy proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress(proxyName, port));
				con = (HttpURLConnection) url.openConnection(proxy);
				Authenticator authenticator = new Authenticator() {
					public PasswordAuthentication getPasswordAuthentication() {
						return (new PasswordAuthentication(proxyUser, proxyPass.toCharArray()));
					}
				};
				Authenticator.setDefault(authenticator);
			}

			// Now it's "open", we can set the request method, headers etc.
			con.setRequestProperty("accept", "application/json");

			// This line makes the request
			InputStream responseStream = con.getInputStream();
			ret = IOUtils.toString(responseStream, StandardCharsets.UTF_8);

		} catch (MalformedURLException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}

		return ret;
	}

	private String executeGet(final String http_url, final String sshServer, final String sshUser, final String sshPass,
			final String webUser, final String webPass, String extSshParams) {

		ProcessBuilder processBuilder = new ProcessBuilder();
		// "http://osspwms.katastar.gov.mk/geoserver/PARCELI/gwc/service/wfs?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=PARCELI:PARCELI_WMS&srs=EPSG:6316&outputFormat=application/json&BBOX=7640026.21,4574935.62,7640698.43,4575335.59\"
		// -- Linux --
		String cmd = "sshpass -p " + sshPass + " ssh " + sshUser + "@" + sshServer +" "+extSshParams+" \"wget -q -O - --user " + webUser
				+ " --password " + webPass + " \\\"" + http_url + "\\\"\"";
		// Run a shell command
		processBuilder.command("bash", "-c", cmd);

		// Run a shell script
		// processBuilder.command("path/to/hello.sh");

		// -- Windows --

		// Run a command
		// processBuilder.command("cmd.exe", "/c", "dir C:\\Users\\mkyong");

		// Run a bat file
		// processBuilder.command("C:\\Users\\mkyong\\hello.bat");

		try {

			Process process = processBuilder.start();

			StringBuilder output = new StringBuilder();

			BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

			String line;
			while ((line = reader.readLine()) != null) {
				output.append(line);
			}

			int exitVal = process.waitFor();
			if (exitVal == 0) {
				return output.toString();
			} else {
				return null;
			}

		} catch (IOException e) {
			e.printStackTrace();
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
		return null;

	}
	// select * from svarog.vfarmer_imp2 where fic='00005005950'

}
