package com.tuanhust.authservice.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuanhust.authservice.config.UserPrincipal;
import com.tuanhust.authservice.entity.User;
import com.tuanhust.authservice.event.ActivityEvent;
import com.tuanhust.authservice.event.ActivityType;
import com.tuanhust.authservice.repository.UserRepository;
import com.tuanhust.authservice.repsonse.UserInfo;
import com.tuanhust.authservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public List<UserPrincipal> getUsers(List<String> usersId) {
        return userRepository.findAllById(usersId)
                .stream()
                .map(u -> UserPrincipal.builder()
                        .email(u.getEmail())
                        .userId(u.getUserId())
                        .fullName(u.getFullName())
                        .roles(Set.of(u.getRole().name()))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserInfo> searchUsers(String text, Pageable pageable) {
        String exceptionUserId = ((UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal()).getUserId();
        return userRepository.searchUsers(text, pageable, exceptionUserId);
    }

    @Override
    @Transactional
    public UserInfo updateName(String name) {
        String currentId = ((UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal()).getUserId();
        User user = userRepository.findById(currentId).orElseThrow();

        Map<String, Object> data = new HashMap<>();
        data.put("old", Map.of("fullName", user.getFullName()));

        user.setFullName(name);

        data.put("new", Map.of("fullName", name));

        eventPublisher.publishEvent(new ActivityEvent(
                user.getUserId(), user.getFullName(), user.getEmail(),
                ActivityType.UPDATE_ACCOUNT, "đã đổi tên tài khoản", data,
                Instant.now()
        ));

        return UserInfo.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .createdAt(user.getCreatedAt())
                .role(user.getRole().name())
                .build();
    }
}
