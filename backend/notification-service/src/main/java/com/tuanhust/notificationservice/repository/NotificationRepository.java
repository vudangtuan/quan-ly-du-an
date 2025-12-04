package com.tuanhust.notificationservice.repository;

import com.tuanhust.notificationservice.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification,String> {
    Page<Notification> findAllByRecipientIdOrderByCreatedAtDesc(String userId, Pageable pageable);


    @Query(value = "{ '_id' : { $in : ?0 } }")
    @Update(value = "{ '$set' : { 'isRead' : true } }")
    void markRead(List<String> ids);

    @Query(value = "{ 'recipientId' : ?0, 'isRead' : false }")
    @Update(value = "{ '$set' : { 'isRead' : true } }")
    void markAllRead(String recipientId);
}
