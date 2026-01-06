package com.tuanhust.notificationservice.service.impl;

import com.tuanhust.notificationservice.dto.NotificationEvent;
import com.tuanhust.notificationservice.service.NotificationChannel;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailChannel implements NotificationChannel {
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.from-mail}")
    private String fromEmail;

    @Value("${spring.mail.from-name}")
    private String fromName;


    @Override
    public boolean supports(String channelType) {
        return "EMAIL".equalsIgnoreCase(channelType) || "ALL".equalsIgnoreCase(channelType);
    }

    @Override
    public void send(NotificationEvent event) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(event.getRecipient());
            helper.setSubject(event.getSubject());

            String templateName = (String) event.getProperties().getOrDefault("template", "email-invite");
            String htmlContent = buildEmail(templateName, event.getProperties());

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Sent email to {}", event.getRecipient());
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String buildEmail(String templateName, Map<String, Object> variables) {
        Context context = new Context();
        context.setVariables(variables);
        return templateEngine.process(templateName, context);
    }
}
