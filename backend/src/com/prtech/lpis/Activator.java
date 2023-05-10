package com.prtech.lpis;

import java.util.ArrayList;

import org.apache.logging.log4j.Logger;
import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.framework.ServiceRegistration;
import org.osgi.service.http.HttpService;
import org.osgi.util.tracker.ServiceTracker;

import com.prtech.lpis.importer.ImporterSDIByFarmExe;
import com.prtech.svarog.SvConf;
import com.prtech.svarog.SvCore;
import com.prtech.svarog.SvException;
import com.prtech.svarog.svCONST;
import com.prtech.svarog_common.ISvOnSave;
import com.prtech.svarog_interfaces.IPerunPlugin;
import com.prtech.svarog_interfaces.ISvExecutor;
import com.prtech.svarog_interfaces.ISvExecutorGroup;

/**
 * This class implements a simple bundle that uses the bundle context to
 * register a list of services with the OSGi framework. There two types of
 * services which you can register. A set of JAX.RS anotated services, which
 * shall be automatically picked up by the JAX RS publisher if available. A
 * Another type of services would be services implementing ISvExecutor interface
 * which provide internal communication means for svarog executor services.
 * 
 */
public class Activator implements BundleActivator {
	/**
	 * Logger instance.
	 */
	static final Logger log4j = SvConf.getLogger(Activator.class);

	static final ISvOnSave paramBefore = new ParamBeforeSave();
	/**
	 * The context path on the http server under which the static content from the
	 * /www folder inside the bundle will be served.
	 */
	static final String httpContextPath = "/" + Config.getProjectName();

	/**
	 * Directory inside the bundle which will be served at the context path.
	 */
	static final String httpLocalDir = "/www";

	/**
	 * List of registered services. Sum of web services and executors.
	 */
	private ArrayList<ServiceRegistration> services = new ArrayList<ServiceRegistration>();

	/**
	 * Init method adding all classes to the list
	 * 
	 * @return list with class objects
	 */
	private ArrayList<Class<?>> initWebServices() {
		ArrayList<Class<?>> list = new ArrayList<Class<?>>();
		list.add(ApplicationServices.class);
		return list;
	}

	/**
	 * List of web-services (JAXRS Service classes). Client-server communication.
	 */
	private ArrayList<Class<?>> webServices = initWebServices();

	/**
	 * List of executor objects to be used for initialisation
	 * 
	 * @return Map with executors
	 */
	private ArrayList<ISvExecutor> initExecutors() {
		ArrayList<ISvExecutor> list = new ArrayList<ISvExecutor>();
		list.add(new ImporterSDIByFarmExe());
		// add executors here.
		return list;
	}

	/**
	 * List of executorGroup objects to be used for initialisation
	 * 
	 * @return Map with executors
	 */
	private ArrayList<ISvExecutorGroup> initExecutorGroups() {
		ArrayList<ISvExecutorGroup> list = new ArrayList<ISvExecutorGroup>();
		list.add(new LPISExecutors());
		return list;

	}

	/**
	 * List of executors (classes implementing ISvExecutor). Cross-plugin
	 * communication.
	 */
	private ArrayList<ISvExecutor> executors = initExecutors();

	/**
	 * List of classes implementing ISvExecutorGroup which we will later use for
	 * registration in the bundle startup
	 */
	private ArrayList<ISvExecutorGroup> executorGroupServiceClasses = initExecutorGroups();

	/**
	 * Member used to track the http services in order to register path for serving
	 * static JS/Other content
	 */
	@SuppressWarnings("rawtypes")
	private ServiceTracker httpTracker;

	/**
	 * Implements BundleActivator.start(). Registers all instances of the JAXRS
	 * services as well as all objects implementing ISvExecutor interfaces using the
	 * bundle context;
	 * 
	 * @param context the framework context for the bundle.
	 */
	@SuppressWarnings({ "unchecked", "rawtypes" })
	public void start(BundleContext context) {

		ServiceRegistration svc = null;
		log4j.info("Starting " + Config.getDescription() + " OSGI bundle");

		IPerunPlugin publisher = new PerunPluginInfo();
		log4j.info("Registering " + Config.getDescription() + " plugin with Svarog");
		svc = context.registerService(IPerunPlugin.class.getName(), publisher, null);

		for (Class<?> ws : webServices) {
			try {
				log4j.info("Registering web service class: " + ws.getName());
				svc = context.registerService(ws.getName(), ws.newInstance(), null);
			} catch (Exception e) {
				log4j.error("Can't register web service class:" + ws.getName(), e);
			}
			if (svc != null)
				this.services.add(svc);
		}

		for (ISvExecutor exec : executors) {
			try {
				log4j.info("Registering executor class: " + exec.getClass().getName());
				svc = context.registerService(ISvExecutor.class.getName(), exec, null);
			} catch (Exception ex) {
				log4j.error("Can't register executor class:" + exec.getClass().getName(), ex);
			}
			if (svc != null)
				this.services.add(svc);
		}

		for (ISvExecutorGroup eg : executorGroupServiceClasses) {
			try {
				log4j.info("Registering executor group service class: " + eg.getClass().getName());
				svc = context.registerService(ISvExecutorGroup.class.getName(), eg, null);
			} catch (Exception ex) {
				log4j.error("Can't register service class:" + eg.getClass().getName(), ex);
			}
			if (svc != null)
				this.services.add(svc);
		}

		httpTracker = new ServiceTracker(context, HttpService.class.getName(), null) {
			public void removedService(ServiceReference reference, Object service) {
				// HTTP service is no longer available, unregister our
				// resources...
				try {
					((HttpService) service).unregister(httpContextPath);
				} catch (IllegalArgumentException exception) {
					// Ignore; servlet registration probably failed earlier
					// on...
				}
			}

			public Object addingService(ServiceReference reference) {
				// HTTP service is available, register our resources...
				HttpService httpService = (HttpService) this.context.getService(reference);
				try {
					httpService.registerResources(httpContextPath, httpLocalDir, null);
				} catch (Exception exception) {
					exception.printStackTrace();
				}
				return httpService;
			}
		};
		// start tracking all HTTP services...
		httpTracker.open();
		Long taskType;
		SvCore.registerOnSaveCallback(paramBefore, svCONST.OBJECT_TYPE_USER_PARAMS);
	}

	/**
	 * Implements BundleActivator.stop(). Unregistering all services which have been
	 * registered
	 * 
	 * @param context the framework context for the bundle.
	 */
	public void stop(BundleContext context) throws Exception {
		for (ServiceRegistration svc : services) {
			svc.unregister();
		}
		SvCore.unregisterOnSaveCallback(paramBefore, svCONST.OBJECT_TYPE_USER_PARAMS);

	};
}
