package core_plugin;

import javax.ws.rs.Path;

import com.prtech.perun_core.ws.WsReactElements;
import com.vividsolutions.jts.geom.Envelope;

@Path("/LPIS/WSM")

public class WSM {

	protected Envelope getMapOriginByUserOrgUnit() {
		Envelope env = new Envelope();
		WsReactElements ws = new WsReactElements();
		return env;
	}
	
	

}
