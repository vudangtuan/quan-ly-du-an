package com.tuanhust.authservice.controller;

import com.tuanhust.authservice.config.UserPrincipal;
import com.tuanhust.authservice.service.AuthService;
import com.tuanhust.authservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/internal")
public class InternalAuthController {
    private final UserService userService;

    @PostMapping("/users")
    public ResponseEntity<List<UserPrincipal>> getUsers(@RequestBody List<String> usersId){
        return ResponseEntity.ok(userService.getUsers(usersId));
    }
}
