package com.tuanhust.authservice.listener;


import com.tuanhust.authservice.event.ActivityEvent;
import com.tuanhust.authservice.pushlisher.ActivityPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class ActivityListener {
    private final ActivityPublisher activityPublisher;

    @Async
    @TransactionalEventListener
    public void handleActivity(ActivityEvent activity) {
        activityPublisher.publish(activity);
    }
}
