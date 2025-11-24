package com.tuanhust.authservice.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdatePassword {
    @NotBlank
    String password;
    @Size(min = 8, max = 20)
    String newPassword;
    String confirmPassword;
}
