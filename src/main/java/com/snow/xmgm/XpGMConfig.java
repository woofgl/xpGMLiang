package com.snow.xmgm;


import com.britesnow.snow.web.WebApplicationLifecycle;
import com.britesnow.snow.web.WebApplicationLifecycleTask;
import com.britesnow.snow.web.auth.AuthRequest;
import com.britesnow.snow.web.binding.ApplicationProperties;
import com.britesnow.snow.web.binding.EntityClasses;
import com.google.inject.*;
import com.snow.xmgm.web.GoogleAuthRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

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
}
