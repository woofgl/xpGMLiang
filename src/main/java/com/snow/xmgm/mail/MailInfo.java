package com.snow.xmgm.mail;


import java.util.Date;

public class MailInfo {
    private long date;
    private String from;
    private String subject;

    public MailInfo(long date, String from, String subject) {
        this.date = date;
        this.from = from;
        this.subject = subject;
    }

    public MailInfo() {
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
}
