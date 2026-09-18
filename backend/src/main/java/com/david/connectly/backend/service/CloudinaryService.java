package com.david.connectly.backend.service;

import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {

    /**
     * Sube un archivo de imagen a Cloudinary y retorna la URL segura.
     *
     * @param file   archivo de imagen recibido (MultipartFile)
     * @param folder carpeta dentro de Cloudinary donde se almacenará (ej: "avatars", "posts")
     * @return URL pública segura (https) de la imagen subida
     */
    String uploadImage(MultipartFile file, String folder);

    /**
     * Elimina una imagen de Cloudinary usando su publicId.
     *
     * @param publicId identificador público de la imagen en Cloudinary
     */
    void deleteImage(String publicId);
}
