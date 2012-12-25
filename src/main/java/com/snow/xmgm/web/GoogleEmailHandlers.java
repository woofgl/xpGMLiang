package com.snow.xmgm.web;


import com.britesnow.snow.web.RequestContext;
import com.britesnow.snow.web.handler.annotation.WebActionHandler;
import com.britesnow.snow.web.handler.annotation.WebModelHandler;
import com.britesnow.snow.web.param.annotation.WebModel;
import com.britesnow.snow.web.param.annotation.WebParam;
import com.britesnow.snow.web.param.annotation.WebUser;
import com.google.inject.Inject;
import com.snow.xmgm.mail.MailInfo;
import com.snow.xmgm.mail.OAuth2Authenticator;
import com.sun.mail.imap.IMAPStore;
import com.sun.mail.smtp.SMTPTransport;

import javax.mail.*;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeUtility;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.HashMap;
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
                MailInfo info = new MailInfo(message.getMessageNumber(), message.getSentDate().getTime(),
                        decodeText(message.getFrom()[0].toString()), message.getSubject());
                mailInfos.add(0, info);
            }
        }
        m.put("result", mailInfos);
    }
    @WebModelHandler(startsWith = "/getEmails")
    public void getEmail(@WebUser String token, @CookieParam(GoogleAuthRequest.EMAIL) String email, @WebModel Map m, @WebParam("id") Integer id) throws Exception {
        IMAPStore imap = emailAuthenticator.connectToImap(email, token);
        Folder inbox = imap.getFolder("INBOX");
        inbox.open(Folder.READ_ONLY);
        FetchProfile profile = new FetchProfile();
        profile.add(FetchProfile.Item.ENVELOPE);
        if (!inbox.isOpen()) {
            inbox.open(Folder.READ_ONLY);
        }

        Message message = inbox.getMessage(id);
        MailInfo info =  new MailInfo(message.getMessageNumber(), message.getSentDate().getTime(),
                decodeText(message.getFrom()[0].toString()), message.getSubject());
        info.setContent(getContent(message));
        m.put("result", info);
    }
    @WebActionHandler(name = "deleteEmail")
    public Object deleteEmail(@WebUser String token, @CookieParam(GoogleAuthRequest.EMAIL) String email,
                            @WebParam("id") Integer id, RequestContext rc) throws Exception {
        IMAPStore imap = emailAuthenticator.connectToImap(email, token);
        Folder inbox = imap.getFolder("INBOX");
        inbox.open(Folder.READ_WRITE);
        Message msg = inbox.getMessage(id);
        msg.setFlag(Flags.Flag.DELETED, true);
        Map map = new HashMap();
        map.put("result", true);
        return map;
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

    private String getContent(Message message) throws Exception {
        StringBuffer str = new StringBuffer();
        if (message.isMimeType("text/plain"))
            str.append(message.getContent().toString());
        if (message.isMimeType("multipart/alternative")) {
            Multipart part = (Multipart) message.getContent();
            str.append(part.getBodyPart(1).getContent().toString());
        }
        if (message.isMimeType("multipart/related")) {
            Multipart part = (Multipart) message.getContent();
            Multipart cpart = (Multipart) part.getBodyPart(0).getContent();
            str.append(cpart.getBodyPart(1).getContent().toString());
        }
        if (message.isMimeType("multipart/mixed")) {
            Multipart part = (Multipart) message.getContent();
            if (part.getBodyPart(0).isMimeType("text/plain")) {
                str.append(part.getBodyPart(0).getContent());
            }
            if (part.getBodyPart(0).isMimeType("multipart/alternative")) {
                Multipart cpart = (Multipart) part.getBodyPart(0).getContent();
                str.append(cpart.getBodyPart(1).getContent());
            }
        }
        return str.toString();
    }

    @WebActionHandler
    public Object sendMail(@WebUser String token, @CookieParam(GoogleAuthRequest.EMAIL) String email,
                           @WebModel Map m, @WebParam("subject") String subject,
                           @WebParam("content") String content,@WebParam("to") String to, RequestContext rc) throws Exception {
        SMTPTransport transport = emailAuthenticator.connectToSmtp(email, token);
        Session mailSession = emailAuthenticator.getSMTPSession(token);
        Message msg = new MimeMessage(mailSession);
        try {
            msg.setFrom(new InternetAddress(email));
            msg.setSubject(subject);
            msg.setContent(content, "text/html;charset=UTF-8");
            InternetAddress[] iaRecevers = new InternetAddress[1];
            iaRecevers[0] = new InternetAddress(to);
            msg.setRecipients(Message.RecipientType.TO, iaRecevers);
            transport.sendMessage(msg, msg.getAllRecipients());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

}
