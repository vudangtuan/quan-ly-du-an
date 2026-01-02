package com.tuanhust.aiservice.config;

import io.micrometer.common.lang.NonNullApi;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.CallAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAdvisorChain;
import org.springframework.ai.chat.client.advisor.api.StreamAdvisor;
import org.springframework.ai.chat.client.advisor.api.StreamAdvisorChain;
import org.springframework.ai.chat.messages.Message;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;

@Configuration
@NonNullApi
@RequiredArgsConstructor
@Log4j2
public class ProjectAdvisor implements CallAdvisor, StreamAdvisor {

    public final CustomChatMemory customChatMemory;

    @Override
    @Transactional
    public ChatClientResponse adviseCall(ChatClientRequest chatClientRequest, CallAdvisorChain callAdvisorChain) {
        String projectId = (String) chatClientRequest.context().get("projectId");
        String userId = (String) chatClientRequest.context().get("userId");

        if (projectId == null || userId == null) {
            return callAdvisorChain.nextCall(chatClientRequest);
        }
        String userMessage = chatClientRequest.prompt().getUserMessage().getText();
        customChatMemory.saveMessage(userId, projectId, "user", userMessage);

        List<Message> history = customChatMemory.getChatHistory(userId, projectId, 40).reversed();
        List<Message> allMessages = new ArrayList<>(history);
        allMessages.addAll(chatClientRequest.prompt().getInstructions());

        ChatClientRequest request = chatClientRequest.mutate()
                .prompt(chatClientRequest.prompt().mutate().messages(allMessages).build()).build();

        ChatClientResponse response = callAdvisorChain.nextCall(request);

        assert response.chatResponse() != null;
        String assistantMessage = response.chatResponse().getResult().getOutput().getText();
        customChatMemory.saveMessage(userId, projectId, "assistant", assistantMessage);

        return response;
    }

    @Override
    public Flux<ChatClientResponse> adviseStream(ChatClientRequest chatClientRequest, StreamAdvisorChain streamAdvisorChain) {
        return streamAdvisorChain.nextStream(chatClientRequest);
    }

    @Override
    public String getName() {
        return "ProjectAdvisor";
    }

    @Override
    public int getOrder() {
        return Integer.MIN_VALUE;
    }
}
