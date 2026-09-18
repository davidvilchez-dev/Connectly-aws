package com.david.connectly.backend.service;

import com.david.connectly.backend.dto.request.UpdateProfileRequest;
import com.david.connectly.backend.dto.response.PostResponse;
import com.david.connectly.backend.dto.response.UserResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserService {
    UserResponse getUserProfile(Long id);

    List<PostResponse> getUserPosts(Long id);

    List<UserResponse> getUserFollowers(Long id);

    List<UserResponse> getUserFollowing(Long id);

    UserResponse updateProfile(Long id, UpdateProfileRequest request);

    UserResponse uploadAvatar(Long id, MultipartFile file);

    List<UserResponse> getAllUsers();
}

