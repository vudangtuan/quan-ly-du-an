package com.tuanhust.notificationservice.controller;


import com.tuanhust.notificationservice.config.UserPrincipal;
import com.tuanhust.notificationservice.entity.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/notifications/stream")
@RequiredArgsConstructor
public class NotificationStreamController {
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> userEmitters =
            new ConcurrentHashMap<>();

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(@AuthenticationPrincipal UserPrincipal user) {
       SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
       String userId = user.getUserId();

       userEmitters.computeIfAbsent(userId,k->new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(()->{
            removeEmitter(userId,emitter);
        });
        emitter.onTimeout(()->{
            removeEmitter(userId,emitter);
            emitter.complete();
        });
        emitter.onError((e)->{
            removeEmitter(userId,emitter);
        });

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("Connected to notification stream for user: " + user.getUsername()));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }
        return emitter;
    }

    public void sendToUser(String userId, Notification notification) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null||emitters.isEmpty()) {
            return;
        }
        emitters.removeIf(emitter->{
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(notification));
                return false;
            }catch (Exception e){
                return true;
            }
        });
    }

    private void removeEmitter(String userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }
    @Scheduled(fixedRate = 60000)
    public void sendHeartbeat() {
        userEmitters.values().forEach(emitters -> {
            emitters.removeIf(emitter -> {
                try {
                    emitter.send(SseEmitter.event().comment("heartbeat"));
                    return false;
                } catch (IOException e) {
                    return true;
                }
            });
        });
    }
}
