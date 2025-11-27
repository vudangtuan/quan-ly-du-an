package com.tuanhust.activityservice.repository;

import com.tuanhust.activityservice.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface ActivityRepository extends MongoRepository<Activity, String> {
    Page<Activity> findByProjectIdOrderByCreatedAtDesc(String projectId, Pageable pageable);
    Page<Activity> findByTaskIdOrderByCreatedAtDesc(String taskId, Pageable pageable);
}
