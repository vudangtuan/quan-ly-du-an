package com.tuanhust.coreservice.repository;

import com.tuanhust.coreservice.entity.Label;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

public interface LabelRepository extends JpaRepository<Label,String> {

    List<Label> findAllByProjectProjectId(String projectId);

    Optional<Label> findByLabelIdAndProjectProjectId(String labelId, String projectId);

    boolean existsByLabelIdAndProjectProjectId(String labelId, String projectId);

    boolean existsByProjectProjectIdAndName(String projectId, String name);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Label> findByProjectIdAndLabelId(String projectId, String labelId);

    void deleteByProjectIdAndLabelId(String projectId, String labelId);

    long countByProjectIdAndLabelIdIn(String projectId, List<String> labelIds);
}