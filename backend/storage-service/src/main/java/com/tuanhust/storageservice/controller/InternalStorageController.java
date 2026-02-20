package com.tuanhust.storageservice.controller;

import com.tuanhust.storageservice.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.InputStream;

@RestController
@RequestMapping("/internal/storage")
@RequiredArgsConstructor
public class InternalStorageController {
    private final StorageService storageService;
    @GetMapping("/view")
    public ResponseEntity<InputStreamResource> viewFile(@RequestParam String key) {
        InputStream inputStream = storageService.getFile(key);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(storageService.getS3ObjectContentType(key)))
                .body(new InputStreamResource(inputStream));
    }
}
