package com.snow.xmgm.oauth;

import com.britesnow.snow.web.binding.ApplicationProperties;
import com.google.api.client.auth.oauth2.*;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.inject.Inject;
import com.google.inject.Singleton;

import java.io.IOException;
import java.util.Arrays;
import java.util.Map;

@Singleton
public class Auth {
    private final Map appConfig;

    public static final JsonFactory JSON_FACTORY = new JacksonFactory();
    public static final HttpTransport TRANSPORT = new NetHttpTransport();

    private static final String GOOGLE_OAUTH2_AUTH_URI = "https://accounts.google.com/o/oauth2/auth";
    private static final String GOOGLE_OAUTH2_TOKEN_URI = "https://accounts.google.com/o/oauth2/token";
    public static final String EMAIL_ENDPOINT = "https://www.googleapis.com/userinfo/email";
    public static final String PROFILE_ENDPOINT = "https://www.googleapis.com/oauth2/v1/userinfo";

    private final String clientId;
    private final String clientSecret;
    private final String scope;
    private final String callBack;
    private final AuthorizationCodeFlow flow;
    private final String authUrl;

    @Inject
    public Auth(@ApplicationProperties Map appConfig) {
        this.appConfig = appConfig;
        this.clientId = (String) appConfig.get("google.client_id");
        this.clientSecret = (String) appConfig.get("google.secret");
        this.scope = (String) appConfig.get("google.scope");
        this.callBack = (String) appConfig.get("google.callback");
        this.flow = buildFlow();
        authUrl = flow.newAuthorizationUrl().setRedirectUri(callBack).build();
    }

    private AuthorizationCodeFlow buildFlow() {
        AuthorizationCodeFlow authorizationCodeFlow = new AuthorizationCodeFlow.Builder(
                BearerToken.authorizationHeaderAccessMethod(),
                TRANSPORT,
                JSON_FACTORY,
                new GenericUrl(GOOGLE_OAUTH2_TOKEN_URI),
                new ClientParametersAuthentication(clientId, clientSecret),
                clientId,
                GOOGLE_OAUTH2_AUTH_URI)
                .setCredentialStore(new MemoryCredentialStore())
                .setScopes(Arrays.asList(scope.split(",")))
                .build();
        return authorizationCodeFlow;
    }

    public AuthorizationCodeFlow getFlow() {
        return flow;
    }

    public String getAuthUrl (){
        return authUrl;
    }

    public TokenResponse getResponse(String code) throws IOException {
        return flow.newTokenRequest(code).setRedirectUri(callBack).execute();
    }

}
