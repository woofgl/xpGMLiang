package com.snow.xmgm;


import com.britesnow.snow.web.auth.AuthRequest;
import com.google.inject.AbstractModule;
import com.snow.xmgm.web.GoogleAuthRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class XpGMConfig extends AbstractModule {
    private static Logger log = LoggerFactory.getLogger(XpGMConfig.class);

    @Override
    protected void configure() {
        bind(AuthRequest.class).to(GoogleAuthRequest.class);
    }
}
