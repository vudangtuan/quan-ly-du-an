package com.tuanhust.aiservice.client;


import com.tuanhust.aiservice.config.FeignConfig;
import com.tuanhust.aiservice.dto.UserInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;

@Component
@FeignClient(name = "auth-service",configuration = FeignConfig.class)
public interface AuthServiceClient {
    @PostMapping("/internal/users")
    List<UserInfo> getUsers(List<String> usersId);
}