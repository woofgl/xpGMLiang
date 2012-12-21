package com.snow.xmgm.web;

import com.britesnow.snow.web.RequestContext;
import com.britesnow.snow.web.auth.AuthRequest;
import com.britesnow.snow.web.auth.AuthToken;
import com.britesnow.snow.web.handler.annotation.WebModelHandler;
import com.britesnow.snow.web.param.annotation.WebModel;
import com.britesnow.snow.web.param.annotation.WebParam;
import com.britesnow.snow.web.param.annotation.WebUser;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpRequestFactory;
import com.google.api.client.http.HttpResponse;
import com.google.api.client.json.JsonObjectParser;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import com.snow.xmgm.oauth.Auth;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URI;
import java.util.Map;


@Singleton
public class GoogleAuthRequest implements AuthRequest {
    public static final String TOKEN = "google_token";
    public static final String EMAIL = "google_email";

    private static Logger log = LoggerFactory.getLogger(GoogleAuthRequest.class);
    @Inject
    private Auth auth;


    @Override
    public AuthToken authRequest(RequestContext rc) {
        // Note: this is not the login logic, the login logic would be
        // @WebActionHandler that would generate the appropriate

        // Note: this is a simple stateless authentication scheme.
        // Security is medium-low, however, with little bit more logic
        // it can be as secure as statefull login while keeping it's scalability attributes

        // First, we get userId and userToken from cookie
        String googleToken = rc.getCookie(TOKEN);

        if (googleToken != null) {
            // get the User from the DAO
            AuthToken result = new AuthToken();
            result.setUser(googleToken);
            return result;
        } else {
            return null;
        }
    }

    @WebModelHandler(startsWith = "/")
    public void pageIndex(@WebModel Map m, @WebUser String token, RequestContext rc) {
        if (token != null) {
            m.put("token", token);
        }

    }


    @WebModelHandler(startsWith = "/googleLogin")
    public void googleLogin(RequestContext rc) throws IOException {
        String url = auth.getAuthUrl();
        rc.getRes().sendRedirect(url);
    }

    @WebModelHandler(startsWith = "/googleCallback")
    public void googleCallback(RequestContext rc, @WebParam("code") String code) throws Exception {
        if (code != null) {
            TokenResponse response = auth.getResponse(code);
            //Credential credential = auth.getFlow().createAndStoreCredential(response, null);
            //if user is none
            if (response.getAccessToken() != null) {
                rc.setCookie(TOKEN, response.getAccessToken());
                Credential credential = auth.getFlow().createAndStoreCredential(response, response.getAccessToken());
                //get user email
                HttpRequestFactory factory = Auth.TRANSPORT.createRequestFactory(credential);
                HttpRequest request = factory.buildGetRequest(new GenericUrl(Auth.EMAIL_ENDPOINT));
//                request.setParser(new JsonObjectParser(Auth.JSON_FACTORY));
                HttpResponse res = request.execute();
                //email=woofgl@gmail.com&isVerified=true
                String email = getUrlParam(res.parseAsString(), "email");
                rc.setCookie(EMAIL,email);
                rc.getRes().sendRedirect(rc.getReq().getContextPath() + "/getEmails");

            }

        }
    }

    private String getUrlParam(String query, final String name) {
        if (query == null || query.length() == 0)
            return null;
        final String[] params = query.split("&"); //$NON-NLS-1$
        for (String param : params) {
            final String[] parts = param.split("="); //$NON-NLS-1$
            if (parts.length != 2)
                continue;
            if (!name.equals(parts[0]))
                continue;
            return parts[1];
        }
        return null;
    }

}