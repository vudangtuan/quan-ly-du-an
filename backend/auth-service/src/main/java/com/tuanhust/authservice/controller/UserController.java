package com.tuanhust.authservice.controller;

import com.tuanhust.authservice.config.UserPrincipal;
import com.tuanhust.authservice.repsonse.ApiResponse;
import com.tuanhust.authservice.repsonse.AuthResponse;
import com.tuanhust.authservice.repsonse.UserInfo;
import com.tuanhust.authservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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

    @PatchMapping("/name")
    public ResponseEntity<ApiResponse<UserInfo>> updateName(
            @RequestParam String name
    ){
        return ResponseEntity.ok(ApiResponse.success(userService.updateName(name)));
    }
}
