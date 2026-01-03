package com.tuanhust.authservice.controller;

import com.tuanhust.authservice.config.UserPrincipal;
import com.tuanhust.authservice.entity.Session;
import com.tuanhust.authservice.entity.User;
import com.tuanhust.authservice.repsonse.ApiResponse;
import com.tuanhust.authservice.repsonse.AuthResponse;
import com.tuanhust.authservice.repsonse.UserDashboardResponse;
import com.tuanhust.authservice.repsonse.UserInfo;
import com.tuanhust.authservice.service.SessionService;
import com.tuanhust.authservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    private final UserService userService;
    private final SessionService sessionService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserInfo>>> searchUsers
            (@RequestParam(defaultValue = "") String text,
             @RequestParam(defaultValue = "0") int page,
             @RequestParam(defaultValue = "10") int size) {
        if (text.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Text is empty");
        }
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(userService.searchUsers(text, pageable)));
    }

    @PatchMapping("/name")
    public ResponseEntity<ApiResponse<UserInfo>> updateName(
            @RequestParam String name
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateName(name)));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<UserDashboardResponse>> getUserStats(
            @RequestParam(defaultValue = "6") int months
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserStats(months)));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ADMIN')")
    private ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    private ResponseEntity<ApiResponse<User>> getUserById(
            @PathVariable String id
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUser(id)));
    }

    @PostMapping("/{id}/ban")
    @PreAuthorize("hasAuthority('ADMIN')")
    private ResponseEntity<ApiResponse<User>> banUser(
            @PathVariable String id
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.banUser(id)));
    }

    @PostMapping("/{id}/unBan")
    @PreAuthorize("hasAuthority('ADMIN')")
    private ResponseEntity<ApiResponse<User>> unBanUser(
            @PathVariable String id
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.unBanUser(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<User>> deleteUser(
            @PathVariable String id
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.deleteUser(id)));
    }

    @GetMapping("/{id}/session")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<Session>>> getUserSession(
            @PathVariable String id
    ){
      return ResponseEntity.ok(ApiResponse.success(sessionService.getSessionByUserId(id)));
    }

    @DeleteMapping("/{id}/session/{sessionId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    private ResponseEntity<ApiResponse<Void>> deleteUserSession(
            @PathVariable String id,
            @PathVariable String sessionId
    ){
        sessionService.deleteSession(id, sessionId);
        return ResponseEntity.ok(ApiResponse.success("success",null));
    }

}
