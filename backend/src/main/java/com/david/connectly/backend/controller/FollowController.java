package com.david.connectly.backend.controller;

import com.david.connectly.backend.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/{userId}")
    public ResponseEntity<Void> followUser(@PathVariable Long userId) {
        followService.followUser(userId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> unfollowUser(@PathVariable Long userId) {
        followService.unfollowUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/status")
    public ResponseEntity<Boolean> checkFollowStatus(@PathVariable Long userId) {
        return ResponseEntity.ok(followService.isFollowing(userId));
    }
}