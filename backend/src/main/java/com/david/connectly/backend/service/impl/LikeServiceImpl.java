package com.david.connectly.backend.service.impl;

import com.david.connectly.backend.entity.Like;
import com.david.connectly.backend.entity.Post;
import com.david.connectly.backend.entity.User;
import com.david.connectly.backend.exception.ConflictException;
import com.david.connectly.backend.exception.ResourceNotFoundException;
import com.david.connectly.backend.repository.LikeRepository;
import com.david.connectly.backend.repository.PostRepository;
import com.david.connectly.backend.repository.UserRepository;
import com.david.connectly.backend.security.SecurityUtils;
import com.david.connectly.backend.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class LikeServiceImpl implements LikeService {
    private final LikeRepository likeRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Override
    public void likePost(Long postId) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        if (currentEmail == null) {
            throw new IllegalArgumentException("Unauthorized");
        }

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for authenticated principal"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        likeRepository.findByPostIdAndUserId(postId, user.getId())
                .ifPresent(existing -> {
                    throw new ConflictException("Like already exists");
                });

        Like like = new Like();
        like.setUser(user);
        like.setPost(post);
        like.setCreatedAt(LocalDateTime.now());

        likeRepository.save(like);
    }

    @Override
    public void unlikePost(Long postId) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        if (currentEmail == null) {
            throw new IllegalArgumentException("Unauthorized");
        }

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for authenticated principal"));

        Like like = likeRepository.findByPostIdAndUserId(postId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Like not found for this post and user"));

        likeRepository.delete(like);
    }

    @Override
    public Long getLikesCount(Long postId) {
        // 404 si el post no existe
        postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        return likeRepository.countByPostId(postId);
    }
}
