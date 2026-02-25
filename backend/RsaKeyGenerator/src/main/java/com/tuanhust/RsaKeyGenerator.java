package com.tuanhust;

import java.io.File;
import java.io.FileOutputStream;
import java.security.*;
import java.util.Base64;

public class RsaKeyGenerator {

    public static void main(String[] args) throws Exception {
        // 1. Tạo thư mục ./certs nếu chưa có
        File certsDir = new File("./certs");
        if (!certsDir.exists()) {
            if (certsDir.mkdirs()) {
                System.out.println("✓ Created directory: ./certs");
            }
        }

        // 2. Khởi tạo RSA KeyPair
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        KeyPair keyPair = keyPairGenerator.generateKeyPair();

        PrivateKey privateKey = keyPair.getPrivate();
        PublicKey publicKey = keyPair.getPublic();

        // 3. Lưu Private Key vào ./certs/private_key.pem
        try (FileOutputStream fos = new FileOutputStream(new File(certsDir, "private_key.pem"))) {
            fos.write("-----BEGIN PRIVATE KEY-----\n".getBytes());
            fos.write(Base64.getMimeEncoder(64, "\n".getBytes()).encode(privateKey.getEncoded()));
            fos.write("\n-----END PRIVATE KEY-----\n".getBytes());
        }

        // 4. Lưu Public Key vào ./certs/public_key.pem
        try (FileOutputStream fos = new FileOutputStream(new File(certsDir, "public_key.pem"))) {
            fos.write("-----BEGIN PUBLIC KEY-----\n".getBytes());
            fos.write(Base64.getMimeEncoder(64, "\n".getBytes()).encode(publicKey.getEncoded()));
            fos.write("\n-----END PUBLIC KEY-----\n".getBytes());
        }

        System.out.println("✓ RSA Keys generated successfully in ./certs folder!");
        System.out.println("✓ File: " + new File(certsDir, "private_key.pem").getAbsolutePath());
        System.out.println("✓ File: " + new File(certsDir, "public_key.pem").getAbsolutePath());
    }
}