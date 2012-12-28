package com.britesnow.snow.web;


import com.britesnow.snow.web.binding.ApplicationProperties;
import com.google.inject.Inject;
import org.apache.tools.ant.Project;
import org.apache.tools.ant.taskdefs.SQLExec;
import org.apache.tools.ant.types.EnumeratedAttribute;

import java.io.File;
import java.util.Map;

public class AntExecSqlTask implements SnowTask {
    @Inject
    @ApplicationProperties
    private Map cfg;

    @Override
    public void run() {
        System.out.println("RUN IMPORT Sql TASK");
        String importSql = (String) cfg.get("sql.import");
        if (importSql != null && Boolean.parseBoolean(importSql)) {

            String driver = (String) cfg.get("hibernate.connection.driver_class");
            String url = (String) cfg.get("hibernate.connection.url");
            String user = (String) cfg.get("hibernate.connection.username");
            String passwd = (String) cfg.get("hibernate.connection.password");
            String src = (String) cfg.get("sql.import.src");
            if (driver != null && url != null && user != null && passwd != null && src != null) {
                SQLExec sqlExec = new SQLExec();
                sqlExec.setDriver(driver.trim());
                sqlExec.setUrl(url.trim());
                sqlExec.setUserid(user.trim());
                sqlExec.setPassword(passwd.trim());
                sqlExec.setSrc(new File(src.trim()));
                sqlExec.setOnerror((SQLExec.OnError) (EnumeratedAttribute.getInstance(SQLExec.OnError.class, "abort")));
                sqlExec.setPrint(true);
                //sqlExec.setOutput(new File("src/sql.out"));
                sqlExec.setProject(new Project());
                sqlExec.execute();
            }

        }

    }
}
