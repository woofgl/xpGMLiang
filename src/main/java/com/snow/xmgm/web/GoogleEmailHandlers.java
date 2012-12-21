package com.snow.xmgm.web;


import com.britesnow.snow.web.handler.annotation.WebModelHandler;
import com.britesnow.snow.web.param.annotation.WebModel;
import com.britesnow.snow.web.param.annotation.WebUser;
import com.google.inject.Inject;
import com.snow.xmgm.mail.OAuth2Authenticator;
import com.sun.mail.imap.IMAPStore;

import javax.mail.FetchProfile;
import javax.mail.Folder;
import javax.mail.Message;
import java.util.Map;


public class GoogleEmailHandlers {
    @Inject
    OAuth2Authenticator emailAuthenticator;

    @WebModelHandler(startsWith = "/getEmails")
    public void listEmails(@WebUser String token, @CookieParam(GoogleAuthRequest.EMAIL) String email, @WebModel Map m) throws Exception {
        IMAPStore imap = emailAuthenticator.connectToImap(email, token);
        Folder inbox = imap.getFolder("INBOX");
        inbox.open(Folder.READ_ONLY);
        FetchProfile profile = new FetchProfile();
        profile.add(FetchProfile.Item.ENVELOPE);
        if (!inbox.isOpen()) {
            inbox.open(Folder.READ_ONLY);
        }
        Message[] messages = inbox.getMessages(1, 10);
        inbox.fetch(messages, profile);

        inbox.close(false);
        m.put("result", messages);
    }
}
