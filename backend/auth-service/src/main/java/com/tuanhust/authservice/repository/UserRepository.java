package com.tuanhust.authservice.repository;

import com.tuanhust.authservice.config.UserPrincipal;
import com.tuanhust.authservice.entity.User;
import com.tuanhust.authservice.repsonse.AuthResponse;
import com.tuanhust.authservice.repsonse.UserInfo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    @Query(value = """
            select new com.tuanhust.authservice.repsonse.UserInfo(
                        u.userId,u.email,u.fullName)
                        from User u where (u.fullName ilike concat("%",:text,"%")
                        or u.email ilike concat("%",:text,"%")) and u.userId!=:exceptionUserId
            """)
    Page<UserInfo> searchUsers(String text, Pageable pageable, String exceptionUserId);
}
