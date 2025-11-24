package com.tuanhust.authservice.request;


import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreatePassword {
    @Size(min = 8, max = 20)
    String password;
    String confirmPassword;
}
