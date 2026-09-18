package com.david.connectly.backend.service.impl;

import com.david.connectly.backend.entity.Follow;
import com.david.connectly.backend.entity.User;
import com.david.connectly.backend.exception.ConflictException;
import com.david.connectly.backend.exception.ResourceNotFoundException;
import com.david.connectly.backend.repository.FollowRepository;
import com.david.connectly.backend.repository.UserRepository;
import com.david.connectly.backend.security.SecurityUtils;
import com.david.connectly.backend.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class FollowServiceImpl implements FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    @Override
    public void followUser(Long userId) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        if (currentEmail == null) {
            throw new IllegalArgumentException("Unauthorized");
        }

        User follower = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for authenticated principal"));

        if (follower.getId().equals(userId)) {
            throw new ConflictException("You cannot follow yourself");
        }

        User following = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        followRepository.findByFollowerIdAndFollowingId(follower.getId(), userId)
                .ifPresent(existing -> {
                    throw new ConflictException("Already following this user");
                });

        Follow follow = new Follow();
        follow.setFollower(follower);
        follow.setFollowing(following);
        follow.setCreatedAt(LocalDateTime.now());

        followRepository.save(follow);
    }

    @Override
    public void unfollowUser(Long userId) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        if (currentEmail == null) {
            throw new IllegalArgumentException("Unauthorized");
        }

        User follower = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for authenticated principal"));

        Follow follow = followRepository.findByFollowerIdAndFollowingId(follower.getId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow relation not found"));

        followRepository.delete(follow);
    }

    @Override
    public Boolean isFollowing(Long userId) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        if (currentEmail == null) {
            throw new IllegalArgumentException("Unauthorized");
        }

        User follower = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for authenticated principal"));

        // 404 si el usuario destino no existe
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return followRepository.findByFollowerIdAndFollowingId(follower.getId(), userId).isPresent();
    }
}
