package com.snow.xmgm.mail;


import javax.mail.Message;
import java.util.Date;

public class MailInfo {
    private int id;
    private long date;
    private String from;
    private String subject;
    private String content;

    public MailInfo(int id, long date, String from, String subject) {
        this.id = id;
        this.date = date;
        this.from = from;
        this.subject = subject;
    }


    public MailInfo(Message msg) {

    }

    public long getDate() {
        return date;
    }

    public void setDate(long date) {
        this.date = date;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public int getId() {
        return id;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }
}
