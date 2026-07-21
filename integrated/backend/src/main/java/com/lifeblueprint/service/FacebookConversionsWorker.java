package com.lifeblueprint.service;

import com.lifeblueprint.repository.FacebookConversionsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class FacebookConversionsWorker {
    private final FacebookConversionsRepository repository;
    private final FacebookConversionsService conversions;

    public FacebookConversionsWorker(FacebookConversionsRepository repository, FacebookConversionsService conversions) {
        this.repository = repository;
        this.conversions = conversions;
    }

    @Scheduled(fixedDelay = 3000, initialDelay = 8000)
    public void run() {
        if (!conversions.enabled()) return;
        repository.recoverStale(System.currentTimeMillis() - 2 * 60_000L);
        repository.nextPendingId(System.currentTimeMillis()).ifPresent(this::send);
    }

    private void send(long id) {
        if (!repository.claim(id)) return;
        try {
            conversions.send(id);
        } catch (Exception e) {
            int attempts = repository.event(id).map(row -> ((Number) row.getOrDefault("attempts", 1)).intValue()).orElse(1);
            repository.failed(id, e.getMessage(), attempts);
            log.warn("Meta CAPI event {} failed on attempt {}: {}", id, attempts, e.getMessage());
        }
    }
}
