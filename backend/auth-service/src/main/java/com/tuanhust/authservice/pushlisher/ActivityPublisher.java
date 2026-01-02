package com.tuanhust.authservice.pushlisher;

import com.tuanhust.authservice.event.ActivityEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
@RequiredArgsConstructor
@Slf4j
public class ActivityPublisher {

    private final RabbitTemplate rabbitTemplate;
    private static final String EXCHANGE = "activity.exchange";


    private void doPublish(ActivityEvent event) {
        try {
            String routingKey = "activity." + event.actionType().name().toLowerCase();
            rabbitTemplate.convertAndSend(EXCHANGE, routingKey, event);
        } catch (Exception e) {
            log.error("Failed to publish activity event: {}", event.actionType(), e);
        }
    }

    public void publish(ActivityEvent event) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            doPublish(event);
                        }
                    }
            );
        } else {
            doPublish(event);
        }
    }
}


