package com.tuanhust.coreservice.publisher;

import com.tuanhust.coreservice.dto.ActivityEvent;
import com.tuanhust.coreservice.dto.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationPublisher {
    private final RabbitTemplate rabbitTemplate;
    private static final String EXCHANGE = "notification.exchange";

    private void doPublish(NotificationEvent event) {
        try {
            String routingKey = "notification." + event.getChannel().toLowerCase();
            rabbitTemplate.convertAndSend(EXCHANGE, routingKey, event);
            log.info("Published notification event to {}", event.getRecipient());
        } catch (Exception e) {
            log.error("Failed to publish notification event", e);
        }
    }

    public void publish(NotificationEvent event) {
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
