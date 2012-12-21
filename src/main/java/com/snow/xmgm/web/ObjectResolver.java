package com.snow.xmgm.web;

import com.britesnow.snow.util.AnnotationMap;
import com.britesnow.snow.web.RequestContext;
import com.britesnow.snow.web.param.resolver.annotation.WebParamResolver;
import com.google.inject.Singleton;
import org.apache.commons.beanutils.BeanUtils;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;

@Singleton
public class ObjectResolver {
    @WebParamResolver(annotatedWith = WebObject.class)
    public <T> T resolveObject(AnnotationMap annotationMap, Class<? extends T> paramType, RequestContext rc) throws IllegalAccessException, InstantiationException, InvocationTargetException {
        WebObject webObject = annotationMap.get(WebObject.class);
        Class clazz = paramType;
        String prefix = webObject.prefix();
        Object obj = clazz.newInstance();
        Field[] fields = clazz.getDeclaredFields();
        for (Field field : fields) {
                String name = field.getName();
                String value = rc.getParam(prefix + name);
                if (value != null && !value.trim().equals("")) {
                    BeanUtils.setProperty(obj, name, value);
                }
        }
        return (T)obj;
    }
    @WebParamResolver(annotatedWith = CookieParam.class)
    public String resolveCookie(AnnotationMap annotationMap, Class paramType, RequestContext rc) throws IllegalAccessException, InstantiationException, InvocationTargetException {
        CookieParam cookie = annotationMap.get(CookieParam.class);
        String key = cookie.value();
        return rc.getCookie(key);
    }
}
