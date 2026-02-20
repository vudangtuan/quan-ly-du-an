package com.tuanhust.aiservice.client;

import com.tuanhust.aiservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "storage-service", configuration = FeignConfig.class)
public interface StorageServiceClient {
    @GetMapping("/internal/storage/view")
    ResponseEntity<Resource> viewFile(@RequestParam("key") String key);
}