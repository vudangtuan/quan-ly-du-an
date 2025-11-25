package com.tuanhust.coreservice.client;

import com.tuanhust.coreservice.config.FeignConfig;
import com.tuanhust.coreservice.config.UserPrincipal;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;

@Component
@FeignClient(name = "auth-service",configuration = FeignConfig.class)
public interface AuthServiceClient {
    @PostMapping("/internal/users")
    List<UserPrincipal> getUsers(List<String> usersId);
}