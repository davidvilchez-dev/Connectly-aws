package com.david.connectly.backend.service.impl;

import com.david.connectly.backend.dto.request.PostRequest;
import com.david.connectly.backend.dto.response.PostResponse;
import com.david.connectly.backend.entity.Post;
import com.david.connectly.backend.entity.User;
import com.david.connectly.backend.exception.ConflictException;
import com.david.connectly.backend.exception.ResourceNotFoundException;
import com.david.connectly.backend.mapper.PostMapper;
import com.david.connectly.backend.repository.PostRepository;
import com.david.connectly.backend.repository.UserRepository;
import com.david.connectly.backend.security.SecurityUtils;
import com.david.connectly.backend.service.CloudinaryService;
import com.david.connectly.backend.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.david.connectly.backend.repository.LikeRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PostServiceImpl implements PostService {
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PostMapper postMapper;
    private final CloudinaryService cloudinaryService;
    private final LikeRepository likeRepository;

    @Override
    public List<PostResponse> getFeed() {
        // Placeholder: por ahora feed = explore (ordenado por fecha)
        return explorePosts();
    }

    @Override
    public List<PostResponse> explorePosts() {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        User currentUser = currentEmail != null ? userRepository.findByEmail(currentEmail).orElse(null) : null;

        return postRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(post -> {
                    PostResponse response = postMapper.toResponse(post);
                    if (currentUser != null) {
                        boolean liked = likeRepository.findByPostIdAndUserId(post.getId(), currentUser.getId()).isPresent();
                        response.setLiked(liked);
                    }
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Override
    public PostResponse getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));
        PostResponse response = postMapper.toResponse(post);
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        if (currentEmail != null) {
            userRepository.findByEmail(currentEmail).ifPresent(user -> {
                boolean liked = likeRepository.findByPostIdAndUserId(post.getId(), user.getId()).isPresent();
                response.setLiked(liked);
            });
        }
        return response;
    }

    @Override
    public PostResponse createPost(PostRequest request) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        if (currentEmail == null) {
            throw new IllegalArgumentException("Unauthorized");
        }

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for authenticated principal"));

        Post post = postMapper.toEntity(request);
        post.setUser(user);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(null);

        Post saved = postRepository.save(post);
        return postMapper.toResponse(saved);
    }

    @Override
    public PostResponse createPost(String content, MultipartFile image) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        if (currentEmail == null) {
            throw new IllegalArgumentException("No autorizado");
        }

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Post post = new Post();
        post.setContent(content);
        post.setUser(user);
        post.setCreatedAt(LocalDateTime.now());

        // Subir imagen a Cloudinary si se proporcionó
        if (image != null && !image.isEmpty()) {
            String imageUrl = cloudinaryService.uploadImage(image, "posts");
            post.setImageUrl(imageUrl);
        }

        Post saved = postRepository.save(post);
        return postMapper.toResponse(saved);
    }

    @Override
    public PostResponse updatePost(Long id, String content, MultipartFile image, boolean removeImage) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        if (currentEmail == null) {
            throw new IllegalArgumentException("No autorizado");
        }

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publicación no encontrada con id: " + id));

        if (post.getUser() == null || post.getUser().getId() == null || !post.getUser().getId().equals(user.getId())) {
            throw new ConflictException("Solo puedes editar tus propias publicaciones");
        }

        post.setContent(content);

        if (removeImage) {
            post.setImageUrl(null);
        } else if (image != null && !image.isEmpty()) {
            String imageUrl = cloudinaryService.uploadImage(image, "posts");
            post.setImageUrl(imageUrl);
        }

        post.setUpdatedAt(LocalDateTime.now());

        Post saved = postRepository.save(post);
        return postMapper.toResponse(saved);
    }

    @Override
    public void deletePost(Long id) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        if (currentEmail == null) {
            throw new IllegalArgumentException("Unauthorized");
        }

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for authenticated principal"));

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        if (post.getUser() == null || post.getUser().getId() == null || !post.getUser().getId().equals(user.getId())) {
            throw new ConflictException("You can only delete your own posts");
        }

        postRepository.delete(post);
    }
}