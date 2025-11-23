package com.tuanhust.authservice.controller;

import com.tuanhust.authservice.config.UserPrincipal;
import com.tuanhust.authservice.repsonse.ApiResponse;
import com.tuanhust.authservice.repsonse.AuthResponse;
import com.tuanhust.authservice.repsonse.UserInfo;
import com.tuanhust.authservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserInfo>>> searchUsers
    (@RequestParam(defaultValue = "") String text,
     @RequestParam(defaultValue = "0") int page,
     @RequestParam(defaultValue = "10") int size) {
        if(text.isEmpty()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Text is empty");
        }
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(userService.searchUsers(text,pageable)));
    }
}
