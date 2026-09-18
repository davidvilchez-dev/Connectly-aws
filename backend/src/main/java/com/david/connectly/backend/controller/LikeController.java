package com.david.connectly.backend.controller;

import com.david.connectly.backend.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    @PostMapping("/{postId}/likes")
    public ResponseEntity<Void> likePost(@PathVariable Long postId) {
        likeService.likePost(postId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{postId}/likes")
    public ResponseEntity<Void> unlikePost(@PathVariable Long postId) {
        likeService.unlikePost(postId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{postId}/likes/count")
    public ResponseEntity<Long> getLikesCount(@PathVariable Long postId) {
        return ResponseEntity.ok(likeService.getLikesCount(postId));
    }
}