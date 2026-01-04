package com.tuanhust.authservice.repository;

import com.tuanhust.authservice.config.UserPrincipal;
import com.tuanhust.authservice.entity.User;
import com.tuanhust.authservice.repsonse.AuthResponse;
import com.tuanhust.authservice.repsonse.UserInfo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);


    @Query(value = """
            select new com.tuanhust.authservice.repsonse.UserInfo(
                        u.userId,u.email,u.fullName)
                        from User u where (u.fullName ilike concat("%",:text,"%")
                        or u.email ilike concat("%",:text,"%")) and u.userId!=:exceptionUserId
                                    and u.status='ACTIVE' and u.role !='ADMIN'
            """)
    Page<UserInfo> searchUsers(String text, Pageable pageable, String exceptionUserId);

    @Query(value = """
                SELECT TO_CHAR(created_at, :format) as time_point, COUNT(*) as count
                FROM users
                WHERE created_at >= :startDate AND role != 'ADMIN'
                GROUP BY time_point
                ORDER BY time_point ASC
            """, nativeQuery = true)
    List<Object[]> getUserGrowth(
            Instant startDate,
            String format
    );


    @Query(value = """
            select * from users where role!='ADMIN' order by created_at desc
            """, nativeQuery = true)
    List<User> getAllUser();
}
