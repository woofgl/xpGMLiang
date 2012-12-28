package com.britesnow.snow.web;

import com.google.inject.Injector;
import com.metapossum.utils.scanner.reflect.ClassesInPackageScanner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * run some task at start
 */
public class WebApplicationLifecycleTask implements WebApplicationLifecycle {
    private static Logger log = LoggerFactory.getLogger(WebApplicationLifecycleTask.class);
    private List<SnowTask> snowTasks = new ArrayList<SnowTask>();
    @Override
    public void init() {
        for (SnowTask snowTask : snowTasks) {
            try {
                snowTask.run();
            } catch (Exception e) {
                log.warn(String.format("run task %s fail", snowTask.getClass().getName()), e);
            }
        }
        snowTasks.clear();
        snowTasks = null;
    }

    @Override
    public void shutdown() {
    }

    public void init(Injector injector, Map appCfg) {
        String packageName = (String) appCfg.get("task.scan-package");
        if (packageName != null) {
            try {
                Set<Class<? extends SnowTask>> classSet = new ClassesInPackageScanner().findImplementers(packageName, SnowTask.class);
                for (Class<? extends SnowTask> aClass : classSet) {
                    snowTasks.add(injector.getInstance(aClass));
                }
            } catch (IOException e) {
                log.warn(String.format("load task class from package %s fail", packageName), e);
            }
        }
        String taskClasss = (String) appCfg.get("task.classes");
        if (taskClasss != null) {
            String[] clazzs = taskClasss.split(",");
            for (String clazzName : clazzs) {
                try {
                    Class clazz = Class.forName(clazzName);
                    if (SnowTask.class.isAssignableFrom(clazz)) {
                        snowTasks.add((SnowTask) injector.getInstance(clazz));
                    }
                } catch (ClassNotFoundException e) {
                    log.warn(String.format("load task class %s fail", clazzName, e));
                }
            }
        }

    }
}
