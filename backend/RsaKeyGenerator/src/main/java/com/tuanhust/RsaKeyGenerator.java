package com.tuanhust;

// RSA Key Generator - Chạy file Java này để sinh keys
import java.io.FileOutputStream;
import java.security.*;
import java.util.Base64;
import java.nio.file.*;

public class RsaKeyGenerator {

    public static void main(String[] args) throws Exception {
        // Generate RSA key pair
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        KeyPair keyPair = keyPairGenerator.generateKeyPair();

        PrivateKey privateKey = keyPair.getPrivate();
        PublicKey publicKey = keyPair.getPublic();

        // Save Private Key
        try (FileOutputStream fos = new FileOutputStream("private_key.pem")) {
            fos.write("-----BEGIN PRIVATE KEY-----\n".getBytes());
            fos.write(Base64.getMimeEncoder(64, "\n".getBytes()).encode(privateKey.getEncoded()));
            fos.write("\n-----END PRIVATE KEY-----\n".getBytes());
        }

        // Save Public Key
        try (FileOutputStream fos = new FileOutputStream("public_key.pem")) {
            fos.write("-----BEGIN PUBLIC KEY-----\n".getBytes());
            fos.write(Base64.getMimeEncoder(64, "\n".getBytes()).encode(publicKey.getEncoded()));
            fos.write("\n-----END PUBLIC KEY-----\n".getBytes());
        }

        System.out.println("✓ Keys generated successfully!");
        System.out.println("✓ private_key.pem");
        System.out.println("✓ public_key.pem");
    }
}