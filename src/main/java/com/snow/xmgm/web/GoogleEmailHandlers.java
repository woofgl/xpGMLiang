package com.snow.xmgm.web;


import com.britesnow.snow.web.handler.annotation.WebModelHandler;
import com.britesnow.snow.web.param.annotation.WebModel;
import com.britesnow.snow.web.param.annotation.WebUser;
import com.google.inject.Inject;
import com.snow.xmgm.mail.MailInfo;
import com.snow.xmgm.mail.OAuth2Authenticator;
import com.sun.mail.imap.IMAPStore;

import javax.mail.FetchProfile;
import javax.mail.Folder;
import javax.mail.Message;
import javax.mail.internet.MimeUtility;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;
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

        List<MailInfo> mailInfos = new ArrayList<MailInfo>();

        int count = inbox.getMessageCount();
        if (count > 0) {
            int start = count - 9;
            if (start < 1) {
                start = 1;
            }
            Message[] messages = inbox.getMessages(start, count);

            inbox.fetch(messages, profile);

            inbox.close(false);

            for (Message message : messages) {
                MailInfo info = new MailInfo(message.getSentDate().getTime(),
                        decodeText(message.getFrom()[0].toString()), message.getSubject());
                mailInfos.add(0, info);
            }
        }
        m.put("result", mailInfos);
    }


    private String decodeText(String text) throws UnsupportedEncodingException {
        if (text == null) {
            return null;
        }
        if (text.startsWith("=?GB") || text.startsWith("=?gb")) {
            text = MimeUtility.decodeText(text);
        } else {
            text = new String(text.getBytes("ISO8859_1"));
        }
        return text;

    }

}
