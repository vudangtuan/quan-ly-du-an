package com.tuanhust.storageservice.controller;

import com.tuanhust.storageservice.dto.ApiResponse;
import com.tuanhust.storageservice.dto.FileResponse;
import com.tuanhust.storageservice.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.io.InputStream;
import java.util.List;

@RestController
@RequestMapping("/storage")
@RequiredArgsConstructor
public class StorageController {
    private final StorageService storageService;

    @PostMapping("/upload/{projectId}/{taskId}")
    public ResponseEntity<ApiResponse<FileResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @PathVariable String projectId,
            @PathVariable String taskId) {
        return ResponseEntity.ok(ApiResponse.success(storageService.uploadFile(file, projectId, taskId)));
    }

    @GetMapping("/files/{projectId}/{taskId}")
    public ResponseEntity<ApiResponse<List<FileResponse>>> listFileInFolder(
            @PathVariable String projectId,
            @PathVariable String taskId) {
        String prefix = projectId + "/" + taskId + "/";
        return ResponseEntity.ok(ApiResponse.success(storageService.getFiles(prefix)));
    }

    @DeleteMapping("/files")
    public ResponseEntity<ApiResponse<Void>> delete(@RequestParam String key) {
        storageService.deleteFile(key);
        return ResponseEntity.ok(ApiResponse.success("success",null));
    }

    @GetMapping("/download-url")
    public ResponseEntity<ApiResponse<String>> getDownloadUrl(@RequestParam String key) {
        return ResponseEntity.ok(ApiResponse.success(storageService.getPresignedUrl(key)));
    }
    @GetMapping("/download")
    public ResponseEntity<InputStreamResource> downloadFile(@RequestParam String key) {

        var s3Object = storageService.getFile(key);
        String fileName = key.substring(key.lastIndexOf("/") + 1);
        fileName = fileName.replaceFirst("^\\d+_[a-f0-9-]{36}_", "");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new InputStreamResource(s3Object));
    }
    @GetMapping("/view")
    public ResponseEntity<InputStreamResource> viewFile(@RequestParam String key) {
        InputStream inputStream = storageService.getFile(key);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(storageService.getS3ObjectContentType(key)))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + key + "\"")
                .body(new InputStreamResource(inputStream));
    }
}
