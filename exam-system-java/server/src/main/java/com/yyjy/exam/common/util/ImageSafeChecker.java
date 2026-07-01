package com.yyjy.exam.common.util;

import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Iterator;
import java.util.Set;

public final class ImageSafeChecker {

    private ImageSafeChecker() {
    }

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");

    public static boolean isSafeImage(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > 1 * 1024 * 1024) {
            return false;
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            return false;
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return false;
        }
        int dotIndex = originalFilename.lastIndexOf(".");
        if (dotIndex < 0) {
            return false;
        }
        String extension = originalFilename.substring(dotIndex + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return false;
        }

        try (InputStream inputStream = file.getInputStream();
             ImageInputStream imageInputStream = ImageIO.createImageInputStream(inputStream)) {
            if (imageInputStream == null) {
                return false;
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInputStream);
            if (readers.hasNext()) {
                ImageReader reader = readers.next();
                try {
                    reader.setInput(imageInputStream);
                    int width = reader.getWidth(0);
                    int height = reader.getHeight(0);
                    return width > 0 && height > 0 && width < 10000 && height < 10000;
                } finally {
                    reader.dispose();
                }
            } else {
                return false;
            }
        } catch (IOException e) {
            return false;
        }
    }
}
