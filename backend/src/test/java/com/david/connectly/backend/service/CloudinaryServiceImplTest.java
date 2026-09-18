package com.david.connectly.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.david.connectly.backend.service.impl.CloudinaryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CloudinaryServiceImpl - Pruebas unitarias")
class CloudinaryServiceImplTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @Mock
    private MultipartFile file;

    @InjectMocks
    private CloudinaryServiceImpl cloudinaryService;

    @BeforeEach
    void setUp() {
        // Configuramos lenientemente el mock del uploader para cuando getUploader() sea
        // llamado
        lenient().when(cloudinary.uploader()).thenReturn(uploader);
    }

    @Test
    @DisplayName("uploadImage: Sube archivo correctamente y devuelve url segura")
    void uploadImage_returnsSecureUrl() throws Exception {
        byte[] bytes = "test image".getBytes();
        when(file.getBytes()).thenReturn(bytes);

        Map<String, String> response = Map.of("secure_url", "https://cloudinary.com/image.jpg");
        when(uploader.upload(eq(bytes), anyMap())).thenReturn(response);

        String result = cloudinaryService.uploadImage(file, "test_folder");

        assertThat(result).isEqualTo("https://cloudinary.com/image.jpg");
        verify(uploader).upload(eq(bytes), anyMap());
    }

    @Test
    @DisplayName("uploadImage: Lanza excepción si ocurre un IOException")
    void uploadImage_throwsRuntimeExceptionOnException() throws Exception {
        when(file.getBytes()).thenThrow(new IOException("File read error"));

        assertThatThrownBy(() -> cloudinaryService.uploadImage(file, "test_folder"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Error uploading image to Cloudinary: File read error");
    }

    @Test
    @DisplayName("deleteImage: Elimina imagen correctamente")
    void deleteImage_callsCloudinaryDestroy() throws Exception {
        when(uploader.destroy(eq("public_id"), anyMap())).thenReturn(Map.of("result", "ok"));

        cloudinaryService.deleteImage("public_id");

        verify(uploader).destroy(eq("public_id"), anyMap());
    }

    @Test
    @DisplayName("deleteImage: Lanza excepción si ocurre un IOException")
    void deleteImage_throwsRuntimeExceptionOnException() throws Exception {
        when(uploader.destroy(anyString(), anyMap())).thenThrow(new IOException("Destroy error"));

        assertThatThrownBy(() -> cloudinaryService.deleteImage("public_id"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Error deleting image from Cloudinary: Destroy error");
    }
}
