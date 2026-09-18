package com.david.connectly.backend.controller;

import com.david.connectly.backend.dto.request.UpdateProfileRequest;
import com.david.connectly.backend.dto.response.PostResponse;
import com.david.connectly.backend.dto.response.UserResponse;
import com.david.connectly.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserProfile(id));
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<List<PostResponse>> getUserPosts(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserPosts(id));
    }

    @GetMapping("/{id}/followers")
    public ResponseEntity<List<UserResponse>> getUserFollowers(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserFollowers(id));
    }

    @GetMapping("/{id}/following")
    public ResponseEntity<List<UserResponse>> getUserFollowing(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserFollowing(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateProfile(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(id, request));
    }

    @PutMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> uploadAvatar(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(userService.uploadAvatar(id, file));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}

