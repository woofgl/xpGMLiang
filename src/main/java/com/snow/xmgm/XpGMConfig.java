package com.snow.xmgm;


import com.britesnow.snow.web.WebApplicationLifecycle;
import com.britesnow.snow.web.WebApplicationLifecycleTask;
import com.britesnow.snow.web.auth.AuthRequest;
import com.britesnow.snow.web.binding.ApplicationProperties;
import com.britesnow.snow.web.binding.EntityClasses;
import com.google.inject.*;
import com.metapossum.utils.scanner.reflect.ClassesInPackageScanner;
import com.snow.xmgm.web.GoogleAuthRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

public class XpGMConfig extends AbstractModule {
    private static Logger log = LoggerFactory.getLogger(XpGMConfig.class);

    @Override
    protected void configure() {
        bind(AuthRequest.class).to(GoogleAuthRequest.class);
    }

    @Provides
    @Singleton
    @Inject
    public WebApplicationLifecycle providesDaoRegistry(Injector injector, @ApplicationProperties Map config) {
        WebApplicationLifecycleTask tasks = new WebApplicationLifecycleTask();
        tasks.init(injector, config);
        return tasks;
    }

    @Provides
    @Singleton
    @Inject
    @EntityClasses
    public Class[] provideEntityClasses() {
        return new Class[0];

    }
}
