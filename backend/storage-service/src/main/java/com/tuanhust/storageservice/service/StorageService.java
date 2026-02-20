package com.tuanhust.storageservice.service;

import com.tuanhust.storageservice.config.UserPrincipal;
import com.tuanhust.storageservice.dto.ActivityEvent;
import com.tuanhust.storageservice.dto.FileResponse;
import com.tuanhust.storageservice.publisher.ActivityPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.paginators.ListObjectsV2Iterable;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final ActivityPublisher activityPublisher;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    public FileResponse uploadFile(MultipartFile file, String projectId, String taskId) {
        String fileName = System.currentTimeMillis() + "_" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        String key = projectId + "/" + taskId + "/" + fileName;
        try {
            PutObjectRequest putOb = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putOb, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            var user = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            ActivityEvent event = new ActivityEvent(projectId, taskId, user.getUserId(), user.getFullName(),
                    user.getEmail(), "UPLOAD_FILE", "đã upload file",
                    Map.of("fileKey", key, "fileType", putOb.contentType()),
                    Instant.now(), key, file.getOriginalFilename());
            activityPublisher.publish(event);

            return new FileResponse(fileName, key, file.getSize());
        } catch (IOException e) {
            log.error("Lỗi upload file", e);
            throw new RuntimeException("Upload failed");
        }
    }

    public String getS3ObjectContentType(String key) {
        HeadObjectRequest objectRequest = HeadObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();
        HeadObjectResponse objectHead = s3Client.headObject(objectRequest);
        return objectHead.contentType();
    }

    public void deleteFile(String key) {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();
        s3Client.deleteObject(deleteObjectRequest);
        var user = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String[] splits = key.split("/");

        ActivityEvent event = new ActivityEvent(splits[0], splits[1], user.getUserId(), user.getFullName(),
                user.getEmail(), "DELETE_FILE", "đã xóa file",
                Map.of("fileKey", key),
                Instant.now(), key,
                splits[2].replaceFirst("^\\d+_[a-f0-9-]{36}_", ""));
        activityPublisher.publish(event);

        log.info("Deleted file: {}", key);
    }

    public List<FileResponse> getFiles(String prefix) {
        try {
            ListObjectsV2Request listReq = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .build();
            ListObjectsV2Response listRes = s3Client.listObjectsV2(listReq);
            return listRes.contents().stream().map(s -> {
                String key = s.key();
                String fileName = key.replace(prefix, "");
                return new FileResponse(
                        fileName, key, s.size()
                );
            }).toList();
        } catch (Exception e) {
            log.error("Lỗi liệt kê file trong folder: {}", prefix, e);
            throw new RuntimeException("Error listing files");
        }
    }

    public String getPresignedUrl(String key) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(10))
                    .getObjectRequest(getObjectRequest)
                    .build();
            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);

            return presignedRequest.url().toString();

        } catch (Exception e) {
            log.error("Lỗi tạo Presigned URL cho key: {}", key, e);
            return null;
        }
    }

    public ResponseInputStream<GetObjectResponse> getFile(String key) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            return s3Client.getObject(getObjectRequest);

        } catch (Exception e) {
            log.error("Lỗi khi tải file từ MinIO: {}", key, e);
            throw new RuntimeException("Không tìm thấy file hoặc lỗi kết nối Storage");
        }
    }

    public void deleteFilesByTask(String projectId, String taskId) {
        String prefix = projectId + "/" + taskId + "/";
        deleteObjectsByPrefix(prefix);
    }

    public void deleteFilesByProject(String projectId) {
        String prefix = projectId + "/";
        deleteObjectsByPrefix(prefix);
    }

    private void deleteObjectsByPrefix(String prefix) {
        ListObjectsV2Request listReq = ListObjectsV2Request.builder()
                .bucket(bucketName)
                .prefix(prefix)
                .build();
        ListObjectsV2Iterable listRes = s3Client.listObjectsV2Paginator(listReq);
        for (var page : listRes) {
            List<S3Object> contents = page.contents();
            if (contents.isEmpty()) continue;

            List<ObjectIdentifier> objectsToDelete = contents.stream()
                    .map(s3Object -> ObjectIdentifier.builder().key(s3Object.key()).build())
                    .toList();

            DeleteObjectsRequest deleteReq = DeleteObjectsRequest.builder()
                    .bucket(bucketName)
                    .delete(Delete.builder()
                            .objects(objectsToDelete)
                            .build())
                    .build();
            s3Client.deleteObjects(deleteReq);
            log.info("Đã xóa batch {} files", objectsToDelete.size());
        }
    }
}
