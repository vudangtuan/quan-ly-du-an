package com.tuanhust.activityservice.controller;

import com.tuanhust.activityservice.entity.Activity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;


@RestController
@RequiredArgsConstructor
@RequestMapping("/activity/stream")
public class ActivityStreamController {
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> projectEmitters =
            new ConcurrentHashMap<>();
    //ConcurrentHashMap: Đảm bảo việc thêm/xóa key projectId an toàn khi có nhiều request cùng lúc.
    //CopyOnWriteArrayList: Thread-safe khi thêm/xóa emitter,An toàn khi iterate (duyệt danh sách)
    /* Tại sao dùng CopyOnWriteArrayList?: Đây là một List an toàn trong đa luồng (Thread-safe).
     Khi server đang duyệt qua list để gửi tin nhắn (iterate),
     nếu có một user khác ngắt kết nối (remove),
     list này đảm bảo không gây ra lỗi ConcurrentModificationException.*/

    @GetMapping(value = "/project/{projectId}",produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamActivitiesByProject(
            @PathVariable String projectId)
    {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        projectEmitters.computeIfAbsent(projectId, k -> new CopyOnWriteArrayList<>())
                .add(emitter);

        //ngắt kết nối khi client có vẫn đề về mạng
        emitter.onCompletion(()->{
            removeEmitter(projectId,emitter);
        });
        emitter.onTimeout(()->{
            removeEmitter(projectId,emitter);
            emitter.complete();
        });
        emitter.onError((e)->{
            removeEmitter(projectId,emitter);
        });

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("Connected to activity stream for project: " + projectId));
        } catch (IOException e) {
            removeEmitter(projectId, emitter);
        }

        return emitter;
    }


    //Hàm gửi dữ liệu khi có hoạt động mới
    public void broadcastActivitiesByProject(Activity activity) {
        String projectId = activity.getProjectId();
        CopyOnWriteArrayList<SseEmitter> emitters = projectEmitters.get(projectId);
        if (emitters == null||emitters.isEmpty()) {
            return;
        }
        emitters.removeIf(emitter->{
            try {
                emitter.send(SseEmitter.event()
                        .name("activity")
                        .data(activity));
                return false;
            }catch (Exception e){
                return true;
            }
        });
    }

    @Scheduled(fixedRate = 60000)
    public void sendHeartbeat() {
        projectEmitters.values().forEach(emitters -> {
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

    private void removeEmitter(String projectId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = projectEmitters.get(projectId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                projectEmitters.remove(projectId);
            }
        }
    }
}
