package com.tuanhust.aiservice.dto;


import java.util.Set;


public record UserInfo(
        String userId,
        String email,
        String fullName,
        Set<String> roles
        ) {
}
