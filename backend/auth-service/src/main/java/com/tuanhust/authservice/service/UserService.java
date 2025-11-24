package com.tuanhust.authservice.service;

import com.tuanhust.authservice.config.UserPrincipal;
import com.tuanhust.authservice.repsonse.UserInfo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {
    List<UserPrincipal> getUsers(List<String> usersId);
    Page<UserInfo> searchUsers(String text, Pageable pageable);

    UserInfo updateName(String name);
}
