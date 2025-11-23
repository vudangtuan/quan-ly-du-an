package com.tuanhust.coreservice.repository;


import com.tuanhust.coreservice.entity.CheckList;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CheckListRepository extends JpaRepository<CheckList, String> {
}