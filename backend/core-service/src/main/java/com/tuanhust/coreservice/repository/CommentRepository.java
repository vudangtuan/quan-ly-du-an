package com.tuanhust.coreservice.repository;

import com.tuanhust.coreservice.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, String> {

}