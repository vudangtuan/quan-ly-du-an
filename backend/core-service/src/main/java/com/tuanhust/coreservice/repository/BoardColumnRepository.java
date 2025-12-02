package com.tuanhust.coreservice.repository;

import com.tuanhust.coreservice.entity.BoardColumn;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BoardColumnRepository extends JpaRepository<BoardColumn,String> {


    @Query(value = """
            select max(bc.sortOrder) from BoardColumn bc where bc.project.projectId=:projectId
            """)
    Optional<Double> getMaxSortOrderFromProject(String projectId);


    @Query(value = """
            select bc from BoardColumn bc where bc.boardColumnId=:columnId and bc.project.projectId=:projectId
            """)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<BoardColumn> findByProjectIdAndBoardColumnId(String projectId, String columnId);


    @Query(value = """
            select * from board_columns where project_id=:projectId and board_column_id=:columnId and status='ARCHIVED'
            """,nativeQuery=true)
    Optional<BoardColumn> findArchivedByProjectIdAndBoardColumnId(String projectId, String columnId);
}