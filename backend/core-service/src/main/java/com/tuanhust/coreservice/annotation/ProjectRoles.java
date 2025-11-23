package com.tuanhust.coreservice.annotation;


import java.lang.annotation.*;



@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ProjectRoles {
    String[] roles() default {};
}