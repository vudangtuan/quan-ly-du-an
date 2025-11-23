package com.tuanhust.coreservice.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CommentRequest {
    @NotBlank(message = "Nội dung bình luận không được để trống")
    @Size(max = 5000, message = "Bình luận không được vượt quá 5000 ký tự")
    private String body;
}