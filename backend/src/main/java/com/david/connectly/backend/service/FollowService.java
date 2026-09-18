package com.david.connectly.backend.service;

public interface FollowService {
    void followUser(Long userId);

    void unfollowUser(Long userId);

    Boolean isFollowing(Long userId);
}
