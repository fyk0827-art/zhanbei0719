package com.lifeblueprint.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DeepSeekServiceTest {
    @Test
    void promptPinsCurrentDateAndForbidsInventedTransits() {
        String prompt = DeepSeekService.buildPrompt(
            "Release Test", "preview", "{\"birthData\":{}}", LocalDate.of(2026, 7, 22));

        assertTrue(prompt.contains("2026-07-22"));
        assertTrue(prompt.contains("Do not invent current planetary positions, transits"));
        assertTrue(prompt.contains("next-90-day actions"));
        assertFalse(prompt.contains("2025"));
    }
}
